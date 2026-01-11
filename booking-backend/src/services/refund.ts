import { PrismaClient, RefundTier, PaymentStatus } from "@prisma/client";
import { config } from "../config";
import { processRefund as paystackProcessRefund } from "./paystack";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

interface RefundSplit {
  customerRefund: number; // Refundable amount (room fee % + full deposit)
  realtorPayout: number; // Realtor compensation from escrow
  stayzaPayout: number; // Platform retention from escrow
  tier: RefundTier;
  breakdown: {
    roomFeeToGuest: number; // Tier % of room fee to guest
    depositToGuest: number; // Always 100% of deposit to guest
    roomFeeToRealtor: number; // Realtor compensation from room fee
    roomFeeToPlatform: number; // Platform retention from room fee
  };
}

/**
 * Calculate refund split based on time before check-in
 * CRITICAL: Tiers apply ONLY to room fee, NOT total payment
 * Cleaning & service fees are NEVER refunded (already in wallets)
 * Security deposit is ALWAYS 100% refunded (not subject to tiers)
 *
 * @param checkInTime - Booking check-in timestamp
 * @param roomFeeAmount - Room fee amount (tier applies here)
 * @param depositAmount - Security deposit (always 100% refunded)
 * @returns Refund split breakdown
 */
export const calculateRefundSplit = (
  checkInTime: Date,
  roomFeeAmount: number,
  depositAmount: number
): RefundSplit => {
  const now = new Date();
  const hoursUntilCheckIn =
    (checkInTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  let tier: RefundTier;
  let customerPercent: number; // Applies to room fee only
  let realtorPercent: number; // Applies to room fee only
  let stayzaPercent: number; // Applies to room fee only

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

  // Calculate room fee splits (tier-based)
  const roomFeeToGuest = Number(
    (roomFeeAmount * (customerPercent / 100)).toFixed(2)
  );
  const roomFeeToRealtor = Number(
    (roomFeeAmount * (realtorPercent / 100)).toFixed(2)
  );
  const roomFeeToPlatform = Number(
    (roomFeeAmount * (stayzaPercent / 100)).toFixed(2)
  );

  // Deposit is always 100% refunded (not subject to tiers)
  const depositToGuest = depositAmount;

  // Total customer refund = tier % of room fee + full deposit
  const customerRefund = roomFeeToGuest + depositToGuest;

  return {
    customerRefund,
    realtorPayout: roomFeeToRealtor,
    stayzaPayout: roomFeeToPlatform,
    tier,
    breakdown: {
      roomFeeToGuest,
      depositToGuest,
      roomFeeToRealtor,
      roomFeeToPlatform,
    },
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

  if (!booking.payment || booking.payment.status !== PaymentStatus.HELD) {
    throw new Error(
      "Payment must be in HELD status (escrow) for cancellation refund"
    );
  }

  if (booking.status !== "CANCELLED") {
    throw new Error("Booking must be cancelled before refunding");
  }

  // CRITICAL: Tiers apply ONLY to room fee (in escrow)
  // Cleaning & service fees are NEVER refunded (already in wallets)
  const roomFeeAmount = Number(booking.payment.roomFeeAmount);
  const depositAmount = Number(booking.payment.securityDepositAmount);

  const refundSplit = calculateRefundSplit(
    booking.checkInDate,
    roomFeeAmount,
    depositAmount
  );

  logger.info("💰 Refund calculation", {
    bookingId,
    tier: refundSplit.tier,
    roomFeeAmount,
    depositAmount,
    breakdown: refundSplit.breakdown,
    totalCustomerRefund: refundSplit.customerRefund,
  });

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
        breakdown: refundSplit.breakdown,
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
      status: PaymentStatus.REFUNDED,
      refundAmount: refundSplit.customerRefund,
      refundedAt: new Date(),
      platformCommission: refundSplit.stayzaPayout, // Platform keeps this from escrow
      realtorEarnings: refundSplit.realtorPayout, // Realtor gets this from escrow
      metadata: {
        ...(booking.payment.metadata as any),
        refundBreakdown: refundSplit.breakdown,
        refundTier: refundSplit.tier,
        // Note: Cleaning & service fees NOT refunded (already in wallets)
        ...(paystackRefundData && {
          paystackRefundId: paystackRefundData.id,
          paystackRefundStatus: paystackRefundData.status,
          paystackRefundReference: paystackRefundData.transaction_reference,
        }),
      },
    },
  });

  return {
    bookingId,
    refundSplit,
    tier: refundSplit.tier,
    breakdown: refundSplit.breakdown,
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
