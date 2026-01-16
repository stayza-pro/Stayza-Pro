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
