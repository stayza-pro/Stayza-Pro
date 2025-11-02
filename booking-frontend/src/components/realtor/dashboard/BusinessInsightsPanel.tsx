"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Star,
  Home,
  Users,
  Award,
  Target,
  Sparkles,
  Trophy,
} from "lucide-react";

interface StatsData {
  totalRevenue: {
    value: string;
    change: { value: number; type: "increase" | "decrease" };
  };
  activeBookings: {
    value: string;
    change: { value: number; type: "increase" | "decrease" };
  };
  propertiesListed: {
    value: string;
    change: { value: number; type: "increase" | "decrease" };
  };
  guestSatisfaction: {
    value: string;
    change: { value: number; type: "increase" | "decrease" };
  };
}

interface BusinessInsightsPanelProps {
  stats: StatsData;
}

export default function BusinessInsightsPanel({
  stats,
}: BusinessInsightsPanelProps) {
  const [hoveredInsight, setHoveredInsight] = useState<string | null>(null);

  const insights = [
    {
      id: "top-property",
      icon: Award,
      label: "Top Performing Property",
      value: "Luxury 2BR Apartment",
      metric: "15 bookings this month",
      gradient: "from-amber-500 to-yellow-600",
      bg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      id: "guest-rating",
      icon: Star,
      label: "Average Guest Rating",
      value: stats.guestSatisfaction.value,
      metric: "Excellent performance",
      gradient: "from-purple-500 to-pink-600",
      bg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      id: "occupancy",
      icon: Home,
      label: "Occupancy Rate",
      value: "87%",
      metric: "Above industry average",
      gradient: "from-green-500 to-emerald-600",
      bg: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      id: "response-time",
      icon: Users,
      label: "Response Time",
      value: "< 2 hours",
      metric: "Quick responder badge",
      gradient: "from-blue-500 to-indigo-600",
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.7 }}
      className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Business Insights
            </h2>
            <p className="text-sm text-gray-500">Key performance metrics</p>
          </div>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="space-y-3">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          const isHovered = hoveredInsight === insight.id;

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.08 }}
              onHoverStart={() => setHoveredInsight(insight.id)}
              onHoverEnd={() => setHoveredInsight(null)}
              whileHover={{ scale: 1.02, x: 4 }}
              className={`relative overflow-hidden p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                isHovered
                  ? `border-transparent shadow-xl ${insight.bg}`
                  : "border-gray-100 bg-gray-50 shadow-sm"
              }`}
            >
              {/* Animated gradient background */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${insight.gradient} opacity-0`}
                animate={{ opacity: isHovered ? 0.1 : 0 }}
                transition={{ duration: 0.3 }}
              />

              <div className="flex items-start space-x-3 relative z-10">
                {/* Icon */}
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className={`p-3 rounded-xl ${insight.bg} shadow-md`}
                >
                  <Icon className={`w-5 h-5 ${insight.iconColor}`} />
                </motion.div>

                {/* Content */}
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                    {insight.label}
                  </p>
                  <p className="text-xl font-bold text-gray-900 mb-1">
                    {insight.value}
                  </p>
                  <p className="text-xs text-gray-600 font-medium">
                    {insight.metric}
                  </p>
                </div>

                {/* Hover sparkle */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0, rotate: 0 }}
                      animate={{ opacity: 1, scale: 1, rotate: 360 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute top-3 right-3"
                    >
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Performance Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="mt-6 pt-6 border-t border-gray-100"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-purple-100 shadow-lg">
          {/* Animated background orbs */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full blur-3xl opacity-30 animate-pulse" />
          <div
            className="absolute bottom-0 left-0 w-24 h-24 bg-blue-200 rounded-full blur-2xl opacity-30 animate-pulse"
            style={{ animationDelay: "1s" }}
          />

          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg"
              >
                <Trophy className="w-5 h-5 text-white" />
              </motion.div>
              <h3 className="font-bold text-gray-900 text-lg">
                Performance Status
              </h3>
            </div>

            <p className="text-sm text-gray-700 mb-4 font-medium">
              🎉 You're in the{" "}
              <span className="font-bold text-purple-600">top 10%</span> of
              realtors on the platform!
            </p>

            {/* Progress bar */}
            <div className="relative">
              <div className="w-full bg-white/80 rounded-full h-3 shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "90%" }}
                  transition={{ delay: 1.4, duration: 1.2, ease: "easeOut" }}
                  className="relative h-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-lg"
                >
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </motion.div>
              </div>
              <p className="text-right text-xs font-bold text-purple-600 mt-2">
                90% Performance Score
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
