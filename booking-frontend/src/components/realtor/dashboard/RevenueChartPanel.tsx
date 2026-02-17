"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from "lucide-react";
import { useRevenueData } from "@/hooks/realtor/useRevenueData";

type TimeRange = "7d" | "30d" | "all";

interface RevenueRow {
  day: string;
  amount: number;
  transactions: number;
}

const RANGE_OPTIONS: Array<{ value: TimeRange; label: string }> = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "all", label: "All Time" },
];

const formatCurrency = (value: unknown) => {
  const amount = Number(value);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `₦${safeAmount.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
};

export default function RevenueChartPanel() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const { data, stats, isLoading, error, setTimeFilter, refetch } =
    useRevenueData("30d");

  useEffect(() => {
    setTimeFilter(timeRange);
  }, [timeRange, setTimeFilter]);

  const currentData = useMemo<RevenueRow[]>(
    () =>
      data.map((point) => ({
        day: point.label || point.date,
        amount: point.revenue || 0,
        transactions: point.bookings || 0,
      })),
    [data]
  );

  const maxAmount = Math.max(1, ...currentData.map((d) => d.amount));
  const totalRevenue =
    stats?.totalRevenue ??
    currentData.reduce((sum, item) => sum + item.amount, 0);
  const growth = stats?.revenueChange ?? { value: 0, type: "increase" as const };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Revenue Overview
            </h2>
            <p className="text-sm text-gray-500">Track your earnings over time</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-gray-100 rounded-xl p-1 shadow-inner">
          {RANGE_OPTIONS.map((option) => (
            <motion.button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                timeRange === option.value
                  ? "bg-white text-gray-900 shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {option.label}
            </motion.button>
          ))}
        </div>
      </div>

      {isLoading && currentData.length === 0 ? (
        <div className="h-48 bg-gray-50 rounded-xl animate-pulse mb-6" />
      ) : currentData.length === 0 ? (
        <div className="mb-6 rounded-xl border border-dashed border-gray-200 p-6 text-sm text-gray-500">
          No revenue data for this period.
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {currentData.map((item, index) => {
            const isHovered = hoveredBar === index;
            const percentage = (item.amount / maxAmount) * 100;

            return (
              <motion.div
                key={`${item.day}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                onHoverStart={() => setHoveredBar(index)}
                onHoverEnd={() => setHoveredBar(null)}
                className="relative"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-20 text-sm font-semibold text-gray-700">
                    {item.day}
                  </div>

                  <div className="flex-1 relative">
                    <div className="h-14 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl overflow-hidden shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{
                          delay: 0.8 + index * 0.05,
                          duration: 0.8,
                          ease: "easeOut",
                        }}
                        className={`h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-end pr-4 relative overflow-hidden ${
                          isHovered ? "shadow-lg" : ""
                        }`}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
                          animate={{
                            x: isHovered ? ["-100%", "200%"] : "-100%",
                          }}
                          transition={{
                            duration: 1,
                            repeat: isHovered ? Infinity : 0,
                          }}
                        />

                        <span className="text-white text-sm font-bold relative z-10">
                          ₦{(item.amount / 1000).toFixed(0)}k
                        </span>
                      </motion.div>
                    </div>

                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.9 }}
                          animate={{ opacity: 1, y: -45, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="absolute left-0 right-0 mx-auto w-fit bg-gray-900 text-white px-4 py-2 rounded-xl shadow-xl z-20"
                        >
                          <div className="text-xs font-medium">
                            {item.transactions} transactions
                          </div>
                          <div className="text-xs text-gray-300">
                            Avg:{" "}
                            {item.transactions > 0
                              ? formatCurrency(item.amount / item.transactions)
                              : formatCurrency(0)}
                          </div>
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            onClick={() => {
              void refetch();
            }}
            className="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-700 hover:bg-red-100 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100"
        >
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalRevenue)}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100"
        >
          <div className="flex items-center space-x-2 mb-2">
            {growth.type === "increase" ? (
              <TrendingUp className="w-5 h-5 text-blue-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-blue-600" />
            )}
            <p className="text-sm font-medium text-gray-600">Growth</p>
          </div>
          <p
            className={`text-2xl font-bold ${
              growth.type === "increase" ? "text-green-600" : "text-red-600"
            }`}
          >
            {growth.type === "increase" ? "+" : "-"}
            {growth.value.toFixed(1)}%
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
