import { prisma } from "@/config/database";
import { AppError } from "@/middleware/errorHandler";
import { Booking, RefundTier, EscrowEventType } from "@prisma/client";
import { refundPolicyService, RefundCalculation } from "./refundPolicy";
import { logger } from "@/utils/logger";
import { NotificationService } from "./notificationService";

export interface CancellationRefundResult {
  success: boolean;
  refundCalculation: RefundCalculation;
  escrowEventsCreated: number;
  notificationsSent: number;
  error?: string;
}

/**
 * Process automatic cancellation refund
 * - Calculates refund based on tier
 * - Releases escrow funds immediately
 * - Creates escrow events
 * - Notifies realtor and admin
 */
export async function processAutomaticCancellationRefund(
  bookingId: string
): Promise<CancellationRefundResult> {
  try {
    // Fetch booking with all necessary relations
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        property: {
          include: {
            realtor: {
              include: {
                user: true,
              },
            },
          },
        },
        guest: true,
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    if (!booking.payment) {
      throw new AppError("No payment found for this booking", 400);
    }

    // IMPORTANT: Only process refunds if payment was actually completed (HELD or later)
    // If payment is still INITIATED or FAILED, no money was ever received
    if (
      booking.payment.status === "INITIATED" ||
      booking.payment.status === "FAILED"
    ) {
      logger.warn(
        `Skipping refund processing for booking ${bookingId} - payment was never completed`,
        {
          bookingId,
          paymentStatus: booking.payment.status,
        }
      );

      return {
        success: false,
        refundCalculation: {
          tier: "NONE" as RefundTier,
          hoursUntilCheckIn: 0,
          roomFee: 0,
          securityDeposit: 0,
          serviceFee: 0,
          cleaningFee: 0,
          customerRoomRefund: 0,
          realtorRoomPortion: 0,
          platformRoomPortion: 0,
          securityDepositRefund: 0,
          totalCustomerRefund: 0,
          totalRealtorPortion: 0,
          totalPlatformPortion: 0,
          currency: booking.currency,
          reason: "Payment was never completed - no funds to refund",
        },
        escrowEventsCreated: 0,
        notificationsSent: 0,
        error: "Payment was never completed - no refund needed",
      };
    }

    // Calculate refund amounts
    const refundCalc = refundPolicyService.calculateCancellationRefund({
      booking,
    });

    logger.info("Cancellation refund calculated", {
      bookingId,
      tier: refundCalc.tier,
      customerRefund: refundCalc.totalCustomerRefund,
      realtorPortion: refundCalc.totalRealtorPortion,
      platformPortion: refundCalc.totalPlatformPortion,
    });

    // Update booking with refund tier
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        refundTier: refundCalc.tier,
      },
    });

    // Create escrow events for fund distribution
    const escrowEvents = [];

    // 1. Refund to customer (room fee portion + security deposit)
    if (refundCalc.totalCustomerRefund > 0) {
      escrowEvents.push(
        prisma.escrowEvent.create({
          data: {
            bookingId,
            eventType: EscrowEventType.REFUND_ROOM_FEE_TO_CUSTOMER,
            amount: refundCalc.totalCustomerRefund,
            currency: booking.currency,
            fromParty: "ESCROW",
            toParty: "CUSTOMER",
            notes: `Cancellation refund: ${
              refundCalc.tier
            } tier - ${refundCalc.customerRoomRefund.toFixed(
              2
            )} room fee + ${refundCalc.securityDepositRefund.toFixed(
              2
            )} security deposit`,
            triggeredBy: "SYSTEM",
          },
        })
      );
    } else {
      // Even if no room fee refund, security deposit still goes back
      escrowEvents.push(
        prisma.escrowEvent.create({
          data: {
            bookingId,
            eventType: EscrowEventType.RELEASE_DEPOSIT_TO_CUSTOMER,
            amount: refundCalc.securityDepositRefund,
            currency: booking.currency,
            fromParty: "ESCROW",
            toParty: "CUSTOMER",
            notes: `Security deposit refund (${refundCalc.tier} tier cancellation)`,
            triggeredBy: "SYSTEM",
          },
        })
      );
    }

    // 2. Realtor portion (room fee % only - cleaning fee was already released)
    if (refundCalc.totalRealtorPortion > 0) {
      escrowEvents.push(
        prisma.escrowEvent.create({
          data: {
            bookingId,
            eventType: EscrowEventType.RELEASE_ROOM_FEE_SPLIT,
            amount: refundCalc.totalRealtorPortion,
            currency: booking.currency,
            fromParty: "ESCROW",
            toParty: "REALTOR",
            notes: `Cancellation payout: ${
              refundCalc.tier
            } tier - ${refundCalc.realtorRoomPortion.toFixed(
              2
            )} room fee (cleaning fee already released)`,
            triggeredBy: "SYSTEM",
          },
        })
      );
    }

    // 3. Platform portion (room fee % only - service fee was already released)
    if (refundCalc.totalPlatformPortion > 0) {
      escrowEvents.push(
        prisma.escrowEvent.create({
          data: {
            bookingId,
            eventType: EscrowEventType.COLLECT_SERVICE_FEE,
            amount: refundCalc.totalPlatformPortion,
            currency: booking.currency,
            fromParty: "ESCROW",
            toParty: "PLATFORM",
            notes: `Cancellation collection: ${
              refundCalc.tier
            } tier - ${refundCalc.platformRoomPortion.toFixed(
              2
            )} room fee (service fee already released)`,
            triggeredBy: "SYSTEM",
          },
        })
      );
    }

    // Execute all escrow events
    await prisma.$transaction(escrowEvents);

    // Update payment status
    await prisma.payment.update({
      where: { id: booking.payment.id },
      data: {
        status: "REFUNDED",
        refundAmount: refundCalc.totalCustomerRefund,
        refundedAt: new Date(),
        realtorEarnings: refundCalc.totalRealtorPortion,
        platformCommission: refundCalc.totalPlatformPortion,
        roomFeeReleasedAt: new Date(),
        depositReleasedAt: new Date(),
      },
    });

    // Send notifications
    const notificationService = NotificationService.getInstance();
    let notificationsSent = 0;

    // Notify realtor
    try {
      await notificationService.createAndSendNotification({
        userId: booking.property.realtor.user.id,
        type: "PAYMENT_COMPLETED",
        title: "Booking Cancelled",
        message: `Booking cancelled (${refundCalc.tier} tier). ${
          refundCalc.totalRealtorPortion > 0
            ? `You receive ${
                booking.currency
              } ${refundCalc.totalRealtorPortion.toFixed(2)} (${
                refundCalc.tier === RefundTier.EARLY
                  ? "7%"
                  : refundCalc.tier === RefundTier.MEDIUM
                  ? "20%"
                  : "80%"
              } of room fee). Cleaning fee already released.`
            : `Cleaning fee already released to you.`
        }`,
        bookingId,
        data: {
          refundTier: refundCalc.tier,
          realtorPortion: refundCalc.realtorRoomPortion,
          cleaningFeeAlreadyReleased: refundCalc.cleaningFee,
        },
      });
      notificationsSent++;
    } catch (error) {
      logger.error("Failed to notify realtor", { error, bookingId });
    }

    // Notify guest
    try {
      await notificationService.createAndSendNotification({
        userId: booking.guestId,
        type: "PAYMENT_COMPLETED",
        title: "Cancellation Refund Processed",
        message: `Your booking cancellation refund of ${
          booking.currency
        } ${refundCalc.totalCustomerRefund.toFixed(2)} has been processed${
          refundCalc.tier === RefundTier.LATE ? " (security deposit only)" : ""
        }`,
        bookingId,
        data: {
          refundTier: refundCalc.tier,
          totalRefund: refundCalc.totalCustomerRefund,
          breakdown: {
            roomFeeRefund: refundCalc.customerRoomRefund,
            securityDeposit: refundCalc.securityDepositRefund,
          },
        },
      });
      notificationsSent++;
    } catch (error) {
      logger.error("Failed to notify guest", { error, bookingId });
    }

    logger.info("Cancellation refund processed successfully", {
      bookingId,
      escrowEventsCreated: escrowEvents.length,
      notificationsSent,
    });

    return {
      success: true,
      refundCalculation: refundCalc,
      escrowEventsCreated: escrowEvents.length,
      notificationsSent,
    };
  } catch (error) {
    logger.error("Failed to process cancellation refund", {
      error,
      bookingId,
    });

    return {
      success: false,
      refundCalculation: {} as RefundCalculation,
      escrowEventsCreated: 0,
      notificationsSent: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
