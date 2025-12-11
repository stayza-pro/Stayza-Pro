import {
  Prisma,
  EscrowEventType,
  PaymentStatus,
  PaymentMethod,
} from "@prisma/client";
import { prisma } from "@/config/database";
import { paystackService } from "./paystack";
import { flutterwaveService } from "./flutterwave";
import { logger } from "@/utils/logger";

interface FeeBreakdown {
  roomFee: number;
  cleaningFee: number;
  securityDeposit: number;
  serviceFee: number;
  platformFee: number;
  totalAmount: number;
}

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

  // Service fee = 2% of (room fee + cleaning fee)
  const serviceFee = (roomFee + cleaningFee) * 0.02;

  // Platform fee = 10% of room fee (deducted at release time)
  const platformFee = roomFee * 0.1;

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
 * Updates payment status and creates escrow events
 */
export const holdFundsInEscrow = async (
  paymentId: string,
  bookingId: string,
  feeBreakdown: FeeBreakdown
) => {
  // Update payment to mark funds as held in escrow
  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: PaymentStatus.ESCROW_HELD,
      roomFeeInEscrow: true,
      depositInEscrow: true,
      roomFeeAmount: new Prisma.Decimal(feeBreakdown.roomFee),
      cleaningFeeAmount: new Prisma.Decimal(feeBreakdown.cleaningFee),
      securityDepositAmount: new Prisma.Decimal(feeBreakdown.securityDeposit),
      serviceFeeAmount: new Prisma.Decimal(feeBreakdown.serviceFee),
      platformFeeAmount: new Prisma.Decimal(feeBreakdown.platformFee),
    },
  });

  // Create escrow events for room fee and security deposit
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

  logger.info("Funds held in escrow", {
    bookingId,
    paymentId,
    roomFee: feeBreakdown.roomFee,
    securityDeposit: feeBreakdown.securityDeposit,
    totalHeld: feeBreakdown.roomFee + feeBreakdown.securityDeposit,
  });
};

/**
 * Release room fee split: 90% to realtor, 10% to platform
 * Called 1 hour after check-in if no user dispute
 */
