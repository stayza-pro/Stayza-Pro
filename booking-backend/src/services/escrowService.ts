import {
  Prisma,
  EscrowEventType,
  PaymentStatus,
  PaymentMethod,
  WalletOwnerType,
  WalletTransactionSource,
  EscrowStatus,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/config/database";
import { paystackService } from "./paystack";
import { logger } from "@/utils/logger";
import walletService from "./walletService";
import { ensureRealtorTransferRecipientCode } from "./payoutAccountService";
import { config as appConfig } from "@/config";

interface FeeBreakdown {
  roomFee: number;
  cleaningFee: number;
  securityDeposit: number;
  serviceFee: number;
  platformFee: number;
  totalAmount: number;
}

const clampRate = (value: number): number => Math.min(Math.max(value, 0), 1);

const toNumeric = (
  value: Prisma.Decimal | Decimal | number | null | undefined
): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric = value instanceof Decimal ? value.toNumber() : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const deriveRateFromAmounts = (
  roomFeeValue: Prisma.Decimal | Decimal | number | null | undefined,
  platformValue: Prisma.Decimal | Decimal | number | null | undefined
): number | null => {
  const roomFee = toNumeric(roomFeeValue);
  const platform = toNumeric(platformValue);
  if (roomFee === null || platform === null || roomFee <= 0) {
    return null;
  }
  return clampRate(platform / roomFee);
};

const resolveEffectiveCommissionRate = (params: {
  directRate?: Prisma.Decimal | Decimal | number | null;
  roomFeeValue: Prisma.Decimal | Decimal | number | null | undefined;
  platformCandidates: Array<
    Prisma.Decimal | Decimal | number | null | undefined
  >;
}): number => {
  const directRate = toNumeric(params.directRate);
  if (directRate !== null) {
    return clampRate(directRate);
  }

  for (const candidate of params.platformCandidates) {
    const derived = deriveRateFromAmounts(params.roomFeeValue, candidate);
    if (derived !== null) {
      return derived;
    }
  }

  throw new Error(
    "Missing commission snapshot for escrow split. Backfill booking/payment commission data before release."
  );
};

/**
 * Calculate fee breakdown for a booking
 *
 * @param pricePerNight - Room price per night
 * @param numberOfNights - Number of nights
 * @param cleaningFee - Cleaning fee set by realtor (default 0)
 * @param securityDeposit - Security deposit set by realtor (default 0)
 * @returns Fee breakdown object
 */
export const calculateFeeBreakdown = (
  pricePerNight: number,
  numberOfNights: number,
  cleaningFee: number = 0,
  securityDeposit: number = 0
): FeeBreakdown => {
  // Validate inputs
  if (
    pricePerNight < 0 ||
    numberOfNights < 1 ||
    cleaningFee < 0 ||
    securityDeposit < 0
  ) {
    throw new Error(
      "Invalid fee breakdown parameters: all values must be non-negative and nights >= 1"
    );
  }

  // Room fee = price per night × number of nights
  const roomFee = pricePerNight * numberOfNights;

  // Legacy estimate helper (booking flows should use pricingEngine for canonical math).
  const serviceFee = (roomFee + cleaningFee) * appConfig.SERVICE_FEE_RATE;

  const platformFee = roomFee * appConfig.DEFAULT_PLATFORM_COMMISSION_RATE;

  // Total amount customer pays
  const totalAmount = roomFee + cleaningFee + securityDeposit + serviceFee;

  return {
    roomFee,
    cleaningFee,
    securityDeposit,
    serviceFee,
    platformFee,
    totalAmount,
  };
};

/**
 * Create escrow event record for audit trail
 */
/**
 * Log escrow event with new format (for new commission flow)
 */
export const logEscrowEvent = async (params: {
  bookingId: string;
  eventType: EscrowEventType;
  amount: number | Decimal;
  description?: string;
  metadata?: any;
}) => {
  return await prisma.escrowEvent.create({
    data: {
      bookingId: params.bookingId,
      eventType: params.eventType,
      amount: new Prisma.Decimal(params.amount.toString()),
      fromParty: "SYSTEM",
      toParty: "SYSTEM",
      notes: params.description || "",
      triggeredBy: "SYSTEM",
      providerResponse: params.metadata
        ? JSON.parse(JSON.stringify(params.metadata))
        : null,
    },
  });
};

export const createEscrowEvent = async (
  bookingId: string,
  eventType: EscrowEventType,
  amount: number,
  fromParty: string,
  toParty: string,
  transactionReference?: string,
  notes?: string,
  triggeredBy?: string,
  providerResponse?: any
) => {
  return await prisma.escrowEvent.create({
    data: {
      bookingId,
      eventType,
      amount: new Prisma.Decimal(amount),
      fromParty,
      toParty,
      transactionReference,
      notes,
      triggeredBy: triggeredBy || "SYSTEM",
      providerResponse: providerResponse
        ? JSON.parse(JSON.stringify(providerResponse))
        : undefined,
    },
  });
};

/**
 * Hold funds in escrow after payment
 *
 * IMPORTANT: Only room fee and security deposit go into escrow
 * Cleaning fee and service fee are released IMMEDIATELY to wallets
 *
 * Updates payment status and creates escrow events
 */
export const holdFundsInEscrow = async (
  paymentId: string,
  bookingId: string,
  realtorId: string,
  feeBreakdown: FeeBreakdown
) => {
  // Get booking details for escrow record
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  await prisma.$transaction(async (tx) => {
    // Create Escrow record
    await tx.escrow.create({
      data: {
        bookingId,
        roomFeeHeld: new Prisma.Decimal(feeBreakdown.roomFee),
        depositHeld: new Prisma.Decimal(feeBreakdown.securityDeposit),
        status: EscrowStatus.HOLDING,
      },
    });

    // Update payment to mark ONLY room fee and deposit as held in escrow
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.HELD,
        roomFeeInEscrow: true,
        depositInEscrow: true,
        roomFeeAmount: new Prisma.Decimal(feeBreakdown.roomFee),
        cleaningFeeAmount: new Prisma.Decimal(feeBreakdown.cleaningFee),
        securityDepositAmount: new Prisma.Decimal(feeBreakdown.securityDeposit),
        serviceFeeAmount: new Prisma.Decimal(feeBreakdown.serviceFee),
        platformFeeAmount: new Prisma.Decimal(feeBreakdown.platformFee),
      },
    });

    // IMMEDIATELY credit wallets for non-refundable fees
    // 1. Cleaning fee → Realtor wallet
    if (feeBreakdown.cleaningFee > 0) {
      const realtorWallet = await walletService.getOrCreateWallet(
        WalletOwnerType.REALTOR,
        realtorId
      );
      await walletService.creditWallet(
        realtorWallet.id,
        feeBreakdown.cleaningFee,
        WalletTransactionSource.CLEANING_FEE,
        bookingId,
        { bookingId, paymentId }
      );
    }

    // 2. Service fee → Platform wallet (use fixed platform ID)
    if (feeBreakdown.serviceFee > 0) {
      const platformWallet = await walletService.getOrCreateWallet(
        WalletOwnerType.PLATFORM,
        "platform" // Fixed platform ID
      );
      await walletService.creditWallet(
        platformWallet.id,
        feeBreakdown.serviceFee,
        WalletTransactionSource.SERVICE_FEE,
        bookingId,
        { bookingId, paymentId }
      );
    }
  });

  // Create escrow events for HELD funds (room fee and security deposit)
  await createEscrowEvent(
    bookingId,
    EscrowEventType.HOLD_ROOM_FEE,
    feeBreakdown.roomFee,
    "CUSTOMER",
    "ESCROW",
    undefined,
    `Room fee of ₦${feeBreakdown.roomFee.toFixed(2)} held in escrow`
  );

  if (feeBreakdown.securityDeposit > 0) {
    await createEscrowEvent(
      bookingId,
      EscrowEventType.HOLD_SECURITY_DEPOSIT,
      feeBreakdown.securityDeposit,
      "CUSTOMER",
      "ESCROW",
      undefined,
      `Security deposit of ₦${feeBreakdown.securityDeposit.toFixed(
        2
      )} held in escrow`
    );
  }

  // Create escrow events for IMMEDIATELY RELEASED funds (cleaning + service)
  if (feeBreakdown.cleaningFee > 0) {
    await createEscrowEvent(
      bookingId,
      EscrowEventType.RELEASE_ROOM_FEE_SPLIT,
      feeBreakdown.cleaningFee,
      "CUSTOMER",
      "REALTOR",
      undefined,
      `Cleaning fee of ₦${feeBreakdown.cleaningFee.toFixed(
        2
      )} released immediately to realtor (non-refundable)`
    );
  }

  if (feeBreakdown.serviceFee > 0) {
    await createEscrowEvent(
      bookingId,
      EscrowEventType.COLLECT_SERVICE_FEE,
      feeBreakdown.serviceFee,
      "CUSTOMER",
      "PLATFORM",
      undefined,
      `Service fee of ₦${feeBreakdown.serviceFee.toFixed(
        2
      )} released immediately to platform (non-refundable)`
    );
  }

  logger.info("Escrow funds held and non-refundable fees released", {
    bookingId,
    paymentId,
    heldInEscrow: {
      roomFee: feeBreakdown.roomFee,
      securityDeposit: feeBreakdown.securityDeposit,
      total: feeBreakdown.roomFee + feeBreakdown.securityDeposit,
    },
    releasedImmediately: {
      cleaningFee: feeBreakdown.cleaningFee,
      serviceFee: feeBreakdown.serviceFee,
      total: feeBreakdown.cleaningFee + feeBreakdown.serviceFee,
    },
  });
};

