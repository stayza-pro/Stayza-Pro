"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Sparkles, Wifi, WifiOff } from "lucide-react";
import { useBranding } from "@/hooks/useBranding";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import WelcomeHeader from "./WelcomeHeader";
import StatisticsGrid from "./StatisticsGrid";
import QuickActionsPanel from "./QuickActionsPanel";
import RevenueChartPanel from "./RevenueChartPanel";
import RecentBookingsPanel from "./RecentBookingsPanel";
import UpcomingEventsPanel from "./UpcomingEventsPanel";
import BusinessInsightsPanel from "./BusinessInsightsPanel";

export default function RealtorDashboardMain() {
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

  // Real-time updates
  const { isConnected, unreadCount, latestNotification, refreshUnreadCount } =
    useRealTimeUpdates();

  // Refresh dashboard when new notifications arrive
  useEffect(() => {
    if (latestNotification) {
      // Refresh dashboard data when booking/payment notifications arrive
      if (
        latestNotification.type.includes("booking") ||
        latestNotification.type.includes("payment")
      ) {
        refresh();
      }
    }
  }, [latestNotification, refresh]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 p-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            </motion.div>
            <motion.div
              className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <motion.p
            className="text-gray-700 font-medium text-lg"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Loading your dashboard...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-50 p-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <span className="text-red-600 text-3xl">⚠️</span>
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Connection Error
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">{error}</p>
          <motion.button
            onClick={refresh}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2 mx-auto font-medium"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Retry Connection</span>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50 min-h-screen relative">
      {/* Real-time Connection Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 right-4 z-50"
      >
        <motion.div
          animate={{
            scale: isConnected ? [1, 1.05, 1] : 1,
          }}
          transition={{
            duration: 2,
            repeat: isConnected ? Infinity : 0,
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg backdrop-blur-sm ${
            isConnected
              ? "bg-green-100/90 text-green-700"
              : "bg-red-100/90 text-red-700"
          }`}
        >
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4" />
              <span className="text-sm font-bold">Live</span>
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 bg-green-500 rounded-full"
              />
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-bold">Offline</span>
            </>
          )}
        </motion.div>
      </motion.div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        {/* Welcome Header with subtle animation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <WelcomeHeader
            userName={userName}
            todayStats={todayStats}
            brandColors={branding?.colors}
          />
        </motion.div>

        {/* Statistics Grid with stagger animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <StatisticsGrid stats={stats} />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Charts and Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Quick Actions */}
            <QuickActionsPanel brandColors={branding?.colors} />

            {/* Revenue Chart */}
            <RevenueChartPanel />

            {/* Recent Bookings */}
            <RecentBookingsPanel bookings={recentBookings} />
          </motion.div>

          {/* Right Column - Insights and Events */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Business Insights */}
            <BusinessInsightsPanel stats={stats} />

            {/* Upcoming Events */}
            <UpcomingEventsPanel brandColors={branding?.colors} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
