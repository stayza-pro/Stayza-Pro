/**
 * Admin Withdrawal Management Routes
 *
 * Endpoints for administrators to manage and manually process withdrawals.
 * This includes viewing pending/failed withdrawals and manually processing them.
 */

import express from "express";
import { AppError } from "@/middleware/errorHandler";
import { authenticate } from "@/middleware/auth";
import { UserRole } from "@prisma/client";
import * as withdrawalService from "@/services/withdrawalService";
import { prisma } from "@/config/database";
import { logger } from "@/utils/logger";
import { AuthenticatedRequest } from "@/types";

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);

// Helper to check if user is admin
const requireAdmin = (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  const user = req.user;
  if (!user || user.role !== UserRole.ADMIN) {
    throw new AppError("Admin access required", 403);
  }
  next();
};

router.use(requireAdmin);

/**
 * GET /api/admin/withdrawals
 * List pending and failed withdrawals
 * Query params:
 * - status: Filter by status (PENDING, FAILED, COMPLETED) - defaults to PENDING,FAILED
 * - realtorId: Filter by specific realtor
 * - page: Page number (default 1)
 * - limit: Items per page (default 20)
 */
router.get("/", async (req, res, next) => {
  try {
    const {
      status,
      realtorId,
      page = "1",
      limit = "20",
    } = req.query as {
      status?: string | string[];
      realtorId?: string;
      page?: string;
      limit?: string;
    };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    // Build filters
    const filters: any = {
      page: pageNum,
      limit: limitNum,
    };

    // If no status specified, default to PENDING and FAILED
    if (status) {
      const statusList = Array.isArray(status)
        ? status
        : String(status).split(",");
      filters.status = statusList;
    } else {
      filters.status = ["PENDING", "FAILED"];
    }

    if (realtorId) {
      filters.realtorId = realtorId;
    }

    const result = await withdrawalService.getWithdrawalsForAdmin(filters);

    res.json({
      success: true,
      data: result.withdrawals,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/withdrawals/stats
 * Get withdrawal statistics for admin dashboard
 */
router.get("/stats", async (req, res, next) => {
  try {
    const [pending, failed, completed, totalAmount] = await Promise.all([
      // Count pending withdrawals
      prisma.withdrawalRequest.count({
        where: { status: "PENDING" },
      }),

      // Count failed withdrawals
      prisma.withdrawalRequest.count({
        where: { status: "FAILED" },
      }),

      // Count completed withdrawals today
      prisma.withdrawalRequest.count({
        where: {
          status: "COMPLETED",
          completedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),

      // Sum of pending amounts
      prisma.withdrawalRequest.aggregate({
        where: {
          status: { in: ["PENDING", "FAILED"] },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        pendingCount: pending,
        failedCount: failed,
        completedTodayCount: completed,
        pendingAmount: totalAmount._sum.amount || 0,
        requiresAttention: pending + failed,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/withdrawals/:id
 * Get detailed information about a specific withdrawal
 */
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        realtor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        wallet: true,
      },
    });

    if (!withdrawal) {
      throw new AppError("Withdrawal not found", 404);
    }

    res.json({
      success: true,
      data: withdrawal,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/withdrawals/:id/process
 * Manually process a pending or failed withdrawal
 */
router.post("/:id/process", async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminUser = (req as any).user;

    logger.info("Admin manually processing withdrawal", {
      withdrawalId: id,
      adminId: adminUser.userId,
      adminEmail: adminUser.email,
    });

    // Check if withdrawal exists and can be processed
    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        realtor: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!withdrawal) {
      throw new AppError("Withdrawal not found", 404);
    }

    if (withdrawal.status === "COMPLETED") {
      throw new AppError("This withdrawal has already been completed", 400);
    }

    // Process the withdrawal with manual retry flag
    const result = await withdrawalService.processWithdrawal(id, true);

    if (result.success) {
      logger.info("Admin successfully processed withdrawal", {
        withdrawalId: id,
        adminId: adminUser.userId,
        transferReference: result.transferReference,
      });

      res.json({
        success: true,
        message: "Withdrawal processed successfully",
        data: {
          withdrawalId: id,
          transferReference: result.transferReference,
          amount: withdrawal.amount,
          status: "COMPLETED",
        },
      });
    } else {
      logger.error("Admin failed to process withdrawal", {
        withdrawalId: id,
        adminId: adminUser.userId,
        error: result.message,
      });

      throw new AppError(result.message || "Failed to process withdrawal", 400);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/withdrawals/retry-failed
 * Batch retry all failed withdrawals
 */
router.post("/retry-failed", async (req, res, next) => {
  try {
    const adminUser = (req as any).user;

    logger.info("Admin initiating batch retry of failed withdrawals", {
      adminId: adminUser.userId,
      adminEmail: adminUser.email,
    });

    const result = await withdrawalService.retryFailedWithdrawals();

    logger.info("Batch retry completed", {
      adminId: adminUser.userId,
      ...result,
    });

    res.json({
      success: true,
      message: "Batch retry completed",
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/withdrawals/:id/cancel
 * Cancel a pending withdrawal and release locked funds
 */
router.put("/:id/cancel", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminUser = (req as any).user;

    if (!reason) {
      throw new AppError("Cancellation reason is required", 400);
    }

    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        wallet: true,
        realtor: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!withdrawal) {
      throw new AppError("Withdrawal not found", 404);
    }

    if (withdrawal.status === "COMPLETED") {
      throw new AppError("Cannot cancel a completed withdrawal", 400);
    }

    // Release locked funds back to available balance
    await prisma.$transaction([
      // Update withdrawal status
      prisma.withdrawalRequest.update({
        where: { id },
        data: {
          status: "CANCELLED" as any, // Add CANCELLED to enum if needed
          failureReason: `Cancelled by admin: ${reason}`,
          completedAt: new Date(),
        },
      }),

      // Release funds
      prisma.wallet.update({
        where: { id: withdrawal.walletId },
        data: {
          balancePending: {
            decrement: withdrawal.amount,
          },
          balanceAvailable: {
            increment: withdrawal.amount,
          },
        },
      }),
    ]);

    logger.info("Admin cancelled withdrawal", {
      withdrawalId: id,
      adminId: adminUser.userId,
      reason,
    });

    res.json({
      success: true,
      message: "Withdrawal cancelled and funds released",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
