"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  MapPin,
  Clock,
  Star,
  Users,
  Calendar,
  Award,
  Target,
} from "lucide-react";
import { useBrand } from "../context/BrandContext";

interface Insight {
  id: string;
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    type: "increase" | "decrease" | "neutral";
  };
  color: string;
}

interface InsightsPanelProps {
  title?: string;
  className?: string;
}

export default function InsightsPanel({
  title = "Business Insights",
  className = "",
}: InsightsPanelProps) {
  const { brand } = useBrand();

  const insights: Insight[] = [
    {
      id: "best-property",
      title: "Best Performing Property",
      value: "Luxury 2BR Apartment",
      description: "85% occupancy rate this month",
      icon: Award,
      trend: { value: 12, type: "increase" },
      color: brand.colors.success,
    },
    {
      id: "top-city",
      title: "Top City by Bookings",
      value: "Lagos, Victoria Island",
      description: "60% of total bookings",
      icon: MapPin,
      color: brand.colors.primary,
    },
    {
      id: "avg-stay",
      title: "Average Stay Duration",
      value: "4.2 nights",
      description: "Up from 3.8 nights last month",
      icon: Clock,
      trend: { value: 8, type: "increase" },
      color: brand.colors.accent,
    },
    {
      id: "guest-rating",
      title: "Average Guest Rating",
      value: "4.8/5.0",
      description: "Based on 127 reviews",
      icon: Star,
      color: "#F59E0B", // Golden yellow
    },
    {
      id: "repeat-guests",
      title: "Repeat Guest Rate",
      value: "32%",
      description: "Guests who book again",
      icon: Users,
      trend: { value: 5, type: "increase" },
      color: "#8B5CF6", // Purple
    },
    {
      id: "booking-lead-time",
      title: "Booking Lead Time",
      value: "14 days",
      description: "Average advance booking",
      icon: Calendar,
      color: "#06B6D4", // Cyan
    },
  ];

  const getTrendIcon = (type: "increase" | "decrease" | "neutral") => {
    switch (type) {
      case "increase":
        return "↗";
      case "decrease":
        return "↘";
      default:
        return "→";
    }
  };

  const getTrendColor = (type: "increase" | "decrease" | "neutral") => {
    switch (type) {
      case "increase":
        return "#10B981"; // Green
      case "decrease":
        return "#EF4444"; // Red
      default:
        return "#6B7280"; // Gray
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className={`bg-white rounded-2xl p-6 shadow-md border border-gray-100 ${className}`}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <TrendingUp
            className="w-5 h-5"
            style={{ color: brand.colors.primary }}
          />
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-sm text-gray-600">
          Key performance indicators for your business
        </p>
      </div>

      {/* Insights Grid */}
      <div className="space-y-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon;

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
              className="group p-4 rounded-xl hover:bg-gray-50 transition-all duration-300 cursor-pointer border border-transparent hover:border-gray-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: `${insight.color}15` }}
                  >
                    <div style={{ color: insight.color }}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                      {insight.title}
                    </h4>
                    <p
                      className="text-lg font-bold mt-1"
                      style={{ color: insight.color }}
                    >
                      {insight.value}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {insight.description}
                    </p>
                  </div>
                </div>

                {/* Trend Indicator */}
                {insight.trend && (
                  <div className="ml-3">
                    <div
                      className="flex items-center px-2 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: `${getTrendColor(
                          insight.trend.type
                        )}15`,
                        color: getTrendColor(insight.trend.type),
                      }}
                    >
                      <span className="mr-1">
                        {getTrendIcon(insight.trend.type)}
                      </span>
                      {insight.trend.value}%
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Bar for certain metrics */}
              {(insight.id === "best-property" ||
                insight.id === "guest-rating" ||
                insight.id === "repeat-guests") && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width:
                          insight.id === "best-property"
                            ? "85%"
                            : insight.id === "guest-rating"
                            ? "96%"
                            : "32%",
                      }}
                      transition={{
                        delay: 1 + index * 0.1,
                        duration: 1,
                        ease: "easeOut",
                      }}
                      className="h-2 rounded-full"
                      style={{ backgroundColor: insight.color }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Action Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="mt-6 pt-4 border-t border-gray-100"
      >
        <button
          className="w-full py-3 px-4 rounded-xl font-medium text-white transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
          style={{ backgroundColor: brand.colors.primary }}
        >
          <div className="flex items-center justify-center space-x-2">
            <Target className="w-4 h-4" />
            <span>View Detailed Analytics</span>
          </div>
        </button>
      </motion.div>
    </motion.div>
  );
}
