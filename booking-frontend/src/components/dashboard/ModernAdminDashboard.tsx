"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Home,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  MoreHorizontal,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react";
import { User as UserType } from "@/types";
import Image from "next/image";
import { getAnalytics, PlatformAnalytics } from "@/services/adminService";
import toast from "react-hot-toast";

interface ModernAdminDashboardProps {
  currentUser: UserType;
}

export const ModernAdminDashboard: React.FC<ModernAdminDashboardProps> = ({
  currentUser,
}) => {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">(
    "30d"
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch analytics data
  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = await getAnalytics(timeRange);
      setAnalytics(data);
    } catch (error: any) {
      console.error("Failed to fetch analytics:", error);
      toast.error(
        error.response?.data?.message || "Failed to load analytics data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAnalytics();
    setIsRefreshing(false);
    toast.success("Dashboard refreshed!");
  };

  // Calculate trends from analytics data
  const calculateTrend = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Loading state
  if (isLoading && !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Use analytics data or fallback
  const stats = analytics?.overview || {
    totalUsers: 0,
    totalRealtors: 0,
    activeRealtors: 0,
    pendingRealtors: 0,
    totalProperties: 0,
    activeProperties: 0,
    totalBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    totalRevenue: "0",
    revenueGrowth: 0,
    averageRating: 0,
    totalReviews: 0,
    occupancyRate: 0,
    conversionRate: 0,
  };

  const StatCard = ({
    title,
    value,
    trend,
    icon: Icon,
    color,
    description,
  }: {
    title: string;
    value: string | number;
    trend?: number;
    icon: any;
    color: string;
    description?: string;
  }) => (
    <motion.div
      className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300"
      whileHover={{ y: -4, scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={`p-3 rounded-xl ${color} shadow-lg`}
          style={{
            background: color.includes("blue")
              ? "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)"
              : color.includes("green")
              ? "linear-gradient(135deg, #047857 0%, #10B981 100%)"
              : color.includes("orange")
              ? "linear-gradient(135deg, #F97316 0%, #FB923C 100%)"
              : undefined,
          }}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center space-x-1 px-2 py-1 rounded-lg ${
              trend >= 0
                ? "text-emerald-700 bg-emerald-50"
                : "text-red-700 bg-red-50"
            }`}
          >
            {trend >= 0 ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span className="text-sm font-semibold">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-gray-900">
          {typeof value === "number" ? value.toLocaleString() : value}
        </h3>
        <p className="text-sm font-semibold text-gray-600">{title}</p>
        {description && (
          <p className="text-xs font-normal text-gray-500">{description}</p>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {currentUser.firstName}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your platform today.
          </p>
        </div>

        <div className="flex items-center space-x-4 mt-6 lg:mt-0">
          <select
            value={timeRange}
            onChange={(e) => {
              const value = e.target.value as "7d" | "30d" | "90d" | "1y";
              setTimeRange(value);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>

          <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          trend={stats.revenueGrowth}
          icon={Users}
          color="bg-blue-500"
          description={`${stats.activeRealtors} active realtors`}
        />
        <StatCard
          title="Properties"
          value={stats.totalProperties}
          trend={stats.revenueGrowth * 0.7}
          icon={Home}
          color="bg-green-500"
          description={`${stats.pendingRealtors} pending approval`}
        />
        <StatCard
          title="Bookings"
          value={stats.totalBookings}
          trend={stats.revenueGrowth * 0.5}
          icon={Calendar}
          color="bg-purple-500"
          description={`${stats.completedBookings} completed`}
        />
        <StatCard
          title="Revenue"
          value={`₦${(parseFloat(stats.totalRevenue) / 1000000).toFixed(1)}M`}
          trend={stats.revenueGrowth}
          icon={DollarSign}
          color="bg-orange-500"
          description="Total platform revenue"
        />
      </div>

      {/* Alerts and Quick Actions */}
      {stats.pendingRealtors > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.pendingRealtors > 0 && (
            <motion.div
              className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800">
                      Pending Realtors
                    </h3>
                    <p className="text-yellow-700 text-sm">
                      {stats.pendingRealtors} realtors awaiting approval
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => (window.location.href = "/admin/realtors")}
                  className="px-4 py-2 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Review
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Platform Summary */}
        <motion.div
          className="bg-white rounded-3xl shadow-sm border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Platform Summary
              </h2>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-medium text-blue-900">
                    Total Realtors
                  </h3>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalRealtors}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {stats.activeRealtors} active • {stats.pendingRealtors}{" "}
                  pending
                </p>
              </div>

              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Home className="w-5 h-5 text-green-600" />
                  <h3 className="text-sm font-medium text-green-900">
                    Properties
                  </h3>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {stats.totalProperties}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  {stats.activeProperties} active
                </p>
              </div>

              <div className="bg-purple-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-medium text-purple-900">
                    Bookings
                  </h3>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.totalBookings}
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  {stats.completedBookings} completed • {stats.pendingBookings}{" "}
                  pending
                </p>
              </div>

              <div className="bg-yellow-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <h3 className="text-sm font-medium text-yellow-900">
                    Reviews
                  </h3>
                </div>
                <p className="text-2xl font-bold text-yellow-600">
                  {(stats.averageRating ?? 0).toFixed(1)}
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  {stats.totalReviews ?? 0} total reviews
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Top Realtors */}
        <motion.div
          className="bg-white rounded-3xl shadow-sm border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Top Realtors
              </h2>
              <button
                onClick={() => (window.location.href = "/admin/realtors")}
                className="text-sm text-blue-600 font-medium hover:text-blue-700"
              >
                View all
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {analytics?.breakdowns.topRealtors &&
            analytics.breakdowns.topRealtors.length > 0 ? (
              analytics.breakdowns.topRealtors.slice(0, 5).map((realtor) => (
                <div key={realtor.id} className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {realtor.businessName.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {realtor.businessName}
                    </h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center space-x-1">
                        <Home className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {realtor.propertyCount} properties
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {realtor.bookingCount} bookings
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      ₦{(parseFloat(realtor.totalRevenue) / 1000).toFixed(0)}K
                    </p>
                    <p className="text-xs text-gray-500">revenue</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No realtor data available</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Avg. Rating",
            value: (stats.averageRating ?? 0).toFixed(1),
            icon: Star,
            color: "text-yellow-600",
          },
          {
            label: "Active Realtors",
            value: (stats.activeRealtors ?? 0).toString(),
            icon: Users,
            color: "text-blue-600",
          },
          {
            label: "Occupancy Rate",
            value: `${(stats.occupancyRate ?? 0).toFixed(1)}%`,
            icon: Home,
            color: "text-green-600",
          },
          {
            label: "Conversion Rate",
            value: `${(stats.conversionRate ?? 0).toFixed(1)}%`,
            icon: TrendingUp,
            color: "text-purple-600",
          },
        ].map((stat, index) => (
          <motion.div
            key={index}
            className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color} opacity-20`} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
