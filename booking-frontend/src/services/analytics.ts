import { apiClient } from "./api";
import { serviceUtils } from "./utils";
import {
  PropertyAnalytics as ComprehensivePropertyAnalytics,
  AnalyticsTimeRange,
  OccupancyMetrics,
  RevenueMetrics,
  GuestAnalytics,
  ReviewMetrics,
  MarketAnalysis,
  BookingAnalytics,
  AnalyticsExportFormat,
} from "@/types/analytics";

export interface AnalyticsOverview {
  users?: {
    total: number;
    growth: number;
  };
  realtors?: {
    total: number;
    active: number;
    pending: number;
    growth: number;
  };
  properties: {
    total: number;
    active: number;
    growth?: number;
  };
  bookings: {
    total: number;
    completed: number;
    pending?: number;
    cancelled?: number;
    growth: number;
  };
  revenue: {
    total: number;
    growth: number;
    average?: number;
  };
  performance: {
    averageRating: number;
    totalReviews: number;
    occupancyRate: number;
    conversionRate: number;
  };
}

export interface AnalyticsTrends {
  monthly: Array<{
    month: string;
    bookings: number;
    revenue: number;
    completed: number;
  }>;
}

export interface AnalyticsBreakdown {
  propertyTypes?: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  locations?: Array<{
    city: string;
    count: number;
  }>;
  bookingStatus?: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

export interface TopProperty {
  id: string;
  title: string;
  city: string;
  pricePerNight: number;
  bookings: number;
  reviews: number;
  averageRating: number;
  revenue: number;
}

export interface PlatformAnalytics {
  timeRange: string;
  overview: AnalyticsOverview;
  trends: AnalyticsTrends;
  breakdowns: AnalyticsBreakdown;
}

export interface RealtorAnalytics {
  timeRange: string;
  overview: AnalyticsOverview;
  trends: AnalyticsTrends;
  topProperties: TopProperty[];
}

export interface PropertyAnalytics {
  property: {
    id: string;
    title: string;
    pricePerNight: number;
  };
  timeRange: string;
  overview: {
    bookings: {
      total: number;
      completed: number;
      pending: number;
    };
    revenue: {
      total: number;
      average: number;
    };
    performance: {
      averageRating: number;
      totalReviews: number;
      occupancyRate: number;
      conversionRate: number;
    };
  };
  recentReviews: Array<{
    rating: number;
    comment: string;
    date: string;
    guestName: string;
  }>;
  bookingTrends: Array<{
    date: string;
    status: string;
    checkIn: string;
    checkOut: string;
    revenue: number;
  }>;
}

class AnalyticsService {
  /**
   * Get platform-wide analytics (Admin only)
   */
  async getPlatformAnalytics(
    timeRange: string = "30d"
  ): Promise<PlatformAnalytics> {
    const response = await apiClient.get(
      `/admin/analytics?timeRange=${timeRange}`
    );
    return (response.data as any).data;
  }

  /**
   * Get realtor-specific analytics
   */
  async getRealtorAnalytics(
    timeRange: string = "30d"
  ): Promise<RealtorAnalytics> {
    const response = await apiClient.get(
      `/realtors/analytics?timeRange=${timeRange}`
    );
    return (response.data as any).data;
  }

  /**
   * Get property-specific analytics
   */
  async getPropertyAnalytics(
    propertyId: string,
    timeRange: string = "30d"
  ): Promise<PropertyAnalytics> {
    const response = await apiClient.get(
      `/realtors/properties/${propertyId}/analytics?timeRange=${timeRange}`
    );
    return (response.data as any).data;
  }

  /**
   * Export analytics data as CSV
   */
  async exportAnalytics(
    type: "platform" | "realtor",
    timeRange: string = "30d"
  ): Promise<Blob> {
    const endpoint =
      type === "platform"
        ? "/admin/analytics/export"
        : "/realtors/analytics/export";
    const response = await apiClient.get(
      `${endpoint}?timeRange=${timeRange}&format=csv`,
      {
        responseType: "blob",
      }
    );
    return response.data as Blob;
  }

