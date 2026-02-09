import { Router, Response, NextFunction } from "express";
import { authenticate, authorize } from "@/middleware/auth";
import * as walletService from "@/services/walletService";
import * as withdrawalService from "@/services/withdrawalService";
import {
  sendWithdrawalOtpEmail,
  sendWithdrawalRequestedEmail,
} from "@/services/email";
import { WalletOwnerType, UserRole } from "@prisma/client";
import { prisma } from "@/config/database";
import { config } from "@/config";
import { logger } from "@/utils/logger";
import { AuthenticatedRequest } from "@/types";
import { createHash } from "crypto";
import { hasConfiguredPayoutAccount } from "@/services/payoutAccountService";

const router = Router();

class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Helper to get realtorId from authenticated request
 */
const getRealtorId = async (userId: string): Promise<string> => {
  const realtor = await prisma.realtor.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!realtor) {
    throw new AppError("Realtor profile not found", 404);
  }

  return realtor.id;
};

const WITHDRAWAL_OTP_EXPIRY_MINUTES = 10;
const WITHDRAWAL_OTP_MAX_ATTEMPTS = 5;
const WITHDRAWAL_OTP_AUDIT_ACTION = "WITHDRAWAL_OTP_REQUESTED";
const WITHDRAWAL_OTP_ENTITY_TYPE = "WITHDRAWAL_OTP";

type WithdrawalOtpDetails = {
  amount: number;
  otpHash: string;
  otpExpiresAt: string;
  attempts: number;
  used: boolean;
  verifiedAt?: string;
};

const normalizeAmount = (value: number): number =>
  Math.round(Number(value) * 100) / 100;

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(value);

const hashWithdrawalOtp = (otp: string): string =>
  createHash("sha256")
    .update(`${otp}:${config.JWT_SECRET}`)
    .digest("hex");

const maskEmail = (email: string): string => {
  const [localPart, domainPart] = email.split("@");
  if (!localPart || !domainPart) return email;
  if (localPart.length <= 2) return `${localPart[0]}***@${domainPart}`;
  return `${localPart.slice(0, 2)}***@${domainPart}`;
};

const getWithdrawalContext = async (userId: string) => {
  const realtorId = await getRealtorId(userId);

  const wallet = await walletService.getOrCreateWallet(
    WalletOwnerType.REALTOR,
    realtorId
  );

  const realtor = await prisma.realtor.findUnique({
    where: { id: realtorId },
    select: {
      id: true,
      businessName: true,
      paystackTransferRecipientCode: true,
      paystackSubAccountCode: true,
      payoutAccountNumber: true,
      user: {
        select: {
          email: true,
          firstName: true,
        },
      },
    },
  });

  if (!realtor) {
    throw new AppError("Realtor not found", 404);
  }

  if (!hasConfiguredPayoutAccount(realtor)) {
    throw new AppError(
      "Payout account not configured. Please update your payout settings.",
      400
    );
  }

  return { realtorId, wallet, realtor };
};

const ensureSufficientWalletBalance = async (
  walletId: string,
  amount: number
) => {
  const currentBalance = await walletService.getWalletBalance(walletId);
  if (currentBalance.available < amount) {
    throw new AppError(
      `Insufficient balance. Available: ${formatCurrency(
        currentBalance.available
      )}, Requested: ${formatCurrency(amount)}`,
      400
    );
  }
};

const saveWithdrawalOtpChallenge = async (
  userId: string,
  realtorId: string,
  amount: number,
  otp: string
) => {
  const otpExpiresAt = new Date(
    Date.now() + WITHDRAWAL_OTP_EXPIRY_MINUTES * 60 * 1000
  );

  const details: WithdrawalOtpDetails = {
    amount,
    otpHash: hashWithdrawalOtp(otp),
    otpExpiresAt: otpExpiresAt.toISOString(),
    attempts: 0,
    used: false,
  };

  await prisma.auditLog.create({
    data: {
      action: WITHDRAWAL_OTP_AUDIT_ACTION,
      entityType: WITHDRAWAL_OTP_ENTITY_TYPE,
      entityId: realtorId,
      userId,
      details,
    },
  });
};

