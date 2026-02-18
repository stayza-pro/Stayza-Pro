import { apiClient } from "./api";

export type AdminDisputeDecision = "FULL_REFUND" | "PARTIAL_REFUND" | "NO_REFUND";

export interface AdminDisputeSummary {
  id: string;
  bookingId: string;
  status: string;
  disputeSubject: string;
  category: string;
  openedAt: string;
  writeup?: string;
  booking?: {
    id: string;
    checkInDate?: string;
    checkOutDate?: string;
    property?: {
      title?: string;
      city?: string;
      state?: string;
      realtor?: {
        businessName?: string;
        user?: {
          email?: string;
        };
      };
    };
    guest?: {
      firstName?: string;
      lastName?: string;
      email?: string;
    };
  };
  opener?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export interface AdminDisputeStats {
  total: number;
  open: number;
  escalated: number;
  resolved: number;
  bySubject: {
    roomFee: number;
    deposit: number;
  };
}

const extractArray = <T>(payload: unknown, fallbackKey: string): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as Record<string, unknown>)[fallbackKey])
  ) {
    return (payload as Record<string, unknown>)[fallbackKey] as T[];
  }
  return [];
};

export const adminDisputesService = {
  async getDisputes(): Promise<AdminDisputeSummary[]> {
    const response = await apiClient.get<AdminDisputeSummary[] | { disputes: AdminDisputeSummary[] }>(
      "/admin/disputes",
    );
    return extractArray<AdminDisputeSummary>(response as unknown, "disputes");
  },

  async getDisputeById(disputeId: string): Promise<AdminDisputeSummary | null> {
    const response = await apiClient.get<{ dispute?: AdminDisputeSummary }>(
      `/admin/disputes/${disputeId}`,
    );
    const payload = response as unknown;
    if (payload && typeof payload === "object") {
      const direct = payload as { dispute?: AdminDisputeSummary };
      if (direct.dispute) return direct.dispute;
      const nested = payload as { data?: { dispute?: AdminDisputeSummary } };
      if (nested.data?.dispute) return nested.data.dispute;
    }
    return null;
  },

  async resolveDispute(
    disputeId: string,
    decision: AdminDisputeDecision,
    adminNotes: string,
  ): Promise<void> {
    await apiClient.post(`/admin/disputes/${disputeId}/resolve`, {
      decision,
      adminNotes,
    });
  },

  async getStats(): Promise<AdminDisputeStats | null> {
    const response = await apiClient.get<{ stats?: AdminDisputeStats }>(
      "/admin/disputes/stats",
    );
    const payload = response as unknown;
    if (payload && typeof payload === "object") {
      const direct = payload as { stats?: AdminDisputeStats };
      if (direct.stats) return direct.stats;
      const nested = payload as { data?: { stats?: AdminDisputeStats } };
      if (nested.data?.stats) return nested.data.stats;
    }
    return null;
  },
};
