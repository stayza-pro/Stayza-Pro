import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/config/database";
import { AppError } from "@/middleware/errorHandler";
import { PaymentStatus } from "@prisma/client";

// NEW COMMISSION STRUCTURE
export const PLATFORM_FEE_RATE = 0.1; // 10% of room fee only
export const SERVICE_FEE_RATE = 0.02; // 2% of total booking amount
// Payment gateway fees (Paystack) are charged directly to guest

// OLD COMMISSION RATE (DEPRECATED - Keeping for backwards compatibility)
export const PLATFORM_COMMISSION_RATE = 0.07; // 7% (legacy)

/**
 * Dispute tier type
 */
export type DisputeTier = "TIER_1_SEVERE" | "TIER_2_PARTIAL" | "TIER_3_ABUSE";

/**
 * NEW Commission breakdown for new flow
 */
export interface NewCommissionBreakdown {
  roomFee: Decimal;
  cleaningFee: Decimal;
  securityDeposit: Decimal;
  subtotal: Decimal; // roomFee + cleaningFee
  serviceFee: Decimal; // 2% of subtotal
  platformFee: Decimal; // 10% of room fee (deducted at release)
  totalAmount: Decimal; // subtotal + serviceFee + securityDeposit

  // Immediate releases (at payment verification)
  cleaningFeeToRealtor: Decimal; // Released immediately
  serviceFeeToPlatform: Decimal; // Collected immediately

  // Held in escrow
  roomFeeInEscrow: Decimal;
  depositInEscrow: Decimal;

  // Released after 1-hour dispute window
  roomFeeSplitRealtor: Decimal; // 90% of room fee
  roomFeeSplitPlatform: Decimal; // 10% of room fee

  // Total realtor earnings
  totalRealtorEarnings: Decimal; // cleaningFee + (roomFee * 0.90)
}

/**
 * OLD Commission breakdown (DEPRECATED)
 */
export interface CommissionBreakdown {
  totalAmount: Decimal;
  platformCommission: Decimal;
  paymentProcessingFee: Decimal;
  realtorEarnings: Decimal;
  commissionRate: Decimal;
}

/**
 * NEW COMMISSION CALCULATION (10% + 2% Split)
 */
export const calculateNewCommission = (
  roomFee: Decimal | number,
  cleaningFee: Decimal | number,
  securityDeposit: Decimal | number
): NewCommissionBreakdown => {
  const roomFeeDecimal = new Decimal(roomFee);
  const cleaningFeeDecimal = new Decimal(cleaningFee);
  const depositDecimal = new Decimal(securityDeposit);

  // Calculate subtotal (room + cleaning)
  const subtotal = roomFeeDecimal.add(cleaningFeeDecimal);

  // Calculate service fee (2% of subtotal)
  const serviceFee = subtotal.mul(SERVICE_FEE_RATE);

  // Calculate platform fee (10% of room fee only - deducted at release)
  const platformFee = roomFeeDecimal.mul(PLATFORM_FEE_RATE);

  // Calculate total amount
  const totalAmount = subtotal.add(serviceFee).add(depositDecimal);

  // Immediate releases (at payment verification)
  const cleaningFeeToRealtor = cleaningFeeDecimal; // Full cleaning fee to realtor
  const serviceFeeToPlatform = serviceFee; // Full service fee to platform

  // Held in escrow
  const roomFeeInEscrow = roomFeeDecimal;
  const depositInEscrow = depositDecimal;

  // Room fee split (after 1-hour dispute window)
  const roomFeeSplitRealtor = roomFeeDecimal.mul(0.9); // 90% to realtor
  const roomFeeSplitPlatform = roomFeeDecimal.mul(0.1); // 10% to platform

  // Total realtor earnings
  const totalRealtorEarnings = cleaningFeeToRealtor.add(roomFeeSplitRealtor);

  return {
    roomFee: roomFeeDecimal,
    cleaningFee: cleaningFeeDecimal,
    securityDeposit: depositDecimal,
    subtotal,
    serviceFee,
    platformFee,
    totalAmount,
    cleaningFeeToRealtor,
    serviceFeeToPlatform,
    roomFeeInEscrow,
    depositInEscrow,
    roomFeeSplitRealtor,
    roomFeeSplitPlatform,
    totalRealtorEarnings,
  };
};

