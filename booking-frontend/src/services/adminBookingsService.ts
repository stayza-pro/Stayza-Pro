import { apiClient } from "./api";
import { BookingStatus, PaymentStatus, PaymentMethod } from "@/types";
import {
  formatBookingStatus as formatBookingStatusUtil,
  getBookingStatusColor as getBookingStatusColorUtil,
} from "@/utils/bookingEnums";

// =====================================================
// TYPE DEFINITIONS
// =====================================================

// Additional types for BookingDetailsModal
export interface AdminBookingDetails {
  id: string;
  bookingReference: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  paidAmount: number;
  commissionAmount: number;
  guest: {
    id: string;
    name: string;
    email: string;
    phone: string;
    verified: boolean;
    totalBookings: number;
  };
  host: {
    id: string;
    name: string;
    email: string;
    phone: string;
    verified: boolean;
    totalProperties: number;
  };
  property: {
    id: string;
    title: string;
    address: string;
    type: string;
    images: string[];
  };
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  hasDisputes: boolean;
  disputeCount: number;
  lastActivity: string;
  notes: string[];
  tags: string[];
}

export interface BookingTimeline {
  id: string;
  timestamp: string;
  event: string;
  description: string;
  actor: string;
  details?: Record<string, any>;
}

export interface DisputeInfo {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

export interface AdminBooking {
  id: string;
  propertyId: string;
  guestId: string;
  bookingReference: string;
  checkInDate: string;
  checkOutDate: string;
  totalGuests: number;
  totalPrice: number;
  totalAmount: number; // Alias for totalPrice
  commissionAmount: number;
  currency: string;
  status: BookingStatus;
  hasDisputes: boolean;
  disputeCount: number;
  refundStatus?: "pending" | "completed" | "failed" | null;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;

  // Convenience getters for component compatibility
  guestName: string;
  guestEmail: string;
  propertyTitle: string;
  propertyLocation: string;

  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    country: string;
    pricePerNight: number;
    realtor: {
      id: string;
      businessName: string;
      user: {
        firstName: string;
        lastName: string;
        email: string;
      };
    };
  };
  guest: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  payment?: {
    id: string;
    amount: number;
    status: PaymentStatus;
    method: PaymentMethod;
    paidAt: string | null;
    refundAmount: number | null;
    refundedAt: string | null;
  };
  review?: {
    id: string;
    rating: number;
    comment: string;
  };
}