  // ===== COMPREHENSIVE ANALYTICS METHODS =====

  /**
   * Get comprehensive analytics for a property with detailed metrics
   */
  async getComprehensivePropertyAnalytics(
    propertyId: string,
    timeRange: AnalyticsTimeRange
  ): Promise<ComprehensivePropertyAnalytics> {
    const queryParams = {
      start: timeRange.start.toISOString(),
      end: timeRange.end.toISOString(),
      period: timeRange.period,
    };

    const queryString = serviceUtils.buildQueryString(queryParams);
    const url = `/analytics/properties/${propertyId}/comprehensive?${queryString}`;

    const response = await apiClient.get<ComprehensivePropertyAnalytics>(url);
    return response.data;
  }

  /**
   * Get occupancy analytics with seasonal trends and forecasting
   */
  async getOccupancyAnalytics(
    propertyId: string,
    timeRange: AnalyticsTimeRange
  ): Promise<OccupancyMetrics> {
    const queryParams = {
      start: timeRange.start.toISOString(),
      end: timeRange.end.toISOString(),
      period: timeRange.period,
    };

    const queryString = serviceUtils.buildQueryString(queryParams);
    const url = `/analytics/properties/${propertyId}/occupancy?${queryString}`;

    const response = await apiClient.get<OccupancyMetrics>(url);
    return response.data;
  }

  /**
   * Get detailed revenue analytics with RevPAR and rate optimization insights
   */
  async getRevenueAnalytics(
    propertyId: string,
    timeRange: AnalyticsTimeRange
  ): Promise<RevenueMetrics> {
    const queryParams = {
      start: timeRange.start.toISOString(),
      end: timeRange.end.toISOString(),
      period: timeRange.period,
    };

    const queryString = serviceUtils.buildQueryString(queryParams);
    const url = `/analytics/properties/${propertyId}/revenue?${queryString}`;

    const response = await apiClient.get<RevenueMetrics>(url);
    return response.data;
  }

  /**
   * Get guest demographics and behavior analytics
   */
  async getGuestAnalytics(
    propertyId: string,
    timeRange: AnalyticsTimeRange
  ): Promise<GuestAnalytics> {
    const queryParams = {
      start: timeRange.start.toISOString(),
      end: timeRange.end.toISOString(),
      period: timeRange.period,
    };

    const queryString = serviceUtils.buildQueryString(queryParams);
    const url = `/analytics/properties/${propertyId}/guests?${queryString}`;

    const response = await apiClient.get<GuestAnalytics>(url);
    return response.data;
  }

  /**
   * Get review analytics with sentiment analysis and competitor comparison
   */
  async getReviewAnalytics(
    propertyId: string,
    timeRange: AnalyticsTimeRange
  ): Promise<ReviewMetrics> {
    const queryParams = {
      start: timeRange.start.toISOString(),
      end: timeRange.end.toISOString(),
      period: timeRange.period,
    };

    const queryString = serviceUtils.buildQueryString(queryParams);
    const url = `/analytics/properties/${propertyId}/reviews?${queryString}`;

    const response = await apiClient.get<ReviewMetrics>(url);
    return response.data;
  }

  /**
   * Get market analysis and competitive positioning
   */
  async getMarketAnalysis(
    propertyId: string,
    timeRange: AnalyticsTimeRange
  ): Promise<MarketAnalysis> {
    const queryParams = {
      start: timeRange.start.toISOString(),
      end: timeRange.end.toISOString(),
      period: timeRange.period,
    };

    const queryString = serviceUtils.buildQueryString(queryParams);
    const url = `/analytics/properties/${propertyId}/market?${queryString}`;

    const response = await apiClient.get<MarketAnalysis>(url);
    return response.data;
  }

  /**
   * Get booking analytics with patterns and lead time analysis
   */
  async getBookingAnalytics(
    propertyId: string,
    timeRange: AnalyticsTimeRange
  ): Promise<BookingAnalytics> {
    const queryParams = {
      start: timeRange.start.toISOString(),
      end: timeRange.end.toISOString(),
      period: timeRange.period,
    };

    const queryString = serviceUtils.buildQueryString(queryParams);
    const url = `/analytics/properties/${propertyId}/bookings?${queryString}`;

    const response = await apiClient.get<BookingAnalytics>(url);
    return response.data;
  }

