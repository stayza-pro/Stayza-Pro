import { apiClient, PaginatedResponse } from "./api";
import {
  Booking,
  BookingFormData,
  BookingStatus,
  SearchParams,
} from "../types";

export interface VerifiedBookingArtifact {
  verified: boolean;
  code: string;
  booking: {
    id: string;
    status: string;
    paymentStatus: string | null;
    checkInDate: string;
    checkOutDate: string;
    guestName: string;
    property: {
      id: string;
      title: string;
      city: string;
      state: string;
    };
  };
  message?: string;
}

export const bookingService = {
  // Create new booking
  createBooking: async (data: BookingFormData): Promise<Booking> => {
    const response = await apiClient.post<Booking>("/bookings", {
      propertyId: data.propertyId,
      checkInDate: data.checkIn.toISOString().split("T")[0],
      checkOutDate: data.checkOut.toISOString().split("T")[0],
      totalGuests: data.guests, // Backend expects totalGuests, not guests
      specialRequests: data.specialRequests,
    });
    return response.data;
  },

  // Get user's bookings
  getUserBookings: async (
    searchParams?: SearchParams
  ): Promise<PaginatedResponse<Booking>> => {
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
      ? `/bookings/my-bookings?${queryString}`
      : "/bookings/my-bookings";

    const response = await apiClient.get<Booking[]>(url);
    return response as PaginatedResponse<Booking>;
  },

  // Get host's bookings
  getHostBookings: async (
    searchParams?: SearchParams
  ): Promise<PaginatedResponse<Booking>> => {
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
      ? `/bookings/realtor-bookings?${queryString}`
      : "/bookings/realtor-bookings";

    const response = await apiClient.get<Booking[]>(url);
    return response as PaginatedResponse<Booking>;
  },

  // Get realtor's bookings (alias for getHostBookings)
  getRealtorBookings: async (
    searchParams?: SearchParams
  ): Promise<Booking[]> => {
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
      ? `/bookings/realtor-bookings?${queryString}`
      : "/bookings/realtor-bookings";

    const response = await apiClient.get<Booking[]>(url);
    return response.data || [];
  },

  // Get single booking
  getBooking: async (id: string): Promise<Booking> => {
    const response = await apiClient.get<Booking>(`/bookings/${id}`);
    return response.data;
  },

  verifyBookingArtifact: async (
    code: string
  ): Promise<VerifiedBookingArtifact> => {
    const response = await apiClient.get<VerifiedBookingArtifact>(
      `/bookings/verify-artifact/${encodeURIComponent(code)}`
    );

    return {
      ...response.data,
      message: response.message,
    };
  },

  // Get single realtor booking
  getRealtorBooking: async (id: string): Promise<Booking> => {
    const response = await apiClient.get<Booking>(`/bookings/${id}`);
    return response.data;
  },

  // Update booking status (hosts only)
  updateBookingStatus: async (
    id: string,
    status: BookingStatus
  ): Promise<Booking> => {
    const response = await apiClient.put<Booking>(`/bookings/${id}/status`, {
      status,
    });
    return response.data;
  },

  // Cancel booking (guests can cancel within refund period)
  cancelBooking: async (
    id: string,
    reason?: string
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      booking: Booking;
      refund: any;
      refundRequest: any;
      cancellation: any;
    };
  }> => {
    const response = await apiClient.put<{
      success: boolean;
      message: string;
      data: {
        booking: Booking;
        refund: any;
        refundRequest: any;
        cancellation: any;
      };
    }>(`/bookings/${id}/cancel`, {
      reason,
    });
    // Backend returns data directly without nested ApiResponse wrapper
    return response as any;
  },

  // Preview cancellation refund before confirming
  previewCancellation: async (
    id: string
  ): Promise<{
    canCancel: boolean;
    reason?: string;
    refundInfo?: {
      tier: "EARLY" | "MEDIUM" | "LATE" | "NONE";
      customerRefund: number;
      realtorPayout: number;
      platformFee: number;
      breakdown: {
        customerPercent: number;
        realtorPercent: number;
        platformPercent: number;
      };
      hoursUntilCheckIn: number;
      totalAmount: number;
      currency: string;
    };
    bookingDetails?: {
      id: string;
      propertyTitle: string;
      checkInDate: string;
      checkOutDate: string;
      status: string;
      paymentStatus: string;
    };
  }> => {
    const response = await apiClient.get<{
      canCancel: boolean;
      reason?: string;
      refundInfo?: {
        tier: "EARLY" | "MEDIUM" | "LATE" | "NONE";
        hoursUntilCheckIn: number;
        roomFee: {
          total: number;
          customerRefund: number;
          realtorPortion: number;
          platformPortion: number;
          percentages: {
            customer: number;
            realtor: number;
            platform: number;
          };
        };
        securityDeposit: {
          total: number;
          customerRefund: number;
          note: string;
        };
        serviceFee: {
          total: number;
          platformPortion: number;
          note: string;
        };
        cleaningFee: {
          total: number;
          realtorPortion: number;
          note: string;
        };
        totals: {
          customerRefund: number;
          realtorPortion: number;
          platformPortion: number;
        };
        currency: string;
        reason: string;
        warning?: string | null;
      };
      bookingDetails?: {
        id: string;
        propertyTitle: string;
        checkInDate: string;
        checkOutDate: string;
        status: string;
        paymentStatus: string;
      };
    }>(`/bookings/${id}/cancel-preview`);
    // Backend returns data directly without ApiResponse wrapper
    return response as any;
  },

  // Request refund for booking
  requestRefund: async (
    id: string,
    amount: number,
    reason: string
  ): Promise<Booking> => {
    const response = await apiClient.post<Booking>(`/bookings/${id}/refund`, {
      amount,
      reason,
    });
    return response.data;
  },

  // Check booking availability
  checkAvailability: async (
    propertyId: string,
    checkInDate: Date,
    checkOutDate: Date
  ): Promise<{ available: boolean; conflicts?: string[] }> => {
    const response = await apiClient.post<{
      available: boolean;
      conflicts?: string[];
    }>("/bookings/check-availability", {
      propertyId,
      checkInDate: checkInDate.toISOString().split("T")[0],
      checkOutDate: checkOutDate.toISOString().split("T")[0],
    });
    return response.data;
  },

  // Get booking calendar for property (hosts only)
  getPropertyCalendar: async (
    propertyId: string,
    month: string,
    year: string
  ): Promise<{
    bookings: Array<{
      id: string;
      checkInDate: string;
      checkOutDate: string;
      guestName: string;
      status: string;
    }>;
    unavailableDates: string[];
  }> => {
    const response = await apiClient.get<{
      bookings: Array<{
        id: string;
        checkInDate: string;
        checkOutDate: string;
        guestName: string;
        status: string;
      }>;
      unavailableDates: string[];
    }>(`/bookings/calendar/${propertyId}?month=${month}&year=${year}`);
    return response.data;
  },

  // Get booking statistics (for dashboards)
  getBookingStats: async (
    period = "30d"
  ): Promise<{
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
    averageBookingValue: number;
  }> => {
    const response = await apiClient.get<{
      totalBookings: number;
      completedBookings: number;
      cancelledBookings: number;
      totalRevenue: number;
      averageBookingValue: number;
    }>(`/bookings/stats?period=${period}`);
    return response.data;
  },

  // Get all bookings (admin only)
  getAllBookings: async (
    searchParams?: SearchParams
  ): Promise<PaginatedResponse<Booking>> => {
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
    const url = queryString ? `/bookings?${queryString}` : "/bookings";

    const response = await apiClient.get<Booking[]>(url);
    return response as PaginatedResponse<Booking>;
  },

  // Calculate booking total
  calculateBookingTotal: async (
    propertyId: string,
    checkInDate: Date,
    checkOutDate: Date,
    guests: number
  ): Promise<{
    subtotal: number;
    serviceFee: number;
    cleaningFee: number;
    securityDeposit: number;
    taxes: number;
    fees: number;
    total: number;
    currency: string;
    nights: number;
    serviceFeeBreakdown?: {
      total: number;
      stayza: number;
      processing: number;
      processingMode: string;
      stayzaCapApplied?: boolean;
      processingCapApplied?: boolean;
    };
    realtorPreview?: {
      baseRate: number;
      volumeReduction: number;
      effectiveRate: number;
      commissionAmount: number;
      estimatedNetPayout: number;
    };
    monthlyVolumeProgress?: {
      current: number;
      nextThreshold: number | null;
      nextReduction: number | null;
    };
  }> => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: {
        subtotal: number;
        serviceFee: number;
        cleaningFee: number;
        securityDeposit: number;
        taxes: number;
        fees: number;
        total: number;
        currency: string;
        nights: number;
        serviceFeeBreakdown?: {
          total: number;
          stayza: number;
          processing: number;
          processingMode: string;
          stayzaCapApplied?: boolean;
          processingCapApplied?: boolean;
        };
        realtorPreview?: {
          baseRate: number;
          volumeReduction: number;
          effectiveRate: number;
          commissionAmount: number;
          estimatedNetPayout: number;
        };
        monthlyVolumeProgress?: {
          current: number;
          nextThreshold: number | null;
          nextReduction: number | null;
        };
        breakdown?: {
          pricePerNight: number;
          serviceFee: number;
          cleaningFee: number;
          securityDeposit: number;
          platformCommission: number;
          realtorPayout: number;
        };
      };
    }>("/bookings/calculate", {
      propertyId,
      checkInDate: checkInDate.toISOString().split("T")[0],
      checkOutDate: checkOutDate.toISOString().split("T")[0],
      guests,
    });

    
    

    // API returns data directly in response.data (already unwrapped by axios)
    // Backend structure: { success, message, data: {...} }
    // But axios already extracts response.data, so we access .data directly
    const result = (response.data as any).data || response.data;
    

    return result;
  },

  // Check-in to booking
  checkIn: async (
    id: string
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      bookingId: string;
      checkinConfirmedAt: string;
      confirmationType: "GUEST_CONFIRMED" | "REALTOR_CONFIRMED";
      disputeWindowClosesAt: string;
      roomFeeReleaseEligibleAt: string;
      disputeWindowDuration: string;
    };
  }> => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: {
        bookingId: string;
        checkinConfirmedAt: string;
        confirmationType: "GUEST_CONFIRMED" | "REALTOR_CONFIRMED";
        disputeWindowClosesAt: string;
        roomFeeReleaseEligibleAt: string;
        disputeWindowDuration: string;
      };
    }>(`/bookings/${id}/confirm-checkin`);
    return response.data;
  },

  // Check-out from booking
  checkOut: async (
    id: string
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      bookingId: string;
      checkOutTime: string;
      depositRefundEligibleAt: string;
      realtorDisputeWindowDuration: string;
      depositAmount: number;
    };
  }> => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: {
        bookingId: string;
        checkOutTime: string;
        depositRefundEligibleAt: string;
        realtorDisputeWindowDuration: string;
        depositAmount: number;
      };
    }>(`/bookings/${id}/checkout`);
    return response.data;
  },
};
