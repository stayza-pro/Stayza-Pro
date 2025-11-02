import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";

/**
 * Hook to fetch revenue analytics with time filtering
 * Supports: 7d, 30d, 90d, All time
 * Returns chart-friendly data arrays
 */

export interface RevenueDataPoint {
  date: string; // ISO date string
  revenue: number;
  bookings: number;
  label: string; // Formatted label for charts (e.g., "Jan 15")
}

export interface RevenueStats {
  totalRevenue: number;
  averageRevenue: number;
  peakRevenue: number;
  revenueChange: { value: number; type: "increase" | "decrease" };
  totalBookings: number;
  bookingsChange: { value: number; type: "increase" | "decrease" };
}

interface UseRevenueDataReturn {
  data: RevenueDataPoint[];
  stats: RevenueStats | null;
  isLoading: boolean;
  error: string | null;
  timeFilter: "7d" | "30d" | "90d" | "all";
  setTimeFilter: (filter: "7d" | "30d" | "90d" | "all") => void;
  refetch: () => Promise<void>;
}

export function useRevenueData(
  initialFilter: "7d" | "30d" | "90d" | "all" = "30d"
): UseRevenueDataReturn {
  const [data, setData] = useState<RevenueDataPoint[]>([]);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<"7d" | "30d" | "90d" | "all">(
    initialFilter
  );
  const { accessToken, user } = useAuthStore();

  const fetchRevenueData = useCallback(async () => {
    if (!accessToken || !user) {
      setIsLoading(false);
      setError("Not authenticated");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

      const response = await fetch(
        `${baseUrl}/api/realtors/revenue-analytics?period=${timeFilter}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch revenue data: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Transform chart data
        const chartData: RevenueDataPoint[] = (result.data.chartData || []).map(
          (point: any) => ({
            date: point.date,
            revenue: point.revenue || 0,
            bookings: point.bookings || 0,
            label: formatDateLabel(point.date, timeFilter),
          })
        );

        setData(chartData);

        // Calculate stats
        const revenues = chartData.map((d) => d.revenue);
        const totalRevenue = revenues.reduce((sum, val) => sum + val, 0);
        const averageRevenue =
          revenues.length > 0 ? totalRevenue / revenues.length : 0;
        const peakRevenue = revenues.length > 0 ? Math.max(...revenues) : 0;

        setStats({
          totalRevenue: result.data.totalRevenue || totalRevenue,
          averageRevenue,
          peakRevenue,
          revenueChange: result.data.periodChange || {
            value: 0,
            type: "increase",
          },
          totalBookings:
            chartData.reduce((sum, d) => sum + d.bookings, 0) ||
            result.data.totalBookings ||
            0,
          bookingsChange: result.data.bookingsChange || {
            value: 0,
            type: "increase",
          },
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load revenue data";
      setError(errorMessage);
      console.error("Error fetching revenue data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, user, timeFilter]);

  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);

  return {
    data,
    stats,
    isLoading,
    error,
    timeFilter,
    setTimeFilter,
    refetch: fetchRevenueData,
  };
}

/**
 * Format date label based on time filter
 */
function formatDateLabel(
  dateString: string,
  filter: "7d" | "30d" | "90d" | "all"
): string {
  const date = new Date(dateString);

  switch (filter) {
    case "7d":
      return date.toLocaleDateString("en-US", { weekday: "short" }); // Mon, Tue, etc.
    case "30d":
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }); // Jan 15
    case "90d":
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }); // Jan 15
    case "all":
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }); // Jan 2025
    default:
      return date.toLocaleDateString();
  }
}
