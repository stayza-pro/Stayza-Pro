import { apiClient } from "./api";

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface AdminBooking {
  id: string;
  propertyId: string;
  guestId: string;
  checkInDate: string;
  checkOutDate: string;
  totalGuests: number;
  totalPrice: number;
  currency: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
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
  dateFrom?: string;
  dateTo?: string;
  realtorId?: string;
  guestId?: string;
  minAmount?: number;
  maxAmount?: number;
}

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
export type PaymentMethod = "PAYSTACK" | "FLUTTERWAVE";

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
    return response;
  } catch (error: any) {
    console.error("Error fetching admin bookings:", error);
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
    return response;
  } catch (error: any) {
    console.error("Error fetching booking stats:", error);
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
    console.error(`Error fetching booking ${id}:`, error);
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
    console.error(`Error updating booking ${id} status:`, error);
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
    console.error(`Error cancelling booking ${id}:`, error);
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
 */
export const formatBookingStatus = (status: BookingStatus): string => {
  const statusMap: Record<BookingStatus, string> = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    CANCELLED: "Cancelled",
    COMPLETED: "Completed",
  };
  return statusMap[status] || status;
};

/**
 * Get status color for UI display
 */
export const getBookingStatusColor = (status: BookingStatus): string => {
  const colorMap: Record<BookingStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    CANCELLED: "bg-red-100 text-red-800",
    COMPLETED: "bg-green-100 text-green-800",
  };
  return colorMap[status] || "bg-gray-100 text-gray-800";
};

/**
 * Format payment method for display
 */
export const formatPaymentMethod = (method: PaymentMethod): string => {
  const methodMap: Record<PaymentMethod, string> = {
    PAYSTACK: "Paystack",
    FLUTTERWAVE: "Flutterwave",
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
  return booking.status === "PENDING" || booking.status === "CONFIRMED";
};

/**
 * Format currency amount
 */
export const formatCurrency = (
  amount: number,
  currency: string = "NGN"
): string => {
  const currencySymbol = currency === "NGN" ? "₦" : currency;
  return `${currencySymbol}${amount.toLocaleString()}`;
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

  return parts.length > 0 ? parts.join(" • ") : "No filters applied";
};
