"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Eye,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart,
} from "lucide-react";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface AnalyticsData {
  timeRange: string;
  overview: {
    properties: {
      total: number;
      active: number;
    };
    bookings: {
      total: number;
      completed: number;
      pending: number;
      cancelled: number;
      growth: number;
    };
    revenue: {
      total: number;
      growth: number;
      average: number;
    };
    guests: {
      total: number;
      newInPeriod: number;
    };
    performance: {
      averageRating: number;
      totalReviews: number;
      occupancyRate: number;
      conversionRate: number;
    };
  };
  trends: {
    monthly: Array<{
      month: string;
      bookings: number;
      revenue: number;
    }>;
  };
  topProperties: Array<{
    id: string;
    title: string;
    bookings: number;
    revenue: number;
    rating: number;
  }>;
}

export default function EarningsPage() {
  const { brandColor, secondaryColor, accentColor } = useRealtorBranding();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">(
    "30d"
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";
      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        `${API_URL}/realtors/analytics?timeRange=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      console.log("📊 Analytics data:", data);
      setAnalytics(data.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load earnings data");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  const COLORS = [
    brandColor,
    secondaryColor,
    accentColor,
    brandColor + "99", // 60% opacity
    secondaryColor + "99", // 60% opacity
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: brandColor }}
        ></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Data Available
          </h3>
          <p className="text-gray-600">
            Complete your first booking to see earnings analytics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Earnings & Analytics
          </h1>
          <p className="text-gray-600">
            Track your revenue, bookings, and performance metrics
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <select
            value={timeRange}
            onChange={(e) =>
              setTimeRange(e.target.value as "7d" | "30d" | "90d" | "1y")
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ borderColor: `${brandColor}40` }}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => toast("Export feature coming soon!")}
          >
            <Download className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${brandColor}15` }}
            >
              <DollarSign className="h-6 w-6" style={{ color: brandColor }} />
            </div>
            {analytics.overview.revenue.growth !== 0 && (
              <div
                className={`flex items-center text-sm font-medium ${
                  analytics.overview.revenue.growth >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {analytics.overview.revenue.growth >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {formatPercent(analytics.overview.revenue.growth)}
              </div>
            )}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrency(analytics.overview.revenue.total)}
          </h3>
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-xs text-gray-500 mt-1">
            Reflects actual earnings including cancellation adjustments
          </p>
        </motion.div>

        {/* Average Booking Value */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${secondaryColor}15` }}
            >
              <CreditCard
                className="h-6 w-6"
                style={{ color: secondaryColor }}
              />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrency(analytics.overview.revenue.average)}
          </h3>
          <p className="text-sm text-gray-600">Average Booking Value</p>
        </motion.div>

        {/* Completed Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${accentColor}15` }}
            >
              <CheckCircle className="h-6 w-6" style={{ color: accentColor }} />
            </div>
            {analytics.overview.bookings.growth !== 0 && (
              <div
                className={`flex items-center text-sm font-medium ${
                  analytics.overview.bookings.growth >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {analytics.overview.bookings.growth >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {formatPercent(analytics.overview.bookings.growth)}
              </div>
            )}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {analytics.overview.bookings.completed}
          </h3>
          <p className="text-sm text-gray-600">Completed Bookings</p>
        </motion.div>

        {/* Occupancy Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-100">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {analytics.overview.performance.occupancyRate.toFixed(1)}%
          </h3>
          <p className="text-sm text-gray-600">Occupancy Rate</p>
        </motion.div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue Trends</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.trends.monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke={brandColor}
              strokeWidth={3}
              dot={{ fill: brandColor, r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Booking Breakdown & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Booking Status Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Booking Status
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                <span className="text-gray-700">Completed</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-900 font-semibold mr-4">
                  {analytics.overview.bookings.completed}
                </span>
                <span className="text-sm text-gray-500">
                  {(
                    (analytics.overview.bookings.completed /
                      analytics.overview.bookings.total) *
                    100
                  ).toFixed(0)}
                  %
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-3"></div>
                <span className="text-gray-700">Pending</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-900 font-semibold mr-4">
                  {analytics.overview.bookings.pending}
                </span>
                <span className="text-sm text-gray-500">
                  {(
                    (analytics.overview.bookings.pending /
                      analytics.overview.bookings.total) *
                    100
                  ).toFixed(0)}
                  %
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-3"></div>
                <span className="text-gray-700">Cancelled</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-900 font-semibold mr-4">
                  {analytics.overview.bookings.cancelled}
                </span>
                <span className="text-sm text-gray-500">
                  {(
                    (analytics.overview.bookings.cancelled /
                      analytics.overview.bookings.total) *
                    100
                  ).toFixed(0)}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Performance Metrics
          </h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Average Rating</span>
                <span className="text-lg font-bold text-gray-900">
                  {analytics.overview.performance.averageRating.toFixed(1)} /
                  5.0
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{
                    width: `${
                      (analytics.overview.performance.averageRating / 5) * 100
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Conversion Rate</span>
                <span className="text-lg font-bold text-gray-900">
                  {analytics.overview.performance.conversionRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${analytics.overview.performance.conversionRate}%`,
                    backgroundColor: secondaryColor,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Occupancy Rate</span>
                <span className="text-lg font-bold text-gray-900">
                  {analytics.overview.performance.occupancyRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${analytics.overview.performance.occupancyRate}%`,
                    backgroundColor: accentColor,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Properties */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Top Performing Properties
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-3 font-medium">Property</th>
                <th className="pb-3 font-medium text-center">Bookings</th>
                <th className="pb-3 font-medium text-right">Revenue</th>
                <th className="pb-3 font-medium text-center">Rating</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topProperties.slice(0, 5).map((property, index) => (
                <tr key={property.id} className="border-b last:border-0">
                  <td className="py-4">
                    <div className="flex items-center">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                        style={{ backgroundColor: `${brandColor}15` }}
                      >
                        <span
                          className="font-bold"
                          style={{ color: brandColor }}
                        >
                          #{index + 1}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">
                        {property.title}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: brandColor + "20",
                        color: brandColor,
                      }}
                    >
                      {property.bookings}
                    </span>
                  </td>
                  <td className="py-4 text-right font-semibold text-gray-900">
                    {formatCurrency(property.revenue)}
                  </td>
                  <td className="py-4 text-center">
                    <div className="flex items-center justify-center">
                      <span className="text-yellow-500 mr-1">★</span>
                      <span className="font-medium text-gray-900">
                        {property.rating != null
                          ? property.rating.toFixed(1)
                          : "0.0"}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
