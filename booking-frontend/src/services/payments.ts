import { apiClient } from "./api";
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
}

export interface FlutterwaveInitializationRequest {
  bookingId: string;
}

export interface FlutterwaveInitializationResponse {
  authorizationUrl?: string;
  reference?: string;
  paymentId: string;
  paymentStatus?: Payment["status"];
}

export interface FlutterwaveVerificationRequest {
  reference: string;
}

export interface FlutterwaveVerificationResponse {
  success: boolean;
  message: string;
}

export const paymentService = {
  // Initialize Paystack split payment for a booking
  initializePaystackPayment: async (
    data: PaystackInitializationRequest
  ): Promise<PaystackInitializationResponse> => {
    const response = await apiClient.post<{
      authorizationUrl?: string;
      reference?: string;
      paymentId: string;
      paymentStatus?: Payment["status"];
    }>("/payments/initialize-paystack", data);

    return {
      authorizationUrl: response.data.authorizationUrl,
      reference: response.data.reference,
      paymentId: response.data.paymentId,
      paymentStatus: response.data.paymentStatus,
    };
  },

  // Verify Paystack payment manually (fallback if webhook missed)
  verifyPaystackPayment: async (
    data: PaystackVerificationRequest
  ): Promise<PaystackVerificationResponse> => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
    }>("/payments/verify-paystack", data);

    return {
      success: response.data.success,
      message: response.data.message,
    };
  },

  // Initialize Flutterwave payment for a booking (primary payment method)
  initializeFlutterwavePayment: async (
    data: FlutterwaveInitializationRequest
  ): Promise<FlutterwaveInitializationResponse> => {
    const response = await apiClient.post<{
      authorizationUrl?: string;
      reference?: string;
      paymentId: string;
      paymentStatus?: Payment["status"];
    }>("/payments/initialize-flutterwave", data);

    return {
      authorizationUrl: response.data.authorizationUrl,
      reference: response.data.reference,
      paymentId: response.data.paymentId,
      paymentStatus: response.data.paymentStatus,
    };
  },

  // Verify Flutterwave payment manually (fallback if webhook missed)
  verifyFlutterwavePayment: async (
    data: FlutterwaveVerificationRequest
  ): Promise<FlutterwaveVerificationResponse> => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
    }>("/payments/verify-flutterwave", data);

    return {
      success: response.data.success,
      message: response.data.message,
    };
  },

  // Fetch a single payment by id
  getPayment: async (id: string): Promise<Payment> => {
    const response = await apiClient.get<Payment>(`/payments/${id}`);
    return response.data;
  },

  // Fetch current user's payments
  getUserPayments: async (): Promise<Payment[]> => {
    const response = await apiClient.get<Payment[]>("/payments");
    return response.data;
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

    const response = await apiClient.get<Payment[]>(url);
    return response as any; // Type assertion for paginated response
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
    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      }/api/payments/${paymentId}/receipt`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error("Unable to download receipt");
    }

    return res.blob();
  },
};