const getLatestWithdrawalOtpChallenge = async (userId: string) => {
  const otpAuditLog = await prisma.auditLog.findFirst({
    where: {
      action: WITHDRAWAL_OTP_AUDIT_ACTION,
      entityType: WITHDRAWAL_OTP_ENTITY_TYPE,
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!otpAuditLog || !otpAuditLog.details) {
    throw new AppError("No active OTP challenge. Request a new code.", 400);
  }

  return otpAuditLog;
};

const verifyAndConsumeWithdrawalOtp = async (
  userId: string,
  amount: number,
  otp: string
) => {
  const otpAuditLog = await getLatestWithdrawalOtpChallenge(userId);
  const details = (otpAuditLog.details as WithdrawalOtpDetails) || null;

  if (!details) {
    throw new AppError("Invalid OTP challenge data. Request a new code.", 400);
  }

  if (details.used) {
    throw new AppError(
      "This OTP has already been used. Request a new code.",
      400
    );
  }

  if (Math.abs(normalizeAmount(details.amount) - amount) > 0.009) {
    throw new AppError(
      "OTP code was generated for a different amount. Request a new code.",
      400
    );
  }

  const now = new Date();
  if (new Date(details.otpExpiresAt) <= now) {
    throw new AppError("OTP has expired. Request a new code.", 400);
  }

  const attempts = Number(details.attempts || 0);
  if (attempts >= WITHDRAWAL_OTP_MAX_ATTEMPTS) {
    throw new AppError("Too many invalid OTP attempts. Request a new code.", 400);
  }

  const otpHash = hashWithdrawalOtp(otp.trim());
  if (otpHash !== details.otpHash) {
    const updatedAttempts = attempts + 1;
    await prisma.auditLog.update({
      where: { id: otpAuditLog.id },
      data: {
        details: {
          ...details,
          attempts: updatedAttempts,
          lastAttemptAt: now.toISOString(),
        },
      },
    });

    const remainingAttempts = WITHDRAWAL_OTP_MAX_ATTEMPTS - updatedAttempts;
    if (remainingAttempts <= 0) {
      throw new AppError("Too many invalid OTP attempts. Request a new code.", 400);
    }

    throw new AppError(
      `Invalid OTP. ${remainingAttempts} attempt${
        remainingAttempts === 1 ? "" : "s"
      } remaining.`,
      400
    );
  }

  await prisma.auditLog.update({
    where: { id: otpAuditLog.id },
    data: {
      details: {
        ...details,
        used: true,
        verifiedAt: now.toISOString(),
      },
    },
  });
};

const createWithdrawalRequest = async ({
  walletId,
  realtorId,
  amount,
  email,
  displayName,
}: {
  walletId: string;
  realtorId: string;
  amount: number;
  email: string;
  displayName: string;
}) => {
  const withdrawalReference = `WITHDRAWAL_${Date.now()}_${realtorId.slice(-8)}`;

  await walletService.lockFundsForWithdrawal(walletId, amount, withdrawalReference);

  const withdrawalRequest = await prisma.withdrawalRequest.create({
    data: {
      walletId,
      realtorId,
      amount,
      status: "PENDING",
      requestedAt: new Date(),
      metadata: { reference: withdrawalReference },
    },
  });

  logger.info("Withdrawal request created", {
    realtorId,
    amount,
    withdrawalRequestId: withdrawalRequest.id,
  });

  await sendWithdrawalRequestedEmail(
    email,
    displayName,
    amount,
    withdrawalReference
  ).catch((error) =>
    logger.error("Failed to send withdrawal requested email", error)
  );

  logger.info("Attempting automatic withdrawal processing", {
    withdrawalRequestId: withdrawalRequest.id,
  });

  withdrawalService
    .processWithdrawal(withdrawalRequest.id, false)
    .then((result) => {
      if (result.success) {
        logger.info("Withdrawal processed automatically", {
          withdrawalRequestId: withdrawalRequest.id,
          transferReference: result.transferReference,
        });
      } else {
        logger.warn(
          "Automatic withdrawal processing failed, will require manual processing",
          {
            withdrawalRequestId: withdrawalRequest.id,
            error: result.message,
          }
        );
      }
    })
    .catch((error) => {
      logger.error("Error in automatic withdrawal processing", {
        withdrawalRequestId: withdrawalRequest.id,
        error: error.message,
      });
    });

  return withdrawalRequest;
};

/**
 * GET /api/wallets/balance
 * Get authenticated realtor's wallet balance
 */
router.get(
  "/balance",
  authenticate,
  authorize(UserRole.REALTOR),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const realtorId = await getRealtorId(req.user!.id);

      // Get or create wallet
      const wallet = await walletService.getOrCreateWallet(
        WalletOwnerType.REALTOR,
        realtorId
      );

      const balance = await walletService.getWalletBalance(wallet.id);

      // Calculate pending escrow funds (money held in escrow for realtor)
      const escrowFunds = await prisma.payment.aggregate({
        where: {
          booking: {
            property: {
              realtorId: realtorId,
            },
            status: "ACTIVE", // Only ACTIVE bookings have money in escrow
          },
          status: {
            in: ["HELD", "PARTIALLY_RELEASED"],
          },
          roomFeeInEscrow: true, // Room fee still in escrow
        },
        _sum: {
          roomFeeAmount: true,
        },
      });

      // Calculate realtor's share (90% of room fees in escrow)
      const roomFeesInEscrow = Number(escrowFunds._sum.roomFeeAmount || 0);
      const realtorShareInEscrow = roomFeesInEscrow * 0.9;

      res.status(200).json({
        success: true,
        data: {
          walletId: wallet.id,
          availableBalance: balance.available,
          pendingBalance: realtorShareInEscrow, // Show escrow funds as pending
          totalBalance: balance.available + realtorShareInEscrow,
          currency: "NGN",
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/wallets/transactions
 * Get wallet transaction history with pagination
 */
router.get(
  "/transactions",
  authenticate,
  authorize(UserRole.REALTOR),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const realtorId = await getRealtorId(req.user!.id);

      // Get wallet
      const wallet = await walletService.getOrCreateWallet(
        WalletOwnerType.REALTOR,
        realtorId
      );

      // Parse pagination params
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as any;
      const status = req.query.status as any;

      const options: any = { page, limit };
      if (type) options.type = type;
      if (status) options.status = status;

      const result = await walletService.getWalletTransactions(
        wallet.id,
        options
      );

      res.status(200).json({
        success: true,
        data: result.transactions,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/wallets/withdraw/request-otp
 * Send withdrawal OTP to authenticated realtor email
 */
router.post(
  "/withdraw/request-otp",
  authenticate,
  authorize(UserRole.REALTOR),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const amount = normalizeAmount(Number(req.body?.amount));
      if (!amount || amount <= 0) {
        throw new AppError("Invalid withdrawal amount", 400);
      }

      const { realtorId, wallet, realtor } = await getWithdrawalContext(
        req.user!.id
      );
      await ensureSufficientWalletBalance(wallet.id, amount);

      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      await saveWithdrawalOtpChallenge(req.user!.id, realtorId, amount, otp);

      await sendWithdrawalOtpEmail(
        realtor.user.email,
        realtor.user.firstName || realtor.businessName,
        otp,
        amount,
        WITHDRAWAL_OTP_EXPIRY_MINUTES
      );

      res.status(200).json({
        success: true,
        message: "OTP sent to your email. Enter the 4-digit code to continue.",
        data: {
          amount,
          maskedEmail: maskEmail(realtor.user.email),
          expiresInMinutes: WITHDRAWAL_OTP_EXPIRY_MINUTES,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/wallets/withdraw/confirm
 * Confirm withdrawal with OTP and process transfer
 */
router.post(
  "/withdraw/confirm",
  authenticate,
  authorize(UserRole.REALTOR),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const amount = normalizeAmount(Number(req.body?.amount));
      const otp = String(req.body?.otp || "").trim();

      if (!amount || amount <= 0) {
        throw new AppError("Invalid withdrawal amount", 400);
      }

      if (!/^\d{4}$/.test(otp)) {
        throw new AppError("A valid 4-digit OTP is required", 400);
      }

      const { wallet, realtorId, realtor } = await getWithdrawalContext(
        req.user!.id
      );
      await ensureSufficientWalletBalance(wallet.id, amount);
      await verifyAndConsumeWithdrawalOtp(req.user!.id, amount, otp);

      const withdrawalRequest = await createWithdrawalRequest({
        walletId: wallet.id,
        realtorId,
        amount,
        email: realtor.user.email,
        displayName: realtor.user.firstName || realtor.businessName,
      });

      res.status(201).json({
        success: true,
        message:
          "Withdrawal request submitted successfully. Processing automatically...",
        data: {
          withdrawalRequestId: withdrawalRequest.id,
          amount,
          status: "PENDING",
          requestedAt: withdrawalRequest.requestedAt,
          note: "Your withdrawal is being processed automatically. You'll receive an email notification once completed (usually within minutes). If automatic processing fails, our team will process it manually within 24 hours.",
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/wallets/withdraw
 * Backward-compatible endpoint (requires OTP)
 */
router.post(
  "/withdraw",
  authenticate,
  authorize(UserRole.REALTOR),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const amount = normalizeAmount(Number(req.body?.amount));
      const otp = String(req.body?.otp || "").trim();

      if (!amount || amount <= 0) {
        throw new AppError("Invalid withdrawal amount", 400);
      }

      if (!/^\d{4}$/.test(otp)) {
        throw new AppError(
          "OTP is required. Request a code first via /api/wallets/withdraw/request-otp",
          400
        );
      }

      const { wallet, realtorId, realtor } = await getWithdrawalContext(
        req.user!.id
      );
      await ensureSufficientWalletBalance(wallet.id, amount);
      await verifyAndConsumeWithdrawalOtp(req.user!.id, amount, otp);

      const withdrawalRequest = await createWithdrawalRequest({
        walletId: wallet.id,
        realtorId,
        amount,
        email: realtor.user.email,
        displayName: realtor.user.firstName || realtor.businessName,
      });

      res.status(201).json({
        success: true,
        message:
          "Withdrawal request submitted successfully. Processing automatically...",
        data: {
          withdrawalRequestId: withdrawalRequest.id,
          amount,
          status: "PENDING",
          requestedAt: withdrawalRequest.requestedAt,
          note: "Your withdrawal is being processed automatically. You'll receive an email notification once completed (usually within minutes). If automatic processing fails, our team will process it manually within 24 hours.",
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/wallets/withdrawals
 * Get withdrawal history
 */
router.get(
  "/withdrawals",
  authenticate,
  authorize(UserRole.REALTOR),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const realtorId = await getRealtorId(req.user!.id);

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [withdrawals, total] = await Promise.all([
        prisma.withdrawalRequest.findMany({
          where: { realtorId },
          orderBy: { requestedAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.withdrawalRequest.count({
          where: { realtorId },
        }),
      ]);

      res.status(200).json({
        success: true,
        data: withdrawals,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/wallets/earnings-summary
 * Get earnings summary by source
 */
router.get(
  "/earnings-summary",
  authenticate,
  authorize(UserRole.REALTOR),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const realtorId = await getRealtorId(req.user!.id);

      // Get wallet
      const wallet = await walletService.getOrCreateWallet(
        WalletOwnerType.REALTOR,
        realtorId
      );

      // Aggregate earnings by source
      const earnings = await prisma.walletTransaction.groupBy({
        by: ["source"],
        where: {
          walletId: wallet.id,
          type: "CREDIT",
          status: "COMPLETED",
        },
        _sum: {
          amount: true,
        },
        _count: true,
      });

      const summary = earnings.map((item: any) => ({
        source: item.source,
        totalAmount: item._sum.amount || 0,
        transactionCount: item._count,
      }));

      res.status(200).json({
        success: true,
        data: {
          summary,
          totalEarnings: summary.reduce(
            (acc: number, item: any) => acc + Number(item.totalAmount),
            0
          ),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
