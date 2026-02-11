import { apiClient } from "./api";
import { getCookie } from "@/utils/cookies";
import { Payment } from "../types";

export interface PaystackInitializationRequest {
  bookingId: string;
}

export interface PaystackInitializationResponse {
  authorizationUrl?: string;
  reference?: string;
  paymentId: string;
  paymentStatus?: Payment["status"];
}

export interface PaystackVerificationRequest {
  reference: string;
}

export interface PaystackVerificationResponse {
  success: boolean;
  message: string;
  // Optional enriched payload from backend
  payment?: Payment;
  booking?: any;
}

export interface VerifyByBookingRequest {
  bookingId: string;
}

export interface VerifyByBookingResponse {
  success: boolean;
  message: string;
  payment?: Payment;
  booking?: any;
}

interface NormalizedPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const normalizePagination = (raw: any): NormalizedPagination | undefined => {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }

  const currentPage =
    Number(raw.currentPage ?? raw.page ?? raw.current ?? 1) || 1;
  const totalPages = Number(raw.totalPages ?? raw.pages ?? 1) || 1;
  const totalItems = Number(raw.totalItems ?? raw.total ?? raw.count ?? 0) || 0;

  return {
    currentPage,
    totalPages,
    totalItems,
    hasNext:
      typeof raw.hasNext === "boolean"
        ? raw.hasNext
        : typeof raw.hasNextPage === "boolean"
        ? raw.hasNextPage
        : currentPage < totalPages,
    hasPrev:
      typeof raw.hasPrev === "boolean"
        ? raw.hasPrev
        : typeof raw.hasPrevPage === "boolean"
        ? raw.hasPrevPage
        : currentPage > 1,
  };
};

const normalizePaymentsList = (
  payload: any
): { data: Payment[]; pagination?: NormalizedPagination } => {
  if (Array.isArray(payload)) {
    return { data: payload };
  }

  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.payments)) {
      return {
        data: payload.payments,
        pagination: normalizePagination(payload.pagination),
      };
    }

    if (Array.isArray(payload.data)) {
      return {
        data: payload.data,
        pagination: normalizePagination(payload.pagination),
      };
    }
  }

  return { data: [] };
};

export const paymentService = {
  // Initialize Paystack split payment for a booking
  initializePaystackPayment: async (
    data: PaystackInitializationRequest
  ): Promise<PaystackInitializationResponse> => {
    
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: {
        authorizationUrl?: string;
        reference?: string;
        paymentId: string;
        paymentStatus?: Payment["status"];
      };
    }>("/payments/initialize-paystack", data);

    
    
    

    if (!response || !response.data) {
      
      throw new Error("Invalid response from payment API");
    }

    // Check if data is nested or at top level
    const responseData = response.data.data || response.data;
    

    if (!responseData || !responseData.authorizationUrl) {
      
      throw new Error("No authorization URL returned from payment API");
    }

    return {
      authorizationUrl: responseData.authorizationUrl,
      reference: responseData.reference,
      paymentId: responseData.paymentId,
      paymentStatus: responseData.paymentStatus,
    };
  },

  // Verify Paystack payment manually (fallback if webhook missed)
  verifyPaystackPayment: async (
    data: PaystackVerificationRequest
  ): Promise<PaystackVerificationResponse> => {
    // apiClient unwraps the backend response automatically
    // Backend: {success, message, data: {payment, booking}}
    // apiClient returns: {success, message, data: {payment, booking}}
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data?: { payment?: Payment; booking?: any };
    }>("/payments/verify-paystack", data);

    
    

    return {
      success: response.success,
      message: response.message || "Payment verification completed",
      payment: response.data?.data?.payment,
      booking: response.data?.data?.booking,
    };
  },

  // Verify payment by booking ID
  // Use this when you have the bookingId but not the payment reference
  verifyPaymentByBooking: async (
    data: VerifyByBookingRequest
  ): Promise<VerifyByBookingResponse> => {
    // apiClient returns res.data which contains { success, message, data }
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data?: { payment?: Payment; booking?: any };
    }>("/payments/verify-by-booking", data);

    return {
      success: response.data.success,
      message: response.data.message,
      payment: response.data.data?.payment,
      booking: response.data.data?.booking,
    };
  },

  // Fetch a single payment by id
  getPayment: async (id: string): Promise<Payment> => {
    const response = await apiClient.get<any>(`/payments/${id}`);
    const payload = response?.data;

    if (payload && typeof payload === "object" && payload.payment) {
      return payload.payment as Payment;
    }

    return payload as Payment;
  },

  // Fetch current user's payments
  getUserPayments: async (): Promise<Payment[]> => {
    const response = await apiClient.get<any>("/payments");
    return normalizePaymentsList(response?.data).data;
  },

  // Fetch host's payments with pagination
  getHostPayments: async (searchParams?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{
    data: Payment[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> => {
    const params = new URLSearchParams();
    if (searchParams?.page) params.append("page", String(searchParams.page));
    if (searchParams?.limit) params.append("limit", String(searchParams.limit));
    if (searchParams?.status) params.append("status", searchParams.status);

    const queryString = params.toString();
    const url = queryString ? `/payments?${queryString}` : "/payments";

    const response = await apiClient.get<any>(url);
    const normalized = normalizePaymentsList(response?.data);

    return {
      data: normalized.data,
      pagination: normalized.pagination,
    };
  },

  // Request a refund for a payment
  requestRefund: async (
    paymentId: string,
    payload?: { amount?: number; reason?: string }
  ): Promise<Payment> => {
    const response = await apiClient.post<Payment>(
      `/payments/${paymentId}/refund`,
      payload
    );
    return response.data;
  },

  // Download receipt for a completed payment (returns Blob)
  downloadReceipt: async (paymentId: string): Promise<Blob> => {
    const token =
      localStorage.getItem("accessToken") || getCookie("accessToken") || "";
    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api"
      }/payments/${paymentId}/receipt`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error("Unable to download receipt");
    }

    return res.blob();
  },
};
