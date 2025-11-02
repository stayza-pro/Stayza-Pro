"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  BarChart3,
  PieChart,
} from "lucide-react";
import { getAnalytics, PlatformAnalytics } from "@/services/adminService";
import { getCommissionRate } from "@/services/settingsService";
import toast from "react-hot-toast";

interface RevenueMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  commissionEarned: number;
  totalBookings: number;
  averageBookingValue: number;
  revenueGrowth: number;
  topRealtors: Array<{
    name: string;
    revenue: number;
    bookings: number;
  }>;
  monthlyData: Array<{
    month: string;
    revenue: number;
    bookings: number;
  }>;
}

interface RevenueTrackingProps {
  className?: string;
}

export default function RevenueTracking({
  className = "",
}: RevenueTrackingProps) {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [commissionRate, setCommissionRate] = useState<number>(0.07);

  // Fetch real analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsData, commissionRateData] = await Promise.all([
        getAnalytics(timeRange as "7d" | "30d" | "90d" | "1y"),
        getCommissionRate(),
      ]);

      setAnalytics(analyticsData);
      setCommissionRate(commissionRateData || 0.07);

      // Transform analytics data to RevenueMetrics format
      const totalRevenue = parseFloat(
        analyticsData?.overview?.totalRevenue || "0"
      );
      const totalBookings = analyticsData?.overview?.totalBookings || 0;
      const commissionEarned = totalRevenue * (commissionRateData || 0.07);
      const averageBookingValue =
        totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Calculate revenue growth from trends
      const monthlyRevenueTrends = analyticsData?.trends?.monthlyRevenue || [];
      const revenueGrowth = (() => {
        if (monthlyRevenueTrends.length >= 2) {
          const latest = parseFloat(
            monthlyRevenueTrends[
              monthlyRevenueTrends.length - 1
            ]?.revenue?.toString() || "0"
          );
          const previous = parseFloat(
            monthlyRevenueTrends[
              monthlyRevenueTrends.length - 2
            ]?.revenue?.toString() || "0"
          );
          return previous > 0 ? ((latest - previous) / previous) * 100 : 0;
        }
        return 0;
      })();

      // Get current month revenue
      const currentMonthRevenue =
        monthlyRevenueTrends.length > 0
          ? parseFloat(
              monthlyRevenueTrends[
                monthlyRevenueTrends.length - 1
              ]?.revenue?.toString() || "0"
            )
          : totalRevenue;

      const transformedMetrics: RevenueMetrics = {
        totalRevenue,
        monthlyRevenue: currentMonthRevenue,
        commissionEarned,
        totalBookings,
        averageBookingValue,
        revenueGrowth,
        topRealtors:
          analyticsData?.breakdowns?.topRealtors
            ?.slice(0, 5)
            .map((realtor) => ({
              name: realtor.businessName || `Realtor ${realtor.id}`,
              revenue: parseFloat(realtor.totalRevenue?.toString() || "0"),
              bookings: realtor.bookingCount || 0,
            })) || [],
        monthlyData:
          analyticsData?.trends?.monthlyRevenue?.map((trend, index) => {
            const bookingData = analyticsData.trends?.monthlyBookings?.[index];
            return {
              month: trend.month || "Unknown",
              revenue: parseFloat(trend.revenue?.toString() || "0"),
              bookings: bookingData?.bookings || 0,
            };
          }) || [],
      };

      setMetrics(transformedMetrics);
    } catch (error: any) {
      console.error("Failed to fetch analytics data:", error);
      toast.error("Failed to load revenue data");

      // Set fallback empty metrics
      setMetrics({
        totalRevenue: 0,
        monthlyRevenue: 0,
        commissionEarned: 0,
        totalBookings: 0,
        averageBookingValue: 0,
        revenueGrowth: 0,
        topRealtors: [],
        monthlyData: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 60000);

    return () => clearInterval(interval);
  }, [timeRange]);

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return "₦0.00";
    }

    if (amount >= 1000000) {
      return `₦${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `₦${(amount / 1000).toFixed(0)}K`;
    }
    return `₦${amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const exportData = () => {
    if (!metrics) {
      toast.error("No data to export");
      return;
    }

    try {
      // Create CSV content
      const csvContent = [
        "Revenue Analytics Export",
        `Generated: ${new Date().toLocaleString()}`,
        `Time Range: ${timeRange}`,
        "",
        "Summary Metrics",
        `Total Revenue,${metrics.totalRevenue}`,
        `Monthly Revenue,${metrics.monthlyRevenue}`,
        `Commission Earned,${metrics.commissionEarned}`,
        `Total Bookings,${metrics.totalBookings}`,
        `Average Booking Value,${metrics.averageBookingValue}`,
        `Revenue Growth,${metrics.revenueGrowth}%`,
        "",
        "Top Realtors",
        "Name,Revenue,Bookings",
        ...metrics.topRealtors.map(
          (r) => `${r.name},${r.revenue},${r.bookings}`
        ),
        "",
        "Monthly Data",
        "Month,Revenue,Bookings",
        ...metrics.monthlyData.map(
          (m) => `${m.month},${m.revenue},${m.bookings}`
        ),
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `revenue-analytics-${timeRange}-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Revenue data exported successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export data");
    }
  };

  if (loading) {
    return (
      <div
        className={`bg-white rounded-lg border border-gray-200 ${className}`}
      >
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Revenue Analytics
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Platform earnings and commission tracking
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
              disabled={loading}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 3 months</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded text-sm disabled:opacity-50 hover:bg-gray-700"
              title="Refresh Data"
            >
              <TrendingUp
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              onClick={exportData}
              disabled={loading || !metrics}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50 hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(metrics.totalRevenue)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  Commission Earned
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(metrics.commissionEarned)}
                </p>
              </div>
              <PieChart className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">
                  Total Bookings
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {metrics.totalBookings}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">
                  Avg Booking Value
                </p>
                <p className="text-2xl font-bold text-orange-900">
                  {formatCurrency(metrics.averageBookingValue)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Growth Indicator */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Growth</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {metrics.revenueGrowth > 0 ? "+" : ""}
                  {metrics.revenueGrowth.toFixed(1)}%
                </span>
                {metrics.revenueGrowth > 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500">vs previous period</p>
          </div>
        </div>

        {/* Top Performing Realtors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">
              Top Performing Realtors
            </h4>
            <div className="space-y-3">
              {metrics.topRealtors.map((realtor, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {realtor.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {realtor.bookings} bookings
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatCurrency(realtor.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">
              Monthly Revenue Trend
            </h4>
            <div className="space-y-2">
              {metrics.monthlyData.map((month, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {month.month}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      {month.bookings} bookings
                    </span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(month.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Commission Rate Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h5 className="font-medium text-blue-900">
                Commission Breakdown
              </h5>
              <p className="text-sm text-blue-700 mt-1">
                Platform earns {(commissionRate * 100).toFixed(1)}% commission
                on each successful booking. This month's commission represents{" "}
                {metrics.monthlyRevenue > 0
                  ? (
                      (metrics.commissionEarned / metrics.monthlyRevenue) *
                      100
                    ).toFixed(1)
                  : "0"}
                % of total revenue.
              </p>
              <div className="flex flex-wrap gap-4 mt-2 text-sm">
                <span className="text-blue-700">
                  <strong>Total Bookings:</strong> ₦
                  {metrics.monthlyRevenue.toLocaleString()}
                </span>
                <span className="text-blue-700">
                  <strong>Platform Commission:</strong> ₦
                  {metrics.commissionEarned.toLocaleString()}
                </span>
                <span className="text-blue-700">
                  <strong>Realtor Earnings:</strong> ₦
                  {Math.max(
                    0,
                    metrics.monthlyRevenue - metrics.commissionEarned
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
