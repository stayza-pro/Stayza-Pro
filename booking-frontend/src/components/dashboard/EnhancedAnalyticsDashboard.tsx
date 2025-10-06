"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "react-query";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Home,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  MapPin,
  Clock,
  Filter,
  Eye,
  Target,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { analyticsService, RealtorAnalytics } from "@/services/analytics";
import { Card, Loading, Button } from "@/components/ui";
import { toast } from "react-hot-toast";

export const EnhancedAnalyticsDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [timeRange, setTimeRange] = useState("30d");
  const [isExporting, setIsExporting] = useState(false);

  // Fetch analytics data
  const {
    data: analyticsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery(
    ["realtor-analytics", timeRange],
    () => analyticsService.getRealtorAnalytics(timeRange),
    {
      enabled: !!user && user.role === "REALTOR",
      refetchOnWindowFocus: false,
      retry: 1,
      onError: (error: any) => {
        toast.error("Failed to load analytics data");
        console.error("Analytics error:", error);
      },
    }
  );

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await analyticsService.exportAnalytics("realtor", timeRange);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analytics-${timeRange}-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Analytics data exported successfully");
    } catch (error) {
      toast.error("Failed to export analytics data");
    } finally {
      setIsExporting(false);
    }
  };

  const MetricCard = ({
    title,
    value,
    change,
    icon: Icon,
    color,
    description,
    format = "number",
  }: {
    title: string;
    value: number | string;
    change?: number;
    icon: any;
    color: string;
    description?: string;
    format?: "number" | "currency" | "percentage";
  }) => {
    const formatValue = (val: number | string) => {
      if (typeof val === "string") return val;

      switch (format) {
        case "currency":
          return `₦${(val / 1000000).toFixed(1)}M`;
        case "percentage":
          return `${val.toFixed(1)}%`;
        default:
          return val.toLocaleString();
      }
    };

    return (
      <motion.div
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
        whileHover={{ y: -2 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {change !== undefined && (
            <div
              className={`flex items-center space-x-1 ${
                change >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {change >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {Math.abs(change).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-3xl font-bold text-gray-900">
            {formatValue(value)}
          </h3>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
        </div>
      </motion.div>
    );
  };

  const ChartCard = ({
    title,
    children,
    actions,
  }: {
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
  }) => (
    <motion.div
      className="bg-white rounded-2xl shadow-sm border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-2">{actions}</div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  );

  const SimpleBarChart = ({
    data,
    color = "#3B82F6",
    dataKey = "value",
  }: {
    data: any[];
    color?: string;
    dataKey?: string;
  }) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-32 text-gray-500">
          No data available
        </div>
      );
    }

    const maxValue = Math.max(
      ...data.map(
        (item) =>
          item[dataKey] || item.bookings || item.revenue || item.count || 0
      )
    );

    return (
      <div className="space-y-4">
        {data.map((item, index) => {
          const value =
            item[dataKey] || item.bookings || item.revenue || item.count || 0;
          const label =
            item.month ||
            item.city ||
            item.status ||
            item.type ||
            item.name ||
            `Item ${index + 1}`;

          return (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 min-w-0 flex-1">
                {label}
              </span>
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: item.color || color,
                      width: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-900 w-16 text-right">
                  {typeof value === "number" && value > 1000000
                    ? `₦${(value / 1000000).toFixed(1)}M`
                    : typeof value === "number" && value > 1000
                    ? `${(value / 1000).toFixed(1)}K`
                    : value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!user || user.role !== "REALTOR") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">
          Access denied. Realtor account required.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading text="Loading analytics..." />
      </div>
    );
  }

  if (isError || !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load analytics data</p>
          <Button onClick={handleRefresh} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive insights into your properties and bookings
          </p>
        </div>

        <div className="flex items-center space-x-4 mt-6 lg:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>

          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-5 h-5 ${isFetching ? "animate-spin" : ""}`}
            />
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "Exporting..." : "Export Report"}</span>
          </button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Properties"
          value={analyticsData.overview.properties.active}
          change={analyticsData.overview.properties.growth}
          icon={Home}
          color="bg-blue-500"
          description={`${analyticsData.overview.properties.total} total properties`}
        />
        <MetricCard
          title="Total Bookings"
          value={analyticsData.overview.bookings.total}
          change={analyticsData.overview.bookings.growth}
          icon={Calendar}
          color="bg-green-500"
          description={`${analyticsData.overview.bookings.completed} completed`}
        />
        <MetricCard
          title="Revenue"
          value={analyticsData.overview.revenue.total}
          change={analyticsData.overview.revenue.growth}
          icon={DollarSign}
          color="bg-purple-500"
          format="currency"
          description={`₦${(
            analyticsData.overview.revenue.average || 0
          ).toLocaleString()} avg per booking`}
        />
        <MetricCard
          title="Average Rating"
          value={analyticsData.overview.performance.averageRating.toFixed(1)}
          icon={Star}
          color="bg-yellow-500"
          description={`${analyticsData.overview.performance.totalReviews} reviews`}
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Occupancy Rate",
            value: analyticsData.overview.performance.occupancyRate.toFixed(1),
            icon: Target,
            color: "text-green-600",
            suffix: "%",
          },
          {
            label: "Conversion Rate",
            value: analyticsData.overview.performance.conversionRate.toFixed(1),
            icon: TrendingUp,
            color: "text-blue-600",
            suffix: "%",
          },
          {
            label: "Pending Bookings",
            value: analyticsData.overview.bookings.pending?.toString() || "0",
            icon: Clock,
            color: "text-orange-600",
          },
          {
            label: "Cancelled",
            value: analyticsData.overview.bookings.cancelled?.toString() || "0",
            icon: TrendingDown,
            color: "text-red-600",
          },
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            className="bg-white rounded-xl p-6 border border-gray-100 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex justify-center mb-3">
              <metric.icon className={`w-6 h-6 ${metric.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {metric.value}
              {metric.suffix || ""}
            </p>
            <p className="text-sm text-gray-600">{metric.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Trend */}
        <ChartCard
          title="Monthly Revenue Trend"
          actions={
            <select className="text-sm border border-gray-300 rounded-lg px-3 py-1">
              <option>Monthly</option>
              <option>Weekly</option>
              <option>Daily</option>
            </select>
          }
        >
          <SimpleBarChart
            data={analyticsData.trends.monthly}
            color="#10B981"
            dataKey="revenue"
          />
        </ChartCard>

        {/* Booking Trend */}
        <ChartCard title="Monthly Booking Trend">
          <SimpleBarChart
            data={analyticsData.trends.monthly}
            color="#3B82F6"
            dataKey="bookings"
          />
        </ChartCard>
      </div>

      {/* Top Properties */}
      <ChartCard title="Top Performing Properties">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <span>Property</span>
            <span className="text-center">City</span>
            <span className="text-center">Bookings</span>
            <span className="text-center">Revenue</span>
            <span className="text-center">Rating</span>
            <span className="text-center">Price/Night</span>
          </div>

          {analyticsData.topProperties.map((property, index) => (
            <motion.div
              key={property.id}
              className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center space-x-3">
                <Home className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="font-medium text-gray-900 text-sm">
                    {property.title}
                  </span>
                </div>
              </div>

              <div className="text-center">
                <span className="text-sm font-semibold text-gray-900">
                  {property.city}
                </span>
              </div>

              <div className="text-center">
                <span className="text-sm font-semibold text-gray-900">
                  {property.bookings}
                </span>
                <p className="text-xs text-gray-500">bookings</p>
              </div>

              <div className="text-center">
                <span className="text-sm font-semibold text-gray-900">
                  ₦{(property.revenue / 1000).toFixed(0)}K
                </span>
                <p className="text-xs text-gray-500">total revenue</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-semibold text-gray-900">
                    {property.averageRating.toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {property.reviews} reviews
                </p>
              </div>

              <div className="text-center">
                <span className="text-sm font-semibold text-gray-900">
                  ₦{property.pricePerNight.toLocaleString()}
                </span>
                <p className="text-xs text-gray-500">per night</p>
              </div>
            </motion.div>
          ))}

          {analyticsData.topProperties.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No properties found for the selected time range
            </div>
          )}
        </div>
      </ChartCard>
    </div>
  );
};
