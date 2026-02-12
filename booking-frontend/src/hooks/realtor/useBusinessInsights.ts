import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";

/**
 * Hook to fetch business insights and performance metrics
 * - Top-performing property
 * - Average guest rating
 * - Occupancy rate
 * - Response time
 * - Performance badge data
 */

export interface TopProperty {
  id: string;
  title: string;
  image: string;
  revenue: number;
  bookings: number;
  occupancyRate: number;
  averageRating: number;
}

export interface BusinessInsights {
  topProperty: TopProperty | null;
  averageGuestRating: number;
  totalReviews: number;
  occupancyRate: number;
  averageResponseTime: number; // in hours
  responseTimeTarget: number; // in hours
  performanceBadge: {
    level: "bronze" | "silver" | "gold" | "platinum";
    score: number;
    nextLevel?: {
      name: string;
      requiredScore: number;
    };
  };
  trends: {
    revenueGrowth: { value: number; type: "increase" | "decrease" };
    bookingGrowth: { value: number; type: "increase" | "decrease" };
    ratingTrend: { value: number; type: "increase" | "decrease" };
  };
}

interface UseBusinessInsightsParams {
  timeRange?: "7d" | "30d" | "90d" | "1y";
  autoFetch?: boolean;
}

interface UseBusinessInsightsReturn {
  insights: BusinessInsights | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setTimeRange: (range: "7d" | "30d" | "90d" | "1y") => void;
}

export function useBusinessInsights(
  params: UseBusinessInsightsParams = {}
): UseBusinessInsightsReturn {
  const { timeRange = "30d", autoFetch = true } = params;
  const [insights, setInsights] = useState<BusinessInsights | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTimeRange, setCurrentTimeRange] = useState<
    "7d" | "30d" | "90d" | "1y"
  >(timeRange);
  const { accessToken, user } = useAuthStore();

  const fetchInsights = useCallback(async () => {
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

      const response = await fetch(
        `${baseUrl}/realtors/analytics?timeRange=${currentTimeRange}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch insights: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        const data = result.data;

        // Determine performance badge
        const performanceScore = calculatePerformanceScore(data);
        const performanceBadge = getPerformanceBadge(performanceScore);

        setInsights({
          topProperty: data.topProperties?.[0]
            ? {
                id: data.topProperties[0].id,
                title: data.topProperties[0].title,
                image:
                  data.topProperties[0].images?.[0] ||
                  "/images/stayza.png",
                revenue: data.topProperties[0].totalRevenue || 0,
                bookings: data.topProperties[0].totalBookings || 0,
                occupancyRate: data.topProperties[0].occupancyRate || 0,
                averageRating: data.topProperties[0].averageRating || 0,
              }
            : null,
          averageGuestRating: data.overview?.averageRating || 0,
          totalReviews: data.overview?.totalReviews || 0,
          occupancyRate: data.overview?.occupancyRate || 0,
          averageResponseTime: data.overview?.averageResponseTime || 0,
          responseTimeTarget: 24, // 24 hours target
          performanceBadge,
          trends: {
            revenueGrowth: data.trends?.revenueGrowth || {
              value: 0,
              type: "increase",
            },
            bookingGrowth: data.trends?.bookingGrowth || {
              value: 0,
              type: "increase",
            },
            ratingTrend: data.trends?.ratingTrend || {
              value: 0,
              type: "increase",
            },
          },
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load business insights";
      setError(errorMessage);
      
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, user, currentTimeRange]);

  useEffect(() => {
    if (autoFetch) {
      fetchInsights();
    }
  }, [fetchInsights, autoFetch]);

  const setTimeRange = useCallback((range: "7d" | "30d" | "90d" | "1y") => {
    setCurrentTimeRange(range);
  }, []);

  return {
    insights,
    isLoading,
    error,
    refetch: fetchInsights,
    setTimeRange,
  };
}

/**
 * Calculate performance score based on various metrics
 */
function calculatePerformanceScore(data: any): number {
  const ratingScore = (data.overview?.averageRating || 0) * 20; // Max 100
  const occupancyScore = data.overview?.occupancyRate || 0; // Already in %
  const responseTimeScore = Math.max(
    0,
    100 - (data.overview?.averageResponseTime || 0) * 4
  ); // Lower is better

  // Weighted average
  return ratingScore * 0.4 + occupancyScore * 0.4 + responseTimeScore * 0.2;
}

/**
 * Determine performance badge based on score
 */
function getPerformanceBadge(
  score: number
): BusinessInsights["performanceBadge"] {
  if (score >= 90) {
    return {
      level: "platinum",
      score,
    };
  } else if (score >= 75) {
    return {
      level: "gold",
      score,
      nextLevel: {
        name: "Platinum",
        requiredScore: 90,
      },
    };
  } else if (score >= 60) {
    return {
      level: "silver",
      score,
      nextLevel: {
        name: "Gold",
        requiredScore: 75,
      },
    };
  } else {
    return {
      level: "bronze",
      score,
      nextLevel: {
        name: "Silver",
        requiredScore: 60,
      },
    };
  }
}
