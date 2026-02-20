import { apiClient } from "./api";
import { getCookie } from "@/utils/cookies";
import { Booking, Payment } from "../types";

export interface PaystackInitializationRequest {
  bookingId: string;
  originUrl?: string;
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
  booking?: Booking;
}

export interface VerifyByBookingRequest {
  bookingId: string;
}

export interface VerifyByBookingResponse {
  success: boolean;
  message: string;
  payment?: Payment;
  booking?: Booking;
}

export interface SavedPaymentMethod {
  methodId: string;
  brand?: string | null;
  bank?: string | null;
  last4?: string | null;
  expMonth?: string | null;
  expYear?: string | null;
  lastUsedAt?: string | Date;
}

export interface SavedMethodPaymentRequest {
  bookingId: string;
  methodId: string;
}

export interface SavedMethodPaymentResponse {
  success: boolean;
  message: string;
  payment?: Payment;
  booking?: Booking;
}

export type CheckoutEventType =
  | "CHECKOUT_PAGE_VIEWED"
  | "CHECKOUT_SUBMITTED"
  | "CHECKOUT_SUBMIT_FAILED"
  | "BOOKING_CREATED"
  | "PAYMENT_PAGE_VIEWED"
  | "PAYSTACK_POPUP_OPENED"
  | "PAYSTACK_CALLBACK_SUCCESS"
  | "PAYMENT_VERIFIED"
  | "PAYMENT_VERIFY_FAILED"
  | "SAVED_METHOD_PAYMENT_ATTEMPT"
  | "SAVED_METHOD_PAYMENT_SUCCESS"
  | "SAVED_METHOD_PAYMENT_FAILED";

export interface CheckoutEventPayload {
  event: CheckoutEventType;
  bookingId?: string;
  paymentId?: string;
  propertyId?: string;
  sessionId?: string;
  context?: Record<string, unknown>;
}

interface NormalizedPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PaymentsEnvelope {
  payments?: Payment[];
  data?: Payment[];
  pagination?: unknown;
}

interface PaymentEnvelope {
  payment?: Payment;
}

interface PaymentVerificationData {
  payment?: Payment;
  booking?: Booking;
}

interface PaymentVerificationEnvelope {
  success?: boolean;
  message?: string;
  data?: PaymentVerificationData;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const normalizePagination = (
  raw: unknown,
): NormalizedPagination | undefined => {
  if (!isRecord(raw)) {
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
  payload: unknown,
): { data: Payment[]; pagination?: NormalizedPagination } => {
  if (Array.isArray(payload)) {
    return { data: payload as Payment[] };
  }

  if (isRecord(payload)) {
    if (Array.isArray(payload.payments)) {
      return {
        data: payload.payments as Payment[],
        pagination: normalizePagination(payload.pagination),
      };
    }

    if (Array.isArray(payload.data)) {
      return {
        data: payload.data as Payment[],
        pagination: normalizePagination(payload.pagination),
      };
    }
  }

  return { data: [] };
};

export const paymentService = {
  // Initialize Paystack split payment for a booking
  initializePaystackPayment: async (
    data: PaystackInitializationRequest,
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

    if (!responseData) {
      throw new Error("Invalid response payload from payment API");
    }

    if (!responseData.authorizationUrl && !responseData.reference) {
      throw new Error(
        "Payment initialization did not return an authorization URL or reference",
      );
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
    data: PaystackVerificationRequest,
  ): Promise<PaystackVerificationResponse> => {
    // apiClient unwraps the backend response automatically
    // Backend: {success, message, data: {payment, booking}}
    // apiClient returns: {success, message, data: {payment, booking}}
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data?: PaymentVerificationData;
    }>("/payments/verify-paystack", data);

    const payload = (response.data || response) as PaymentVerificationEnvelope;

    return {
      success: payload.success ?? false,
      message: payload.message || "Payment verification completed",
      payment: payload.data?.payment,
      booking: payload.data?.booking,
    };
  },

  // Verify payment by booking ID
  // Use this when you have the bookingId but not the payment reference
  verifyPaymentByBooking: async (
    data: VerifyByBookingRequest,
  ): Promise<VerifyByBookingResponse> => {
    // apiClient returns res.data which contains { success, message, data }
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data?: PaymentVerificationData;
    }>("/payments/verify-by-booking", data);

    const payload = (response.data || response) as PaymentVerificationEnvelope;

    return {
      success: payload.success ?? false,
      message: payload.message || "Payment verification completed",
      payment: payload.data?.payment,
      booking: payload.data?.booking,
    };
  },

  getSavedMethods: async (): Promise<SavedPaymentMethod[]> => {
    const response = await apiClient.get<{
      savedMethods?: SavedPaymentMethod[];
    }>("/payments/saved-methods");

    const payload =
      (response?.data as { savedMethods?: SavedPaymentMethod[] } | undefined) ||
      {};

    return Array.isArray(payload.savedMethods) ? payload.savedMethods : [];
  },

  payWithSavedMethod: async (
    data: SavedMethodPaymentRequest,
  ): Promise<SavedMethodPaymentResponse> => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data?: PaymentVerificationData;
    }>("/payments/pay-with-saved-method", data);

    const nestedPayload = isRecord(response.data)
      ? (response.data as PaymentVerificationEnvelope)
      : undefined;

    return {
      success: response.success ?? nestedPayload?.success ?? false,
      message:
        response.message ||
        nestedPayload?.message ||
        "Payment request completed",
      payment: nestedPayload?.data?.payment,
      booking: nestedPayload?.data?.booking,
    };
  },

  trackCheckoutEvent: async (payload: CheckoutEventPayload): Promise<void> => {
    try {
      await apiClient.post<unknown, CheckoutEventPayload>(
        "/payments/checkout-event",
        payload,
      );
    } catch {
      // Intentionally silent - analytics should never block booking flow.
    }
  },

  // Fetch a single payment by id
  getPayment: async (id: string): Promise<Payment> => {
    const response = await apiClient.get<unknown>(`/payments/${id}`);
    const payload = response?.data;

    if (isRecord(payload) && "payment" in payload) {
      const paymentPayload = payload as PaymentEnvelope;
      if (paymentPayload.payment) {
        return paymentPayload.payment;
      }
    }

    return payload as Payment;
  },

  // Fetch current user's payments
  getUserPayments: async (): Promise<Payment[]> => {
    const response = await apiClient.get<unknown>("/payments");
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

    const response = await apiClient.get<PaymentsEnvelope>(url);
    const normalized = normalizePaymentsList(response?.data);

    return {
      data: normalized.data,
      pagination: normalized.pagination,
    };
  },

  // Request a refund for a payment
  requestRefund: async (
    paymentId: string,
    payload?: { amount?: number; reason?: string },
  ): Promise<Payment> => {
    const response = await apiClient.post<Payment>(
      `/payments/${paymentId}/refund`,
      payload,
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
      },
    );

    if (!res.ok) {
      throw new Error("Unable to download receipt");
    }

    return res.blob();
  },
};