/**
 * @deprecated This function is NO LONGER USED in wallet-based system
 *
 * Cleaning fee is now handled immediately in holdFundsInEscrow()
 * which credits the realtor's wallet directly (no Paystack transfer)
 *
 * OLD FLOW (Paystack): Payment → Paystack transfer to realtor
 * NEW FLOW (Wallet): Payment → Credit realtor wallet immediately
 *
 * This function is kept for backwards compatibility but should not be called
 */
export const transferCleaningFeeToRealtor = async (
  bookingId: string,
  paymentId: string,
  realtorId: string,
  cleaningFee: number
): Promise<{ success: boolean; transferId?: string; error?: string }> => {
  logger.warn(
    "DEPRECATED: transferCleaningFeeToRealtor called - cleaning fee should be handled in holdFundsInEscrow",
    {
      bookingId,
      paymentId,
      realtorId,
      cleaningFee,
    }
  );

  // Return success to avoid breaking existing code
  return { success: true };

  /* OLD IMPLEMENTATION - DEPRECATED
  ============================================
  if (cleaningFee <= 0) {
    return { success: true }; // No cleaning fee to transfer
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: {
          include: {
            realtor: true,
          },
        },
        payment: true,
      },
    });

    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    const realtor = booking.property.realtor;

    try {
      const recipientCode = await ensureRealtorTransferRecipientCode(realtor.id);

      // Idempotent reference
      const transferReference = `cleaning_fee_${bookingId}_${paymentId.slice(
        -8
      )}`;

      // Check if transfer already exists
      const existingEvent = await prisma.escrowEvent.findFirst({
        where: {
          bookingId,
          eventType: EscrowEventType.RELEASE_ROOM_FEE_SPLIT,
          toParty: "REALTOR",
          transactionReference: transferReference,
          notes: { contains: "Cleaning fee" },
        },
      });

      if (!existingEvent) {
        // Initiate Paystack transfer
        const transferResult = await paystackService.initiateTransfer({
          amount: cleaningFee,
          recipient: recipientCode,
          reason: `Cleaning fee for booking ${bookingId}`,
          reference: transferReference,
        });

        logger.info("Cleaning fee transferred successfully", {
          bookingId,
          realtorId: realtor.id,
          amount: cleaningFee,
          reference: transferReference,
          transferId: transferResult.id,
        });

        return { success: true, transferId: transferResult.id };
      }

      logger.info("Cleaning fee transfer already processed", {
        bookingId,
        reference: transferReference,
      });
      return { success: true };
    } catch (paystackError: any) {
      logger.error("Cleaning fee transfer failed", {
        bookingId,
        realtorId: realtor.id,
        amount: cleaningFee,
        error: paystackError.message,
      });
      return { success: false, error: paystackError.message };
    }
  } catch (error: any) {
    logger.error("Failed to transfer cleaning fee", {
      bookingId,
      error: error.message,
    });
    return { success: false, error: error.message };
  }
  ============================================ */
};

