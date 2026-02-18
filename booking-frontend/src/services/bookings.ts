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

export interface BookingModificationOptions {
  oldNights: number;
  newNights: number;
  pricePerNight: number;
  oldSubtotal: number;
  newSubtotal: number;
  difference: number;
  requiresPayment: boolean;
  refundAmount: number;
}

export interface BookingModifyPayload {
  newCheckInDate?: string;
  newCheckOutDate?: string;
  newGuestCount?: number;
  reason?: string;
}

export interface BookingModifyResult {
  priceDifference: number;
  requiresPayment: boolean;
  refundAmount: number;
}

export interface BookingExtensionResult {
  newCheckOutDate: string;
  additionalCost: number;
  paymentReference: string;
  booking: Booking;
}

export type RoomFeeDisputeCategory =
  | "SAFETY_UNINHABITABLE"
  | "MAJOR_MISREPRESENTATION"
  | "MISSING_AMENITIES_CLEANLINESS"
  | "MINOR_INCONVENIENCE";

export type DepositDisputeCategory =
  | "PROPERTY_DAMAGE"
  | "MISSING_ITEMS"
  | "CLEANING_REQUIRED"
  | "OTHER_DEPOSIT_CLAIM";

export interface OpenDisputeResult {
  message?: string;
  dispute?: {
    id: string;
    status: string;
  };
}

export interface BookingDisputeWindows {
  bookingId: string;
  status: string;
  guestDisputeWindow: {
    deadline: string;
    expired: boolean;
    opened: boolean;
    canOpen: boolean;
  } | null;
  realtorDisputeWindow: {
    deadline: string;
    expired: boolean;
    opened: boolean;
    canOpen: boolean;
  } | null;
}

export interface PropertyCalendarDay {
  date: string;
  available: boolean;
  status?: string;
}

export interface PropertyAvailabilityCalendar {
  propertyId: string;
  propertyName: string;
  calendar: PropertyCalendarDay[];
}

export interface BlockDatesPayload {
  startDate: string;
  endDate: string;
  reason: string;
}

export interface BlockedDateBooking {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  status: string;
}

export interface PropertyBlockedBooking extends BlockedDateBooking {
  propertyId?: string;
  specialRequests?: string | null;
  reason?: string | null;
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
    searchParams?: SearchParams,
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
    searchParams?: SearchParams,
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
    searchParams?: SearchParams,
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

  getModificationOptions: async (
    id: string,
    newCheckInDate: string,
    newCheckOutDate: string,
  ): Promise<BookingModificationOptions> => {
    const params = new URLSearchParams({
      newCheckIn: newCheckInDate,
      newCheckOut: newCheckOutDate,
    });
    const response = await apiClient.get<BookingModificationOptions | { data: BookingModificationOptions }>(
      `/bookings/${id}/modification-options?${params.toString()}`,
    );
    return ((response as any)?.data || response) as BookingModificationOptions;
  },

  modifyBooking: async (
    id: string,
    payload: BookingModifyPayload,
  ): Promise<BookingModifyResult> => {
    const response = await apiClient.post<
      BookingModifyResult | { data: BookingModifyResult }
    >(`/bookings/${id}/modify`, payload);
    return ((response as any)?.data || response) as BookingModifyResult;
  },

  extendBooking: async (
    id: string,
    additionalNights: number,
  ): Promise<BookingExtensionResult> => {
    const response = await apiClient.post<
      BookingExtensionResult | { data: BookingExtensionResult }
    >(`/bookings/${id}/extend`, { additionalNights });
    return ((response as any)?.data || response) as BookingExtensionResult;
  },

  getDisputeWindows: async (id: string): Promise<BookingDisputeWindows> => {
    const response = await apiClient.get<
      BookingDisputeWindows | { data: BookingDisputeWindows }
    >(`/bookings/${id}/dispute-windows`);
    return ((response as any)?.data || response) as BookingDisputeWindows;
  },

  openRoomFeeDispute: async (
    bookingId: string,
    category: RoomFeeDisputeCategory,
    writeup: string,
    attachments: string[] = [],
  ): Promise<OpenDisputeResult> => {
    const response = await apiClient.post<
      OpenDisputeResult | { data: OpenDisputeResult }
    >("/disputes/room-fee", {
      bookingId,
      category,
      writeup,
      attachments,
    });
    return ((response as any)?.data || response) as OpenDisputeResult;
  },

  openDepositDispute: async (
    bookingId: string,
    category: DepositDisputeCategory,
    claimedAmount: number,
    writeup: string,
    attachments: string[] = [],
  ): Promise<OpenDisputeResult> => {
    const response = await apiClient.post<
      OpenDisputeResult | { data: OpenDisputeResult }
    >("/disputes/deposit", {
      bookingId,
      category,
      claimedAmount,
      writeup,
      attachments,
    });
    return ((response as any)?.data || response) as OpenDisputeResult;
  },

