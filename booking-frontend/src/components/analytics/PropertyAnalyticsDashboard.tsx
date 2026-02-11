"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  DollarSign,
  Download,
  Home,
  RefreshCw,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  usePropertyAnalytics,
  useAnalyticsTimeRange,
  useAnalyticsExport,
} from "@/hooks/analytics/useAnalytics";
import { AnalyticsViewType } from "@/types/analytics";
import { AnalyticsOverview } from "./AnalyticsOverview";
import { PerformanceMetrics } from "./PerformanceMetrics";
import { AlertsPanel } from "./AlertsPanel";
import { TrendChart } from "./charts/TrendChart";

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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

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
    setTimeout(() => setIsRefreshing(false), 900);
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
            We couldn't load analytics right now. Try again.
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {propertyName} Analytics
            </h1>
            <p className="text-gray-600">
              {timeRange.start.toLocaleDateString()} -{" "}
              {timeRange.end.toLocaleDateString()}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
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

            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
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
                  className={`flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? "border-blue-600 text-blue-600 bg-blue-50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-lg h-32 animate-pulse" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-lg h-64 animate-pulse" />
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
                <AnalyticsOverview analytics={analytics} timeRange={timeRange} />
              )}

              {activeView === "occupancy" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Occupancy Trends
                      </h3>
                      <TrendChart
                        data={analytics.occupancy.occupancyTrend.map((point) => ({
                          date: point.date,
                          value: point.occupancyRate,
                        }))}
                        color="blue"
                        formatValue={formatPercent}
                      />
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Occupancy Metrics
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600">Current Rate</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {formatPercent(
                              analytics.occupancy.currentOccupancy.value
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Average Rate</p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatPercent(
                              analytics.occupancy.averageOccupancy.value
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Peak Rate</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {formatPercent(analytics.occupancy.peakOccupancy.value)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Seasonal Performance
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {analytics.occupancy.seasonalTrends.map((season) => (
                        <div key={season.season} className="rounded-lg bg-gray-50 p-4">
                          <p className="text-sm text-gray-600">{season.season}</p>
                          <p className="text-xl font-semibold text-gray-900">
                            {formatPercent(season.averageOccupancy)}
                          </p>
                          <p
                            className={`text-xs ${
                              season.change >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {season.change >= 0 ? "+" : ""}
                            {season.change.toFixed(1)}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeView === "revenue" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Revenue Trends
                      </h3>
                      <TrendChart
                        data={analytics.revenue.revenueTrend.map((point) => ({
                          date: point.date,
                          value: point.revenue,
                        }))}
                        color="green"
                        formatValue={formatCurrency}
                      />
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Revenue Metrics
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600">Total Revenue</p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(analytics.revenue.totalRevenue.value)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">ADR</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {formatCurrency(analytics.revenue.averageDailyRate.value)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">RevPAR</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {formatCurrency(analytics.revenue.revPAR.value)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Revenue Sources
                    </h3>
                    <div className="space-y-3">
                      {analytics.revenue.revenueBySource.map((source) => (
                        <div key={source.source}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">{source.source}</span>
                            <span className="font-medium text-gray-900">
                              {formatCurrency(source.revenue)} ({source.percentage.toFixed(1)}
                              %)
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-100">
                            <div
                              className="h-2 rounded-full bg-green-500"
                              style={{ width: `${Math.min(source.percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
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
                          <p className="text-sm text-gray-600">Returning Rate</p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatPercent(analytics.guests.returningGuestRate.value)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Average Stay</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {analytics.guests.averageStayDuration.value.toFixed(1)} nights
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Satisfaction</p>
                          <p className="text-2xl font-bold text-yellow-600">
                            {analytics.guests.guestSatisfaction.rating.toFixed(1)}/5.0
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Age Demographics
                      </h3>
                      <div className="space-y-3">
                        {analytics.guests.demographics.age.map((group) => (
                          <div key={group.ageGroup}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700">{group.ageGroup}</span>
                              <span className="font-medium text-gray-900">
                                {group.percentage.toFixed(1)}%
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-gray-100">
                              <div
                                className="h-2 rounded-full bg-blue-500"
                                style={{ width: `${Math.min(group.percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Top Guest Locations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analytics.guests.demographics.location.slice(0, 6).map((item) => (
                        <div
                          key={`${item.country}-${item.city ?? "all"}`}
                          className="rounded-lg bg-gray-50 p-4"
                        >
                          <p className="text-sm text-gray-600">
                            {item.city ? `${item.city}, ${item.country}` : item.country}
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            {item.guestCount} guests
                          </p>
                          <p className="text-xs text-gray-500">
                            Avg spend: {formatCurrency(item.averageSpend)}
                          </p>
                        </div>
                      ))}
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
                          <p className="text-sm text-gray-600">Average Rating</p>
                          <p className="text-2xl font-bold text-yellow-600">
                            {analytics.reviews.averageRating.value.toFixed(1)}/5.0
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
                            {formatPercent(analytics.reviews.responseRate.value)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Positive Sentiment</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {formatPercent(
                              analytics.reviews.sentimentAnalysis.positive
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Review Sentiment
                      </h3>
                      <div className="space-y-4">
                        {[
                          {
                            label: "Positive",
                            value: analytics.reviews.sentimentAnalysis.positive,
                            color: "bg-green-500",
                          },
                          {
                            label: "Neutral",
                            value: analytics.reviews.sentimentAnalysis.neutral,
                            color: "bg-yellow-500",
                          },
                          {
                            label: "Negative",
                            value: analytics.reviews.sentimentAnalysis.negative,
                            color: "bg-red-500",
                          },
                        ].map((sentiment) => (
                          <div key={sentiment.label}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700">{sentiment.label}</span>
                              <span className="font-medium text-gray-900">
                                {sentiment.value.toFixed(1)}%
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-gray-100">
                              <div
                                className={`h-2 rounded-full ${sentiment.color}`}
                                style={{ width: `${Math.min(sentiment.value, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Category Ratings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {analytics.reviews.categoryRatings.map((category) => (
                        <div
                          key={category.category}
                          className="rounded-lg bg-gray-50 p-4 flex items-center justify-between"
                        >
                          <span className="text-sm text-gray-700">{category.category}</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {category.rating.toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeView === "performance" && (
                <PerformanceMetrics analytics={analytics} propertyId={propertyId} />
              )}

              {activeView === "alerts" && (
                <AlertsPanel analytics={analytics} propertyId={propertyId} />
              )}

              {activeView === "market" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <p className="text-sm text-gray-600">Market Rank</p>
                      <p className="text-3xl font-bold text-blue-600">
                        #{analytics.market.marketPosition.rank}
                      </p>
                      <p className="text-xs text-gray-500">
                        out of {analytics.market.marketPosition.totalProperties} properties
                      </p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <p className="text-sm text-gray-600">Percentile</p>
                      <p className="text-3xl font-bold text-green-600">
                        {analytics.market.marketPosition.percentile.toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <p className="text-sm text-gray-600">Top Competitor Rating</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {analytics.market.competitorComparison[0]?.rating.toFixed(1) || "0.0"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Market Trends
                    </h3>
                    <div className="space-y-3">
                      {analytics.market.marketTrends.map((trend) => (
                        <div key={trend.metric} className="rounded-lg bg-gray-50 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-900">{trend.metric}</p>
                            <p
                              className={`text-xs font-medium ${
                                trend.difference >= 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {trend.difference >= 0 ? "+" : ""}
                              {trend.difference.toFixed(1)} vs market
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500">Your property</p>
                              <p className="font-semibold text-gray-900">
                                {trend.yourProperty.toFixed(1)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Market average</p>
                              <p className="font-semibold text-gray-900">
                                {trend.marketAverage.toFixed(1)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Opportunities
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analytics.market.opportunities.map((opportunity) => (
                        <div key={opportunity.title} className="rounded-lg bg-blue-50 p-4">
                          <p className="font-medium text-blue-900">{opportunity.title}</p>
                          <p className="text-sm text-blue-800 mt-1">
                            {opportunity.description}
                          </p>
                          <div className="mt-3 flex gap-2 text-xs">
                            <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">
                              Impact: {opportunity.impact}
                            </span>
                            <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">
                              Effort: {opportunity.effort}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
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
                Analytics will appear here once bookings and reviews are recorded.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyAnalyticsDashboard;
