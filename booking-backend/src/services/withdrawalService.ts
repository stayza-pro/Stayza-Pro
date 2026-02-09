import { prisma } from "@/config/database";
import { logger } from "@/utils/logger";
import * as paystackService from "@/services/paystack";
import * as walletService from "@/services/walletService";
import {
  sendWithdrawalRequestedEmail,
  sendWithdrawalCompletedEmail,
  sendWithdrawalFailedEmail,
} from "@/services/email";
import { Prisma, WithdrawalRequestStatus } from "@prisma/client";

/**
 * Process a pending withdrawal by transferring funds via Paystack
 */
export const processWithdrawal = async (
  withdrawalRequestId: string,
  isManualRetry: boolean = false
): Promise<{
  success: boolean;
  message: string;
  transferReference?: string;
}> => {
  try {
    // Get withdrawal request with full details
    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalRequestId },
      include: {
        realtor: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        wallet: true,
      },
    });

    if (!withdrawal) {
      throw new Error("Withdrawal request not found");
    }

    if (withdrawal.status === "COMPLETED") {
      return {
        success: false,
        message: "Withdrawal already completed",
      };
    }

    if (withdrawal.status === "CANCELLED") {
      return {
        success: false,
        message: "Withdrawal has been cancelled",
      };
    }

    // Check if realtor has subaccount configured
    if (!withdrawal.realtor.paystackSubAccountCode) {
      throw new Error("Realtor subaccount not configured");
    }

    // Generate transfer reference
    const transferReference = `TXN_${Date.now()}_${withdrawal.realtorId.slice(
      -8
    )}`;

    logger.info("Processing withdrawal", {
      withdrawalId: withdrawalRequestId,
      realtorId: withdrawal.realtorId,
      amount: withdrawal.amount,
      transferReference,
      isManualRetry,
    });

    // Initiate Paystack transfer
    const transferResult = await paystackService.initiateTransfer({
      amount: Number(withdrawal.amount),
      recipient: withdrawal.realtor.paystackSubAccountCode,
      reason: `Withdrawal for ${withdrawal.realtor.businessName}`,
      reference: transferReference,
    });

    logger.info("Paystack transfer initiated successfully", {
      withdrawalId: withdrawalRequestId,
      transferReference,
      transferStatus: transferResult.status,
    });

    // Update withdrawal status to COMPLETED
    await prisma.withdrawalRequest.update({
      where: { id: withdrawalRequestId },
      data: {
        status: "COMPLETED",
        processedAt: new Date(),
        metadata: {
          ...(withdrawal.metadata as any),
          transferReference,
          transferStatus: transferResult.status,
          transferCode: transferResult.transfer_code,
          processedBy: isManualRetry ? "admin" : "automatic",
        },
      },
    });

    // Complete wallet transaction - mark the pending transaction as completed and deduct from pending balance
    await prisma.$transaction(async (tx) => {
      // Update wallet: remove from pending balance
      await tx.wallet.update({
        where: { id: withdrawal.walletId },
        data: {
          balancePending: {
            decrement: withdrawal.amount,
          },
        },
      });

      // Mark any related transactions as completed (optional, since funds already locked)
      // The lockFundsForWithdrawal already moved funds from available to pending
      // Now we just need to remove them from pending entirely
    });

    // Send success email to realtor
    await sendWithdrawalCompletedEmail(
      withdrawal.realtor.user.email,
      withdrawal.realtor.user.firstName || withdrawal.realtor.businessName,
      Number(withdrawal.amount),
      transferReference
    );

    logger.info("Withdrawal processed successfully", {
      withdrawalId: withdrawalRequestId,
      transferReference,
    });

    return {
      success: true,
      message: "Withdrawal processed successfully",
      transferReference,
    };
  } catch (error: any) {
    logger.error("Failed to process withdrawal", {
      withdrawalRequestId,
      error: error.message,
      stack: error.stack,
    });

    // Map Paystack errors to user-friendly messages
    let userMessage = error.message;

    if (error.message?.includes("third party payouts")) {
      userMessage =
        "Your Paystack account needs to be verified for transfers. Please contact Paystack support to enable the Transfer feature. This is a one-time setup.";
    } else if (error.message?.includes("Insufficient")) {
      userMessage =
        "Insufficient balance in platform account. Please contact support.";
    } else if (
      error.message?.includes("Invalid recipient") ||
      error.message?.includes("subaccount not configured")
    ) {
      userMessage =
        "Bank account details are invalid or not set up. Please update your payout settings.";
    } else if (error.message?.includes("Rate limit")) {
      userMessage =
        "Too many transfer requests. Your withdrawal will be processed automatically within the hour.";
    }

    // Update withdrawal status to FAILED
    await prisma.withdrawalRequest
      .update({
        where: { id: withdrawalRequestId },
        data: {
          status: "FAILED",
          failureReason: userMessage,
          failedAt: new Date(),
          retryCount: { increment: 1 },
          metadata: {
            error: error.message,
            failedAt: new Date().toISOString(),
            isManualRetry,
          },
        },
      })
      .catch((err) =>
        logger.error("Failed to update withdrawal status to FAILED", err)
      );

    // Get withdrawal details for email
    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalRequestId },
      include: {
        realtor: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
              },
            },
          },
        },
      },
    });

    if (withdrawal) {
      // Send failure email to realtor
      await sendWithdrawalFailedEmail(
        withdrawal.realtor.user.email,
        withdrawal.realtor.user.firstName || withdrawal.realtor.businessName,
        Number(withdrawal.amount),
        userMessage
      ).catch((emailError) =>
        logger.error("Failed to send withdrawal failed email", emailError)
      );
    }

    return {
      success: false,
      message: userMessage,
    };
  }
};