/**
 * Release room fee split using the effective commission snapshot
 * Called 1 hour after check-in if no user dispute
 *
 * IMPORTANT: Money moves from escrow to WALLETS (not Paystack)
 * Realtors withdraw from wallet later
 */
export const releaseRoomFeeSplit = async (
  bookingId: string,
  paymentId: string,
  realtorId: string
) => {
  // Check payment status
  const paymentCheck = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      roomFeeAmount: true,
      roomFeeInEscrow: true,
      commissionEffectiveRate: true,
      roomFeeSplitPlatformAmount: true,
      platformFeeAmount: true,
      booking: {
        select: {
          commissionEffectiveRate: true,
          roomFee: true,
          platformFee: true,
        },
      },
    },
  });

  if (!paymentCheck || !paymentCheck.roomFeeInEscrow) {
    throw new Error("Room fee not in escrow or already released");
  }

  const roomFee = paymentCheck.roomFeeAmount.toNumber();
  const effectiveRate = resolveEffectiveCommissionRate({
    directRate:
      paymentCheck.commissionEffectiveRate ??
      paymentCheck.booking?.commissionEffectiveRate,
    roomFeeValue: paymentCheck.roomFeeAmount,
    platformCandidates: [
      paymentCheck.roomFeeSplitPlatformAmount,
      paymentCheck.platformFeeAmount,
      paymentCheck.booking?.platformFee,
    ],
  });
  const realtorAmount = Number((roomFee * (1 - effectiveRate)).toFixed(2));
  const platformAmount = Number((roomFee * effectiveRate).toFixed(2));

  // Get booking details
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      property: {
        include: {
          realtor: true,
        },
      },
    },
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  // Release funds from escrow to wallets (all in one transaction)
  await prisma.$transaction(async (tx) => {
    // 1. Credit realtor wallet
    const realtorWallet = await walletService.getOrCreateWallet(
      WalletOwnerType.REALTOR,
      realtorId
    );
    await walletService.creditWallet(
      realtorWallet.id,
      realtorAmount,
      WalletTransactionSource.ROOM_FEE,
      bookingId,
      {
        bookingId,
        paymentId,
        effectiveCommissionRate: effectiveRate,
        payoutRate: 1 - effectiveRate,
      }
    );

    // 2. Credit platform wallet
    const platformWallet = await walletService.getOrCreateWallet(
      WalletOwnerType.PLATFORM,
      "platform"
    );
    await walletService.creditWallet(
      platformWallet.id,
      platformAmount,
      WalletTransactionSource.ROOM_FEE, // Platform share of room fee
      bookingId,
      {
        bookingId,
        paymentId,
        effectiveCommissionRate: effectiveRate,
      }
    );

    // 3. Update payment status
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.PARTIALLY_RELEASED, // Room fee released, deposit still held
        roomFeeInEscrow: false,
        roomFeeSplitDone: true,
        roomFeeReleasedAt: new Date(),
      },
    });

    // 4. Update escrow record
    await tx.escrow.update({
      where: { bookingId },
      data: {
        roomFeeHeld: new Prisma.Decimal(0), // Room fee released
        // Deposit still held
      },
    });

    // 5. Create escrow events for the split
    await createEscrowEvent(
      bookingId,
      EscrowEventType.RELEASE_ROOM_FEE_SPLIT,
      realtorAmount,
      "ESCROW",
      "REALTOR_WALLET",
      `room_fee_${bookingId}_${paymentId.slice(-8)}`,
      `Released ₦${realtorAmount.toFixed(
        2
      )} (${((1 - effectiveRate) * 100).toFixed(2)}%) to realtor wallet from room fee`
    );

    await createEscrowEvent(
      bookingId,
      EscrowEventType.RELEASE_ROOM_FEE_SPLIT,
      platformAmount,
      "ESCROW",
      "PLATFORM_WALLET",
      undefined,
      `Released ₦${platformAmount.toFixed(2)} (${(effectiveRate * 100).toFixed(2)}%) to platform from room fee`
    );
  });

  logger.info("Room fee split completed successfully", {
    bookingId,
    paymentId,
    effectiveRate,
    realtorAmount,
    platformAmount,
    totalReleased: roomFee,
  });

  return {
    realtorAmount,
    platformAmount,
    totalReleased: roomFee,
  };
};

