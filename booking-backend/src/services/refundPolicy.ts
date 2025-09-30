import { prisma } from "@/config/database";
import { AppError } from "@/middleware/errorHandler";
import { Booking } from "@prisma/client";

export interface RefundEvaluationResult {
  eligible: boolean;
  fullRefund: boolean;
  partialRefund: boolean;
  partialRate: number; // 0..1
  refundableAmount: number; // monetary amount (propertyPrice portion or total?)
  reason: string;
}

interface EvaluateParams {
  booking: Booking & { property: { realtorId: string } };
  now?: Date;
}

// Baseline policy (hours before check-in) - simplified MVP uses fixed policy
const BASE_FULL_REFUND_HOURS = 24;
const BASE_PARTIAL_REFUND_HOURS = 12;
const BASE_PARTIAL_RATE = 0.5; // 50%

export async function evaluateRefund({
  booking,
  now = new Date(),
}: EvaluateParams): Promise<RefundEvaluationResult> {
  const msUntilCheckIn = booking.checkInDate.getTime() - now.getTime();
  const hoursUntilCheckIn = msUntilCheckIn / (1000 * 60 * 60);

  // MVP uses standard policy for all realtors
  let fullHours = BASE_FULL_REFUND_HOURS;
  let partialHours = BASE_PARTIAL_REFUND_HOURS;
  let partialRate = BASE_PARTIAL_RATE;

  if (hoursUntilCheckIn >= fullHours) {
    return {
      eligible: true,
      fullRefund: true,
      partialRefund: false,
      partialRate: 1,
      refundableAmount: Number(booking.totalPrice),
      reason: `Full refund (>=${fullHours}h before check-in)`,
    };
  }

  if (hoursUntilCheckIn >= partialHours) {
    return {
      eligible: true,
      fullRefund: false,
      partialRefund: true,
      partialRate,
      refundableAmount: Number(booking.totalPrice) * partialRate,
      reason: `Partial refund (>=${partialHours}h & <${fullHours}h) at ${
        partialRate * 100
      }%`,
    };
  }

  return {
    eligible: false,
    fullRefund: false,
    partialRefund: false,
    partialRate: 0,
    refundableAmount: 0,
    reason: `No refund (<${partialHours}h before check-in)`,
  };
}

export const refundPolicyService = { evaluateRefund };