/**
 * Auto-retry failed withdrawals (can be called by a cron job)
 */
export const retryFailedWithdrawals = async (): Promise<{
  processed: number;
  successful: number;
  failed: number;
}> => {
  const results = {
    processed: 0,
    successful: 0,
    failed: 0,
  };

  try {
    // Get all failed withdrawals that haven't been retried too many times
    const failedWithdrawals = await prisma.withdrawalRequest.findMany({
      where: {
        status: "FAILED",
        OR: [
          { metadata: { path: ["retryCount"], equals: Prisma.JsonNull } },
          { metadata: { path: ["retryCount"], lt: 3 } },
        ],
      },
      take: 10, // Process 10 at a time
    });

    for (const withdrawal of failedWithdrawals) {
      results.processed++;

      const result = await processWithdrawal(withdrawal.id, false);

      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
      }

      // Add delay between retries to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    logger.info("Retry failed withdrawals completed", results);
  } catch (error: any) {
    logger.error("Error in retry failed withdrawals", {
      error: error.message,
      stack: error.stack,
    });
  }

  return results;
};

/**
 * Get pending and failed withdrawals for admin dashboard
 */
export const getWithdrawalsForAdmin = async (filters?: {
  status?: string | string[];
  realtorId?: string;
  page?: number;
  limit?: number;
}) => {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {};

  const allowedStatuses = new Set<WithdrawalRequestStatus>([
    "PENDING",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
    "CANCELLED",
  ]);

  const normalizedStatuses = (Array.isArray(filters?.status)
    ? filters?.status
    : filters?.status
      ? [filters.status]
      : []
  )
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim().toUpperCase())
    .filter((value): value is WithdrawalRequestStatus =>
      allowedStatuses.has(value as WithdrawalRequestStatus)
    );

  if (normalizedStatuses.length > 0) {
    where.status = { in: normalizedStatuses };
  } else {
    // Default: show PENDING and FAILED
    where.status = { in: ["PENDING", "FAILED"] };
  }

  if (filters?.realtorId) {
    where.realtorId = filters.realtorId;
  }

  const [withdrawals, total] = await Promise.all([
    prisma.withdrawalRequest.findMany({
      where,
      include: {
        realtor: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { requestedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.withdrawalRequest.count({ where }),
  ]);

  return {
    withdrawals,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
