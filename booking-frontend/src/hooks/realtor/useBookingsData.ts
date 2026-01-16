import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { bookingService } from "@/services";
import type { Booking, BookingStatus } from "@/types";

/**
 * Hook to fetch bookings data with status filtering and pagination
 * Supports filtering by all booking statuses
 */

interface UseBookingsDataParams {
  status?: BookingStatus | "ALL";
  page?: number;
  limit?: number;
  autoFetch?: boolean;
}

interface UseBookingsDataReturn {
  bookings: Booking[];
  total: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setStatus: (status: BookingStatus | "ALL") => void;
  confirmBooking: (bookingId: string) => Promise<boolean>;
  cancelBooking: (bookingId: string, reason?: string) => Promise<boolean>;
}

export function useBookingsData(
  params: UseBookingsDataParams = {}
): UseBookingsDataReturn {
  const { status = "ALL", page = 1, limit = 20, autoFetch = true } = params;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(page);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [hasPrev, setHasPrev] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<BookingStatus | "ALL">(
    status
  );
  const { accessToken, user } = useAuthStore();

  const fetchBookings = useCallback(async () => {
    if (!accessToken || !user) {
      setIsLoading(false);
      setError("Not authenticated");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Build search params
      const searchParams = {
        page: currentPage,
        limit,
        ...(currentStatus !== "ALL" && { status: currentStatus }),
      };

      const response = await bookingService.getHostBookings(searchParams);

      if (response && response.data) {
        setBookings(response.data);
        setTotal(response.pagination?.totalItems || response.data.length);
        setTotalPages(response.pagination?.totalPages || 1);
        setHasNext(response.pagination?.hasNext || false);
        setHasPrev(response.pagination?.hasPrev || false);
      } else {
        setBookings([]);
        setTotal(0);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load bookings";
      setError(errorMessage);
      
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, user, currentStatus, currentPage, limit]);

  useEffect(() => {
    if (autoFetch) {
      fetchBookings();
    }
  }, [fetchBookings, autoFetch]);

  const setPage = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  const setStatus = useCallback((newStatus: BookingStatus | "ALL") => {
    setCurrentStatus(newStatus);
    setCurrentPage(1); // Reset to first page on status change
  }, []);

  const confirmBooking = useCallback(
    async (bookingId: string): Promise<boolean> => {
      try {
        await bookingService.updateBookingStatus(bookingId, "CONFIRMED");
        await fetchBookings(); // Refresh bookings after confirmation
        return true;
      } catch (err) {
        
        return false;
      }
    },
    [fetchBookings]
  );

  const cancelBooking = useCallback(
    async (bookingId: string, reason?: string): Promise<boolean> => {
      try {
        await bookingService.cancelBooking(bookingId, reason);
        await fetchBookings(); // Refresh bookings after cancellation
        return true;
      } catch (err) {
        
        return false;
      }
    },
    [fetchBookings]
  );

  return {
    bookings,
    total,
    currentPage,
    totalPages,
    hasNext,
    hasPrev,
    isLoading,
    error,
    refetch: fetchBookings,
    setPage,
    setStatus,
    confirmBooking,
    cancelBooking,
  };
}
