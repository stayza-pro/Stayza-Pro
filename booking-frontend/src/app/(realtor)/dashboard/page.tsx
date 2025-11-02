"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Home,
  Star,
  Calendar,
  Clock,
  MessageSquare,
  Activity,
  Loader2,
  AlertCircle,
  BarChart3,
  Users,
  CheckCircle,
  Package,
  Copy,
  Eye,
} from "lucide-react";
import { useRealtorStats } from "@/hooks/realtor/useRealtorStats";
import { useBusinessInsights } from "@/hooks/realtor/useBusinessInsights";
import { useBookingsData } from "@/hooks/realtor/useBookingsData";
import { useRevenueData } from "@/hooks/realtor/useRevenueData";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import { useBranding } from "@/hooks/useBranding";
import { getRealtorSubdomain } from "@/utils/subdomain";
import { format } from "date-fns";

export default function RealtorDashboardPage() {
  const { user } = useAuth();
  const { showSuccess } = useAlert();
  const { branding } = useBranding();
  const realtorSubdomain = getRealtorSubdomain();
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useRealtorStats();
  const { insights: insightsData, isLoading: insightsLoading } =
    useBusinessInsights();
  const { bookings, isLoading: bookingsLoading } = useBookingsData({
    status: "CONFIRMED",
    limit: 5,
  });
  const { data: revenueChartData, isLoading: revenueLoading } =
    useRevenueData("30d");

  const brandColor = branding?.colors?.primary || "#3B82F6";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess("Copied to clipboard!");
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-spin" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600">{statsError}</p>
        </div>
      </div>
    );
  }

  const stats = statsData || {
    totalRevenue: 0,
    revenueChange: { value: 0, type: "increase" as const },
    activeBookings: 0,
    bookingsChange: { value: 0, type: "increase" as const },
    propertiesListed: 0,
    propertiesChange: { value: 0, type: "increase" as const },
    guestSatisfaction: 0,
    satisfactionChange: { value: 0, type: "increase" as const },
    todayStats: {
      newBookings: 0,
      checkIns: 0,
      messages: 0,
    },
  };

  const insights = insightsData || {
    topProperty: null,
    averageGuestRating: 0,
    occupancyRate: 0,
    averageResponseTime: 0,
    performanceBadge: { level: "bronze", score: 0 },
  };

  return (
    <div className="min-h-screen space-y-6 pb-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 border border-gray-200"
        style={{
          borderTopWidth: "4px",
          borderTopColor: brandColor,
        }}
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName || "User"}! 👋
        </h1>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-gray-600 text-sm">Your website:</span>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative group"
            >
              <span
                className="font-bold px-4 py-2 rounded-lg text-sm border-2 cursor-pointer"
                style={{
                  color: brandColor,
                  backgroundColor: brandColor + "10",
                  borderColor: brandColor + "30",
                }}
                onClick={() =>
                  copyToClipboard(
                    `https://${realtorSubdomain || "yourcompany"}.stayza.pro`
                  )
                }
              >
                {realtorSubdomain || "yourcompany"}.stayza.pro
              </span>
            </motion.div>
          </div>
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                copyToClipboard(
                  `https://${realtorSubdomain || "yourcompany"}.stayza.pro`
                )
              }
              className="px-5 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium hover:border-gray-300 hover:shadow-lg transition-all flex items-center space-x-2 bg-white"
            >
              <Copy className="w-4 h-4 text-gray-600" />
              <span className="text-gray-700">Copy Link</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                window.open(
                  `https://${realtorSubdomain || "yourcompany"}.stayza.pro`,
                  "_blank"
                )
              }
              className="px-5 py-2.5 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all flex items-center space-x-2"
              style={{ backgroundColor: brandColor }}
            >
              <Eye className="w-4 h-4" />
              <span>Preview Site</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue",
            value: `₦${stats.totalRevenue.toLocaleString()}`,
            icon: TrendingUp,
            iconBg: "bg-green-50",
            iconColor: "text-green-600",
          },
          {
            label: "Active Bookings",
            value: stats.activeBookings,
            icon: Calendar,
            iconBg: `${brandColor}10`,
            iconColor: brandColor,
          },
          {
            label: "Properties Listed",
            value: stats.propertiesListed,
            icon: Home,
            iconBg: "bg-purple-50",
            iconColor: "text-purple-600",
          },
          {
            label: "Guest Satisfaction",
            value: `${stats.guestSatisfaction}%`,
            icon: Star,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          const useBrandIcon = stat.label === "Active Bookings";
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 rounded-xl ${
                    !useBrandIcon ? stat.iconBg : ""
                  }`}
                  style={
                    useBrandIcon
                      ? {
                          backgroundColor: `${brandColor}15`,
                        }
                      : {}
                  }
                >
                  <Icon
                    className={`w-5 h-5 ${!useBrandIcon ? stat.iconColor : ""}`}
                    style={useBrandIcon ? { color: brandColor } : {}}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Today's Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 border border-gray-200"
      >
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Today's Activity
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${brandColor}15` }}
            >
              <Calendar className="w-5 h-5" style={{ color: brandColor }} />
            </div>
            <div>
              <p className="text-sm text-gray-600">New Bookings</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.todayStats.newBookings}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Check-ins Today</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.todayStats.checkIns}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <MessageSquare className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Messages Waiting</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.todayStats.messages}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Revenue Overview
              </h2>
              <p className="text-sm text-gray-600">Last 30 days</p>
            </div>
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${brandColor}15` }}
            >
              <BarChart3 className="w-5 h-5" style={{ color: brandColor }} />
            </div>
          </div>

          {revenueLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : (
            <div className="h-64 flex items-end justify-between gap-2">
              {revenueChartData?.map((item: any, index: number) => {
                const maxValue = Math.max(
                  ...revenueChartData.map((d: any) => d.revenue),
                  1
                );
                const heightPercent = (item.revenue / maxValue) * 100;
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <div
                      className="w-full flex items-end"
                      style={{ height: "200px" }}
                    >
                      <div
                        className="w-full rounded-t-lg transition-all"
                        style={{
                          height: `${heightPercent}%`,
                          backgroundColor: brandColor,
                          opacity: 0.8,
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.opacity = "1")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.opacity = "0.8")
                        }
                        title={`${item.label}: $${item.revenue}`}
                      />
                    </div>
                    <span className="text-xs text-gray-600 font-medium">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Business Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border border-gray-200"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Business Insights
          </h2>

          {insightsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {insights.topProperty && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Top Property</p>
                  <p className="font-bold text-gray-900">
                    {insights.topProperty.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {insights.topProperty.bookings} bookings
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-current" />
                    <span className="font-bold text-gray-900">
                      {insights.averageGuestRating.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Occupancy</p>
                  <p className="font-bold text-gray-900">
                    {insights.occupancyRate}%
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Performance Badge
                  </span>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                      insights.performanceBadge.level === "platinum"
                        ? "bg-purple-600"
                        : insights.performanceBadge.level === "gold"
                        ? "bg-amber-500"
                        : insights.performanceBadge.level === "silver"
                        ? "bg-gray-400"
                        : "bg-orange-600"
                    }`}
                  >
                    {insights.performanceBadge.level.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Bookings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 border border-gray-200"
      >
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Recent Bookings
        </h2>

        {bookingsLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No recent bookings</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      {booking.property?.title || "Property"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {booking.guest?.firstName} {booking.guest?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {booking.checkIn &&
                        format(new Date(booking.checkIn), "MMM dd")}{" "}
                      -
                      {booking.checkOut &&
                        format(new Date(booking.checkOut), "MMM dd")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    ₦{booking.totalPrice?.toLocaleString()}
                  </p>
                  <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded">
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