/**
 * Return security deposit to customer
 * Called 2 hours after check-out if no realtor dispute
 */
export const returnSecurityDeposit = async (
  bookingId: string,
  paymentId: string,
  customerId: string
) => {
  // Use transaction to ensure atomicity
  return await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            guest: true,
          },
        },
      },
    });

    if (!payment || !payment.depositInEscrow) {
      throw new Error("Security deposit not in escrow or already released");
    }

    const depositAmount = payment.securityDepositAmount.toNumber();

    if (depositAmount === 0) {
      // No deposit to return
      return { depositReturned: 0 };
    }

    // Idempotent reference for refund
    const refundReference = `deposit_${bookingId}_${paymentId.slice(-8)}`;

    // Check if refund already processed
    const existingEvent = await tx.escrowEvent.findFirst({
      where: {
        bookingId,
        eventType: EscrowEventType.RELEASE_DEPOSIT_TO_CUSTOMER,
        toParty: "CUSTOMER",
        transactionReference: refundReference,
      },
    });

    if (existingEvent) {
      logger.info("Deposit refund already processed", {
        bookingId,
        paymentId,
        refundReference,
      });
      return { depositReturned: depositAmount };
    }

    const paymentMethod = payment.method || PaymentMethod.PAYSTACK;
    const transactionReference =
      payment.providerTransactionId || payment.reference;

    if (!transactionReference) {
      logger.warn("No transaction reference found for refund", {
        paymentId,
        bookingId,
      });
      throw new Error("Cannot process refund without transaction reference");
    }

    // Process refund based on payment method
    try {
      if (paymentMethod === PaymentMethod.PAYSTACK) {
        const refundResult = await paystackService.processRefund(
          transactionReference,
          depositAmount
        );
        logger.info("Paystack deposit refund initiated", {
          bookingId,
          paymentId,
          customerId,
          amount: depositAmount,
          refundReference,
          refundId: refundResult.id,
        });
      } else {
        throw new Error(`Unsupported payment method: ${paymentMethod}`);
      }
    } catch (refundError: any) {
      logger.error("Deposit refund failed", {
        bookingId,
        paymentId,
        error: refundError.message,
        stack: refundError.stack,
      });

      // Update payment with error metadata
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          metadata: {
            ...(payment.metadata as any),
            refundFailed: true,
            refundError: refundError.message,
            refundErrorTimestamp: new Date().toISOString(),
          },
        },
      });

      // Re-throw to prevent marking as refunded
      throw new Error(`Deposit refund failed: ${refundError.message}`);
    }

    // Update payment status
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        depositInEscrow: false,
        depositRefunded: true,
        depositReleasedAt: new Date(),
        status: PaymentStatus.SETTLED, // All money distributed (room fee + deposit)
      },
    });

    // Update escrow record - deposit refunded
    await tx.escrow.update({
      where: { bookingId },
      data: {
        depositHeld: new Prisma.Decimal(0), // Deposit refunded to guest
        status: EscrowStatus.REFUNDED, // Escrow fully resolved
      },
    });

    // Create escrow event
    await createEscrowEvent(
      bookingId,
      EscrowEventType.RELEASE_DEPOSIT_TO_CUSTOMER,
      depositAmount,
      "ESCROW",
      "CUSTOMER",
      refundReference,
      `Returned security deposit of ₦${depositAmount.toFixed(
        2
      )} to customer via Paystack refund`
    );

    logger.info("Security deposit returned successfully", {
      bookingId,
      paymentId,
      customerId,
      amount: depositAmount,
      refundReference,
    });

    return {
      depositReturned: depositAmount,
    };
  });
};

