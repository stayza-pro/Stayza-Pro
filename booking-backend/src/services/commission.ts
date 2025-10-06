import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/config/database";
import { AppError } from "@/middleware/errorHandler";

// Platform commission rates (can be configurable per realtor in the future)
export const PLATFORM_COMMISSION_RATE = 0.05; // 5%
export const PAYMENT_PROCESSING_FEE_RATE = 0.015; // 1.5%

/**
 * Calculate commission breakdown for a payment
 */
export interface CommissionBreakdown {
  totalAmount: Decimal;
  platformCommission: Decimal;
  paymentProcessingFee: Decimal;
  realtorEarnings: Decimal;
  commissionRate: Decimal;
}

export const calculateCommission = (
  totalAmount: Decimal,
  customCommissionRate?: number
): CommissionBreakdown => {
  const commissionRate = new Decimal(
    customCommissionRate || PLATFORM_COMMISSION_RATE
  );
  const processingFeeRate = new Decimal(PAYMENT_PROCESSING_FEE_RATE);

  const platformCommission = totalAmount.mul(commissionRate);
  const paymentProcessingFee = totalAmount.mul(processingFeeRate);
  const realtorEarnings = totalAmount
    .sub(platformCommission)
    .sub(paymentProcessingFee);

  return {
    totalAmount,
    platformCommission,
    paymentProcessingFee,
    realtorEarnings,
    commissionRate,
  };
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

  if (payment.status !== "COMPLETED") {
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
    console.error("Failed to send payout notification email:", emailError);
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
    status: "COMPLETED",
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
    status: "COMPLETED",
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
