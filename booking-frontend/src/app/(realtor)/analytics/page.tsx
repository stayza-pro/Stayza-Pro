"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import { useBranding } from "@/hooks/useBranding";
import { getRealtorSubdomain } from "@/utils/subdomain";
import { analyticsService, RealtorAnalytics } from "@/services/analytics";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Calendar,
  Copy,
  Eye as EyeIcon,
  Loader2,
  AlertCircle,
  Home,
  Wallet,
  Star,
} from "lucide-react";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { showSuccess } = useAlert();
  const { branding } = useBranding();
  const realtorSubdomain = getRealtorSubdomain();

  const [analytics, setAnalytics] = useState<RealtorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("30d");

  const brandColors = branding?.colors || {
    primary: "#3B82F6",
    secondary: "#1E40AF",
    accent: "#F59E0B",
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess("Copied to clipboard!");
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getRealtorAnalytics(timeRange);
      setAnalytics(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? "text-green-600" : "text-red-600";
    const bgColor = isPositive ? "bg-green-50" : "bg-red-50";

    return (
      <div
        className={`flex items-center text-xs ${color} ${bgColor} px-2 py-1 rounded-full`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {Math.abs(growth).toFixed(1)}%
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 flex-shrink-0">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Welcome back, {user?.firstName || "User"} 👋
            </h1>
            <p className="text-gray-600 flex items-center space-x-2">
              <span>Your website:</span>
              <span
                className="font-semibold px-3 py-1 rounded-md text-sm"
                style={{
                  color: brandColors.primary,
                  backgroundColor: brandColors.primary + "15",
                }}
              >
                {realtorSubdomain || "yourcompany"}.stayza.pro
              </span>
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() =>
                copyToClipboard(
                  `https://${realtorSubdomain || "yourcompany"}.stayza.pro`
                )
              }
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </button>
            <button
              onClick={() =>
                window.open(
                  `https://${realtorSubdomain || "yourcompany"}.stayza.pro`,
                  "_blank"
                )
              }
              className="px-4 py-2 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center space-x-2"
              style={{ backgroundColor: brandColors.primary }}
            >
              <EyeIcon className="w-4 h-4" />
              <span>Preview Site</span>
            </button>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
                <p className="text-gray-600 mt-1">
                  Insights and performance metrics for your properties
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setTimeRange("7d")}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    timeRange === "7d"
                      ? "bg-blue-600 text-white"
                      : "border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setTimeRange("30d")}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    timeRange === "30d"
                      ? "bg-blue-600 text-white"
                      : "border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => setTimeRange("90d")}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    timeRange === "90d"
                      ? "bg-blue-600 text-white"
                      : "border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Last 90 Days
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading analytics...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Error Loading Analytics
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={fetchAnalytics}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Analytics Content */}
          {!loading && !error && analytics && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Home className="w-6 h-6 text-blue-600" />
                    </div>
                    {formatGrowth(analytics.overview.properties.growth ?? 0)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Properties</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {analytics.overview.properties.total}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {analytics.overview.properties.active} active
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Calendar className="w-6 h-6 text-green-600" />
                    </div>
                    {formatGrowth(analytics.overview.bookings.growth)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {analytics.overview.bookings.total}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {analytics.overview.bookings.completed} completed
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Wallet className="w-6 h-6 text-purple-600" />
                    </div>
                    {formatGrowth(analytics.overview.revenue.growth)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      ₦{analytics.overview.revenue.total.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ₦{analytics.overview.revenue.average?.toFixed(2) || "0"}{" "}
                      avg
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <Star className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Average Rating</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {analytics.overview.performance.averageRating.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      from {analytics.overview.performance.totalReviews} reviews
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Occupancy & Conversion
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Occupancy Rate</span>
                        <span className="font-semibold text-gray-900">
                          {analytics.overview.performance.occupancyRate.toFixed(
                            1
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${analytics.overview.performance.occupancyRate}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Conversion Rate</span>
                        <span className="font-semibold text-gray-900">
                          {analytics.overview.performance.conversionRate.toFixed(
                            1
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${analytics.overview.performance.conversionRate}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Booking Status Breakdown
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Completed</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {analytics.overview.bookings.completed}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Pending</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {analytics.overview.bookings.pending ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Cancelled</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {analytics.overview.bookings.cancelled ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Trends */}
              {analytics.trends &&
                analytics.trends.monthly &&
                analytics.trends.monthly.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Monthly Trends
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left text-sm font-medium text-gray-600 pb-3">
                              Month
                            </th>
                            <th className="text-right text-sm font-medium text-gray-600 pb-3">
                              Bookings
                            </th>
                            <th className="text-right text-sm font-medium text-gray-600 pb-3">
                              Revenue
                            </th>
                            <th className="text-right text-sm font-medium text-gray-600 pb-3">
                              Completed
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.trends.monthly.map((trend, index) => (
                            <tr
                              key={index}
                              className="border-b border-gray-100 last:border-0"
                            >
                              <td className="py-3 text-sm text-gray-900">
                                {trend.month}
                              </td>
                              <td className="py-3 text-sm text-gray-900 text-right">
                                {trend.bookings}
                              </td>
                              <td className="py-3 text-sm text-gray-900 text-right">
                                ₦{trend.revenue.toLocaleString()}
                              </td>
                              <td className="py-3 text-sm text-gray-900 text-right">
                                {trend.completed}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              {/* Top Performing Properties */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Top Performing Properties
                  </h3>
                </div>
                {analytics.topProperties &&
                analytics.topProperties.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.topProperties.map((property, index) => (
                      <div
                        key={property.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {property.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {property.city}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6 text-sm">
                          <div className="text-right">
                            <p className="text-gray-500">Bookings</p>
                            <p className="font-semibold text-gray-900">
                              {property.bookings}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500">Revenue</p>
                            <p className="font-semibold text-gray-900">
                              ₦{property.revenue.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500">Rating</p>
                            <p className="font-semibold text-gray-900 flex items-center">
                              <Star className="w-4 h-4 text-yellow-500 mr-1 fill-yellow-500" />
                              {property.averageRating.toFixed(1)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No property data available</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Empty State (no data at all) */}
          {!loading && !error && !analytics && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Analytics Data Yet
                </h3>
                <p className="text-gray-600">
                  Add properties and start getting bookings to see detailed
                  analytics
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
