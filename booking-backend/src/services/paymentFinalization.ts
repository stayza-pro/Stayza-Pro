import {
  BookingStatus,
  EmailEventType,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/config/database";
import escrowService from "@/services/escrowService";
import {
  sendBookingConfirmation,
} from "@/services/email";
import { getMetadataObject } from "@/services/savedPaymentMethods";
import { SystemMessageService } from "@/services/systemMessage";
import { logger } from "@/utils/logger";
import { config } from "@/config";
import type { ProcessingFeeMode } from "@/services/pricingEngine";

export interface FinalizePaystackPaymentParams {
  paymentId: string;
  source:
    | "VERIFY_PAYSTACK"
    | "VERIFY_BY_BOOKING"
    | "SAVED_METHOD"
    | "WEBHOOK";
  providerData?: Record<string, unknown> | null;
  extraMetadata?: Record<string, unknown>;
}

type PaymentWithRelations = Prisma.PaymentGetPayload<{
  include: {
    booking: {
      include: {
        guest: true;
        property: {
          include: {
            realtor: {
              include: {
                user: true;
              };
            };
          };
        };
      };
    };
  };
}>;

export interface FinalizePaystackPaymentResult {
  payment: PaymentWithRelations;
  booking: PaymentWithRelations["booking"];
  alreadyFinalized: boolean;
}

const TERMINAL_PAYMENT_STATUSES = new Set<PaymentStatus>([
  PaymentStatus.HELD,
  PaymentStatus.PARTIALLY_RELEASED,
  PaymentStatus.SETTLED,
]);

const isKnownPrismaError = (
  error: unknown
): error is Prisma.PrismaClientKnownRequestError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  );
};

const loadPaymentForFinalization = async (
  paymentId: string
): Promise<PaymentWithRelations | null> => {
  return prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        include: {
          guest: true,
          property: {
            include: {
              realtor: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      },
    },
  });
};

const ensureEscrowHeld = async (payment: PaymentWithRelations): Promise<void> => {
  const escrowExists = await prisma.escrow.findUnique({
    where: { bookingId: payment.booking.id },
    select: { id: true },
  });

  if (escrowExists) {
    return;
  }

  const feeBreakdown = {
    roomFee: Number(payment.booking.roomFee),
    cleaningFee: Number(payment.booking.cleaningFee),
    securityDeposit: Number(payment.booking.securityDeposit),
    serviceFee: Number(payment.booking.serviceFee),
    platformFee: Number(payment.booking.platformFee),
    totalAmount: Number(payment.booking.totalPrice),
  };

  try {
    await escrowService.holdFundsInEscrow(
      payment.id,
      payment.booking.id,
      payment.booking.property.realtorId,
      feeBreakdown
    );
  } catch (error) {
    if (isKnownPrismaError(error) && error.code === "P2002") {
      // Another process may have finalized escrow first.
      return;
    }
    throw error;
  }
};

const buildMergedMetadata = (
  payment: PaymentWithRelations,
  now: Date,
  source: FinalizePaystackPaymentParams["source"],
  providerData?: Record<string, unknown> | null,
  extraMetadata?: Record<string, unknown>
): Prisma.InputJsonValue => {
  const metadata = getMetadataObject(payment.metadata);
  const nextMetadata: Prisma.JsonObject = {
    ...((metadata as Prisma.JsonObject | null) || {}),
    finalizationSource: source,
    finalizedAt: now.toISOString(),
    ...((extraMetadata as Prisma.JsonObject | undefined) || {}),
  };

  if (providerData && Object.keys(providerData).length > 0) {
    const providerIdValue = providerData.id;
    if (providerIdValue !== undefined && providerIdValue !== null) {
      nextMetadata.providerId = String(providerIdValue);
    }
    nextMetadata.providerResponse = providerData as Prisma.JsonValue;

    const gatewayResponse = providerData.gateway_response;
    if (typeof gatewayResponse === "string" && gatewayResponse.trim()) {
      nextMetadata.gatewayResponse = gatewayResponse;
    }
  }

  return nextMetadata as Prisma.InputJsonValue;
};

const toActualProcessingMode = (
  providerData?: Record<string, unknown> | null
): ProcessingFeeMode => {
  const authorization =
    providerData?.authorization &&
    typeof providerData.authorization === "object" &&
    !Array.isArray(providerData.authorization)
      ? (providerData.authorization as Record<string, unknown>)
      : {};

  const countryCode =
    typeof authorization.country_code === "string"
      ? authorization.country_code.toUpperCase()
      : "NG";
  const isInternational = countryCode !== "NG";
  return isInternational ? "INTERNATIONAL_ACTUAL" : "LOCAL_ACTUAL";
};

const createPaymentNotifications = async (
  payment: PaymentWithRelations
): Promise<void> => {
  await prisma.notification.create({
    data: {
      userId: payment.booking.guestId,
      type: "PAYMENT_COMPLETED",
      title: "Payment Confirmed",
      message: `Your payment of NGN ${Number(payment.amount).toLocaleString()} for ${
        payment.booking.property.title
      } has been confirmed`,
    },
  });

  await prisma.notification.create({
    data: {
      userId: payment.booking.property.realtor.userId,
      type: "BOOKING_CONFIRMED",
      title: "New Booking",
      message: `New booking confirmed for ${payment.booking.property.title}. Payment held in escrow.`,
    },
  });
};

