"use client";

import React, { useState } from "react";
import { useRevenueData } from "@/hooks/realtor/useRevenueData";
import { useBranding } from "@/hooks/useBranding";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import { getRealtorSubdomain } from "@/utils/subdomain";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Loader2,
  AlertCircle,
  BarChart3,
  Copy,
  Eye,
} from "lucide-react";

export default function RevenuePage() {
  const { user } = useAuth();
  const { branding } = useBranding();
  const { showSuccess } = useAlert();
  const realtorSubdomain = getRealtorSubdomain();
  const [timeFilter, setTimeFilter] = useState<"7d" | "30d" | "90d" | "all">(
    "30d"
  );

  const {
    data: chartData,
    stats,
    isLoading,
    error,
    setTimeFilter: updateTimeFilter,
  } = useRevenueData(timeFilter);

  const brandColor = branding?.colors?.primary || "#3B82F6";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess("Copied to clipboard!");
  };

  const handleFilterChange = (filter: "7d" | "30d" | "90d" | "all") => {
    setTimeFilter(filter);
    updateTimeFilter(filter);
  };

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-spin" />
          <p className="text-gray-600 font-medium">Loading revenue data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Error Loading Revenue
          </h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Revenue & Analytics
            </h1>
            <p className="text-gray-600">Track your earnings and performance</p>
          </div>

          {/* Time Filter */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            {(["7d", "30d", "90d", "all"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={`px-4 py-2 rounded-lg transition-all text-sm font-bold ${
                  timeFilter === filter
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-600"
                }`}
              >
                {filter === "7d"
                  ? "7 Days"
                  : filter === "30d"
                  ? "30 Days"
                  : filter === "90d"
                  ? "90 Days"
                  : "All Time"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${brandColor}15` }}
            >
              <TrendingUp className="w-5 h-5" style={{ color: brandColor }} />
            </div>
            <p className="text-sm text-gray-600">Total Revenue</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            ₦{stats?.totalRevenue.toLocaleString() || 0}
          </p>
          {stats?.revenueChange && (
            <div className="flex items-center gap-1 text-sm">
              {stats.revenueChange.type === "increase" ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-green-600 font-bold">
                    +{stats.revenueChange.value}%
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="text-red-600 font-bold">
                    -{stats.revenueChange.value}%
                  </span>
                </>
              )}
              <span className="text-gray-600">vs last period</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gray-100 rounded-lg">
              <BarChart3 className="w-5 h-5" style={{ color: brandColor }} />
            </div>
            <p className="text-sm text-gray-600">Average Revenue</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ₦{stats?.averageRevenue.toFixed(0).toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-600">per booking</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gray-100 rounded-lg">
              <TrendingUp className="w-5 h-5" style={{ color: brandColor }} />
            </div>
            <p className="text-sm text-gray-600">Peak Revenue</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ₦{stats?.peakRevenue.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-600">highest day</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Calendar className="w-5 h-5" style={{ color: brandColor }} />
            </div>
            <p className="text-sm text-gray-600">Total Bookings</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats?.totalBookings || 0}
          </p>
          {stats?.bookingsChange && (
            <div className="flex items-center gap-1 text-sm">
              {stats.bookingsChange.type === "increase" ? (
                <>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-green-600 font-bold">
                    +{stats.bookingsChange.value}%
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="text-red-600 font-bold">
                    -{stats.bookingsChange.value}%
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            Revenue Overview
          </h2>
          <p className="text-gray-600 text-sm">
            Daily revenue for selected period
          </p>
        </div>

        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600">
                No revenue data available for this period
              </p>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-end justify-between gap-2">
            {chartData.map((item, index) => {
              const maxValue = Math.max(...chartData.map((d) => d.revenue), 1);
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
                      className="w-full rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                      style={{
                        height: `${heightPercent}%`,
                        backgroundColor: brandColor,
                      }}
                      title={`${item.label}: ₦${item.revenue.toLocaleString()}`}
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
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Recent Transactions
        </h2>

        {chartData.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-600">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chartData
              .filter((d) => d.revenue > 0)
              .slice(0, 10)
              .map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-600">
                        {item.bookings} booking{item.bookings !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      ₦{item.revenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600">Revenue</p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
