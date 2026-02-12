import { prisma } from "@/config/database";
import { logger } from "@/utils/logger";
import * as paystackService from "@/services/paystack";
import { ensureRealtorTransferRecipientCode } from "@/services/payoutAccountService";
import {
  sendWithdrawalCompletedEmail,
  sendWithdrawalFailedEmail,
} from "@/services/email";
import {
  Prisma,
  WithdrawalRequestStatus,
  WalletOwnerType,
  WalletTransactionSource,
  WalletTransactionStatus,
  WalletTransactionType,
} from "@prisma/client";

const getObjectMetadata = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
};

const getWithdrawalReference = (metadata: unknown): string | null => {
  const record = getObjectMetadata(metadata);
  return typeof record.reference === "string" ? record.reference : null;
};

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

    const metadata = getObjectMetadata(withdrawal.metadata);
    const withdrawalReference = getWithdrawalReference(metadata);
    const grossAmount = Number(withdrawal.amount);
    const feeAmount = Number(withdrawal.feeAmount || 0);
    const netAmount = Number(
      (
        withdrawal.netAmount !== null
          ? Number(withdrawal.netAmount)
          : Number(withdrawal.amount) - Number(withdrawal.feeAmount || 0)
      ).toFixed(2)
    );

    if (netAmount <= 0) {
      throw new Error("Invalid withdrawal net amount");
    }

    const pendingLockTransaction = await prisma.walletTransaction.findFirst({
      where: {
        walletId: withdrawal.walletId,
        source: WalletTransactionSource.WITHDRAWAL,
        status: WalletTransactionStatus.PENDING,
        ...(withdrawalReference ? { referenceId: withdrawalReference } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    if (!pendingLockTransaction) {
      throw new Error(
        "Withdrawal funds are not locked. Please submit a new withdrawal request."
      );
    }

    const recipientCode = await ensureRealtorTransferRecipientCode(
      withdrawal.realtorId
    );

    // Generate transfer reference
    const transferReference = `TXN_${Date.now()}_${withdrawal.realtorId.slice(
      -8
    )}`;

    logger.info("Processing withdrawal", {
      withdrawalId: withdrawalRequestId,
      realtorId: withdrawal.realtorId,
      grossAmount,
      feeAmount,
      netAmount,
      transferReference,
      isManualRetry,
    });

    // Initiate Paystack transfer
    const transferResult = await paystackService.initiateTransfer({
      amount: netAmount,
      recipient: recipientCode,
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
          ...metadata,
          transferReference,
          transferStatus: transferResult.status,
          transferCode: transferResult.transfer_code,
          grossAmount,
          feeAmount,
          netAmount,
          fundsRestored: false,
          processedBy: isManualRetry ? "admin" : "automatic",
        },
      },
    });

    await prisma.$transaction(async (tx) => {
      // Update lock transaction and remove held amount from pending balance
      await tx.walletTransaction.update({
        where: { id: pendingLockTransaction.id },
        data: {
          status: WalletTransactionStatus.COMPLETED,
          metadata: {
            ...getObjectMetadata(pendingLockTransaction.metadata),
            withdrawalRequestId,
            transferReference,
            grossAmount,
            feeAmount,
            netAmount,
          },
        },
      });

      await tx.wallet.update({
        where: { id: withdrawal.walletId },
        data: {
          balancePending: {
            decrement: withdrawal.amount,
          },
        },
      });

      if (feeAmount > 0) {
        // Realtor-side fee transaction for ledger transparency
        await tx.walletTransaction.create({
          data: {
            walletId: withdrawal.walletId,
            type: WalletTransactionType.DEBIT,
            source: WalletTransactionSource.WITHDRAWAL_FEE,
            amount: new Prisma.Decimal(feeAmount),
            referenceId: transferReference,
            status: WalletTransactionStatus.COMPLETED,
            metadata: {
              withdrawalRequestId,
              grossAmount,
              feeAmount,
              netAmount,
            },
          },
        });

        // Credit platform wallet with withdrawal fee margin
        const platformWallet = await tx.wallet.upsert({
          where: {
            ownerType_ownerId: {
              ownerType: WalletOwnerType.PLATFORM,
              ownerId: "platform",
            },
          },
          update: {
            balanceAvailable: {
              increment: new Prisma.Decimal(feeAmount),
            },
          },
          create: {
            ownerType: WalletOwnerType.PLATFORM,
            ownerId: "platform",
            balanceAvailable: new Prisma.Decimal(feeAmount),
            balancePending: new Prisma.Decimal(0),
          },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: platformWallet.id,
            type: WalletTransactionType.CREDIT,
            source: WalletTransactionSource.WITHDRAWAL_FEE,
            amount: new Prisma.Decimal(feeAmount),
            referenceId: withdrawalRequestId,
            status: WalletTransactionStatus.COMPLETED,
            metadata: {
              withdrawalRequestId,
              realtorId: withdrawal.realtorId,
              transferReference,
            },
          },
        });
      }
    });

    // Send success email to realtor
    await sendWithdrawalCompletedEmail(
      withdrawal.realtor.user.email,
      withdrawal.realtor.user.firstName || withdrawal.realtor.businessName,
      netAmount,
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
      error.message?.includes("subaccount not configured") ||
      error.message?.includes("Payout account is not configured")
    ) {
      userMessage =
        "Bank account details are invalid or not set up. Please update your payout settings.";
    } else if (error.message?.includes("Rate limit")) {
      userMessage =
        "Too many transfer requests. Your withdrawal will be processed automatically within the hour.";
    }

    const failedAt = new Date();
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
      const metadata = getObjectMetadata(withdrawal.metadata);
      const withdrawalReference = getWithdrawalReference(metadata);
      const amount = Number(withdrawal.amount);

      try {
        await prisma.$transaction(async (tx) => {
          const lockTransaction = await tx.walletTransaction.findFirst({
            where: {
              walletId: withdrawal.walletId,
              source: WalletTransactionSource.WITHDRAWAL,
              status: WalletTransactionStatus.PENDING,
              ...(withdrawalReference
                ? { referenceId: withdrawalReference }
                : {}),
            },
            orderBy: { createdAt: "desc" },
          });

          const fundsRestored = true;

          if (lockTransaction) {
            await tx.wallet.update({
              where: { id: withdrawal.walletId },
              data: {
                balanceAvailable: {
                  increment: new Prisma.Decimal(amount),
                },
                balancePending: {
                  decrement: new Prisma.Decimal(amount),
                },
              },
            });

            await tx.walletTransaction.update({
              where: { id: lockTransaction.id },
              data: {
                status: WalletTransactionStatus.FAILED,
                metadata: {
                  ...getObjectMetadata(lockTransaction.metadata),
                  failureReason: userMessage,
                  failedAt: failedAt.toISOString(),
                  fundsRestored,
                },
              },
            });
          }

          await tx.withdrawalRequest.update({
            where: { id: withdrawalRequestId },
            data: {
              status: "FAILED",
              failureReason: userMessage,
              failedAt,
              retryCount: { increment: 1 },
              metadata: {
                ...metadata,
                error: error.message,
                failedAt: failedAt.toISOString(),
                isManualRetry,
                fundsRestored,
              },
            },
          });
        });
      } catch (recoveryError) {
        logger.error("Failed to finalize withdrawal failure recovery", {
          withdrawalRequestId,
          recoveryError:
            recoveryError instanceof Error
              ? recoveryError.message
              : recoveryError,
        });
      }

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
    // Get failed withdrawals that still have locked funds available for retry
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
      const metadata = getObjectMetadata(withdrawal.metadata);
      if (metadata.fundsRestored === true) {
        continue;
      }

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

  const statusFilter = filters?.status;
  const normalizedStatuses = (Array.isArray(statusFilter)
    ? statusFilter
    : statusFilter
      ? [statusFilter]
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