const sendConfirmationEmails = async (
  payment: PaymentWithRelations,
): Promise<void> => {
  const dedupeKey = `${payment.booking.id}:${EmailEventType.BOOKING_CONFIRMED}`;

  try {
    await prisma.emailEventDedupe.create({
      data: {
        bookingId: payment.booking.id,
        eventType: EmailEventType.BOOKING_CONFIRMED,
        dedupeKey,
      },
    });
  } catch (error) {
    const isDuplicate =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002";
    if (isDuplicate) {
      return;
    }
    throw error;
  }

  sendBookingConfirmation(
    payment.booking.guest.email,
    payment.booking.guest.firstName,
    {
      bookingId: payment.booking.id,
      propertyName: payment.booking.property.title,
      checkInDate: payment.booking.checkInDate,
      checkOutDate: payment.booking.checkOutDate,
      totalPrice: Number(payment.booking.totalPrice),
      captureLink: `${config.FRONTEND_URL}/evidence/capture?booking=${encodeURIComponent(
        payment.booking.id,
      )}`,
      realtorName:
        payment.booking.property.realtor.businessName ||
        `${payment.booking.property.realtor.user.firstName} ${payment.booking.property.realtor.user.lastName}`,
      realtorEmail: payment.booking.property.realtor.user.email,
    },
    payment.booking.property.realtor,
  ).catch(() => undefined);
};

export const finalizePaystackPayment = async (
  params: FinalizePaystackPaymentParams
): Promise<FinalizePaystackPaymentResult> => {
  const payment = await loadPaymentForFinalization(params.paymentId);

  if (!payment) {
    throw new Error("Payment not found");
  }

  if (TERMINAL_PAYMENT_STATUSES.has(payment.status) && payment.paidAt) {
    return {
      payment,
      booking: payment.booking,
      alreadyFinalized: true,
    };
  }

  await ensureEscrowHeld(payment);

  const now = new Date();
  const mergedMetadata = buildMergedMetadata(
    payment,
    now,
    params.source,
    params.providerData,
    params.extraMetadata
  );

  const effectiveRate = Number(
    payment.booking.commissionEffectiveRate ||
      payment.commissionEffectiveRate ||
      0.1
  );
  const roomFeeAmount = new Decimal(payment.booking.roomFee).mul(
    1 - effectiveRate
  );
  const platformRoomFeeAmount = new Decimal(payment.booking.roomFee).mul(
    effectiveRate
  );

  const quotedProcessing = Number(
    payment.booking.serviceFeeProcessing ||
      payment.serviceFeeProcessingQuotedAmount ||
      0
  );
  const stayzaAmount = Number(
    payment.booking.serviceFeeStayza || payment.serviceFeeStayzaAmount || 0
  );
  const providerFeesRaw =
    typeof params.providerData?.fees === "number"
      ? Number(params.providerData.fees)
      : null;
  const actualProcessingFee = providerFeesRaw !== null ? providerFeesRaw / 100 : quotedProcessing;
  const processingVariance = Number(
    (actualProcessingFee - quotedProcessing).toFixed(2)
  );
  const processingModeActual = toActualProcessingMode(params.providerData);

  const updateResult = await prisma.payment.updateMany({
    where: {
      id: payment.id,
      paidAt: null,
    },
    data: {
      status: PaymentStatus.HELD,
      paidAt: now,
      cleaningFeeReleasedToRealtor: true,
      serviceFeeCollectedByPlatform: true,
      roomFeeSplitRealtorAmount: roomFeeAmount,
      roomFeeSplitPlatformAmount: platformRoomFeeAmount,
      commissionBaseRate: payment.booking.commissionBaseRate,
      commissionVolumeReductionRate:
        payment.booking.commissionVolumeReductionRate,
      commissionEffectiveRate: new Decimal(effectiveRate),
      commissionBaseAmount: payment.booking.commissionBaseRate
        ? new Decimal(payment.booking.roomFee).mul(
            payment.booking.commissionBaseRate
          )
        : null,
      serviceFeeStayzaAmount: new Decimal(stayzaAmount),
      serviceFeeProcessingQuotedAmount: new Decimal(quotedProcessing),
      serviceFeeProcessingActualAmount: new Decimal(
        Number(actualProcessingFee.toFixed(2))
      ),
      serviceFeeProcessingVarianceAmount: new Decimal(processingVariance),
      processingFeeModeQuoted:
        payment.booking.processingFeeMode ||
        payment.processingFeeModeQuoted ||
        "LOCAL_QUOTED",
      processingFeeModeActual: processingModeActual,
      metadata: mergedMetadata,
    },
  });

  const didFinalizeInThisCall = updateResult.count > 0;

  if (didFinalizeInThisCall) {
    await prisma.booking.update({
      where: { id: payment.booking.id },
      data: {
        status: BookingStatus.ACTIVE,
        paymentStatus: PaymentStatus.HELD,
        cleaningFeeReleasedAt: now,
        serviceFeeCollectedAt: now,
        processingFeeMode: processingModeActual,
        serviceFeeStayza: new Decimal(stayzaAmount),
        serviceFeeProcessing: new Decimal(
          Number(actualProcessingFee.toFixed(2))
        ),
      },
    });

    void sendConfirmationEmails(payment);
    await createPaymentNotifications(payment);

    try {
      await SystemMessageService.scheduleBookingMessages(payment.booking.id);
    } catch (error) {
      logger.error("Failed to schedule booking system messages", {
        bookingId: payment.booking.id,
        paymentId: payment.id,
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  const refreshedPayment = await loadPaymentForFinalization(payment.id);

  if (!refreshedPayment) {
    throw new Error("Payment not found after finalization");
  }

  return {
    payment: refreshedPayment,
    booking: refreshedPayment.booking,
    alreadyFinalized: !didFinalizeInThisCall,
  };
};
