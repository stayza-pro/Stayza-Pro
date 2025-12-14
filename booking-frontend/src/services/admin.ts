import { apiClient, type ApiResponse, type PaginatedResponse } from "./api";
import { serviceUtils } from "./utils";
import type { Realtor, RealtorStatus, UserRole } from "@/types";

// Admin-specific types
export interface AdminRealtorResponse extends Realtor {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    country: string;
    city: string;
    role: UserRole;
    isEmailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  _count: {
    properties: number;
  };
}

export interface RealtorSuspensionData {
  reason: string;
  notes?: string;
  suspendedUntil?: Date;
  durationDays?: number;
}

export interface RealtorApprovalData {
  approvalNotes?: string;
  notes?: string;
}

export interface PlatformAnalytics {
  overview: {
    totalUsers: number;
    totalRealtors: number;
    approvedRealtors: number;
    pendingRealtors: number;
    totalProperties: number;
    approvedProperties: number;
    totalBookings: number;
    completedBookings: number;
    totalRevenue: number;
  };
  monthlyTrends: Array<{
    month: string;
    bookings: number;
    revenue: number;
    users: number;
  }>;
  topRealtors: Array<{
    businessName: string;
    totalRevenue: number;
    totalBookings: number;
    averageRating: number;
  }>;
}

export interface CommissionReport {
  totalCommission: number;
  totalPayouts: number;
  pendingPayouts: number;
  currency: string;
  period: {
    startDate: string;
    endDate: string;
  };
  breakdown: Array<{
    realtorId: string;
    businessName: string;
    totalEarnings: number;
    platformCommission: number;
    payoutStatus: "PAID" | "PENDING" | "PROCESSING";
  }>;
}

export interface PendingPayout {
  id: string;
  bookingId: string;
  realtorId: string;
  amount: number;
  currency: string;
  realtorEarnings: number;
  platformCommission: number;
  commissionRate: number;
  createdAt: string;
  realtor: {
    businessName: string;
    user: {
      email: string;
      firstName: string;
      lastName: string;
    };
  };
  booking: {
    property: {
      title: string;
    };
  };
}

export interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  entity: string;
  entityId: string;
  details: Record<string, any>;
  ipAddress: string;
  createdAt: string;
  admin: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

