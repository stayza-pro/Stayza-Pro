import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "react-query";
import { analyticsService } from "@/services/analytics";
import {
  PropertyAnalytics,
  AnalyticsTimeRange,
  OccupancyMetrics,
  RevenueMetrics,
  GuestAnalytics,
  ReviewMetrics,
  MarketAnalysis,
  BookingAnalytics,
  AnalyticsExportFormat,
} from "@/types/analytics";
import { toast } from "react-hot-toast";

// Hook for comprehensive property analytics
export const usePropertyAnalytics = (
  propertyId: string,
  timeRange: AnalyticsTimeRange
) => {
  return useQuery({
    queryKey: ["propertyAnalytics", propertyId, timeRange],
    queryFn: () =>
      analyticsService.getComprehensivePropertyAnalytics(propertyId, timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!propertyId,
    onError: (error) => {
      
      toast.error("Failed to load analytics data");
    },
  });
};

// Hook for occupancy analytics
export const useOccupancyAnalytics = (
  propertyId: string,
  timeRange: AnalyticsTimeRange
) => {
  return useQuery({
    queryKey: ["occupancyAnalytics", propertyId, timeRange],
    queryFn: () =>
      analyticsService.getOccupancyAnalytics(propertyId, timeRange),
    staleTime: 5 * 60 * 1000,
    enabled: !!propertyId,
  });
};

// Hook for revenue analytics
export const useRevenueAnalytics = (
  propertyId: string,
  timeRange: AnalyticsTimeRange
) => {
  return useQuery({
    queryKey: ["revenueAnalytics", propertyId, timeRange],
    queryFn: () => analyticsService.getRevenueAnalytics(propertyId, timeRange),
    staleTime: 5 * 60 * 1000,
    enabled: !!propertyId,
  });
};

// Hook for guest analytics
export const useGuestAnalytics = (
  propertyId: string,
  timeRange: AnalyticsTimeRange
) => {
  return useQuery({
    queryKey: ["guestAnalytics", propertyId, timeRange],
    queryFn: () => analyticsService.getGuestAnalytics(propertyId, timeRange),
    staleTime: 5 * 60 * 1000,
    enabled: !!propertyId,
  });
};

// Hook for review analytics
export const useReviewAnalytics = (
  propertyId: string,
  timeRange: AnalyticsTimeRange
) => {
  return useQuery({
    queryKey: ["reviewAnalytics", propertyId, timeRange],
    queryFn: () => analyticsService.getReviewAnalytics(propertyId, timeRange),
    staleTime: 5 * 60 * 1000,
    enabled: !!propertyId,
  });
};

// Hook for market analysis
export const useMarketAnalysis = (
  propertyId: string,
  timeRange: AnalyticsTimeRange
) => {
  return useQuery({
    queryKey: ["marketAnalysis", propertyId, timeRange],
    queryFn: () => analyticsService.getMarketAnalysis(propertyId, timeRange),
    staleTime: 15 * 60 * 1000, // Market data changes less frequently
    enabled: !!propertyId,
  });
};

// Hook for booking analytics
export const useBookingAnalytics = (
  propertyId: string,
  timeRange: AnalyticsTimeRange
) => {
  return useQuery({
    queryKey: ["bookingAnalytics", propertyId, timeRange],
    queryFn: () => analyticsService.getBookingAnalytics(propertyId, timeRange),
    staleTime: 5 * 60 * 1000,
    enabled: !!propertyId,
  });
};

// Hook for property comparison
export const usePropertyComparison = (
  propertyIds: string[],
  timeRange: AnalyticsTimeRange,
  metrics: string[] = ["occupancy", "revenue", "rating"]
) => {
  return useQuery({
    queryKey: [
      "propertyComparison",
      propertyIds.sort(),
      timeRange,
      metrics.sort(),
    ],
    queryFn: () =>
      analyticsService.compareProperties(propertyIds, timeRange, metrics),
    staleTime: 5 * 60 * 1000,
    enabled: propertyIds.length > 1,
  });
};

// Hook for analytics summary
export const useAnalyticsSummary = (propertyIds: string[]) => {
  return useQuery({
    queryKey: ["analyticsSummary", propertyIds.sort()],
    queryFn: () => analyticsService.getAnalyticsSummary(propertyIds),
    staleTime: 2 * 60 * 1000, // 2 minutes for dashboard summary
    enabled: propertyIds.length > 0,
  });
};

// Hook for industry benchmarks
export const useIndustryBenchmarks = (
  region?: string,
  propertyType?: string
) => {
  return useQuery({
    queryKey: ["industryBenchmarks", region, propertyType],
    queryFn: () => analyticsService.getIndustryBenchmarks(region, propertyType),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - benchmarks change slowly
    cacheTime: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Hook for analytics export functionality
export const useAnalyticsExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportAnalytics = useCallback(
    async (
      propertyId: string,
      timeRange: AnalyticsTimeRange,
      format: AnalyticsExportFormat = "pdf",
      sections: string[] = [
        "overview",
        "occupancy",
        "revenue",
        "guests",
        "reviews",
      ]
    ) => {
      setIsExporting(true);
      try {
        const blob = await analyticsService.exportComprehensiveAnalytics(
          propertyId,
          timeRange,
          format,
          sections
        );

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `analytics-${propertyId}-${
          timeRange.start.toISOString().split("T")[0]
        }.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success("Analytics report exported successfully");
      } catch (error) {
        
        toast.error("Failed to export analytics report");
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  return { exportAnalytics, isExporting };
};

// Hook for time range management
export const useAnalyticsTimeRange = (initialRange?: AnalyticsTimeRange) => {
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>(
    initialRange || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
      period: "day",
    }
  );

  const queryClient = useQueryClient();

  const updateTimeRange = useCallback(
    (newTimeRange: AnalyticsTimeRange) => {
      setTimeRange(newTimeRange);
      // Invalidate all analytics queries to refetch with new time range
      queryClient.invalidateQueries(["propertyAnalytics"]);
      queryClient.invalidateQueries(["occupancyAnalytics"]);
      queryClient.invalidateQueries(["revenueAnalytics"]);
      queryClient.invalidateQueries(["guestAnalytics"]);
      queryClient.invalidateQueries(["reviewAnalytics"]);
      queryClient.invalidateQueries(["marketAnalysis"]);
      queryClient.invalidateQueries(["bookingAnalytics"]);
      queryClient.invalidateQueries(["propertyComparison"]);
    },
    [queryClient]
  );

  // Predefined time range presets
  const presets = {
    last7Days: () => ({
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date(),
      period: "day" as const,
    }),
    last30Days: () => ({
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
      period: "day" as const,
    }),
    last90Days: () => ({
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      end: new Date(),
      period: "week" as const,
    }),
    lastYear: () => ({
      start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      end: new Date(),
      period: "month" as const,
    }),
    thisMonth: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end: now, period: "day" as const };
    },
    thisYear: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      return { start, end: now, period: "month" as const };
    },
  };

  return {
    timeRange,
    updateTimeRange,
    presets,
  };
};

// Hook for real-time analytics updates
export const useRealtimeAnalytics = (
  propertyId: string,
  enabled: boolean = false
) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !propertyId) return;

    // Set up periodic refresh for real-time data
    const interval = setInterval(() => {
      queryClient.invalidateQueries(["propertyAnalytics", propertyId]);
      queryClient.invalidateQueries(["occupancyAnalytics", propertyId]);
      queryClient.invalidateQueries(["revenueAnalytics", propertyId]);
      queryClient.invalidateQueries(["bookingAnalytics", propertyId]);
    }, 60 * 1000); // Refresh every minute

    return () => clearInterval(interval);
  }, [propertyId, enabled, queryClient]);
};

// Hook for analytics alerts and notifications
export const useAnalyticsAlerts = (propertyIds: string[]) => {
  const { data: summary } = useAnalyticsSummary(propertyIds);

  return {
    alerts: summary?.alerts || [],
    hasAlerts: (summary?.alerts || []).length > 0,
    criticalAlerts: (summary?.alerts || []).filter(
      (alert) => alert.type === "warning"
    ),
    infoAlerts: (summary?.alerts || []).filter(
      (alert) => alert.type === "info"
    ),
    successAlerts: (summary?.alerts || []).filter(
      (alert) => alert.type === "success"
    ),
  };
};
