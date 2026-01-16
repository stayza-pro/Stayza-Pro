import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";

/**
 * Hook to fetch all top-level statistics for the realtor dashboard
 * - Total revenue
 * - Active bookings
 * - Properties listed
 * - Guest satisfaction
 * - New bookings today
 * - Pending check-ins
 * - Messages waiting
 */

export interface RealtorStats {
  totalRevenue: number;
  revenueChange: { value: number; type: "increase" | "decrease" };
  activeBookings: number;
  bookingsChange: { value: number; type: "increase" | "decrease" };
  propertiesListed: number;
  propertiesChange: { value: number; type: "increase" | "decrease" };
  guestSatisfaction: number; // Rating out of 5
  satisfactionChange: { value: number; type: "increase" | "decrease" };
  todayStats: {
    newBookings: number;
    checkIns: number;
    messages: number;
  };
}

interface UseRealtorStatsReturn {
  data: RealtorStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRealtorStats(realtorId?: string): UseRealtorStatsReturn {
  const [data, setData] = useState<RealtorStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { accessToken, user } = useAuthStore();

  const fetchStats = useCallback(async () => {
    if (!accessToken || !user) {
      setIsLoading(false);
      setError("Not authenticated");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";

      const response = await fetch(`${baseUrl}/realtors/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setData({
          totalRevenue: result.data.totalRevenue || 0,
          revenueChange: result.data.revenueChange || {
            value: 0,
            type: "increase",
          },
          activeBookings: result.data.activeBookings || 0,
          bookingsChange: result.data.bookingsChange || {
            value: 0,
            type: "increase",
          },
          propertiesListed: result.data.propertiesCount || 0,
          propertiesChange: result.data.propertiesChange || {
            value: 0,
            type: "increase",
          },
          guestSatisfaction: result.data.averageRating || 0,
          satisfactionChange: result.data.ratingChange || {
            value: 0,
            type: "increase",
          },
          todayStats: {
            newBookings: result.data.todayBookings || 0,
            checkIns: result.data.todayCheckIns || 0,
            messages: result.data.unreadMessages || 0,
          },
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load statistics";
      setError(errorMessage);
      
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, user, realtorId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchStats,
  };
}
