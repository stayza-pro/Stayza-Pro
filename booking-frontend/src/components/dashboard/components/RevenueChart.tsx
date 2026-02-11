"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Calendar, DollarSign } from "lucide-react";
import { useBrand } from "../context/BrandContext";
import { useRevenueData } from "@/hooks/realtor/useRevenueData";

interface ChartDataPoint {
  date: string;
  revenue: number;
  bookings: number;
}

interface RevenueChartProps {
  title?: string;
  className?: string;
}

export default function RevenueChart({
  title = "Revenue Overview",
  className = "",
}: RevenueChartProps) {
  const { brand } = useBrand();
  const [activeTab, setActiveTab] = useState<"7days" | "30days" | "alltime">(
    "30days"
  );
  const { data, isLoading, setTimeFilter } = useRevenueData("30d");

  useEffect(() => {
    const filter =
      activeTab === "7days" ? "7d" : activeTab === "30days" ? "30d" : "all";
    setTimeFilter(filter);
  }, [activeTab, setTimeFilter]);

  const chartData = useMemo<ChartDataPoint[]>(
    () =>
      data.map((point) => ({
        date: point.date,
        revenue: point.revenue || 0,
        bookings: point.bookings || 0,
      })),
    [data]
  );

  const maxRevenue = Math.max(1, ...chartData.map((d) => d.revenue));
  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const avgRevenue =
    chartData.length > 0 ? Math.floor(totalRevenue / chartData.length) : 0;

  const tabs = [
    { id: "7days" as const, label: "7 Days" },
    { id: "30days" as const, label: "30 Days" },
    { id: "alltime" as const, label: "All Time" },
  ];

  const Chart = () => {
    const width = 100;
    const height = 60;
    const padding = 5;
    const denominator = Math.max(chartData.length - 1, 1);

    const points = chartData.map((point, index) => {
      const x = (index / denominator) * (width - padding * 2) + padding;
      const y =
        height -
        (point.revenue / maxRevenue) * (height - padding * 2) -
        padding;
      return { x, y };
    });

    const pathData =
      points.length > 0
        ? `M ${points[0].x} ${points[0].y} ${points
            .slice(1)
            .map((p) => `L ${p.x} ${p.y}`)
            .join(" ")}`
        : "M 0 0";

    return (
      <div className="relative mt-6 h-48">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              id="grid"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="0.5"
              />
            </pattern>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop
                offset="0%"
                style={{ stopColor: brand.colors.primary, stopOpacity: 0.3 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: brand.colors.primary, stopOpacity: 0.05 }}
              />
            </linearGradient>
          </defs>

          <rect width={width} height={height} fill="url(#grid)" />

          <path
            d={`${pathData} L ${
              points[points.length - 1]?.x || width - padding
            },${height - padding} L ${points[0]?.x || padding},${
              height - padding
            } Z`}
            fill="url(#areaGradient)"
          />

          <motion.path
            d={pathData}
            fill="none"
            stroke={brand.colors.primary}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />

          {points.map((point, index) => {
            const { x, y } = point;

            return (
              <motion.circle
                key={index}
                cx={x}
                cy={y}
                r="2"
                fill={brand.colors.primary}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05, duration: 0.3 }}
                className="hover:r-3 transition-all cursor-pointer"
              />
            );
          })}
        </svg>

        <div className="absolute inset-0 flex items-end justify-between px-2 pb-2">
          {chartData.map((point, index) => (
            <div
              key={index}
              className="group relative w-4 h-full flex items-end opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
              title={`${point.date}: $${point.revenue}`}
            >
              <div
                className="w-full bg-blue-500 bg-opacity-20 group-hover:bg-opacity-40 transition-all"
                style={{ height: `${(point.revenue / maxRevenue) * 100}%` }}
              />

              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                ${point.revenue}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className={`bg-white rounded-2xl p-6 shadow-md border border-gray-100 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            Track your revenue performance over time
          </p>
        </div>

        <div className="flex bg-gray-100 rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab.id
                  ? "text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              style={{
                backgroundColor:
                  activeTab === tab.id ? brand.colors.primary : "transparent",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${totalRevenue.toLocaleString()}
          </p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Average</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${avgRevenue.toLocaleString()}
          </p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Peak</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${maxRevenue.toLocaleString()}
          </p>
        </div>
      </div>

      {isLoading && chartData.length === 0 ? (
        <div className="h-48 rounded-lg bg-gray-50 animate-pulse" />
      ) : (
        <Chart />
      )}

      {!isLoading && chartData.length === 0 && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          No revenue data available for this period.
        </div>
      )}
    </motion.div>
  );
}