/**
 * OLD COMMISSION CALCULATION (DEPRECATED - Keeping for backwards compatibility)
 */
export const calculateCommission = (
  totalAmount: Decimal,
  customCommissionRate?: number
): CommissionBreakdown => {
  const commissionRate = new Decimal(
    customCommissionRate || PLATFORM_COMMISSION_RATE
  );

  const platformCommission = totalAmount.mul(commissionRate);
  // Payment gateway fees are handled by provider (Paystack)
  const paymentProcessingFee = new Decimal(0); // No longer deducted from booking amount
  const realtorEarnings = totalAmount.sub(platformCommission);

  return {
    totalAmount,
    platformCommission,
    paymentProcessingFee,
    realtorEarnings,
    commissionRate,
  };
};

/**
 * Calculate refund amount based on dispute tier
 */
export const calculateDisputeRefund = (
  tier: DisputeTier,
  roomFee: Decimal | number
): Decimal => {
  const roomFeeDecimal = new Decimal(roomFee);

  switch (tier) {
    case "TIER_1_SEVERE":
      // 100% room fee refund (realtor at fault: no access, fake listing, uninhabitable)
      return roomFeeDecimal;

    case "TIER_2_PARTIAL":
      // 30% room fee refund (partial fault: broken AC, missing amenities)
      return roomFeeDecimal.mul(0.3);

    case "TIER_3_ABUSE":
      // 0% refund (guest abuse: no evidence, late dispute, false claim)
      return new Decimal(0);

    default:
      throw new AppError(`Invalid dispute tier: ${tier}`, 400);
  }
};

/**
 * Calculate deposit deduction for realtor dispute
 * Returns amount realtor gets and amount guest gets back
 */
export const calculateDepositDeduction = (
  damageAmount: Decimal | number,
  depositAmount: Decimal | number
): {
  realtorGets: Decimal;
  guestRefund: Decimal;
  isLiabilityCapped: boolean;
} => {
  const damageDecimal = new Decimal(damageAmount);
  const depositDecimal = new Decimal(depositAmount);

  // LIABILITY CAP: Realtor can only claim up to deposit amount
  if (damageDecimal.lte(depositDecimal)) {
    // Damage <= deposit: Pay exact damage amount, refund remainder
    return {
      realtorGets: damageDecimal,
      guestRefund: depositDecimal.sub(damageDecimal),
      isLiabilityCapped: false,
    };
  } else {
    // Damage > deposit: Realtor gets full deposit, guest gets ₦0
    // No extra charges to guest (liability cap)
    return {
      realtorGets: depositDecimal,
      guestRefund: new Decimal(0),
      isLiabilityCapped: true,
    };
  }
};

/**
 * Update payment with commission data after successful payment
 */
export const updatePaymentCommission = async (
  paymentId: string,
  customCommissionRate?: number
): Promise<void> => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: { include: { property: { include: { realtor: true } } } },
    },
  });

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  // Allow commission calculation for ESCROW_HELD, PARTIAL_RELEASED, or COMPLETED payments
  if (
    payment.status !== PaymentStatus.HELD &&
    payment.status !== PaymentStatus.PARTIALLY_RELEASED &&
    payment.status !== PaymentStatus.SETTLED
  ) {
    throw new AppError(
      "Cannot calculate commission for incomplete payment",
      400
    );
  }

  const breakdown = calculateCommission(payment.amount, customCommissionRate);

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      platformCommission: breakdown.platformCommission,
      commissionRate: breakdown.commissionRate,
      realtorEarnings: breakdown.realtorEarnings,
    },
  });
};

/**
 * Process payout to realtor
 */