  verifyBookingArtifact: async (
    code: string,
  ): Promise<VerifiedBookingArtifact> => {
    const response = await apiClient.get<VerifiedBookingArtifact>(
      `/bookings/verify-artifact/${encodeURIComponent(code)}`,
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
    status: BookingStatus,
  ): Promise<Booking> => {
    const response = await apiClient.put<Booking>(`/bookings/${id}/status`, {
      status,
    });
    return response.data;
  },

  // Cancel booking (guests can cancel within refund period)
  cancelBooking: async (
    id: string,
    reason?: string,
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
    id: string,
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
    reason: string,
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
    checkOutDate: Date,
  ): Promise<{ available: boolean; conflicts?: string[] }> => {
    const query = new URLSearchParams({
      checkIn: checkInDate.toISOString().split("T")[0],
      checkOut: checkOutDate.toISOString().split("T")[0],
    }).toString();

    const response = await apiClient.get<{
      available: boolean;
      conflicts?: string[];
    }>(`/bookings/availability/${propertyId}?${query}`);
    return response.data;
  },

  // Get booking calendar for property (hosts only)
  getPropertyCalendar: async (
    propertyId: string,
    months = 6,
  ): Promise<PropertyAvailabilityCalendar> => {
    const safeMonths = Number.isFinite(months)
      ? Math.max(1, Math.min(12, Math.floor(months)))
      : 6;

    const response = await apiClient.get<
      PropertyAvailabilityCalendar | { data: PropertyAvailabilityCalendar }
    >(
      `/bookings/properties/${propertyId}/calendar?format=json&months=${safeMonths}`,
    );
    return ((response as any)?.data || response) as PropertyAvailabilityCalendar;
  },

  blockDates: async (
    propertyId: string,
    payload: BlockDatesPayload,
  ): Promise<BlockedDateBooking> => {
    const response = await apiClient.post<
      { blockedBooking: BlockedDateBooking } | { data: { blockedBooking: BlockedDateBooking } }
    >(`/bookings/properties/${propertyId}/block-dates`, payload);
    const data = (response as any)?.data || response;
    return (data?.blockedBooking || data?.data?.blockedBooking) as BlockedDateBooking;
  },

  unblockDates: async (
    blockedBookingId: string,
    reason = "Dates unblocked by host",
  ): Promise<void> => {
    await apiClient.put(`/bookings/${blockedBookingId}/cancel`, { reason });
  },

  getPropertyBlockedBookings: async (
    propertyId: string,
    limit = 250,
  ): Promise<PropertyBlockedBooking[]> => {
    const response = await apiClient.get<Booking[] | { data: Booking[] }>(
      `/bookings/realtor-bookings?propertyId=${encodeURIComponent(
        propertyId,
      )}&status=ACTIVE&page=1&limit=${Math.max(50, Math.min(limit, 500))}&sortBy=checkInDate&sortOrder=asc`,
    );

    const payload = (response as any)?.data || response;
    const bookings: Booking[] = Array.isArray(payload)
      ? (payload as Booking[])
      : Array.isArray((payload as any)?.data)
        ? ((payload as any).data as Booking[])
        : [];

    return bookings
      .filter((booking) => {
        const specialRequests =
          typeof booking?.specialRequests === "string"
            ? booking.specialRequests
            : "";
        return (
          specialRequests.includes("[SYSTEM_BLOCKED_DATES]") ||
          specialRequests.includes("SYSTEM:BLOCKED_DATES")
        );
      })
      .map((booking) => {
        const specialRequests =
          typeof booking?.specialRequests === "string"
            ? booking.specialRequests
            : null;
        const reason = specialRequests
          ? specialRequests
              .replace("[SYSTEM_BLOCKED_DATES]", "")
              .replace("SYSTEM:BLOCKED_DATES", "")
              .trim() || null
          : null;

        return {
          id: booking.id,
          propertyId: booking.propertyId,
          checkInDate: String(booking.checkInDate),
          checkOutDate: String(booking.checkOutDate),
          status: booking.status,
          specialRequests,
          reason,
        } as PropertyBlockedBooking;
      });
  },

  // Get booking statistics (for dashboards)
  getBookingStats: async (
    period = "30d",
  ): Promise<{
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
    averageBookingValue: number;
  }> => {
    try {
      const response = await apiClient.get<{
        totalBookings: number;
        completedBookings: number;
        cancelledBookings: number;
        totalRevenue: number;
        averageBookingValue: number;
      }>(`/bookings/stats?period=${period}`);
      return response.data;
    } catch {
      return {
        totalBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        totalRevenue: 0,
        averageBookingValue: 0,
      };
    }
  },

  // Get all bookings (admin only)
  getAllBookings: async (
    searchParams?: SearchParams,
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
    guests: number,
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
    id: string,
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
    id: string,
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
