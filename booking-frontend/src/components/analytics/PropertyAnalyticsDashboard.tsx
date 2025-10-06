"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  Users,
  DollarSign,
  Star,
  Home,
  Filter,
  RefreshCw,
  AlertCircle,
  Info,
  CheckCircle,
} from "lucide-react";
import {
  usePropertyAnalytics,
  useAnalyticsTimeRange,
  useAnalyticsExport,
} from "@/hooks/analytics/useAnalytics";
import { AnalyticsTimeRange, AnalyticsViewType } from "@/types/analytics";
import { AnalyticsOverview } from "./AnalyticsOverview";
import { PerformanceMetrics } from "./PerformanceMetrics";
import { AlertsPanel } from "./AlertsPanel";

interface PropertyAnalyticsDashboardProps {
  propertyId: string;
  propertyName: string;
  className?: string;
}

const viewTabs: {
  id: AnalyticsViewType;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "occupancy", label: "Occupancy", icon: Home },
  { id: "revenue", label: "Revenue", icon: DollarSign },
  { id: "guests", label: "Guests", icon: Users },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "performance", label: "Performance", icon: CheckCircle },
  { id: "alerts", label: "Alerts", icon: AlertCircle },
  { id: "market", label: "Market", icon: TrendingUp },
];

export const PropertyAnalyticsDashboard: React.FC<
  PropertyAnalyticsDashboardProps
> = ({ propertyId, propertyName, className }) => {
  const [activeView, setActiveView] = useState<AnalyticsViewType>("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { timeRange, updateTimeRange, presets } = useAnalyticsTimeRange();
  const { exportAnalytics, isExporting } = useAnalyticsExport();

  const {
    data: analytics,
    isLoading,
    error,
    refetch,
  } = usePropertyAnalytics(propertyId, timeRange);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleExport = async () => {
    await exportAnalytics(propertyId, timeRange, "pdf", [
      "overview",
      "occupancy",
      "revenue",
      "guests",
      "reviews",
      "market",
    ]);
  };

  const handleTimeRangePreset = (preset: keyof typeof presets) => {
    updateTimeRange(presets[preset]());
  };

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to Load Analytics
          </h3>
          <p className="text-gray-600 mb-4">
            We couldn't load the analytics data. Please try again.
          </p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {propertyName} Analytics
            </h1>
            <p className="text-gray-600">
              Performance insights for {timeRange.start.toLocaleDateString()} -{" "}
              {timeRange.end.toLocaleDateString()}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Time Range Presets */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleTimeRangePreset("last7Days")}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                7 days
              </button>
              <button
                onClick={() => handleTimeRangePreset("last30Days")}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                30 days
              </button>
              <button
                onClick={() => handleTimeRangePreset("last90Days")}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                90 days
              </button>
              <button
                onClick={() => handleTimeRangePreset("thisYear")}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                This year
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </button>

              <button
                onClick={handleExport}
                disabled={isExporting}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {viewTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeView === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`
                    flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                    ${
                      isActive
                        ? "border-blue-600 text-blue-600 bg-blue-50"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-6">
              {/* Loading Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-100 rounded-lg h-32 animate-pulse"
                  />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-100 rounded-lg h-64 animate-pulse"
                  />
                ))}
              </div>
            </div>
          ) : analytics ? (
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeView === "overview" && (
                <AnalyticsOverview
                  analytics={analytics}
                  timeRange={timeRange}
                />
              )}

              {activeView === "occupancy" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Occupancy Trends
                        </h3>
                        <div className="h-64 flex items-center justify-center text-gray-500">
                          <p>Occupancy chart component coming soon...</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Occupancy Metrics
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-600">
                              Current Rate
                            </p>
                            <p className="text-2xl font-bold text-blue-600">
                              {analytics.occupancy.currentOccupancy.value.toFixed(
                                1
                              )}
                              %
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              Average Rate
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                              {analytics.occupancy.averageOccupancy.value.toFixed(
                                1
                              )}
                              %
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Peak Rate</p>
                            <p className="text-2xl font-bold text-purple-600">
                              {analytics.occupancy.peakOccupancy.value.toFixed(
                                1
                              )}
                              %
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeView === "revenue" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Revenue Trends
                        </h3>
                        <div className="h-64 flex items-center justify-center text-gray-500">
                          <p>Revenue chart component coming soon...</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Revenue Metrics
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-600">
                              Total Revenue
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                              $
                              {analytics.revenue.totalRevenue.value.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">ADR</p>
                            <p className="text-2xl font-bold text-blue-600">
                              $
                              {analytics.revenue.averageDailyRate.value.toFixed(
                                0
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">RevPAR</p>
                            <p className="text-2xl font-bold text-purple-600">
                              ${analytics.revenue.revPAR.value.toFixed(0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeView === "guests" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Guest Metrics
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600">Total Guests</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {analytics.guests.totalGuests.value.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Returning Rate
                          </p>
                          <p className="text-2xl font-bold text-green-600">
                            {analytics.guests.returningGuestRate.value.toFixed(
                              1
                            )}
                            %
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Avg Stay</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {analytics.guests.averageStayDuration.value.toFixed(
                              1
                            )}{" "}
                            nights
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Satisfaction</p>
                          <p className="text-2xl font-bold text-yellow-600">
                            {analytics.guests.guestSatisfaction.rating.toFixed(
                              1
                            )}
                            /5.0
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Guest Demographics
                      </h3>
                      <div className="h-48 flex items-center justify-center text-gray-500">
                        <p>Demographics chart component coming soon...</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeView === "reviews" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Review Metrics
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600">
                            Average Rating
                          </p>
                          <p className="text-2xl font-bold text-yellow-600">
                            {analytics.reviews.averageRating.value.toFixed(1)}
                            /5.0
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Reviews</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {analytics.reviews.totalReviews.value.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Response Rate</p>
                          <p className="text-2xl font-bold text-green-600">
                            {analytics.reviews.responseRate.value.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Positive Sentiment
                          </p>
                          <p className="text-2xl font-bold text-purple-600">
                            {analytics.reviews.sentimentAnalysis.positive.toFixed(
                              1
                            )}
                            %
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Review Sentiment
                      </h3>
                      <div className="h-48 flex items-center justify-center text-gray-500">
                        <p>Sentiment chart component coming soon...</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeView === "performance" && (
                <PerformanceMetrics
                  analytics={analytics}
                  propertyId={propertyId}
                />
              )}

              {activeView === "alerts" && (
                <AlertsPanel analytics={analytics} propertyId={propertyId} />
              )}

              {activeView === "market" && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Market Comparison
                  </h3>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <p>Market comparison component coming soon...</p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Data Available
              </h3>
              <p className="text-gray-600">
                Analytics data will appear here once your property has bookings
                and reviews.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyAnalyticsDashboard;
