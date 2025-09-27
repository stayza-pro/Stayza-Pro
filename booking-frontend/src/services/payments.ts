import { apiClient } from "./api";
import { Payment } from "../types";

export interface StripePaymentIntentRequest {
  bookingId: string;
}

export interface StripePaymentIntentResponse {
  clientSecret?: string;
  paymentId: string;
  paymentStatus?: Payment["status"];
}

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

export const paymentService = {
  // Create Stripe payment intent for a booking
  createStripePaymentIntent: async (
    data: StripePaymentIntentRequest
  ): Promise<StripePaymentIntentResponse> => {
    const response = await apiClient.post<{
      clientSecret?: string;
      paymentId: string;
      paymentStatus?: Payment["status"];
    }>("/payments/create-stripe-intent", data);

    return {
      clientSecret: response.data.clientSecret,
      paymentId: response.data.paymentId,
      paymentStatus: response.data.paymentStatus,
    };
  },

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
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
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
