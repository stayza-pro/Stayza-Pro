import { apiClient, type ApiResponse, type PaginatedResponse } from "./api";
import { serviceUtils } from "./utils";

// Refund-related types
export interface RefundRequest {
  id: string;
  bookingId: string;
  paymentId: string;
  requestedBy: string;
  requestedAmount: number;
  currency: string;
  reason: RefundReason;
  customerNotes?: string;
  status: RefundStatus;
  realtorReason?: string;
  realtorNotes?: string;
  adminNotes?: string;
  actualRefundAmount?: number;
  createdAt: string;
  realtorApprovedAt?: string;
  adminProcessedAt?: string;
  completedAt?: string;
  // Relations
  booking?: {
    id: string;
    property: {
      title: string;
      realtor: {
        businessName: string;
      };
    };
    guest: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  payment?: {
    amount: number;
    currency: string;
    method: string;
  };
}

export type RefundReason =
  | "BOOKING_CANCELLED"
  | "SERVICE_ISSUE"
  | "PROPERTY_UNAVAILABLE"
  | "OVERCHARGE"
  | "OTHER";

export type RefundStatus =
  | "PENDING_REALTOR_APPROVAL"
  | "REALTOR_APPROVED"
  | "REALTOR_REJECTED"
  | "ADMIN_PROCESSING"
  | "COMPLETED"
  | "CANCELLED";

export interface RefundRequestInput {
  bookingId: string;
  paymentId: string;
  requestedAmount: number;
  reason: RefundReason;
  customerNotes?: string;
}

export interface RealtorDecisionInput {
  approved: boolean;
  realtorReason: string;
  realtorNotes?: string;
}

export interface AdminProcessInput {
  actualRefundAmount?: number;
  adminNotes?: string;
}

// Refund service
export const refundService = {
  // Guest: Request a refund
  requestRefund: async (data: RefundRequestInput): Promise<RefundRequest> => {
    const response = await apiClient.post<RefundRequest>(
      "/refunds/request",
      data
    );
    return response.data;
  },

  // Guest: Get refund request details
  getRefundRequest: async (id: string): Promise<RefundRequest> => {
    const response = await apiClient.get<RefundRequest>(`/refunds/${id}`);
    return response.data;
  },

  // Guest: Get my refund requests
  getMyRefundRequests: async (params?: {
    page?: number;
    limit?: number;
    status?: RefundStatus;
  }): Promise<PaginatedResponse<RefundRequest>> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);

    const url = queryParams.toString()
      ? `/refunds/my?${queryParams}`
      : "/refunds/my";
    const response = await apiClient.get<RefundRequest[]>(url);
    return response as PaginatedResponse<RefundRequest>;
  },

  // Realtor: Get refund requests for review
  getRealtorRefundRequests: async (params?: {
    page?: number;
    limit?: number;
    status?: RefundStatus;
  }): Promise<PaginatedResponse<RefundRequest>> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);

    const url = queryParams.toString()
      ? `/refunds/realtor/pending?${queryParams}`
      : "/refunds/realtor/pending";
    const response = await apiClient.get<RefundRequest[]>(url);
    return response as PaginatedResponse<RefundRequest>;
  },

  // Realtor: Approve or reject refund request
  realtorDecision: async (
    id: string,
    decision: RealtorDecisionInput
  ): Promise<RefundRequest> => {
    const response = await apiClient.patch<RefundRequest>(
      `/refunds/${id}/realtor-decision`,
      decision
    );
    return response.data;
  },

  // Admin: Get refund requests for processing
  getAdminRefundRequests: async (params?: {
    page?: number;
    limit?: number;
    status?: RefundStatus;
  }): Promise<PaginatedResponse<RefundRequest>> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);

    const url = queryParams.toString()
      ? `/refunds/admin/pending?${queryParams}`
      : "/refunds/admin/pending";
    const response = await apiClient.get<RefundRequest[]>(url);
    return response as PaginatedResponse<RefundRequest>;
  },

  // Admin: Process refund (final step)
  processRefund: async (
    id: string,
    data?: AdminProcessInput
  ): Promise<{
    refundRequestId: string;
    actualRefundAmount: number;
    currency: string;
    processedAt: string;
  }> => {
    const response = await apiClient.post<{
      refundRequestId: string;
      actualRefundAmount: number;
      currency: string;
      processedAt: string;
    }>(`/refunds/${id}/process`, data);
    return response.data;
  },

  // Utility functions
  extractErrorMessage: serviceUtils.extractErrorMessage,

  // Helper functions
  getStatusColor: (status: RefundStatus): string => {
    switch (status) {
      case "PENDING_REALTOR_APPROVAL":
        return "yellow";
      case "REALTOR_APPROVED":
        return "blue";
      case "REALTOR_REJECTED":
        return "red";
      case "ADMIN_PROCESSING":
        return "purple";
      case "COMPLETED":
        return "green";
      case "CANCELLED":
        return "gray";
      default:
        return "gray";
    }
  },

  getStatusLabel: (status: RefundStatus): string => {
    switch (status) {
      case "PENDING_REALTOR_APPROVAL":
        return "Pending Realtor Review";
      case "REALTOR_APPROVED":
        return "Approved by Realtor";
      case "REALTOR_REJECTED":
        return "Rejected by Realtor";
      case "ADMIN_PROCESSING":
        return "Processing by Admin";
      case "COMPLETED":
        return "Refund Completed";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
    }
  },

  getReasonLabel: (reason: RefundReason): string => {
    switch (reason) {
      case "BOOKING_CANCELLED":
        return "Booking Cancelled";
      case "SERVICE_ISSUE":
        return "Service Issue";
      case "PROPERTY_UNAVAILABLE":
        return "Property Unavailable";
      case "OVERCHARGE":
        return "Overcharge";
      case "OTHER":
        return "Other";
      default:
        return reason;
    }
  },

  canRealtorReview: (status: RefundStatus): boolean => {
    return status === "PENDING_REALTOR_APPROVAL";
  },

  canAdminProcess: (status: RefundStatus): boolean => {
    return status === "REALTOR_APPROVED";
  },

  isCompleted: (status: RefundStatus): boolean => {
    return ["COMPLETED", "CANCELLED", "REALTOR_REJECTED"].includes(status);
  },
};