  /**
   * Compare multiple properties across key metrics
   */
  async compareProperties(
    propertyIds: string[],
    timeRange: AnalyticsTimeRange,
    metrics: string[] = ["occupancy", "revenue", "rating"]
  ): Promise<{
    properties: ComprehensivePropertyAnalytics[];
    comparison: {
      metric: string;
      properties: { propertyId: string; value: number; rank: number }[];
    }[];
  }> {
    const queryParams = {
      properties: propertyIds.join(","),
      metrics: metrics.join(","),
      start: timeRange.start.toISOString(),
      end: timeRange.end.toISOString(),
      period: timeRange.period,
    };

    const queryString = serviceUtils.buildQueryString(queryParams);
    const url = `/analytics/compare?${queryString}`;

    const response = await apiClient.get(url);
    return response.data as {
      properties: ComprehensivePropertyAnalytics[];
      comparison: {
        metric: string;
        properties: { propertyId: string; value: number; rank: number }[];
      }[];
    };
  }

  /**
   * Export comprehensive analytics in multiple formats
   */
  async exportComprehensiveAnalytics(
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
  ): Promise<Blob> {
    const queryParams = {
      start: timeRange.start.toISOString(),
      end: timeRange.end.toISOString(),
      period: timeRange.period,
      format,
      sections: sections.join(","),
    };

    const queryString = serviceUtils.buildQueryString(queryParams);
    const url = `/analytics/properties/${propertyId}/export?${queryString}`;

    const response = await apiClient.get(url, {
      responseType: "blob",
    });
    return response.data as Blob;
  }

  /**
   * Get analytics summary for multiple properties dashboard
   */
  async getAnalyticsSummary(propertyIds: string[]): Promise<{
    totalProperties: number;
    totalRevenue: number;
    averageOccupancy: number;
    averageRating: number;
    totalBookings: number;
    topPerforming: {
      propertyId: string;
      propertyName: string;
      metric: string;
      value: number;
    }[];
    alerts: {
      type: "warning" | "info" | "success";
      message: string;
      propertyId?: string;
    }[];
  }> {
    const queryParams = {
      properties: propertyIds.join(","),
    };

    const queryString = serviceUtils.buildQueryString(queryParams);
    const url = `/analytics/summary?${queryString}`;

    const response = await apiClient.get(url);
    return response.data as {
      totalProperties: number;
      totalRevenue: number;
      averageOccupancy: number;
      averageRating: number;
      totalBookings: number;
      topPerforming: {
        propertyId: string;
        propertyName: string;
        metric: string;
        value: number;
      }[];
      alerts: {
        type: "warning" | "info" | "success";
        message: string;
        propertyId?: string;
      }[];
    };
  }

  /**
   * Get industry benchmarks for competitive analysis
   */
  async getIndustryBenchmarks(
    region?: string,
    propertyType?: string
  ): Promise<{
    occupancyRate: { average: number; top25: number; top10: number };
    averageDailyRate: { average: number; top25: number; top10: number };
    revPAR: { average: number; top25: number; top10: number };
    guestSatisfaction: { average: number; top25: number; top10: number };
    lastUpdated: Date;
  }> {
    const queryParams = {
      ...(region && { region }),
      ...(propertyType && { propertyType }),
    };

    const queryString = serviceUtils.buildQueryString(queryParams);
    const url = queryString
      ? `/analytics/benchmarks?${queryString}`
      : `/analytics/benchmarks`;

    const response = await apiClient.get(url);
    return response.data as {
      occupancyRate: { average: number; top25: number; top10: number };
      averageDailyRate: { average: number; top25: number; top10: number };
      revPAR: { average: number; top25: number; top10: number };
      guestSatisfaction: { average: number; top25: number; top10: number };
      lastUpdated: Date;
    };
  }
}

export const analyticsService = new AnalyticsService();