export interface BookingSearchFilters {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "checkInDate" | "totalPrice" | "status";
  sortOrder?: "asc" | "desc";
  status?: BookingStatus;
  search?: string;
  dateRange?: string;
  dateFrom?: string;
  dateTo?: string;
  realtorId?: string;
  guestId?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface BookingsResponse {
  success: boolean;
  data: {
    bookings: AdminBooking[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
      limit: number;
    };
  };
}

export interface BookingStatsResponse {
  success: boolean;
  data: {
    overview: {
      total: number;
      pending: number;
      confirmed: number;
      cancelled: number;
      completed: number;
      recent: number;
    };
    metrics: {
      totalRevenue: number;
      totalCommission?: number;
      averageBookingValue: number;
      conversionRate: number;
      cancellationRate: number;
    };
    period: {
      days: number;
      startDate: string;
      endDate: string;
    };
  };
}

export interface BookingDetailsResponse {
  success: boolean;
  data: {
    booking: AdminBooking & {
      property: AdminBooking["property"] & {
        images: Array<{ url: string; order: number }>;
      };
      notifications: Array<{
        id: string;
        type: string;
        title: string;
        message: string;
        createdAt: string;
      }>;
      refundRequests: Array<{
        id: string;
        reason: string;
        amount: number;
        status: string;
        createdAt: string;
      }>;
    };
  };
}

export interface UpdateBookingStatusRequest {
  status: BookingStatus;
  reason: string;
}

export interface CancelBookingRequest {
  reason: string;
  refundPercentage?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const toNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (value && typeof value === "object" && "toString" in value) {
    const parsed = Number((value as { toString: () => string }).toString());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

type AdminBookingPayload = Partial<
  Omit<
    AdminBooking,
    | "bookingReference"
    | "totalAmount"
    | "commissionAmount"
    | "guestName"
    | "guestEmail"
    | "propertyTitle"
    | "propertyLocation"
  >
> & {
  platformFee?: unknown;
  _count?: {
    disputes?: unknown;
  };
  disputes?: unknown[];
};

const normalizeAdminBooking = (booking: AdminBookingPayload): AdminBooking => {
  const bookingId = String(booking.id || "");
  const totalPrice = toNumber(booking.totalPrice);
  const paymentAmount = toNumber(booking.payment?.amount);
  const platformFeeFromBooking = toNumber(booking.platformFee);
  const platformFeeFromPayment = toNumber(
    (booking.payment as unknown as { platformFeeAmount?: unknown } | undefined)
      ?.platformFeeAmount
  );
  const refundAmount = toNumber(booking.payment?.refundAmount ?? 0);

  const disputeCount =
    Array.isArray(booking.disputes) && booking.disputes.length > 0
      ? booking.disputes.length
      : toNumber(booking._count?.disputes);

  const hasDisputes = disputeCount > 0;
  const refundStatus =
    refundAmount > 0
      ? booking.payment?.refundedAt
        ? "completed"
        : "pending"
      : null;

  const property = booking.property || {
    id: "",
    title: "",
    address: "",
    city: "",
    country: "",
    pricePerNight: 0,
    realtor: {
      id: "",
      businessName: "",
      user: {
        firstName: "",
        lastName: "",
        email: "",
      },
    },
  };

  const guest = booking.guest || {
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  };

  return {
    ...booking,
    property,
    guest,
    bookingReference: bookingId
      ? `BK-${bookingId.slice(-8).toUpperCase()}`
      : "BOOKING",
    totalPrice,
    totalAmount: paymentAmount > 0 ? paymentAmount : totalPrice,
    commissionAmount:
      platformFeeFromBooking > 0 ? platformFeeFromBooking : platformFeeFromPayment,
    hasDisputes,
    disputeCount,
    refundStatus,
    refundAmount: refundAmount > 0 ? refundAmount : undefined,
    guestName: `${guest.firstName || ""} ${guest.lastName || ""}`.trim(),
    guestEmail: guest.email || "",
    propertyTitle: property.title || "Property",
    propertyLocation: [property.city, property.country]
      .filter((part) => Boolean(part))
      .join(", "),
    status: (booking.status || "PENDING") as BookingStatus,
    currency: booking.currency || "NGN",
  } as AdminBooking;
};

// =====================================================
// ADMIN BOOKING SERVICE FUNCTIONS
// =====================================================

/**
 * Get all bookings with advanced filtering and search
 */
export const getAdminBookings = async (
  filters: BookingSearchFilters = {}
): Promise<BookingsResponse> => {
  try {
    const queryParams = new URLSearchParams();

    // Add all filters as query parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get<BookingsResponse["data"]>(
      `/admin/bookings?${queryParams.toString()}`
    );
    const rawBookings = Array.isArray(response.data.bookings)
      ? response.data.bookings
      : [];

    return {
      ...response,
      data: {
        ...response.data,
        bookings: rawBookings.map((booking) =>
          normalizeAdminBooking(booking as unknown as AdminBookingPayload)
        ),
      },
    };
  } catch (error: any) {
    
    throw new Error(
      error.response?.data?.message || "Failed to fetch bookings"
    );
  }
};

/**
 * Get booking statistics for dashboard
 */
export const getBookingStats = async (
  period: number = 30
): Promise<BookingStatsResponse> => {
  try {
    const response = await apiClient.get<BookingStatsResponse["data"]>(
      `/admin/bookings/stats?period=${period}`
    );
    return {
      ...response,
      data: {
        ...response.data,
        metrics: {
          ...response.data.metrics,
          totalRevenue: toNumber(response.data.metrics.totalRevenue),
          totalCommission: toNumber(response.data.metrics.totalCommission),
          averageBookingValue: toNumber(response.data.metrics.averageBookingValue),
          conversionRate: toNumber(response.data.metrics.conversionRate),
          cancellationRate: toNumber(response.data.metrics.cancellationRate),
        },
      },
    };
  } catch (error: any) {
    
    throw new Error(
      error.response?.data?.message || "Failed to fetch booking statistics"
    );
  }
};

/**
 * Get detailed booking information
 */
export const getBookingById = async (
  id: string
): Promise<BookingDetailsResponse> => {
  try {
    const response = await apiClient.get<BookingDetailsResponse["data"]>(
      `/admin/bookings/${id}`
    );
    return response;
  } catch (error: any) {
    
    throw new Error(
      error.response?.data?.message || "Failed to fetch booking details"
    );
  }
};

/**
 * Update booking status (admin override)
 */
export const updateBookingStatus = async (
  id: string,
  data: UpdateBookingStatusRequest
): Promise<ApiResponse<{ booking: AdminBooking }>> => {
  try {
    const response = await apiClient.put<{ booking: AdminBooking }>(
      `/admin/bookings/${id}/status`,
      data
    );
    return response;
  } catch (error: any) {
    
    throw new Error(
      error.response?.data?.message || "Failed to update booking status"
    );
  }
};

/**
 * Cancel booking with refund processing
 */
export const cancelBooking = async (
  id: string,
  data: CancelBookingRequest
): Promise<ApiResponse<{ booking: AdminBooking; refundAmount: number }>> => {
  try {
    const response = await apiClient.post<{
      booking: AdminBooking;
      refundAmount: number;
    }>(`/admin/bookings/${id}/cancel`, data);
    return response;
  } catch (error: any) {
    
    throw new Error(
      error.response?.data?.message || "Failed to cancel booking"
    );
  }
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Format booking status for display
 * Re-export centralized utility for backward compatibility
 */
export const formatBookingStatus = formatBookingStatusUtil;

/**
 * Get status color for UI display
 * Re-export centralized utility with backward-compatible format
 */
export const getBookingStatusColor = (status: BookingStatus): string => {
  const colors = getBookingStatusColorUtil(status);
  return `${colors.bg} ${colors.text}`;
};

/**
 * Format payment method for display
 */
export const formatPaymentMethod = (method: PaymentMethod): string => {
  const methodMap: Record<PaymentMethod, string> = {
    PAYSTACK: "Paystack",
  };
  return methodMap[method] || method;
};

/**
 * Calculate booking duration in days
 */
export const getBookingDuration = (
  checkIn: string,
  checkOut: string
): number => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

/**
 * Check if booking can be cancelled
 */
export const canCancelBooking = (booking: AdminBooking): boolean => {
  return booking.status !== "CANCELLED" && booking.status !== "COMPLETED";
};

/**
 * Check if booking is active (not cancelled or completed)
 */
export const isBookingActive = (booking: AdminBooking): boolean => {
  return booking.status === "PENDING" || booking.status === "ACTIVE";
};

/**
 * Format currency amount
 */
export const formatCurrency = (
  amount: number,
  currency: string = "NGN"
): string => {
  const currencyPrefix = currency === "NGN" ? "NGN " : `${currency} `;
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `${currencyPrefix}${safeAmount.toLocaleString("en-NG")}`;
};

/**
 * Get booking urgency level based on check-in date and status
 */
export const getBookingUrgency = (
  booking: AdminBooking
): "low" | "medium" | "high" => {
  const checkInDate = new Date(booking.checkInDate);
  const now = new Date();
  const daysUntilCheckIn = Math.ceil(
    (checkInDate.getTime() - now.getTime()) / (1000 * 3600 * 24)
  );

  if (booking.status === "PENDING") {
    if (daysUntilCheckIn <= 1) return "high";
    if (daysUntilCheckIn <= 3) return "medium";
  }

  return "low";
};

/**
 * Build filter summary text for display
 */
export const buildFilterSummary = (filters: BookingSearchFilters): string => {
  const parts: string[] = [];

  if (filters.status) {
    parts.push(`Status: ${formatBookingStatus(filters.status)}`);
  }

  if (filters.search) {
    parts.push(`Search: "${filters.search}"`);
  }

  if (filters.dateFrom || filters.dateTo) {
    const dateRange = [
      filters.dateFrom &&
        `from ${new Date(filters.dateFrom).toLocaleDateString()}`,
      filters.dateTo && `to ${new Date(filters.dateTo).toLocaleDateString()}`,
    ]
      .filter(Boolean)
      .join(" ");
    parts.push(`Date: ${dateRange}`);
  }

  if (filters.minAmount || filters.maxAmount) {
    const amountRange = [
      filters.minAmount && `min ${formatCurrency(filters.minAmount)}`,
      filters.maxAmount && `max ${formatCurrency(filters.maxAmount)}`,
    ]
      .filter(Boolean)
      .join(", ");
    parts.push(`Amount: ${amountRange}`);
  }

  return parts.length > 0 ? parts.join(" | ") : "No filters applied";
};
