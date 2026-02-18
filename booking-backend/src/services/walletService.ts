import { prisma } from "@/config/database";
import {
  WalletOwnerType,
  WalletTransactionType,
  WalletTransactionSource,
  WalletTransactionStatus,
  Prisma,
} from "@prisma/client";
import { logger } from "@/utils/logger";

type WalletDbClient = Prisma.TransactionClient | typeof prisma;

const withTransaction = async <T>(
  txClient: Prisma.TransactionClient | undefined,
  operation: (client: Prisma.TransactionClient) => Promise<T>
): Promise<T> => {
  if (txClient) {
    return operation(txClient);
  }

  return prisma.$transaction(async (tx) => operation(tx));
};

/**
 * Get or create wallet for realtor or platform
 */
export const getOrCreateWallet = async (
  ownerType: WalletOwnerType,
  ownerId: string,
  txClient?: Prisma.TransactionClient
) => {
  const db: WalletDbClient = txClient || prisma;

  let wallet = await db.wallet.findUnique({
    where: {
      ownerType_ownerId: {
        ownerType,
        ownerId,
      },
    },
  });

  if (!wallet) {
    wallet = await db.wallet.create({
      data: {
        ownerType,
        ownerId,
        balanceAvailable: 0,
        balancePending: 0,
      },
    });

    logger.info("Wallet created", { ownerType, ownerId, walletId: wallet.id });
  }

  return wallet;
};

/**
 * Credit wallet (add money)
 * Creates a CREDIT transaction and updates balanceAvailable
 */
export const creditWallet = async (
  walletId: string,
  amount: number,
  source: WalletTransactionSource,
  referenceId?: string,
  metadata?: any,
  txClient?: Prisma.TransactionClient
): Promise<{ success: boolean; transaction: any; newBalance: number }> => {
  if (amount <= 0) {
    throw new Error("Credit amount must be positive");
  }

  const result = await withTransaction(txClient, async (tx) => {
    // Update wallet balance
    const wallet = await tx.wallet.update({
      where: { id: walletId },
      data: {
        balanceAvailable: {
          increment: new Prisma.Decimal(amount),
        },
      },
    });

    // Create transaction record
    const transaction = await tx.walletTransaction.create({
      data: {
        walletId,
        type: WalletTransactionType.CREDIT,
        source,
        amount: new Prisma.Decimal(amount),
        referenceId,
        status: WalletTransactionStatus.COMPLETED,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      },
    });

    return {
      wallet,
      transaction,
    };
  });

  logger.info("Wallet credited", {
    walletId,
    amount,
    source,
    referenceId,
    newBalance: result.wallet.balanceAvailable.toNumber(),
  });

  return {
    success: true,
    transaction: result.transaction,
    newBalance: result.wallet.balanceAvailable.toNumber(),
  };
};

/**
 * Debit wallet (remove money)
 * Creates a DEBIT transaction and updates balanceAvailable
 */
export const debitWallet = async (
  walletId: string,
  amount: number,
  source: WalletTransactionSource,
  referenceId?: string,
  metadata?: any,
  txClient?: Prisma.TransactionClient
): Promise<{ success: boolean; transaction: any; newBalance: number }> => {
  if (amount <= 0) {
    throw new Error("Debit amount must be positive");
  }

  const result = await withTransaction(txClient, async (tx) => {
    // Check sufficient balance
    const wallet = await tx.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    if (wallet.balanceAvailable.toNumber() < amount) {
      throw new Error(
        `Insufficient balance. Available: ${wallet.balanceAvailable}, Required: ${amount}`
      );
    }

    // Update wallet balance
    const updatedWallet = await tx.wallet.update({
      where: { id: walletId },
      data: {
        balanceAvailable: {
          decrement: new Prisma.Decimal(amount),
        },
      },
    });

    // Create transaction record
    const transaction = await tx.walletTransaction.create({
      data: {
        walletId,
        type: WalletTransactionType.DEBIT,
        source,
        amount: new Prisma.Decimal(amount),
        referenceId,
        status: WalletTransactionStatus.COMPLETED,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      },
    });

    return {
      wallet: updatedWallet,
      transaction,
    };
  });

  logger.info("Wallet debited", {
    walletId,
    amount,
    source,
    referenceId,
    newBalance: result.wallet.balanceAvailable.toNumber(),
  });

  return {
    success: true,
    transaction: result.transaction,
    newBalance: result.wallet.balanceAvailable.toNumber(),
  };
};

/**
 * Lock funds for pending withdrawal
 * Moves money from balanceAvailable to balancePending
 */
