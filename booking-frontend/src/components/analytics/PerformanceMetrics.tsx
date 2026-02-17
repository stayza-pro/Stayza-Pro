"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Star,
  Calendar,
  Award,
  Filter,
} from "lucide-react";
import { PropertyAnalytics } from "@/types/analytics";

interface PerformanceMetricsProps {
  analytics: PropertyAnalytics;
  propertyId: string;
}

type MetricCategory = "occupancy" | "revenue" | "guest" | "review" | "all";

interface PerformanceGoal {
  id: string;
  category: MetricCategory;
  title: string;
  target: number;
  current: number;
  unit: "percentage" | "currency" | "number" | "rating";
  trend: "up" | "down" | "stable";
  status: "achieved" | "at_risk" | "needs_attention";
  description: string;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  analytics,
  propertyId,
}) => {
  const [selectedCategory, setSelectedCategory] =
    useState<MetricCategory>("all");

  // Generate performance goals based on analytics data
  const generateGoals = (): PerformanceGoal[] => {
    return [
      {
        id: "occupancy-rate",
        category: "occupancy",
        title: "Occupancy Rate Target",
        target: 75,
        current: analytics.occupancy.currentOccupancy.value,
        unit: "percentage",
        trend: analytics.occupancy.currentOccupancy.trend,
        status:
          analytics.occupancy.currentOccupancy.value >= 75
            ? "achieved"
            : analytics.occupancy.currentOccupancy.value >= 65
            ? "at_risk"
            : "needs_attention",
        description: "Maintain minimum 75% occupancy rate for optimal revenue",
      },
      {
        id: "avg-daily-rate",
        category: "revenue",
        title: "Average Daily Rate",
        target: 150,
        current: analytics.revenue.averageDailyRate.value,
        unit: "currency",
        trend: analytics.revenue.averageDailyRate.trend,
        status:
          analytics.revenue.averageDailyRate.value >= 150
            ? "achieved"
            : analytics.revenue.averageDailyRate.value >= 130
            ? "at_risk"
            : "needs_attention",
        description: "Target ADR of $150 to maximize revenue per room",
      },
      {
        id: "revpar",
        category: "revenue",
        title: "Revenue Per Available Room",
        target: 112.5,
        current: analytics.revenue.revPAR.value,
        unit: "currency",
        trend: analytics.revenue.revPAR.trend,
        status:
          analytics.revenue.revPAR.value >= 112.5
            ? "achieved"
            : analytics.revenue.revPAR.value >= 95
            ? "at_risk"
            : "needs_attention",
        description: "RevPAR target based on 75% occupancy × $150 ADR",
      },
      {
        id: "guest-satisfaction",
        category: "guest",
        title: "Guest Satisfaction Score",
        target: 4.5,
        current: analytics.guests.guestSatisfaction.rating,
        unit: "rating",
        trend: analytics.guests.guestSatisfaction.trend,
        status:
          analytics.guests.guestSatisfaction.rating >= 4.5
            ? "achieved"
            : analytics.guests.guestSatisfaction.rating >= 4.0
            ? "at_risk"
            : "needs_attention",
        description: "Maintain high guest satisfaction with 4.5+ rating",
      },
      {
        id: "returning-guests",
        category: "guest",
        title: "Returning Guest Rate",
        target: 25,
        current: analytics.guests.returningGuestRate.value,
        unit: "percentage",
        trend: analytics.guests.returningGuestRate.trend,
        status:
          analytics.guests.returningGuestRate.value >= 25
            ? "achieved"
            : analytics.guests.returningGuestRate.value >= 20
            ? "at_risk"
            : "needs_attention",
        description: "Build loyalty with 25% returning guest rate",
      },
      {
        id: "average-rating",
        category: "review",
        title: "Average Review Rating",
        target: 4.7,
        current: analytics.reviews.averageRating.value,
        unit: "rating",
        trend: analytics.reviews.averageRating.trend,
        status:
          analytics.reviews.averageRating.value >= 4.7
            ? "achieved"
            : analytics.reviews.averageRating.value >= 4.3
            ? "at_risk"
            : "needs_attention",
        description: "Achieve excellence with 4.7+ average rating",
      },
      {
        id: "response-rate",
        category: "review",
        title: "Review Response Rate",
        target: 90,
        current: analytics.reviews.responseRate.value,
        unit: "percentage",
        trend: analytics.reviews.responseRate.trend || "stable",
        status:
          analytics.reviews.responseRate.value >= 90
            ? "achieved"
            : analytics.reviews.responseRate.value >= 80
            ? "at_risk"
            : "needs_attention",
        description: "Engage with guests through 90% response rate",
      },
      {
        id: "cancellation-rate",
        category: "occupancy",
        title: "Cancellation Rate",
        target: 5, // Lower is better
        current: analytics.bookings.cancellationRate.value,
        unit: "percentage",
        trend:
          analytics.bookings.cancellationRate.trend === "up"
            ? "down"
            : analytics.bookings.cancellationRate.trend === "down"
            ? "up"
            : "stable",
        status:
          analytics.bookings.cancellationRate.value <= 5
            ? "achieved"
            : analytics.bookings.cancellationRate.value <= 10
            ? "at_risk"
            : "needs_attention",
        description: "Minimize cancellations below 5%",
      },
    ];
  };

  const goals = generateGoals();
  const filteredGoals =
    selectedCategory === "all"
      ? goals
      : goals.filter((goal) => goal.category === selectedCategory);

  // Calculate category stats
  const getCategoryStats = () => {
    const stats = {
      all: { achieved: 0, at_risk: 0, needs_attention: 0, total: goals.length },
      occupancy: { achieved: 0, at_risk: 0, needs_attention: 0, total: 0 },
      revenue: { achieved: 0, at_risk: 0, needs_attention: 0, total: 0 },
      guest: { achieved: 0, at_risk: 0, needs_attention: 0, total: 0 },
      review: { achieved: 0, at_risk: 0, needs_attention: 0, total: 0 },
    };

    goals.forEach((goal) => {
      stats.all[goal.status]++;
      stats[goal.category][goal.status]++;
      stats[goal.category].total++;
    });

    return stats;
  };

  const categoryStats = getCategoryStats();

  // Format value based on unit
  const formatValue = (value: number, unit: string) => {
    switch (unit) {
      case "percentage":
        return `${value.toFixed(1)}%`;
      case "currency":
        return new Intl.NumberFormat("en-NG", {
          style: "currency",
          currency: "NGN",
          currencyDisplay: "narrowSymbol",
          minimumFractionDigits: 0,
        }).format(value);
      case "rating":
        return `${value.toFixed(1)}/5.0`;
      default:
        return value.toString();
    }
  };

  // Get status configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "achieved":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        };
      case "at_risk":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
        };
      case "needs_attention":
        return {
          icon: AlertCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        };
      default:
        return {
          icon: Clock,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        };
    }
  };

  // Calculate progress percentage
  const getProgress = (current: number, target: number, unit: string) => {
    if (unit === "percentage" && target === 5) {
      // For cancellation rate (lower is better)
      return Math.min(100, Math.max(0, ((15 - current) / 10) * 100)); // 0% at 15%, 100% at 5%
    }
    return Math.min(100, (current / target) * 100);
  };

  const categories = [
    { id: "all", label: "All Metrics", icon: Target },
    { id: "occupancy", label: "Occupancy", icon: Calendar },
    { id: "revenue", label: "Revenue", icon: DollarSign },
    { id: "guest", label: "Guest", icon: Users },
    { id: "review", label: "Reviews", icon: Star },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Performance Metrics
          </h2>
          <p className="text-gray-600">
            Track your property's performance against key targets
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {categories.map((category) => {
            const Icon = category.icon;
            const stats = categoryStats[category.id];
            const isActive = selectedCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() =>
                  setSelectedCategory(category.id as MetricCategory)
                }
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  isActive
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{category.label}</span>
                {category.id !== "all" && (
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      isActive
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {stats.achieved}/{stats.total}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-900">Achieved</span>
          </div>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {categoryStats[selectedCategory].achieved}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-medium text-gray-900">At Risk</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {categoryStats[selectedCategory].at_risk}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-gray-900">
              Needs Attention
            </span>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {categoryStats[selectedCategory].needs_attention}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">
              Success Rate
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {Math.round(
              (categoryStats[selectedCategory].achieved /
                categoryStats[selectedCategory].total) *
                100
            )}
            %
          </p>
        </div>
      </motion.div>

      {/* Goals List */}
      <div className="space-y-4">
        {filteredGoals.map((goal, index) => {
          const statusConfig = getStatusConfig(goal.status);
          const StatusIcon = statusConfig.icon;
          const progress = getProgress(goal.current, goal.target, goal.unit);

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-lg border p-6 ${statusConfig.borderColor}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
                      <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {goal.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {goal.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 mt-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Current
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatValue(goal.current, goal.unit)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Target
                      </p>
                      <p className="text-xl font-bold text-blue-600">
                        {formatValue(goal.target, goal.unit)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Progress
                      </p>
                      <p className="text-xl font-bold text-purple-600">
                        {progress.toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Progress to Target</span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                        className={`h-2 rounded-full ${
                          goal.status === "achieved"
                            ? "bg-green-500"
                            : goal.status === "at_risk"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Trend Indicator */}
                <div className="flex flex-col items-center space-y-2">
                  {goal.trend === "up" && (
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  )}
                  {goal.trend === "down" && (
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  )}
                  {goal.trend === "stable" && (
                    <div className="h-6 w-6 border-2 border-gray-400 rounded" />
                  )}
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}
                  >
                    {goal.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