export const processRealtorPayout = async (
  paymentId: string,
  payoutReference?: string
): Promise<void> => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: {
        include: {
          property: {
            include: {
              realtor: {
                include: { user: true },
              },
            },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  if (payment.commissionPaidOut) {
    throw new AppError("Payout already processed", 400);
  }

  if (!payment.realtorEarnings) {
    throw new AppError("Realtor earnings not calculated", 400);
  }

  // Update payment with payout information
  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      commissionPaidOut: true,
      payoutDate: new Date(),
      payoutReference: payoutReference || `PAYOUT_${Date.now()}`,
    },
  });

  // Create audit log for payout
  await prisma.auditLog.create({
    data: {
      action: "PAYOUT_PROCESSED",
      entityType: "PAYMENT",
      entityId: paymentId,
      userId: "system", // System-generated payout
      details: {
        realtorId: payment.booking.property.realtorId,
        amount: payment.realtorEarnings.toString(),
        currency: payment.currency,
        payoutReference,
      },
    },
  });

  // Optional: Send email notification to realtor
  try {
    const { sendRealtorPayout } = await import("@/services/email");
    await sendRealtorPayout(
      payment.booking.property.realtor.user.email,
      payment.booking.property.realtor,
      payment.realtorEarnings.toNumber(),
      payment.currency,
      payment.bookingId
    );
  } catch (emailError) {
      }
};

/**
 * Get commission report for a realtor
 */
export interface CommissionReport {
  realtorId: string;
  totalEarnings: Decimal;
  totalCommissionPaid: Decimal;
  pendingPayouts: Decimal;
  completedPayouts: Decimal;
  payoutCount: number;
  bookingCount: number;
}

export const getRealtorCommissionReport = async (
  realtorId: string,
  startDate?: Date,
  endDate?: Date
): Promise<CommissionReport> => {
  const whereClause: any = {
    booking: {
      property: {
        realtorId,
      },
    },
    status: "RELEASED",
  };

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = startDate;
    if (endDate) whereClause.createdAt.lte = endDate;
  }

  const payments = await prisma.payment.findMany({
    where: whereClause,
    include: {
      booking: {
        include: {
          property: true,
        },
      },
    },
  });

  const totalEarnings = payments.reduce(
    (sum, payment) => sum.add(payment.realtorEarnings || new Decimal(0)),
    new Decimal(0)
  );

  const totalCommissionPaid = payments.reduce(
    (sum, payment) => sum.add(payment.platformCommission || new Decimal(0)),
    new Decimal(0)
  );

  const completedPayouts = payments
    .filter((p) => p.commissionPaidOut)
    .reduce(
      (sum, payment) => sum.add(payment.realtorEarnings || new Decimal(0)),
      new Decimal(0)
    );

  const pendingPayouts = totalEarnings.sub(completedPayouts);

  return {
    realtorId,
    totalEarnings,
    totalCommissionPaid,
    pendingPayouts,
    completedPayouts,
    payoutCount: payments.filter((p) => p.commissionPaidOut).length,
    bookingCount: payments.length,
  };
};

/**
 * Get platform commission report
 */
export interface PlatformCommissionReport {
  totalRevenue: Decimal;
  totalCommissions: Decimal;
  totalPayouts: Decimal;
  pendingPayouts: Decimal;
  totalBookings: number;
  activeRealtors: number;
}

export const getPlatformCommissionReport = async (
  startDate?: Date,
  endDate?: Date
): Promise<PlatformCommissionReport> => {
  const whereClause: any = {
    status: "RELEASED",
  };

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = startDate;
    if (endDate) whereClause.createdAt.lte = endDate;
  }

  const payments = await prisma.payment.findMany({
    where: whereClause,
    include: {
      booking: {
        include: {
          property: {
            include: { realtor: true },
          },
        },
      },
    },
  });

  const totalRevenue = payments.reduce(
    (sum, payment) => sum.add(payment.amount),
    new Decimal(0)
  );

  const totalCommissions = payments.reduce(
    (sum, payment) => sum.add(payment.platformCommission || new Decimal(0)),
    new Decimal(0)
  );

  const completedPayouts = payments
    .filter((p) => p.commissionPaidOut)
    .reduce(
      (sum, payment) => sum.add(payment.realtorEarnings || new Decimal(0)),
      new Decimal(0)
    );

  const totalEarnings = payments.reduce(
    (sum, payment) => sum.add(payment.realtorEarnings || new Decimal(0)),
    new Decimal(0)
  );

  const pendingPayouts = totalEarnings.sub(completedPayouts);

  const activeRealtors = new Set(
    payments.map((p) => p.booking.property.realtorId)
  ).size;

  return {
    totalRevenue,
    totalCommissions,
    totalPayouts: completedPayouts,
    pendingPayouts,
    totalBookings: payments.length,
    activeRealtors,
  };
};