// Admin service
export const adminService = {
  // Realtor Management
  getAllRealtors: async (filters?: {
    status?: RealtorStatus;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<AdminRealtorResponse>> => {
    const queryParams = new URLSearchParams();

    if (filters?.status) queryParams.append("status", filters.status);
    if (filters?.search) queryParams.append("search", filters.search);
    if (filters?.page) queryParams.append("page", filters.page.toString());
    if (filters?.limit) queryParams.append("limit", filters.limit.toString());

    const url = queryParams.toString()
      ? `/admin/realtors?${queryParams}`
      : "/admin/realtors";
    const response = await apiClient.get<AdminRealtorResponse[]>(url);
    return response as PaginatedResponse<AdminRealtorResponse>;
  },

  updateRealtorStatus: async (
    realtorId: string,
    action: "approve" | "reject" | "suspend" | "reinstate",
    data?: { reason?: string; notes?: string; durationDays?: number }
  ): Promise<AdminRealtorResponse> => {
    const response = await apiClient.patch<AdminRealtorResponse>(
      `/admin/realtors/${realtorId}/status`,
      { action, ...data }
    );
    return response.data;
  },

  // Legacy wrappers for backward compatibility
  approveRealtor: async (
    realtorId: string,
    data: RealtorApprovalData
  ): Promise<AdminRealtorResponse> => {
    const response = await apiClient.patch<AdminRealtorResponse>(
      `/admin/realtors/${realtorId}/status`,
      { action: "approve", notes: data.notes }
    );
    return response.data;
  },

  rejectRealtor: async (
    realtorId: string,
    reason: string
  ): Promise<AdminRealtorResponse> => {
    const response = await apiClient.patch<AdminRealtorResponse>(
      `/admin/realtors/${realtorId}/status`,
      { action: "reject", reason }
    );
    return response.data;
  },

  suspendRealtor: async (
    realtorId: string,
    data: RealtorSuspensionData
  ): Promise<AdminRealtorResponse> => {
    const response = await apiClient.patch<AdminRealtorResponse>(
      `/admin/realtors/${realtorId}/status`,
      {
        action: "suspend",
        reason: data.reason,
        durationDays: data.durationDays,
      }
    );
    return response.data;
  },

  reactivateRealtor: async (
    realtorId: string
  ): Promise<AdminRealtorResponse> => {
    const response = await apiClient.patch<AdminRealtorResponse>(
      `/admin/realtors/${realtorId}/status`,
      { action: "reinstate" }
    );
    return response.data;
  },

  // Booking Management - Batch operations for realtor suspension
  batchSuspendRealtorBookings: async (
    realtorId: string,
    reason: string
  ): Promise<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
    suspendedBookings: number;
    notificationsSent: number;
    realtorBusinessName: string;
  }> => {
    const response = await apiClient.put<{
      successful: string[];
      failed: Array<{ id: string; error: string }>;
      suspendedBookings: number;
      notificationsSent: number;
      realtorBusinessName: string;
    }>("/admin/bookings/batch-suspend", {
      realtorId,
      reason,
    });
    return response.data;
  },

  // Analytics
  getPlatformAnalytics: async (): Promise<PlatformAnalytics> => {
    const response = await apiClient.get<PlatformAnalytics>("/admin/analytics");
    return response.data;
  },

  // Commission Management
  getPlatformCommissionReport: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<CommissionReport> => {
    const queryParams = new URLSearchParams();

    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);

    const url = queryParams.toString()
      ? `/admin/commission/platform-report?${queryParams}`
      : "/admin/commission/platform-report";

    const response = await apiClient.get<CommissionReport>(url);
    return response.data;
  },

  getRealtorCommissionReport: async (
    realtorId: string,
    params?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<CommissionReport> => {
    const queryParams = new URLSearchParams();

    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);

    const url = queryParams.toString()
      ? `/admin/commission/realtor/${realtorId}?${queryParams}`
      : `/admin/commission/realtor/${realtorId}`;

    const response = await apiClient.get<CommissionReport>(url);
    return response.data;
  },

  getPendingPayouts: async (params?: {
    page?: number;
    limit?: number;
    realtorId?: string;
  }): Promise<PaginatedResponse<PendingPayout>> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.realtorId) queryParams.append("realtorId", params.realtorId);

    const url = queryParams.toString()
      ? `/admin/commission/pending-payouts?${queryParams}`
      : "/admin/commission/pending-payouts";

    const response = await apiClient.get<PendingPayout[]>(url);
    return response as PaginatedResponse<PendingPayout>;
  },

  processRealtorPayout: async (
    paymentId: string,
    payoutReference?: string
  ): Promise<{
    paymentId: string;
    payoutAmount: number;
    currency: string;
    processedAt: string;
  }> => {
    const response = await apiClient.post<{
      paymentId: string;
      payoutAmount: number;
      currency: string;
      processedAt: string;
    }>(`/admin/commission/payout/${paymentId}`, {
      payoutReference,
    });
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (params?: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    adminId?: string;
  }): Promise<PaginatedResponse<AuditLog>> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.action) queryParams.append("action", params.action);
    if (params?.entityType) queryParams.append("entityType", params.entityType);
    if (params?.adminId) queryParams.append("adminId", params.adminId);

    const url = queryParams.toString()
      ? `/admin/audit-logs?${queryParams}`
      : "/admin/audit-logs";

    const response = await apiClient.get<AuditLog[]>(url);
    return response as PaginatedResponse<AuditLog>;
  },

  // Utility functions
  extractErrorMessage: serviceUtils.extractErrorMessage,

  // Helper functions
  getRealtorStatusColor: (status: RealtorStatus): string => {
    switch (status) {
      case "PENDING":
        return "yellow";
      case "APPROVED":
        return "green";
      case "REJECTED":
        return "red";
      case "SUSPENDED":
        return "orange";
      default:
        return "gray";
    }
  },

  getRealtorStatusLabel: (status: RealtorStatus): string => {
    switch (status) {
      case "PENDING":
        return "Pending Review";
      case "APPROVED":
        return "Approved";
      case "REJECTED":
        return "Rejected";
      case "SUSPENDED":
        return "Suspended";
      default:
        return status;
    }
  },

  canApproveRealtor: (status: RealtorStatus): boolean => {
    return status === "PENDING";
  },

  canRejectRealtor: (status: RealtorStatus): boolean => {
    return status === "PENDING";
  },

  canSuspendRealtor: (status: RealtorStatus): boolean => {
    return status === "APPROVED";
  },

  formatCurrency: (amount: number, currency: string = "NGN"): string => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency,
    }).format(amount);
  },

  calculateCommissionRate: (
    platformCommission: number,
    totalAmount: number
  ): number => {
    return (platformCommission / totalAmount) * 100;
  },
};
