import api from "./api";

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface WithdrawalRequest {
  id: string;
  walletId: string;
  realtorId: string;
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
  failedAt?: string;
  failureReason?: string;
  paystackTransferId?: string;
  paystackTransferCode?: string;
  retryCount: number;
  metadata?: any;
  realtor: {
    id: string;
    businessName: string;
    user: {
      email: string;
      firstName: string;
      lastName: string;
    };
  };
  wallet?: {
    balanceAvailable: number;
    balancePending: number;
  };
}

export interface WithdrawalStats {
  pendingCount: number;
  failedCount: number;
  completedTodayCount: number;
  pendingAmount: number;
  requiresAttention: number;
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

export interface BatchRetryResult {
  processed: number;
  successful: number;
  failed: number;
}

// =====================================================
// API FUNCTIONS
// =====================================================

/**
 * Get list of pending/failed withdrawals
 */
export const getWithdrawals = async (
  status?: string,
  page: number = 1,
  limit: number = 20,
  realtorId?: string
): Promise<PaginatedResponse<WithdrawalRequest>> => {
  const params: any = { page, limit };
  if (status) params.status = status;
  if (realtorId) params.realtorId = realtorId;

  const response = await api.get("/admin/withdrawals", { params });
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
};

/**
 * Get withdrawal statistics
 */
export const getWithdrawalStats = async (): Promise<WithdrawalStats> => {
  const response = await api.get("/admin/withdrawals/stats");
  return response.data.data;
};

/**
 * Get detailed information about a specific withdrawal
 */
export const getWithdrawalDetails = async (
  id: string
): Promise<WithdrawalRequest> => {
  const response = await api.get(`/admin/withdrawals/${id}`);
  return response.data.data;
};

/**
 * Manually process a pending or failed withdrawal
 */
export const processWithdrawal = async (
  id: string
): Promise<{
  withdrawalId: string;
  transferReference: string;
  amount: number;
  status: string;
}> => {
  const response = await api.post(`/admin/withdrawals/${id}/process`);
  return response.data.data;
};

/**
 * Batch retry all failed withdrawals
 */
export const retryFailedWithdrawals = async (): Promise<BatchRetryResult> => {
  const response = await api.post("/admin/withdrawals/retry-failed");
  return response.data.data;
};

/**
 * Cancel a withdrawal and release locked funds
 */
export const cancelWithdrawal = async (
  id: string,
  reason: string
): Promise<void> => {
  await api.put(`/admin/withdrawals/${id}/cancel`, { reason });
};

const adminWithdrawalService = {
  getWithdrawals,
  getWithdrawalStats,
  getWithdrawalDetails,
  processWithdrawal,
  retryFailedWithdrawals,
  cancelWithdrawal,
};

export default adminWithdrawalService;