/**
 * Pay realtor from security deposit (after dispute resolution)
 */
export const payRealtorFromDeposit = async (
  bookingId: string,
  paymentId: string,
  amount: number,
  notes: string
) => {
  // Use transaction to ensure atomicity
  return await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
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
        },
      },
    });

    if (!payment || !payment.depositInEscrow) {
      throw new Error("Security deposit not in escrow");
    }

    const depositAmount = payment.securityDepositAmount.toNumber();

    if (amount > depositAmount) {
      throw new Error(
        `Requested amount ₦${amount} exceeds available deposit ₦${depositAmount}`
      );
    }

    const remainingDeposit = depositAmount - amount;
    const paymentMethod = payment.method || PaymentMethod.PAYSTACK;
    const realtor = payment.booking.property.realtor;
    const transactionReference =
      payment.providerTransactionId || payment.reference;

    // Idempotent references
    const transferReference = `deposit_realtor_${bookingId}_${paymentId.slice(
      -8
    )}`;
    const refundReference = `deposit_remain_${bookingId}_${paymentId.slice(
      -8
    )}`;

    // Check if transfer already processed
    const existingTransferEvent = await tx.escrowEvent.findFirst({
      where: {
        bookingId,
        eventType: EscrowEventType.PAY_REALTOR_FROM_DEPOSIT,
        toParty: "REALTOR",
        transactionReference: transferReference,
      },
    });

    if (existingTransferEvent) {
      logger.info("Deposit transfer to realtor already processed", {
        bookingId,
        paymentId,
        transferReference,
      });
      return {
        paidToRealtor: amount,
        returnedToCustomer: remainingDeposit,
      };
    }

    if (!transactionReference) {
      throw new Error("Cannot process without transaction reference");
    }

      // Transfer to realtor
      try {
        if (paymentMethod === PaymentMethod.PAYSTACK) {
          const recipientCode = await ensureRealtorTransferRecipientCode(
            realtor.id
          );

          const transferResult = await paystackService.initiateTransfer({
            amount,
            recipient: recipientCode,
            reason: `Deposit claim: ${notes}`,
            reference: transferReference,
          });

        logger.info("Paystack deposit transfer to realtor initiated", {
          bookingId,
          paymentId,
          realtorId: realtor.id,
          amount,
          transferReference,
          transferId: transferResult.transfer_code,
        });
      } else {
        throw new Error(`Unsupported payment method: ${paymentMethod}`);
      }
    } catch (transferError: any) {
      logger.error("Deposit transfer to realtor failed", {
        bookingId,
        paymentId,
        error: transferError.message,
        stack: transferError.stack,
      });

      await tx.payment.update({
        where: { id: paymentId },
        data: {
          metadata: {
            ...(payment.metadata as any),
            depositTransferFailed: true,
            depositTransferError: transferError.message,
            depositTransferErrorTimestamp: new Date().toISOString(),
          },
        },
      });

      throw new Error(
        `Deposit transfer to realtor failed: ${transferError.message}`
      );
    }

    // Refund remaining deposit to customer if any
    if (remainingDeposit > 0) {
      try {
        if (paymentMethod === PaymentMethod.PAYSTACK) {
          const refundResult = await paystackService.processRefund(
            transactionReference,
            remainingDeposit
          );
          logger.info("Paystack remaining deposit refund initiated", {
            bookingId,
            paymentId,
            amount: remainingDeposit,
            refundReference,
            refundId: refundResult.id,
          });
        }
      } catch (refundError: any) {
        logger.error("Remaining deposit refund failed", {
          bookingId,
          paymentId,
          error: refundError.message,
          stack: refundError.stack,
        });

        await tx.payment.update({
          where: { id: paymentId },
          data: {
            metadata: {
              ...(payment.metadata as any),
              remainingDepositRefundFailed: true,
              remainingDepositRefundError: refundError.message,
              remainingDepositRefundErrorTimestamp: new Date().toISOString(),
            },
          },
        });

        throw new Error(
          `Remaining deposit refund failed: ${refundError.message}`
        );
      }
    }

    // Create escrow events
    await createEscrowEvent(
      bookingId,
      EscrowEventType.PAY_REALTOR_FROM_DEPOSIT,
      amount,
      "ESCROW",
      "REALTOR",
      transferReference,
      notes
    );

    if (remainingDeposit > 0) {
      await createEscrowEvent(
        bookingId,
        EscrowEventType.RELEASE_DEPOSIT_TO_CUSTOMER,
        remainingDeposit,
        "ESCROW",
        "CUSTOMER",
        refundReference,
        `Returned remaining security deposit of ₦${remainingDeposit.toFixed(
          2
        )} to customer`
      );
    }

    // Update payment
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        depositInEscrow: false,
        depositReleasedAt: new Date(),
      },
    });

    logger.info("Deposit split completed", {
      bookingId,
      paymentId,
      paidToRealtor: amount,
      returnedToCustomer: remainingDeposit,
    });

    return {
      paidToRealtor: amount,
      returnedToCustomer: remainingDeposit,
    };
  });
};