export const lockFundsForWithdrawal = async (
  walletId: string,
  amount: number,
  referenceId: string
): Promise<{ success: boolean; transaction: any }> => {
  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }

  const result = await prisma.$transaction(async (tx) => {
    // Check sufficient balance
    const wallet = await tx.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    if (wallet.balanceAvailable.toNumber() < amount) {
      throw new Error(
        `Insufficient balance. Available: ${wallet.balanceAvailable}, Required: ${amount}`
      );
    }

    // Lock funds
    const updatedWallet = await tx.wallet.update({
      where: { id: walletId },
      data: {
        balanceAvailable: {
          decrement: new Prisma.Decimal(amount),
        },
        balancePending: {
          increment: new Prisma.Decimal(amount),
        },
      },
    });

    // Create PENDING transaction record
    const transaction = await tx.walletTransaction.create({
      data: {
        walletId,
        type: WalletTransactionType.DEBIT,
        source: WalletTransactionSource.WITHDRAWAL,
        amount: new Prisma.Decimal(amount),
        referenceId,
        status: WalletTransactionStatus.PENDING,
      },
    });

    return {
      wallet: updatedWallet,
      transaction,
    };
  });

  logger.info("Funds locked for withdrawal", {
    walletId,
    amount,
    referenceId,
    newAvailable: result.wallet.balanceAvailable.toNumber(),
    newPending: result.wallet.balancePending.toNumber(),
  });

  return {
    success: true,
    transaction: result.transaction,
  };
};

/**
 * Complete withdrawal (success)
 * Removes money from balancePending and marks transaction as COMPLETED
 */
export const completeWithdrawal = async (
  transactionId: string
): Promise<{ success: boolean }> => {
  await prisma.$transaction(async (tx) => {
    // Get transaction
    const transaction = await tx.walletTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status !== WalletTransactionStatus.PENDING) {
      throw new Error("Transaction is not pending");
    }

    // Update transaction status
    await tx.walletTransaction.update({
      where: { id: transactionId },
      data: {
        status: WalletTransactionStatus.COMPLETED,
      },
    });

    // Remove from pending balance
    await tx.wallet.update({
      where: { id: transaction.walletId },
      data: {
        balancePending: {
          decrement: transaction.amount,
        },
      },
    });
  });

  logger.info("Withdrawal completed", { transactionId });

  return { success: true };
};

/**
 * Fail withdrawal (return funds)
 * Returns money from balancePending to balanceAvailable and marks transaction as FAILED
 */
export const failWithdrawal = async (
  transactionId: string,
  reason?: string
): Promise<{ success: boolean }> => {
  await prisma.$transaction(async (tx) => {
    // Get transaction
    const transaction = await tx.walletTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status !== WalletTransactionStatus.PENDING) {
      throw new Error("Transaction is not pending");
    }

    // Update transaction status
    await tx.walletTransaction.update({
      where: { id: transactionId },
      data: {
        status: WalletTransactionStatus.FAILED,
        metadata: reason
          ? {
              ...((transaction.metadata as any) || {}),
              failureReason: reason,
            }
          : transaction.metadata,
      },
    });

    // Return funds to available balance
    await tx.wallet.update({
      where: { id: transaction.walletId },
      data: {
        balanceAvailable: {
          increment: transaction.amount,
        },
        balancePending: {
          decrement: transaction.amount,
        },
      },
    });
  });

  logger.info("Withdrawal failed, funds returned", { transactionId, reason });

  return { success: true };
};

/**
 * Get wallet balance
 */
export const getWalletBalance = async (walletId: string) => {
  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
  });

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  return {
    available: wallet.balanceAvailable.toNumber(),
    pending: wallet.balancePending.toNumber(),
    total:
      wallet.balanceAvailable.toNumber() + wallet.balancePending.toNumber(),
  };
};

/**
 * Get wallet transactions (paginated)
 */
export const getWalletTransactions = async (
  walletId: string,
  options?: {
    page?: number;
    limit?: number;
    status?: WalletTransactionStatus;
    type?: WalletTransactionType;
  }
) => {
  const page = options?.page || 1;
  const limit = options?.limit || 50;
  const skip = (page - 1) * limit;

  const where: any = { walletId };
  if (options?.status) where.status = options.status;
  if (options?.type) where.type = options.type;

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.walletTransaction.count({ where }),
  ]);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export default {
  getOrCreateWallet,
  creditWallet,
  debitWallet,
  lockFundsForWithdrawal,
  completeWithdrawal,
  failWithdrawal,
  getWalletBalance,
  getWalletTransactions,
};
