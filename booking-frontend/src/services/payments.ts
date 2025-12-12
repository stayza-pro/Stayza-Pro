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
  // Optional enriched payload from backend
  payment?: Payment;
  booking?: any;
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

export const paymentService = {
  // Initialize Paystack split payment for a booking
  initializePaystackPayment: async (
    data: PaystackInitializationRequest
  ): Promise<PaystackInitializationResponse> => {
    console.log("🚀 Calling Paystack initialization API...");
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

    console.log("📦 Raw API response:", response);

    if (!response || !response.data) {
      console.error("❌ Invalid response:", response);
      throw new Error("Invalid response from payment API");
    }

    // apiClient returns res.data which contains { success, message, data }
    // So we need to access response.data.data for the actual payload
    const responseData = response.data.data;
    console.log("✅ Parsed response data:", responseData);

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
    // apiClient returns res.data which contains { success, message, data }
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data?: { payment?: Payment; booking?: any };
    }>("/payments/verify-paystack", data);

    return {
      success: response.data.success,
      message: response.data.message,
      payment: response.data.data?.payment,
      booking: response.data.data?.booking,
    };
  },

  // Initialize Flutterwave payment for a booking (primary payment method)
  initializeFlutterwavePayment: async (
    data: FlutterwaveInitializationRequest
  ): Promise<FlutterwaveInitializationResponse> => {
    console.log("🚀 Calling Flutterwave initialization API...");
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: {
        authorizationUrl?: string;
        reference?: string;
        paymentId: string;
        paymentStatus?: Payment["status"];
      };
    }>("/payments/initialize-flutterwave", data);

    console.log("📦 Raw API response:", response);

    if (!response || !response.data) {
      console.error("❌ Invalid response:", response);
      throw new Error("Invalid response from payment API");
    }

    // apiClient returns res.data which contains { success, message, data }
    // So we need to access response.data.data for the actual payload
    const responseData = response.data.data;
    console.log("✅ Parsed response data:", responseData);

    return {
      authorizationUrl: responseData.authorizationUrl,
      reference: responseData.reference,
      paymentId: responseData.paymentId,
      paymentStatus: responseData.paymentStatus,
    };
  },

  // Verify Flutterwave payment manually (fallback if webhook missed)
  verifyFlutterwavePayment: async (
    data: FlutterwaveVerificationRequest
  ): Promise<FlutterwaveVerificationResponse> => {
    // apiClient returns res.data which contains { success, message, data }
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data?: { payment?: Payment; booking?: any };
    }>("/payments/verify-flutterwave", data);

    return {
      success: response.data.success,
      message: response.data.message,
      payment: response.data.data?.payment,
      booking: response.data.data?.booking,
    };
  },

  // Verify payment by booking ID (auto-detects provider and verifies)
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
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api"
      }/payments/${paymentId}/receipt`,
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
