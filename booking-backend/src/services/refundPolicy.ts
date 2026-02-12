import { Booking, RefundTier } from "@prisma/client";

export interface RefundCalculation {
  tier: RefundTier;
  hoursUntilCheckIn: number;

  // Room fee breakdown (only component that gets refunded based on tier)
  roomFee: number;
  customerRoomRefund: number;
  realtorRoomPortion: number;
  platformRoomPortion: number;

  // Always 100% to customer
  securityDepositRefund: number;

  // Never refunded
  serviceFee: number;
  cleaningFee: number;

  // Totals
  totalCustomerRefund: number; // customerRoomRefund + securityDepositRefund
  totalRealtorPortion: number; // realtorRoomPortion + cleaningFee
  totalPlatformPortion: number; // platformRoomPortion + serviceFee

  currency?: string; // Optional currency field for escrow events
  reason: string;
}

interface CalculateRefundParams {
  booking: Booking;
  now?: Date;
}

// Refund tier thresholds (hours before check-in)
const EARLY_HOURS = 24; // 24+ hours
const MEDIUM_HOURS = 12; // 12-24 hours
const LATE_HOURS = 0; // 0-12 hours

// Refund tier splits: [customer %, realtor %, platform %]
const TIER_SPLITS = {
  EARLY: { customer: 0.9, realtor: 0.07, platform: 0.03 },
  MEDIUM: { customer: 0.7, realtor: 0.2, platform: 0.1 },
  LATE: { customer: 0.0, realtor: 0.8, platform: 0.2 },
};

const clampRate = (value: number): number => Math.min(Math.max(value, 0), 1);

const resolveNoRefundSplit = (booking: Booking) => {
  const roomFee = Number(booking.roomFee);
  if (roomFee <= 0) {
    return { customer: 0, realtor: 0, platform: 0 };
  }

  const directRate =
    booking.commissionEffectiveRate !== null
      ? Number(booking.commissionEffectiveRate)
      : null;
  if (directRate !== null && Number.isFinite(directRate)) {
    const platformRate = clampRate(directRate);
    return {
      customer: 0,
      realtor: 1 - platformRate,
      platform: platformRate,
    };
  }

  const platformFee = Number(booking.platformFee ?? 0);
  if (platformFee > 0) {
    const platformRate = clampRate(platformFee / roomFee);
    return {
      customer: 0,
      realtor: 1 - platformRate,
      platform: platformRate,
    };
  }

  // Legacy data without snapshots: avoid hidden hardcoded defaults.
  return { customer: 0, realtor: 1, platform: 0 };
};

/**
 * Calculate refund amounts based on cancellation timing
 * - Room fee: Split according to tier (customer/realtor/platform)
 * - Security deposit: Always 100% to customer
 * - Service fee & Cleaning fee: Never refunded
 */
export function calculateCancellationRefund({
  booking,
  now = new Date(),
}: CalculateRefundParams): RefundCalculation {
  const msUntilCheckIn = booking.checkInDate.getTime() - now.getTime();
  const hoursUntilCheckIn = msUntilCheckIn / (1000 * 60 * 60);

  // Determine refund tier
  let tier: RefundTier;
  let reason: string;

  if (hoursUntilCheckIn >= EARLY_HOURS) {
    tier = RefundTier.EARLY;
    reason = `Early cancellation (${hoursUntilCheckIn.toFixed(
      1
    )}h before check-in)`;
  } else if (hoursUntilCheckIn >= MEDIUM_HOURS) {
    tier = RefundTier.MEDIUM;
    reason = `Medium cancellation (${hoursUntilCheckIn.toFixed(
      1
    )}h before check-in)`;
  } else if (hoursUntilCheckIn >= LATE_HOURS) {
    tier = RefundTier.LATE;
    reason = `Late cancellation (${hoursUntilCheckIn.toFixed(
      1
    )}h before check-in)`;
  } else {
    tier = RefundTier.NONE;
    reason = `Cancellation after check-in time`;
  }

  const split =
    tier === RefundTier.NONE ? resolveNoRefundSplit(booking) : TIER_SPLITS[tier];

  // Extract fee components
  const roomFee = Number(booking.roomFee);
  const securityDeposit = Number(booking.securityDeposit);
  const serviceFee = Number(booking.serviceFee);
  const cleaningFee = Number(booking.cleaningFee);

  // Calculate room fee split according to tier
  const customerRoomRefund = roomFee * split.customer;
  const realtorRoomPortion = roomFee * split.realtor;
  const platformRoomPortion = roomFee * split.platform;

  // Security deposit always 100% to customer
  const securityDepositRefund = securityDeposit;

  // Calculate totals
  // Note: Cleaning fee and service fee were already released immediately upon payment
  // So on cancellation, realtor keeps cleaning fee, platform keeps service fee
  // Only room fee and security deposit need to be handled
  const totalCustomerRefund = customerRoomRefund + securityDepositRefund;
  const totalRealtorPortion = realtorRoomPortion; // Cleaning fee already released
  const totalPlatformPortion = platformRoomPortion; // Service fee already released

  return {
    tier,
    hoursUntilCheckIn,

    roomFee,
    customerRoomRefund,
    realtorRoomPortion,
    platformRoomPortion,

    securityDepositRefund,

    serviceFee,
    cleaningFee,

    totalCustomerRefund,
    totalRealtorPortion,
    totalPlatformPortion,

    reason,
  };
}

export const refundPolicyService = { calculateCancellationRefund };
