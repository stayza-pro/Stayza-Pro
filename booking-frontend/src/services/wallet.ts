import api from "./api";
import axios from "axios";

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
  feeAmount?: number;
  netAmount?: number;
  feeConfigVersion?: string;
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

export interface WithdrawalFeePreview {
  requestedAmount: number;
  feeAmount: number;
  netAmount: number;
  capApplied: boolean;
  minimumWithdrawal: number;
}

export interface WithdrawalOtpChallenge {
  amount: number;
  maskedEmail: string;
  expiresInMinutes: number;
  legacyFlow?: boolean;
  fee?: WithdrawalFeePreview;
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
  amount: number,
  otp?: string
): Promise<WithdrawalRequest> => {
  if (!otp) {
    throw new Error("OTP is required. Request OTP before confirming withdrawal.");
  }
  const response = await api.post("/wallets/withdraw", { amount, otp });
  return response.data.data;
};

/**
 * Request OTP for withdrawal confirmation
 */
export const requestWithdrawalOtp = async (
  amount: number
): Promise<WithdrawalOtpChallenge> => {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await api.post("/wallets/withdraw/request-otp", {
        amount,
      });
      return response.data.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        // Backward compatibility for older backend deployments.
        if (error.response?.status === 404) {
          return {
            amount,
            maskedEmail: "",
            expiresInMinutes: 0,
            legacyFlow: true,
          };
        }

        const isTimeout =
          error.code === "ECONNABORTED" ||
          error.message?.toLowerCase().includes("timeout");

        if (isTimeout && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 1200));
          continue;
        }
      }

      throw error;
    }
  }

  throw new Error("Failed to request withdrawal OTP.");
};

/**
 * Preview withdrawal fee and net transfer
 */
export const previewWithdrawal = async (
  amount: number
): Promise<WithdrawalFeePreview> => {
  const response = await api.post("/wallets/withdraw/preview", { amount });
  return response.data.data;
};

/**
 * Confirm withdrawal using OTP
 */
export const confirmWithdrawal = async (
  amount: number,
  otp: string
): Promise<WithdrawalRequest> => {
  const response = await api.post("/wallets/withdraw/confirm", { amount, otp });
  return response.data.data;
};

/**
 * Legacy withdrawal flow for older backend versions without OTP endpoints.
 */
export const requestWithdrawalLegacy = async (
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
  previewWithdrawal,
  requestWithdrawal,
  requestWithdrawalOtp,
  confirmWithdrawal,
  requestWithdrawalLegacy,
  getWithdrawalHistory,
  getEarningsSummary,
};

export default walletService;
