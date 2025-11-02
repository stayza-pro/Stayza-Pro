"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  TrendingUp,
  Users,
  MapPin,
  Clock,
  Star,
  Bell,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { useBranding } from "@/hooks/useBranding";
import { useDashboardData } from "@/hooks/useDashboardData";
import StatCard from "./components/StatCard";
import QuickActions from "./components/QuickActions";
import RevenueChart from "./components/RevenueChart";
import RecentBookings from "./components/RecentBookings";
import InsightsPanel from "./components/InsightsPanel";

export default function DashboardHome() {
  const { branding } = useBranding();
  const {
    stats,
    userName,
    todayStats,
    recentBookings,
    loading,
    error,
    refresh,
  } = useDashboardData();

  // Hero greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const statCards = [
    {
      title: "Total Revenue",
      value: stats.totalRevenue.value,
      change: stats.totalRevenue.change,
      icon: TrendingUp,
    },
    {
      title: "Active Bookings",
      value: stats.activeBookings.value,
      change: stats.activeBookings.change,
      icon: Calendar,
    },
    {
      title: "Properties Listed",
      value: stats.propertiesListed.value,
      change: stats.propertiesListed.change,
      icon: MapPin,
    },
    {
      title: "Guest Satisfaction",
      value: stats.guestSatisfaction.value,
      change: stats.guestSatisfaction.change,
      icon: Star,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Connection Error
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
          <p className="text-sm text-gray-500 mt-3">
            Showing fallback data below
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6 lg:space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 lg:p-8 border border-gray-100 shadow-sm"
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="mb-6 lg:mb-0">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2"
              >
                {getGreeting()}, {userName}! 👋
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-gray-600 text-lg"
              >
                Here's what's happening with your properties today
              </motion.p>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex flex-wrap items-center gap-6 mt-6"
              >
                <div className="flex items-center space-x-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: branding?.colors?.primary || "#10B981" }}
                  />
                  <span className="text-gray-700">
                    {todayStats.newBookings} new bookings today
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">
                    {todayStats.checkIns} check-ins pending
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Bell className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">
                    {todayStats.messages} messages waiting
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Date and Time */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-right"
            >
              <div className="text-sm text-gray-500 mb-1">Today</div>
              <div
                className="text-2xl font-bold"
                style={{ color: branding?.colors?.primary || "#3B82F6" }}
              >
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <div className="text-sm text-gray-600">
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                })}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Statistics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Charts and Actions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <QuickActions />
            </motion.div>

            {/* Revenue Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <RevenueChart />
            </motion.div>

            {/* Recent Bookings Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <RecentBookings bookings={recentBookings} />
            </motion.div>
          </div>

          {/* Right Column - Insights */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <InsightsPanel />
            </motion.div>

            {/* Upcoming Events */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="bg-white rounded-2xl p-6 shadow-md border border-gray-100"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Upcoming Events
                </h3>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div
                    className="w-3 h-3 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: branding?.colors?.primary || "#3B82F6" }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      Property Inspection
                    </p>
                    <p className="text-sm text-gray-600">
                      Luxury 2BR Apartment
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Tomorrow, 10:00 AM
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div
                    className="w-3 h-3 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: branding?.colors?.accent || "#F59E0B" }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Guest Check-in</p>
                    <p className="text-sm text-gray-600">John & Mary Smith</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Dec 28, 3:00 PM
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div
                    className="w-3 h-3 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: branding?.colors?.primary || "#10B981" }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      Maintenance Schedule
                    </p>
                    <p className="text-sm text-gray-600">
                      AC Service - Unit 204
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Dec 30, 9:00 AM
                    </p>
                  </div>
                </div>
              </div>

              <button
                className="w-full mt-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-gray-50"
                style={{ color: branding?.colors?.primary || "#3B82F6" }}
              >
                View All Events
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
