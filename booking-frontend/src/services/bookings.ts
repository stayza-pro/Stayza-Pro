import { apiClient, PaginatedResponse } from "./api";
import { Booking, BookingFormData, SearchParams } from "../types";

export const bookingService = {
  // Create new booking
  createBooking: async (data: BookingFormData): Promise<Booking> => {
    const response = await apiClient.post<Booking>("/bookings", {
      ...data,
      checkInDate: data.checkIn.toISOString().split("T")[0],
      checkOutDate: data.checkOut.toISOString().split("T")[0],
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

  // Get single booking
  getBooking: async (id: string): Promise<Booking> => {
    const response = await apiClient.get<Booking>(`/bookings/${id}`);
    return response.data;
  },

  // Update booking status (hosts only)
  updateBookingStatus: async (
    id: string,
    status: "CONFIRMED" | "CANCELLED"
  ): Promise<Booking> => {
    const response = await apiClient.patch<Booking>(`/bookings/${id}/status`, {
      status,
    });
    return response.data;
  },

  // Cancel booking (guests can cancel within refund period)
  cancelBooking: async (id: string, reason?: string): Promise<Booking> => {
    const response = await apiClient.patch<Booking>(`/bookings/${id}/cancel`, {
      reason,
    });
    return response.data;
  },

  // Request refund for booking
  requestRefund: async (id: string, reason: string): Promise<Booking> => {
    const response = await apiClient.post<Booking>(`/bookings/${id}/refund`, {
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
    taxes: number;
    fees: number;
    total: number;
    currency: string;
    nights: number;
  }> => {
    const response = await apiClient.post<{
      subtotal: number;
      taxes: number;
      fees: number;
      total: number;
      currency: string;
      nights: number;
    }>("/bookings/calculate", {
      propertyId,
      checkInDate: checkInDate.toISOString().split("T")[0],
      checkOutDate: checkOutDate.toISOString().split("T")[0],
      guests,
    });
    return response.data;
  },
};
