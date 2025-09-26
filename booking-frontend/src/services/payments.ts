import { apiClient, PaginatedResponse } from "./api";
import { Payment, SearchParams } from "../types";

export interface PaymentIntentData {
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethod: "stripe" | "paystack";
  returnUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaymentConfirmData {
  paymentIntentId: string;
  paymentMethodId?: string; // For Stripe
  reference?: string; // For Paystack
}

export const paymentService = {
  // Create payment intent
  createPaymentIntent: async (
    data: PaymentIntentData
  ): Promise<{
    clientSecret?: string; // Stripe
    authorizationUrl?: string; // Paystack
    reference?: string; // Paystack
    paymentIntentId: string;
  }> => {
    const response = await apiClient.post<{
      clientSecret?: string;
      authorizationUrl?: string;
      reference?: string;
      paymentIntentId: string;
    }>("/payments/create-intent", data);
    return response.data;
  },

  // Confirm payment
  confirmPayment: async (data: PaymentConfirmData): Promise<Payment> => {
    const response = await apiClient.post<Payment>("/payments/confirm", data);
    return response.data;
  },

  // Get payment by ID
  getPayment: async (id: string): Promise<Payment> => {
    const response = await apiClient.get<Payment>(`/payments/${id}`);
    return response.data;
  },

  // Get user's payments
  getUserPayments: async (
    searchParams?: SearchParams
  ): Promise<PaginatedResponse<Payment>> => {
    const params = new URLSearchParams();

    if (searchParams) {
      Object.keys(searchParams).forEach((key) => {
        const value = searchParams[key as keyof SearchParams];
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString
      ? `/payments/my-payments?${queryString}`
      : "/payments/my-payments";

    const response = await apiClient.get<Payment[]>(url);
    return response as PaginatedResponse<Payment>;
  },

  // Get host's payments (earnings)
  getHostPayments: async (
    searchParams?: SearchParams
  ): Promise<PaginatedResponse<Payment>> => {
    const params = new URLSearchParams();

    if (searchParams) {
      Object.keys(searchParams).forEach((key) => {
        const value = searchParams[key as keyof SearchParams];
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString
      ? `/payments/host-earnings?${queryString}`
      : "/payments/host-earnings";

    const response = await apiClient.get<Payment[]>(url);
    return response as PaginatedResponse<Payment>;
  },

  // Request refund
  requestRefund: async (
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<Payment> => {
    const response = await apiClient.post<Payment>(
      `/payments/${paymentId}/refund`,
      {
        amount,
        reason,
      }
    );
    return response.data;
  },

  // Process refund (admin only)
  processRefund: async (
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<Payment> => {
    const response = await apiClient.post<Payment>(
      `/payments/${paymentId}/process-refund`,
      {
        amount,
        reason,
      }
    );
    return response.data;
  },

  // Get payment methods for user (saved cards, etc.)
  getPaymentMethods: async (): Promise<
    Array<{
      id: string;
      type: string;
      last4: string;
      brand: string;
      expiryMonth: number;
      expiryYear: number;
      isDefault: boolean;
    }>
  > => {
    const response = await apiClient.get<
      Array<{
        id: string;
        type: string;
        last4: string;
        brand: string;
        expiryMonth: number;
        expiryYear: number;
        isDefault: boolean;
      }>
    >("/payments/payment-methods");
    return response.data;
  },

  // Add payment method
  addPaymentMethod: async (paymentMethodId: string): Promise<void> => {
    await apiClient.post("/payments/payment-methods", {
      paymentMethodId,
    });
  },

  // Remove payment method
  removePaymentMethod: async (paymentMethodId: string): Promise<void> => {
    await apiClient.delete(`/payments/payment-methods/${paymentMethodId}`);
  },

  // Set default payment method
  setDefaultPaymentMethod: async (paymentMethodId: string): Promise<void> => {
    await apiClient.patch(
      `/payments/payment-methods/${paymentMethodId}/default`
    );
  },

  // Get payment statistics
  getPaymentStats: async (
    period = "30d"
  ): Promise<{
    totalRevenue: number;
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    refundedAmount: number;
    averagePaymentAmount: number;
    currency: string;
  }> => {
    const response = await apiClient.get<{
      totalRevenue: number;
      totalPayments: number;
      successfulPayments: number;
      failedPayments: number;
      refundedAmount: number;
      averagePaymentAmount: number;
      currency: string;
    }>(`/payments/stats?period=${period}`);
    return response.data;
  },

  // Verify payment status (for webhooks)
  verifyPayment: async (
    reference: string,
    provider: "stripe" | "paystack"
  ): Promise<{
    status: string;
    amount: number;
    currency: string;
    verified: boolean;
  }> => {
    const response = await apiClient.get<{
      status: string;
      amount: number;
      currency: string;
      verified: boolean;
    }>(`/payments/verify/${provider}/${reference}`);
    return response.data;
  },

  // Get all payments (admin only)
  getAllPayments: async (
    searchParams?: SearchParams
  ): Promise<PaginatedResponse<Payment>> => {
    const params = new URLSearchParams();

    if (searchParams) {
      Object.keys(searchParams).forEach((key) => {
        const value = searchParams[key as keyof SearchParams];
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/payments?${queryString}` : "/payments";

    const response = await apiClient.get<Payment[]>(url);
    return response as PaginatedResponse<Payment>;
  },

  // Get payment analytics for charts/graphs
  getPaymentAnalytics: async (
    period = "30d",
    groupBy: "day" | "week" | "month" = "day"
  ): Promise<
    Array<{
      period: string;
      revenue: number;
      payments: number;
      refunds: number;
    }>
  > => {
    const response = await apiClient.get<
      Array<{
        period: string;
        revenue: number;
        payments: number;
        refunds: number;
      }>
    >(`/payments/analytics?period=${period}&groupBy=${groupBy}`);
    return response.data;
  },
};
