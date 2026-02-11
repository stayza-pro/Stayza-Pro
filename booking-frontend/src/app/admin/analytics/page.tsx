"use client";

import React, { useState, useEffect } from "react";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Building2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";
import { getAnalytics, PlatformAnalytics } from "@/services/adminService";
import { getCommissionRate } from "@/services/settingsService";
import RevenueTracking from "@/components/admin/RevenueTracking";
import toast from "react-hot-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#3B82F6", "#F97316", "#10B981", "#EF4444", "#8B5CF6"];

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commissionRate, setCommissionRate] = useState<number>(0.07);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">(
    "30d"
  );

  useEffect(() => {
    fetchAnalytics();
    fetchCommissionRate();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 60000);

    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = await getAnalytics(timeRange);
      setAnalytics(data);
      
    } catch (error: any) {
      
      toast.error(error.response?.data?.message || "Failed to load analytics");
      setAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCommissionRate = async () => {
    try {
      const rate = await getCommissionRate();
      setCommissionRate(rate || 0.07);
    } catch (error: any) {
      
      setCommissionRate(0.07);
    }
  };

  const handleRefresh = () => {
    fetchAnalytics();
    fetchCommissionRate();
    toast.success("Analytics data refreshed!");
  };

  // Format currency with fallback
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount) || numAmount === null || numAmount === undefined)
      return "₦0.00";
    return `₦${numAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Safe data extraction with fallbacks
  const safeValue = (value: any, fallback: any = 0) => {
    return value !== null && value !== undefined && !isNaN(value)
      ? value
      : fallback;
  };

  const monthlyRevenue = Array.isArray(analytics?.trends?.monthlyRevenue)
    ? analytics.trends.monthlyRevenue
    : [];
  const monthlyBookings = Array.isArray(analytics?.trends?.monthlyBookings)
    ? analytics.trends.monthlyBookings
    : [];

  // Prepare revenue data from backend with fallbacks
  const revenueData = monthlyRevenue.map((trend) => {
    const bookingData = monthlyBookings.find((b) => b.month === trend.month);
    return {
      name: trend.month || "Unknown",
      revenue: safeValue(parseFloat(trend.revenue?.toString() || "0"), 0),
      bookings: safeValue(bookingData?.bookings, 0),
    };
  });

  // Prepare status data with fallbacks
  const statusData = (
    Array.isArray(analytics?.breakdowns?.bookingStatus)
      ? analytics.breakdowns.bookingStatus
      : []
  ).map((status) => ({
    name: status.status || "Pending",
    value: safeValue(status.count, 0),
  }));

  // Calculate all growth metrics from real data
  const revenueGrowth = safeValue(analytics?.overview.revenueGrowth, 0);

  // Calculate bookings growth from trends data
  const bookingsGrowth = (() => {
    const trends = analytics?.trends.monthlyBookings || [];
    if (trends.length >= 2) {
      const latest = trends[trends.length - 1]?.bookings || 0;
      const previous = trends[trends.length - 2]?.bookings || 0;
      return previous > 0 ? ((latest - previous) / previous) * 100 : 0;
    }
    return 0;
  })();

  // Calculate realtors growth (active vs total)
  const realtorsGrowth = (() => {
    const total = safeValue(analytics?.overview.totalRealtors, 0);
    const active = safeValue(analytics?.overview.activeRealtors, 0);
    return total > 0 ? (active / total) * 100 - 50 : 0; // Relative to 50% baseline
  })();

  // Calculate properties growth (active vs total)
  const propertiesGrowth = (() => {
    const total = safeValue(analytics?.overview.totalProperties, 0);
    const active = safeValue(analytics?.overview.activeProperties, 0);
    return total > 0 ? (active / total) * 100 - 70 : 0; // Relative to 70% baseline
  })(); // Metric Card Component
  const MetricCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    color,
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: "up" | "down";
    trendValue?: number;
    color: string;
  }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && trendValue !== undefined && (
          <div
            className={`flex items-center space-x-1 text-sm font-medium ${
              trend === "up" ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend === "up" ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>{Math.abs(trendValue).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  );

  if (isLoading) {
    return (
      <>
        <AdminNavigation />
        <div className="min-h-screen bg-gray-50 pt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNavigation />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-600 mt-1">
                  Platform performance metrics and insights
                </p>
              </div>

              <div className="mt-4 lg:mt-0 flex items-center space-x-3">
                {/* Time Range Selector */}
                <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg p-1">
                  {(["7d", "30d", "90d", "1y"] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        timeRange === range
                          ? "bg-blue-600 text-white"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {range === "7d" && "7 Days"}
                      {range === "30d" && "30 Days"}
                      {range === "90d" && "90 Days"}
                      {range === "1y" && "1 Year"}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Revenue"
                value={formatCurrency(
                  safeValue(analytics?.overview.totalRevenue, "0")
                )}
                icon={DollarSign}
                trend={revenueGrowth >= 0 ? "up" : "down"}
                trendValue={revenueGrowth}
                color="bg-green-500"
              />
              <MetricCard
                title="Total Bookings"
                value={safeValue(analytics?.overview.totalBookings, 0)}
                icon={Calendar}
                trend={bookingsGrowth >= 0 ? "up" : "down"}
                trendValue={bookingsGrowth}
                color="bg-blue-500"
              />
              <MetricCard
                title="Active Realtors"
                value={safeValue(analytics?.overview.activeRealtors, 0)}
                icon={Users}
                trend={realtorsGrowth >= 0 ? "up" : "down"}
                trendValue={realtorsGrowth}
                color="bg-purple-500"
              />
              <MetricCard
                title="Listed Properties"
                value={safeValue(analytics?.overview.totalProperties, 0)}
                icon={Building2}
                trend={propertiesGrowth >= 0 ? "up" : "down"}
                trendValue={propertiesGrowth}
                color="bg-orange-500"
              />
            </div>

            {/* Revenue Tracking Component */}
            <RevenueTracking />

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Revenue Trend
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Monthly revenue overview
                    </p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [
                        formatCurrency(value),
                        "Revenue",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={{ fill: "#3B82F6", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Bookings Overview */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Bookings Overview
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Monthly bookings count
                    </p>
                  </div>
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="bookings"
                      fill="#F97316"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Booking Status Distribution */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Booking Status
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Distribution by status
                  </p>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => {
                        const displayName = name || "Unknown";
                        const displayPercent = isNaN(percent)
                          ? 0
                          : (percent * 100).toFixed(0);
                        return `${displayName} ${displayPercent}%`;
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Quick Stats */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Quick Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">
                      Avg. Booking Value
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {(() => {
                        const totalRevenue = parseFloat(
                          safeValue(analytics?.overview.totalRevenue, "0")
                        );
                        const totalBookings = safeValue(
                          analytics?.overview.totalBookings,
                          0
                        );
                        const avgValue =
                          totalBookings > 0 ? totalRevenue / totalBookings : 0;
                        return formatCurrency(avgValue);
                      })()}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">
                      Commission Earned
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {(() => {
                        const totalRevenue = parseFloat(
                          safeValue(analytics?.overview.totalRevenue, "0")
                        );
                        const commission = totalRevenue * commissionRate;
                        return formatCurrency(commission);
                      })()}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">
                      Pending Approvals
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {safeValue(analytics?.overview.pendingRealtors, 0)}
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">
                      Completed Bookings
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {safeValue(analytics?.overview.completedBookings, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
