import { PrismaClient, RefundTier } from "@prisma/client";
import { config } from "../config";
import { processRefund as paystackProcessRefund } from "./paystack";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

interface RefundSplit {
  customerRefund: number;
  realtorPayout: number;
  stayzaPayout: number;
  tier: RefundTier;
}

/**
 * Calculate refund split based on time before check-in
 * @param checkInTime - Booking check-in timestamp
 * @param totalAmount - Total payment amount
 * @returns Refund split breakdown
 */
export const calculateRefundSplit = (
  checkInTime: Date,
  totalAmount: number
): RefundSplit => {
  const now = new Date();
  const hoursUntilCheckIn =
    (checkInTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  let tier: RefundTier;
  let customerPercent: number;
  let realtorPercent: number;
  let stayzaPercent: number;

  if (hoursUntilCheckIn >= 24) {
    // EARLY: 24+ hours before check-in
    tier = RefundTier.EARLY;
    customerPercent = 90;
    realtorPercent = 7;
    stayzaPercent = 3;
  } else if (hoursUntilCheckIn >= 12) {
    // MEDIUM: 12-24 hours before check-in
    tier = RefundTier.MEDIUM;
    customerPercent = 70;
    realtorPercent = 20;
    stayzaPercent = 10;
  } else if (hoursUntilCheckIn > 0) {
    // LATE: 0-12 hours before check-in
    tier = RefundTier.LATE;
    customerPercent = 0;
    realtorPercent = 80;
    stayzaPercent = 20;
  } else {
    // NONE: After check-in time (no refund)
    tier = RefundTier.NONE;
    customerPercent = 0;
    realtorPercent = 0;
    stayzaPercent = 0;
  }

  return {
    customerRefund: Number((totalAmount * (customerPercent / 100)).toFixed(2)),
    realtorPayout: Number((totalAmount * (realtorPercent / 100)).toFixed(2)),
    stayzaPayout: Number((totalAmount * (stayzaPercent / 100)).toFixed(2)),
    tier,
  };
};

/**
 * Process refund for a cancelled booking
 * @param bookingId - Booking ID to refund
 * @returns Refund details
 */
export const processBookingRefund = async (bookingId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: true,
      property: {
        include: {
          realtor: true,
        },
      },
      guest: true,
    },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (
    !booking.payment ||
    (booking.payment.status !== "COMPLETED" &&
      booking.payment.status !== "PARTIAL_RELEASED")
  ) {
    throw new Error("No completed payment found for this booking");
  }

  if (booking.status !== "CANCELLED") {
    throw new Error("Booking must be cancelled before refunding");
  }

  const totalAmount = Number(booking.totalPrice);
  const refundSplit = calculateRefundSplit(booking.checkInDate, totalAmount);

  // Update booking with refund tier
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      refundTier: refundSplit.tier,
    },
  });

  // Only process Paystack refund if customer actually gets money back
  let paystackRefundData = null;
  if (refundSplit.customerRefund > 0 && booking.payment.reference) {
    try {
      logger.info("💳 Initiating Paystack refund", {
        reference: booking.payment.reference,
        amount: refundSplit.customerRefund,
        tier: refundSplit.tier,
      });

      paystackRefundData = await paystackProcessRefund(
        booking.payment.reference,
        refundSplit.customerRefund
      );

      logger.info("✅ Paystack refund successful", {
        refundId: paystackRefundData.id,
        amount: paystackRefundData.amount,
        status: paystackRefundData.status,
      });
    } catch (error: any) {
      logger.error("❌ Paystack refund failed", {
        error: error.message,
        reference: booking.payment.reference,
        amount: refundSplit.customerRefund,
      });
      // Continue with database updates even if Paystack fails
      // Admin can manually process the refund later
    }
  }

  // Update payment record
  await prisma.payment.update({
    where: { id: booking.payment.id },
    data: {
      status: "REFUNDED_TO_CUSTOMER",
      refundAmount: refundSplit.customerRefund,
      refundedAt: new Date(),
      platformCommission: refundSplit.stayzaPayout,
      realtorEarnings: refundSplit.realtorPayout,
      // Store Paystack refund transaction ID if successful
      ...(paystackRefundData && {
        metadata: {
          ...(booking.payment.metadata as any),
          paystackRefundId: paystackRefundData.id,
          paystackRefundStatus: paystackRefundData.status,
          paystackRefundReference: paystackRefundData.transaction_reference,
        },
      }),
    },
  });

  return {
    bookingId,
    refundSplit,
    tier: refundSplit.tier,
    totalAmount,
    paystackRefund: paystackRefundData,
  };
};

/**
 * Check if booking is eligible for refund
 * @param checkInTime - Booking check-in timestamp
 * @returns Boolean indicating if refund is possible
 */
export const isRefundEligible = (checkInTime: Date): boolean => {
  const now = new Date();
  return checkInTime.getTime() > now.getTime();
};
