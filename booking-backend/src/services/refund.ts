import { PrismaClient, RefundTier } from "@prisma/client";
import { config } from "../config";

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

  if (!booking.payment || booking.payment.status !== "COMPLETED") {
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

  // Update payment record
  await prisma.payment.update({
    where: { id: booking.payment.id },
    data: {
      status: "PARTIAL_REFUND",
      refundAmount: refundSplit.customerRefund,
      refundedAt: new Date(),
      platformCommission: refundSplit.stayzaPayout,
      realtorEarnings: refundSplit.realtorPayout,
    },
  });

  return {
    bookingId,
    refundSplit,
    tier: refundSplit.tier,
    totalAmount,
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
