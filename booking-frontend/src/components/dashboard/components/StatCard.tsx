"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { useBrand } from "../context/BrandContext";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
  };
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  delay?: number;
  prefix?: string;
  suffix?: string;
  gradient?: boolean;
}

export default function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend = "neutral",
  delay = 0,
  prefix = "",
  suffix = "",
  gradient = false,
}: StatCardProps) {
  const { brand } = useBrand();
  const [displayValue, setDisplayValue] = useState(0);
  const [mounted, setMounted] = useState(false);

  const numericValue =
    typeof value === "string"
      ? parseFloat(value.replace(/[^0-9.-]/g, ""))
      : value;

  useEffect(() => {
    setMounted(true);
    if (!isNaN(numericValue)) {
      const timer = setTimeout(() => {
        const start = 0;
        const end = numericValue;
        const duration = 1000;
        const startTime = Date.now();

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Easing function
          const easeOutQuart = 1 - Math.pow(1 - progress, 4);

          setDisplayValue(Math.floor(start + (end - start) * easeOutQuart));

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            setDisplayValue(end);
          }
        };

        requestAnimationFrame(animate);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [numericValue, delay]);

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return brand.colors.success;
      case "down":
        return brand.colors.danger;
      default:
        return brand.colors.muted;
    }
  };

  const getBackgroundStyle = () => {
    if (gradient) {
      return {
        background: `linear-gradient(135deg, ${brand.colors.primary}15 0%, ${brand.colors.accent}10 100%)`,
      };
    }
    return {};
  };

  const formatDisplayValue = (val: number) => {
    if (typeof value === "string") {
      return value; // Return original string if it's not numeric
    }
    return `${prefix}${val.toLocaleString()}${suffix}`;
  };

  if (!mounted) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
        <div className="animate-pulse">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
            <div className="w-16 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="mt-4 w-24 h-8 bg-gray-200 rounded"></div>
          <div className="mt-2 w-20 h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: delay / 1000,
        ease: "easeOut",
      }}
      whileHover={{
        y: -2,
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      className="bg-white rounded-2xl p-4 lg:p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer"
      style={getBackgroundStyle()}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${brand.colors.primary}15` }}
        >
          <Icon className="w-6 h-6" style={{ color: brand.colors.primary }} />
        </div>

        {change && (
          <div
            className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${
              change.type === "increase"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {change.type === "increase" ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{Math.abs(change.value)}%</span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <motion.h3
          className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight"
          key={displayValue}
        >
          {formatDisplayValue(displayValue)}
        </motion.h3>

        <p className="text-sm text-gray-600 mt-2 font-medium">{title}</p>
      </div>

      {/* Trend Indicator */}
      {trend !== "neutral" && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getTrendColor() }}
            />
            <span className="text-xs text-gray-600">
              {trend === "up" ? "Trending up" : "Trending down"}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
