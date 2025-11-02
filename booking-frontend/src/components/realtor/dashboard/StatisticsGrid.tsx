"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  TrendingUp,
  MapPin,
  Star,
  ArrowUp,
  ArrowDown,
  Sparkles,
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

interface StatisticsGridProps {
  stats: StatsData;
}

export default function StatisticsGrid({ stats }: StatisticsGridProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [animateValue, setAnimateValue] = useState(false);

  useEffect(() => {
    setAnimateValue(true);
  }, [stats]);

  const statCards = [
    {
      title: "Total Revenue",
      value: stats.totalRevenue.value,
      change: stats.totalRevenue.change.value,
      type: stats.totalRevenue.change.type,
      icon: TrendingUp,
      gradient: "from-blue-500 via-blue-600 to-blue-700",
      glowColor: "shadow-blue-500/20",
      lightBg: "bg-blue-50",
      darkBg: "bg-gradient-to-br from-blue-500 to-blue-600",
    },
    {
      title: "Active Bookings",
      value: stats.activeBookings.value,
      change: stats.activeBookings.change.value,
      type: stats.activeBookings.change.type,
      icon: Calendar,
      gradient: "from-green-500 via-green-600 to-green-700",
      glowColor: "shadow-green-500/20",
      lightBg: "bg-green-50",
      darkBg: "bg-gradient-to-br from-green-500 to-green-600",
    },
    {
      title: "Properties Listed",
      value: stats.propertiesListed.value,
      change: stats.propertiesListed.change.value,
      type: stats.propertiesListed.change.type,
      icon: MapPin,
      gradient: "from-purple-500 via-purple-600 to-purple-700",
      glowColor: "shadow-purple-500/20",
      lightBg: "bg-purple-50",
      darkBg: "bg-gradient-to-br from-purple-500 to-purple-600",
    },
    {
      title: "Guest Satisfaction",
      value: stats.guestSatisfaction.value,
      change: stats.guestSatisfaction.change.value,
      type: stats.guestSatisfaction.change.type,
      icon: Star,
      gradient: "from-amber-500 via-amber-600 to-amber-700",
      glowColor: "shadow-amber-500/20",
      lightBg: "bg-amber-50",
      darkBg: "bg-gradient-to-br from-amber-500 to-amber-600",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
    >
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        const isPositive = stat.type === "increase";
        const isHovered = hoveredCard === stat.title;

        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
            onHoverStart={() => setHoveredCard(stat.title)}
            onHoverEnd={() => setHoveredCard(null)}
            whileHover={{ y: -8, scale: 1.02 }}
            className={`relative bg-white rounded-3xl p-6 shadow-lg border border-gray-100 hover:border-gray-200 transition-all duration-300 overflow-hidden group cursor-pointer ${
              isHovered ? `${stat.glowColor} shadow-2xl` : ""
            }`}
          >
            {/* Animated background gradient on hover */}
            <motion.div
              className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
              initial={false}
              animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
            />

            {/* Sparkle effect on hover */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="absolute top-4 right-4"
                >
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative z-10">
              {/* Icon and Change Badge */}
              <div className="flex items-start justify-between mb-4">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className={`p-3 rounded-2xl ${stat.lightBg} border border-gray-100 shadow-sm`}
                >
                  <Icon
                    className={`w-6 h-6 bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`}
                    style={{
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                      stroke: "url(#gradient)",
                      strokeWidth: 2,
                    }}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                    isPositive
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200"
                      : "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200"
                  }`}
                >
                  <motion.div
                    animate={{ y: isPositive ? [-2, 0, -2] : [2, 0, 2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {isPositive ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )}
                  </motion.div>
                  <span>
                    {isPositive ? "+" : ""}
                    {stat.change}%
                  </span>
                </motion.div>
              </div>

              {/* Value with counter animation */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <h3 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                  {stat.value}
                </h3>
              </motion.div>

              {/* Title */}
              <p className="text-gray-600 text-sm font-medium">{stat.title}</p>

              {/* Hover effect bar */}
              <motion.div
                className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} rounded-b-3xl`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: isHovered ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                style={{ transformOrigin: "left" }}
              />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
