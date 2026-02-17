"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Home,
  DollarSign,
  Users,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Target,
  Award,
  AlertTriangle,
} from "lucide-react";
import { PropertyAnalytics, AnalyticsTimeRange } from "@/types/analytics";
import { MetricCard } from "./MetricCard";
import { TrendChart } from "./charts/TrendChart";

interface AnalyticsOverviewProps {
  analytics: PropertyAnalytics;
  timeRange: AnalyticsTimeRange;
}

export const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({
  analytics,
  timeRange,
}) => {
  const { occupancy, revenue, guests, reviews, bookings } = analytics;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Get trend icon and color
  const getTrendDisplay = (
    trend: "up" | "down" | "stable",
    change?: number
  ) => {
    if (trend === "up") {
      return {
        icon: TrendingUp,
        color: "text-green-600",
        bgColor: "bg-green-100",
        change: change ? `+${change.toFixed(1)}%` : "+0%",
      };
    } else if (trend === "down") {
      return {
        icon: TrendingDown,
        color: "text-red-600",
        bgColor: "bg-red-100",
        change: change ? `-${Math.abs(change).toFixed(1)}%` : "-0%",
      };
    } else {
      return {
        icon: Minus,
        color: "text-gray-600",
        bgColor: "bg-gray-100",
        change: "0%",
      };
    }
  };

  // Calculate days in period
  const daysDiff = Math.ceil(
    (timeRange.end.getTime() - timeRange.start.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-8">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <MetricCard
            title="Occupancy Rate"
            value={formatPercentage(occupancy.currentOccupancy.value)}
            change={occupancy.currentOccupancy.change}
            trend={occupancy.currentOccupancy.trend}
            icon={Home}
            description="Current occupancy vs available rooms"
            color="blue"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(revenue.totalRevenue.value)}
            change={revenue.totalRevenue.change}
            trend={revenue.totalRevenue.trend}
            icon={DollarSign}
            description={`Over ${daysDiff} days`}
            color="green"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <MetricCard
            title="Total Guests"
            value={guests.totalGuests.value.toString()}
            change={guests.totalGuests.change}
            trend={guests.totalGuests.trend}
            icon={Users}
            description="Unique guests served"
            color="purple"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <MetricCard
            title="Average Rating"
            value={reviews.averageRating.value.toFixed(1)}
            change={reviews.averageRating.change}
            trend={reviews.averageRating.trend}
            icon={Star}
            description={`From ${reviews.totalReviews.value} reviews`}
            color="yellow"
          />
        </motion.div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Revenue Metrics
            </h3>
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Daily Rate</span>
              <div className="text-right">
                <span className="font-semibold">
                  {formatCurrency(revenue.averageDailyRate.value)}
                </span>
                {revenue.averageDailyRate.change && (
                  <div
                    className={`text-xs ${
                      getTrendDisplay(revenue.averageDailyRate.trend).color
                    }`}
                  >
                    {
                      getTrendDisplay(
                        revenue.averageDailyRate.trend,
                        revenue.averageDailyRate.change
                      ).change
                    }
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">RevPAR</span>
              <div className="text-right">
                <span className="font-semibold">
                  {formatCurrency(revenue.revPAR.value)}
                </span>
                {revenue.revPAR.change && (
                  <div
                    className={`text-xs ${
                      getTrendDisplay(revenue.revPAR.trend).color
                    }`}
                  >
                    {
                      getTrendDisplay(
                        revenue.revPAR.trend,
                        revenue.revPAR.change
                      ).change
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Booking Metrics
            </h3>
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Bookings</span>
              <div className="text-right">
                <span className="font-semibold">
                  {bookings.totalBookings.value}
                </span>
                {bookings.totalBookings.change && (
                  <div
                    className={`text-xs ${
                      getTrendDisplay(bookings.totalBookings.trend).color
                    }`}
                  >
                    {
                      getTrendDisplay(
                        bookings.totalBookings.trend,
                        bookings.totalBookings.change
                      ).change
                    }
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cancellation Rate</span>
              <div className="text-right">
                <span className="font-semibold">
                  {formatPercentage(bookings.cancellationRate.value)}
                </span>
                {bookings.cancellationRate.change && (
                  <div
                    className={`text-xs ${
                      getTrendDisplay(bookings.cancellationRate.trend).color
                    }`}
                  >
                    {
                      getTrendDisplay(
                        bookings.cancellationRate.trend,
                        bookings.cancellationRate.change
                      ).change
                    }
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Lead Time</span>
              <div className="text-right">
                <span className="font-semibold">
                  {bookings.leadTime.value} days
                </span>
                {bookings.leadTime.change && (
                  <div
                    className={`text-xs ${
                      getTrendDisplay(bookings.leadTime.trend).color
                    }`}
                  >
                    {
                      getTrendDisplay(
                        bookings.leadTime.trend,
                        bookings.leadTime.change
                      ).change
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Guest Metrics
            </h3>
            <Users className="h-5 w-5 text-purple-600" />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Returning Guests</span>
              <div className="text-right">
                <span className="font-semibold">
                  {formatPercentage(guests.returningGuestRate.value)}
                </span>
                {guests.returningGuestRate.change && (
                  <div
                    className={`text-xs ${
                      getTrendDisplay(guests.returningGuestRate.trend).color
                    }`}
                  >
                    {
                      getTrendDisplay(
                        guests.returningGuestRate.trend,
                        guests.returningGuestRate.change
                      ).change
                    }
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Stay Duration</span>
              <div className="text-right">
                <span className="font-semibold">
                  {guests.averageStayDuration.value} nights
                </span>
                {guests.averageStayDuration.change && (
                  <div
                    className={`text-xs ${
                      getTrendDisplay(guests.averageStayDuration.trend).color
                    }`}
                  >
                    {
                      getTrendDisplay(
                        guests.averageStayDuration.trend,
                        guests.averageStayDuration.change
                      ).change
                    }
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Satisfaction</span>
              <div className="text-right">
                <span className="font-semibold">
                  {guests.guestSatisfaction.rating.toFixed(1)}/5.0
                </span>
                <div
                  className={`text-xs ${
                    guests.guestSatisfaction.trend === "up"
                      ? "text-green-600"
                      : guests.guestSatisfaction.trend === "down"
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {guests.guestSatisfaction.trend === "up"
                    ? "↗"
                    : guests.guestSatisfaction.trend === "down"
                    ? "↘"
                    : "→"}{" "}
                  Trending
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Performance Highlights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Performance Highlights
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
            <div className="flex-shrink-0">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">
                Peak Occupancy
              </p>
              <p className="text-lg font-bold text-green-900">
                {formatPercentage(occupancy.peakOccupancy.value)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
            <div className="flex-shrink-0">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Avg Occupancy</p>
              <p className="text-lg font-bold text-blue-900">
                {formatPercentage(occupancy.averageOccupancy.value)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
            <div className="flex-shrink-0">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-purple-800">
                Response Rate
              </p>
              <p className="text-lg font-bold text-purple-900">
                {formatPercentage(reviews.responseRate.value)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Low Occupancy
              </p>
              <p className="text-lg font-bold text-yellow-900">
                {formatPercentage(occupancy.lowOccupancy.value)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Trends Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Occupancy Trend
          </h3>
          <TrendChart
            data={occupancy.occupancyTrend.map((item) => ({
              date: item.date,
              value: item.occupancyRate,
            }))}
            color="blue"
            formatValue={(value) => formatPercentage(value)}
          />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue Trend
          </h3>
          <TrendChart
            data={revenue.revenueTrend.map((item) => ({
              date: item.date,
              value: item.revenue,
            }))}
            color="green"
            formatValue={(value) => formatCurrency(value)}
          />
        </div>
      </motion.div>
    </div>
  );
};