/**
 * Refund room fee to customer (after dispute resolution)
 */
export const refundRoomFeeToCustomer = async (
  bookingId: string,
  paymentId: string,
  refundAmount: number,
  notes: string
) => {
  // Use transaction to ensure atomicity
  return await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
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
        },
      },
    });

    if (!payment || !payment.roomFeeInEscrow) {
      throw new Error("Room fee not in escrow");
    }

    const roomFee = payment.roomFeeAmount.toNumber();

    if (refundAmount > roomFee) {
      throw new Error(
        `Refund amount ₦${refundAmount} exceeds available room fee ₦${roomFee}`
      );
    }

    // Calculate remaining amount split using effective commission snapshot
    const remainingForRealtor = roomFee - refundAmount;
    const effectiveRate = resolveEffectiveCommissionRate({
      directRate:
        payment.commissionEffectiveRate ??
        payment.booking.commissionEffectiveRate,
      roomFeeValue: payment.roomFeeAmount,
      platformCandidates: [
        payment.roomFeeSplitPlatformAmount,
        payment.platformFeeAmount,
        payment.booking.platformFee,
      ],
    });
    const realtorAmount = Number(
      (remainingForRealtor * (1 - effectiveRate)).toFixed(2)
    );
    const platformAmount = Number(
      (remainingForRealtor * effectiveRate).toFixed(2)
    );

    const paymentMethod = payment.method || PaymentMethod.PAYSTACK;
    const realtor = payment.booking.property.realtor;
    const transactionReference =
      payment.providerTransactionId || payment.reference;

    // Idempotent references
    const refundReference = `roomfee_refund_${bookingId}_${paymentId.slice(
      -8
    )}`;
    const transferReference = `roomfee_realtor_${bookingId}_${paymentId.slice(
      -8
    )}`;

    // Check if refund already processed
    const existingRefundEvent = await tx.escrowEvent.findFirst({
      where: {
        bookingId,
        eventType: EscrowEventType.REFUND_PARTIAL_TO_CUSTOMER,
        toParty: "CUSTOMER",
        transactionReference: refundReference,
      },
    });

    if (existingRefundEvent) {
      logger.info("Room fee refund already processed", {
        bookingId,
        paymentId,
        refundReference,
      });
      return {
        refundedToCustomer: refundAmount,
        paidToRealtor: realtorAmount,
        paidToPlatform: platformAmount,
      };
    }

    if (!transactionReference) {
      throw new Error("Cannot process without transaction reference");
    }

    // Refund to customer
    try {
      if (paymentMethod === PaymentMethod.PAYSTACK) {
        const refundResult = await paystackService.processRefund(
          transactionReference,
          refundAmount
        );
        logger.info("Paystack room fee refund initiated", {
          bookingId,
          paymentId,
          amount: refundAmount,
          refundReference,
          refundId: refundResult.id,
        });
      } else {
        throw new Error(`Unsupported payment method: ${paymentMethod}`);
      }
    } catch (refundError: any) {
      logger.error("Room fee refund failed", {
        bookingId,
        paymentId,
        error: refundError.message,
        stack: refundError.stack,
      });

      await tx.payment.update({
        where: { id: paymentId },
        data: {
          metadata: {
            ...(payment.metadata as any),
            roomFeeRefundFailed: true,
            roomFeeRefundError: refundError.message,
            roomFeeRefundErrorTimestamp: new Date().toISOString(),
          },
        },
      });

      throw new Error(`Room fee refund failed: ${refundError.message}`);
    }

    // Transfer remaining amount to realtor if any
    if (realtorAmount > 0) {
      try {
        if (paymentMethod === PaymentMethod.PAYSTACK) {
          const recipientCode = await ensureRealtorTransferRecipientCode(
            realtor.id
          );

          const transferResult = await paystackService.initiateTransfer({
            amount: realtorAmount,
            recipient: recipientCode,
            reason: `Partial room fee payout: ${notes}`,
            reference: transferReference,
          });

          logger.info(
            "Paystack partial room fee transfer to realtor initiated",
            {
              bookingId,
              paymentId,
              realtorId: realtor.id,
              amount: realtorAmount,
              transferReference,
              transferId: transferResult.transfer_code,
            }
          );
        } else {
          throw new Error(`Unsupported payment method: ${paymentMethod}`);
        }
      } catch (transferError: any) {
        logger.error("Partial room fee transfer to realtor failed", {
          bookingId,
          paymentId,
          error: transferError.message,
          stack: transferError.stack,
        });

        await tx.payment.update({
          where: { id: paymentId },
          data: {
            metadata: {
              ...(payment.metadata as any),
              partialTransferFailed: true,
              partialTransferError: transferError.message,
              partialTransferErrorTimestamp: new Date().toISOString(),
            },
          },
        });

        throw new Error(
          `Partial room fee transfer failed: ${transferError.message}`
        );
      }
    }

    // Create escrow events
    await createEscrowEvent(
      bookingId,
      EscrowEventType.REFUND_PARTIAL_TO_CUSTOMER,
      refundAmount,
      "ESCROW",
      "CUSTOMER",
      refundReference,
      notes
    );

    if (remainingForRealtor > 0) {
      await createEscrowEvent(
        bookingId,
        EscrowEventType.REFUND_PARTIAL_TO_REALTOR,
        realtorAmount,
        "ESCROW",
        "REALTOR",
        transferReference,
        `Released ₦${realtorAmount.toFixed(2)} (${((1 - effectiveRate) * 100).toFixed(2)}% of remaining) to realtor`
      );

      await createEscrowEvent(
        bookingId,
        EscrowEventType.RELEASE_ROOM_FEE_SPLIT,
        platformAmount,
        "ESCROW",
        "PLATFORM",
        undefined,
        `Released ₦${platformAmount.toFixed(2)} (${(effectiveRate * 100).toFixed(2)}% of remaining) to platform`
      );
    }

    // Update payment
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        roomFeeInEscrow: false,
        roomFeeReleasedAt: new Date(),
        status: PaymentStatus.PARTIALLY_RELEASED, // Room fee split completed
      },
    });

    logger.info("Room fee split and refund completed", {
      bookingId,
      paymentId,
      refundedToCustomer: refundAmount,
      paidToRealtor: realtorAmount,
      paidToPlatform: platformAmount,
    });

    return {
      refundedToCustomer: refundAmount,
      paidToRealtor: realtorAmount,
      paidToPlatform: platformAmount,
    };
  });
};

