import { LucideIcon } from "lucide-react";

// Base Analytics Types
export interface AnalyticsTimeRange {
  start: Date;
  end: Date;
  period: "day" | "week" | "month" | "quarter" | "year";
}

export interface AnalyticsMetric {
  value: number;
  change?: number; // Percentage change from previous period
  trend: "up" | "down" | "stable";
}

// Occupancy Analytics
export interface OccupancyData {
  date: string;
  occupancyRate: number; // 0-100 percentage
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
}

export interface OccupancyMetrics {
  currentOccupancy: AnalyticsMetric;
  averageOccupancy: AnalyticsMetric;
  peakOccupancy: AnalyticsMetric;
  lowOccupancy: AnalyticsMetric;
  occupancyTrend: OccupancyData[];
  seasonalTrends: {
    season: string;
    averageOccupancy: number;
    change: number;
  }[];
}

// Revenue Analytics
export interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
  averageRate: number;
  revPAR: number; // Revenue Per Available Room
}

export interface RevenueMetrics {
  totalRevenue: AnalyticsMetric;
  averageDailyRate: AnalyticsMetric;
  revPAR: AnalyticsMetric;
  revenueTrend: RevenueData[];
  revenueBySource: {
    source: string;
    revenue: number;
    percentage: number;
    change: number;
  }[];
  monthlyComparison: {
    month: string;
    revenue: number;
    change: number;
  }[];
}

// Guest Demographics
export interface GuestDemographic {
  ageGroup: string;
  percentage: number;
  count: number;
  averageStay: number;
  averageSpend: number;
}

export interface LocationData {
  country: string;
  city?: string;
  guestCount: number;
  percentage: number;
  averageSpend: number;
}

export interface GuestAnalytics {
  totalGuests: AnalyticsMetric;
  returningGuestRate: AnalyticsMetric;
  averageStayDuration: AnalyticsMetric;
  demographics: {
    age: GuestDemographic[];
    location: LocationData[];
    travelPurpose: {
      purpose: string;
      percentage: number;
      count: number;
    }[];
    groupSize: {
      size: string;
      percentage: number;
      count: number;
    }[];
  };
  guestSatisfaction: {
    rating: number;
    trend: "up" | "down" | "stable";
    reviewCount: number;
  };
}

// Review & Rating Analytics
export interface ReviewMetrics {
  averageRating: AnalyticsMetric;
  totalReviews: AnalyticsMetric;
  responseRate: AnalyticsMetric;
  ratingDistribution: {
    rating: number;
    count: number;
    percentage: number;
  }[];
  categoryRatings: {
    category: string;
    rating: number;
    change: number;
  }[];
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
    keywords: {
      word: string;
      frequency: number;
      sentiment: "positive" | "negative" | "neutral";
    }[];
  };
  competitorComparison: {
    property: string;
    rating: number;
    reviewCount: number;
  }[];
}

// Performance Comparison
export interface CompetitorData {
  name: string;
  occupancyRate: number;
  averageRate: number;
  rating: number;
  revPAR: number;
}

export interface MarketAnalysis {
  marketPosition: {
    rank: number;
    totalProperties: number;
    percentile: number;
  };
  competitorComparison: CompetitorData[];
  marketTrends: {
    metric: string;
    yourProperty: number;
    marketAverage: number;
    difference: number;
    trend: "up" | "down" | "stable";
  }[];
  opportunities: {
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
    effort: "high" | "medium" | "low";
  }[];
}

// Booking Analytics
export interface BookingPattern {
  dayOfWeek: string;
  bookingCount: number;
  revenue: number;
}

export interface BookingAnalytics {
  totalBookings: AnalyticsMetric;
  cancellationRate: AnalyticsMetric;
  leadTime: AnalyticsMetric; // Average days between booking and check-in
  bookingPatterns: {
    daily: BookingPattern[];
    seasonal: {
      season: string;
      bookings: number;
      revenue: number;
      change: number;
    }[];
    leadTimeDistribution: {
      range: string;
      count: number;
      percentage: number;
    }[];
  };
  channelPerformance: {
    channel: string;
    bookings: number;
    revenue: number;
    conversionRate: number;
    averageValue: number;
  }[];
}

// Combined Analytics Dashboard Data
export interface PropertyAnalytics {
  propertyId: string;
  propertyName: string;
  timeRange: AnalyticsTimeRange;
  occupancy: OccupancyMetrics;
  revenue: RevenueMetrics;
  guests: GuestAnalytics;
  reviews: ReviewMetrics;
  market: MarketAnalysis;
  bookings: BookingAnalytics;
  lastUpdated: Date;
}

// Analytics Dashboard Props
export interface AnalyticsDashboardProps {
  propertyId: string;
  initialTimeRange?: AnalyticsTimeRange;
  onTimeRangeChange?: (timeRange: AnalyticsTimeRange) => void;
}

// Analytics Card Props
export interface AnalyticsCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "stable";
  icon: LucideIcon;
  description?: string;
  loading?: boolean;
}

// Chart Data Types
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

export interface BarChartData {
  category: string;
  value: number;
  color?: string;
}

// Export utility types
export type AnalyticsFilterType = "property" | "dateRange" | "comparison";
export type AnalyticsViewType =
  | "overview"
  | "occupancy"
  | "revenue"
  | "guests"
  | "reviews"
  | "performance"
  | "alerts"
  | "market";
export type AnalyticsExportFormat = "pdf" | "excel" | "csv";