export const releaseRoomFeeSplit = async (
  bookingId: string,
  paymentId: string,
  realtorId: string
) => {
  // First check payment status outside transaction
  const paymentCheck = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { roomFeeAmount: true, roomFeeInEscrow: true },
  });

  if (!paymentCheck || !paymentCheck.roomFeeInEscrow) {
    throw new Error("Room fee not in escrow or already released");
  }

  const roomFee = paymentCheck.roomFeeAmount.toNumber();
  const realtorAmount = roomFee * 0.9; // 90%
  const platformAmount = roomFee * 0.1; // 10%

  // Integrate with actual payout provider (Paystack or Flutterwave)
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
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
        payment: true,
      },
    });

    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    const paymentMethod = booking.payment?.method || PaymentMethod.PAYSTACK;
    const realtor = booking.property.realtor;

    // Transfer to realtor based on payment method
    if (paymentMethod === PaymentMethod.PAYSTACK) {
      // Use Paystack subaccount for transfers
      if (realtor.paystackSubAccountCode) {
        try {
          // Idempotent reference using bookingId (not timestamp)
          const transferReference = `room_fee_${bookingId}_${paymentId.slice(
            -8
          )}`;

          // Check if transfer already exists
          const existingEvent = await prisma.escrowEvent.findFirst({
            where: {
              bookingId,
              eventType: EscrowEventType.RELEASE_ROOM_FEE_SPLIT,
              toParty: "REALTOR",
              transactionReference: transferReference,
            },
          });

          if (!existingEvent) {
            // Initiate actual Paystack transfer
            const transferResult = await paystackService.initiateTransfer({
              amount: realtorAmount,
              recipient: realtor.paystackSubAccountCode,
              reason: `Room fee payout for booking ${bookingId}`,
              reference: transferReference,
            });

            logger.info("Paystack transfer initiated successfully", {
              bookingId,
              realtorId: realtor.id,
              amount: realtorAmount,
              reference: transferReference,
              transferId: transferResult.id,
            });
          } else {
            logger.info("Transfer already processed (idempotency)", {
              bookingId,
              reference: transferReference,
            });
          }
        } catch (paystackError: any) {
          logger.error("Paystack transfer failed", {
            bookingId,
            realtorId: realtor.id,
            amount: realtorAmount,
            error: paystackError.message,
            stack: paystackError.stack,
          });
          // Mark for manual intervention
          await prisma.payment.update({
            where: { id: paymentId },
            data: {
              metadata: {
                ...((booking.payment?.metadata as any) || {}),
                transferFailed: true,
                transferError: paystackError.message,
                transferAttemptedAt: new Date().toISOString(),
              } as any,
            },
          });
          throw paystackError; // Re-throw to be caught by outer catch
        }
      } else {
        logger.warn("Realtor missing Paystack subaccount", {
          realtorId: realtor.id,
          bookingId,
        });
        throw new Error(
          `Realtor ${realtor.id} missing Paystack subaccount code`
        );
      }
    } else if (paymentMethod === PaymentMethod.FLUTTERWAVE) {
      // Use Flutterwave transfer
      // Note: This requires bank account details to be added to Realtor model
      logger.warn("Flutterwave transfer not yet implemented", {
        bookingId,
        realtorId: realtor.id,
        amount: realtorAmount,
      });
      // TODO: Implement Flutterwave transfer when bank account fields are added
      // For now, mark as pending manual payout
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          metadata: {
            ...((booking.payment?.metadata as any) || {}),
            manualPayoutRequired: true,
            manualPayoutMethod: "FLUTTERWAVE",
            manualPayoutAmount: realtorAmount,
          } as any,
        },
      });
    }
  } catch (transferError: any) {
    logger.error("Transfer failed for booking", {
      bookingId,
      error: transferError.message,
      stack: transferError.stack,
    });
    // Re-throw to prevent marking as released in database
    throw new Error(`Transfer failed: ${transferError.message}`);
  }

  // Wrap database updates in transaction after successful transfer
  await prisma.$transaction(async (tx) => {
    // Update payment status
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.ROOM_FEE_SPLIT_RELEASED,
        roomFeeInEscrow: false,
        roomFeeSplitDone: true,
        roomFeeReleasedAt: new Date(),
      },
    });

    // Create escrow events for the split
    await createEscrowEvent(
      bookingId,
      EscrowEventType.RELEASE_ROOM_FEE_SPLIT,
      realtorAmount,
      "ESCROW",
      "REALTOR",
      `room_fee_${bookingId}_${paymentId.slice(-8)}`,
      `Released ₦${realtorAmount.toFixed(2)} (90%) to realtor from room fee`
    );

    await createEscrowEvent(
      bookingId,
      EscrowEventType.RELEASE_ROOM_FEE_SPLIT,
      platformAmount,
      "ESCROW",
      "PLATFORM",
      undefined,
      `Released ₦${platformAmount.toFixed(2)} (10%) to platform from room fee`
    );
  });

  logger.info("Room fee split completed successfully", {
    bookingId,
    paymentId,
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
      } else if (paymentMethod === PaymentMethod.FLUTTERWAVE) {
        const refundResult = await flutterwaveService.processRefund(
          transactionReference,
          depositAmount
        );
        logger.info("Flutterwave deposit refund initiated", {
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
      `Returned security deposit of ₦${depositAmount.toFixed(2)} to customer`
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
        if (!realtor.paystackSubAccountCode) {
          throw new Error(
            `Realtor ${realtor.id} missing Paystack subaccount code`
          );
        }

        const transferResult = await paystackService.initiateTransfer({
          amount: amount * 100, // Convert to kobo
          recipient: realtor.paystackSubAccountCode,
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
      } else if (paymentMethod === PaymentMethod.FLUTTERWAVE) {
        if (!realtor.flutterwaveSubAccountCode) {
          logger.warn("Realtor missing Flutterwave subaccount", {
            realtorId: realtor.id,
            bookingId,
          });
          throw new Error(
            `Realtor ${realtor.id} missing Flutterwave subaccount code`
          );
        }

        // Flutterwave transfer implementation
        logger.warn("Flutterwave transfer not fully implemented", {
          bookingId,
          realtorId: realtor.id,
          amount,
        });
        throw new Error("Flutterwave transfers not yet supported");
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
        } else if (paymentMethod === PaymentMethod.FLUTTERWAVE) {
          const refundResult = await flutterwaveService.processRefund(
            transactionReference,
            remainingDeposit
          );
          logger.info("Flutterwave remaining deposit refund initiated", {
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

    // Calculate remaining amount for realtor
    const remainingForRealtor = roomFee - refundAmount;
    const realtorAmount = remainingForRealtor * 0.9; // 90%
    const platformAmount = remainingForRealtor * 0.1; // 10%

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
      } else if (paymentMethod === PaymentMethod.FLUTTERWAVE) {
        const refundResult = await flutterwaveService.processRefund(
          transactionReference,
          refundAmount
        );
        logger.info("Flutterwave room fee refund initiated", {
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
          if (!realtor.paystackSubAccountCode) {
            throw new Error(
              `Realtor ${realtor.id} missing Paystack subaccount code`
            );
          }

          const transferResult = await paystackService.initiateTransfer({
            amount: realtorAmount * 100, // Convert to kobo
            recipient: realtor.paystackSubAccountCode,
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
        } else if (paymentMethod === PaymentMethod.FLUTTERWAVE) {
          if (!realtor.flutterwaveSubAccountCode) {
            logger.warn("Realtor missing Flutterwave subaccount", {
              realtorId: realtor.id,
              bookingId,
            });
            throw new Error(
              `Realtor ${realtor.id} missing Flutterwave subaccount code`
            );
          }

          logger.warn("Flutterwave transfer not fully implemented", {
            bookingId,
            realtorId: realtor.id,
            amount: realtorAmount,
          });
          throw new Error("Flutterwave transfers not yet supported");
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
        `Released ₦${realtorAmount.toFixed(2)} (90% of remaining) to realtor`
      );

      await createEscrowEvent(
        bookingId,
        EscrowEventType.RELEASE_ROOM_FEE_SPLIT,
        platformAmount,
        "ESCROW",
        "PLATFORM",
        undefined,
        `Released ₦${platformAmount.toFixed(2)} (10% of remaining) to platform`
      );
    }

    // Update payment
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        roomFeeInEscrow: false,
        roomFeeReleasedAt: new Date(),
        status: PaymentStatus.PARTIAL_PAYOUT_REALTOR,
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
      status: "CHECKED_IN",
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
      status: "CHECKED_OUT",
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
  holdFundsInEscrow,
  releaseRoomFeeSplit,
  returnSecurityDeposit,
  payRealtorFromDeposit,
  refundRoomFeeToCustomer,
  isUserDisputeWindowOpen,
  isRealtorDisputeWindowOpen,
  getBookingsEligibleForRoomFeeRelease,
  getBookingsEligibleForDepositReturn,
};