/**
 * Check if user dispute window is still open (within 1 hour of check-in)
 * All timestamps are in UTC
 */
export const isUserDisputeWindowOpen = (checkInTime: Date): boolean => {
  const now = new Date(); // UTC
  const oneHourAfterCheckIn = new Date(checkInTime.getTime() + 60 * 60 * 1000); // UTC + 1 hour
  return now < oneHourAfterCheckIn;
};

/**
 * Check if realtor dispute window is still open (within 2 hours of check-out)
 * All timestamps are in UTC
 */
export const isRealtorDisputeWindowOpen = (checkOutTime: Date): boolean => {
  const now = new Date(); // UTC
  const twoHoursAfterCheckOut = new Date(
    checkOutTime.getTime() + 2 * 60 * 60 * 1000 // UTC + 2 hours
  );
  return now < twoHoursAfterCheckOut;
};

/**
 * Get bookings eligible for room fee release (1 hour after check-in, no user dispute)
 * All date comparisons are in UTC
 */
export const getBookingsEligibleForRoomFeeRelease = async () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // UTC - 1 hour

  return await prisma.booking.findMany({
    where: {
      checkInTime: {
        lte: oneHourAgo, // Check-in was at least 1 hour ago (UTC)
      },
      userDisputeOpened: false,
      status: "ACTIVE",
      payment: {
        roomFeeInEscrow: true,
        roomFeeSplitDone: false,
      },
    },
    include: {
      payment: true,
      property: {
        include: {
          realtor: true,
        },
      },
    },
  });
};

/**
 * Get bookings eligible for deposit return (2 hours after check-out, no realtor dispute)
 * All date comparisons are in UTC
 */
export const getBookingsEligibleForDepositReturn = async () => {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000); // UTC - 2 hours

  return await prisma.booking.findMany({
    where: {
      checkOutTime: {
        lte: twoHoursAgo, // Check-out was at least 2 hours ago (UTC)
      },
      realtorDisputeOpened: false,
      status: "COMPLETED",
      payment: {
        depositInEscrow: true,
        depositRefunded: false,
      },
    },
    include: {
      payment: true,
      guest: true,
    },
  });
};

export default {
  calculateFeeBreakdown,
  createEscrowEvent,
  logEscrowEvent, // New commission flow format
  holdFundsInEscrow,
  transferCleaningFeeToRealtor,
  releaseRoomFeeSplit,
  returnSecurityDeposit,
  payRealtorFromDeposit,
  refundRoomFeeToCustomer,
  isUserDisputeWindowOpen,
  isRealtorDisputeWindowOpen,
  getBookingsEligibleForRoomFeeRelease,
  getBookingsEligibleForDepositReturn,
};


