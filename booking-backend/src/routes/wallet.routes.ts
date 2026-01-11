import { Router, Response, NextFunction } from "express";
import { authenticate, authorize } from "@/middleware/auth";
import * as walletService from "@/services/walletService";
import { WalletOwnerType, UserRole } from "@prisma/client";
import { prisma } from "@/config/database";
import { logger } from "@/utils/logger";
import { AuthenticatedRequest } from "@/types";

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

      res.status(200).json({
        success: true,
        data: {
          walletId: wallet.id,
          availableBalance: balance.available,
          pendingBalance: balance.pending,
          totalBalance: balance.available + balance.pending,
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
 * POST /api/wallets/withdraw
 * Request a withdrawal from wallet to bank account
 */
router.post(
  "/withdraw",
  authenticate,
  authorize(UserRole.REALTOR),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const realtorId = await getRealtorId(req.user!.id);

      const { amount } = req.body;

      if (!amount || amount <= 0) {
        throw new AppError("Invalid withdrawal amount", 400);
      }

      // Get wallet
      const wallet = await walletService.getOrCreateWallet(
        WalletOwnerType.REALTOR,
        realtorId
      );

      // Get realtor details for Paystack transfer
      const realtor = await prisma.realtor.findUnique({
        where: { id: realtorId },
        select: {
          id: true,
          businessName: true,
          paystackSubAccountCode: true,
        },
      });

      if (!realtor) {
        throw new AppError("Realtor not found", 404);
      }

      if (!realtor.paystackSubAccountCode) {
        throw new AppError(
          "Paystack subaccount not configured. Please contact support.",
          400
        );
      }

      // Step 1: Lock funds for withdrawal (available → pending)
      const withdrawalReference = `WITHDRAWAL_${Date.now()}_${realtorId.slice(
        -8
      )}`;
      await walletService.lockFundsForWithdrawal(
        wallet.id,
        amount,
        withdrawalReference
      );

      // Create withdrawal request record
      const withdrawalRequest = await prisma.withdrawalRequest.create({
        data: {
          walletId: wallet.id,
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

      // TODO: Implement actual Paystack transfer processing
      // For now, we just lock the funds and return success
      // A background job or admin action should process this

      res.status(201).json({
        success: true,
        message: "Withdrawal request submitted successfully",
        data: {
          withdrawalRequestId: withdrawalRequest.id,
          amount,
          status: "PENDING",
          requestedAt: withdrawalRequest.requestedAt,
          note: "Your withdrawal is being processed. You will be notified when it's completed.",
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
