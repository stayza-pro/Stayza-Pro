import api from "./api";

export interface WalletBalance {
  walletId: string;
  availableBalance: number;
  pendingBalance: number;
  totalBalance: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  currency: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  source: string;
  description?: string;
  metadata?: any;
  createdAt: string;
  completedAt?: string;
}

export interface WithdrawalRequest {
  id: string;
  walletId: string;
  realtorId: string;
  amount: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  requestedAt: string;
  processedAt?: string;
  metadata?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EarningsSummary {
  summary: Array<{
    source: string;
    totalAmount: number;
    transactionCount: number;
  }>;
  totalEarnings: number;
}

/**
 * Get wallet balance
 */
export const getWalletBalance = async (): Promise<WalletBalance> => {
  const response = await api.get("/wallets/balance");
  return response.data.data;
};

/**
 * Get wallet transaction history
 */
export const getWalletTransactions = async (
  page: number = 1,
  limit: number = 20,
  type?: "CREDIT" | "DEBIT",
  status?: string
): Promise<PaginatedResponse<WalletTransaction>> => {
  const params: any = { page, limit };
  if (type) params.type = type;
  if (status) params.status = status;

  const response = await api.get("/wallets/transactions", { params });
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
};

/**
 * Request a withdrawal
 */
export const requestWithdrawal = async (
  amount: number
): Promise<WithdrawalRequest> => {
  const response = await api.post("/wallets/withdraw", { amount });
  return response.data.data;
};

/**
 * Get withdrawal history
 */
export const getWithdrawalHistory = async (
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResponse<WithdrawalRequest>> => {
  const response = await api.get("/wallets/withdrawals", {
    params: { page, limit },
  });
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
};

/**
 * Get earnings summary by source
 */
export const getEarningsSummary = async (): Promise<EarningsSummary> => {
  const response = await api.get("/wallets/earnings-summary");
  return response.data.data;
};

const walletService = {
  getWalletBalance,
  getWalletTransactions,
  requestWithdrawal,
  getWithdrawalHistory,
  getEarningsSummary,
};

export default walletService;
