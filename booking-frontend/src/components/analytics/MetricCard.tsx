"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  trend: "up" | "down" | "stable";
  icon: LucideIcon;
  description?: string;
  color: "blue" | "green" | "purple" | "yellow" | "red" | "gray";
}

const colorConfig = {
  blue: {
    icon: "text-blue-600",
    iconBg: "bg-blue-100",
    trend: {
      up: "text-blue-600",
      down: "text-red-600",
      stable: "text-gray-600",
    },
  },
  green: {
    icon: "text-green-600",
    iconBg: "bg-green-100",
    trend: {
      up: "text-green-600",
      down: "text-red-600",
      stable: "text-gray-600",
    },
  },
  purple: {
    icon: "text-purple-600",
    iconBg: "bg-purple-100",
    trend: {
      up: "text-green-600",
      down: "text-red-600",
      stable: "text-gray-600",
    },
  },
  yellow: {
    icon: "text-yellow-600",
    iconBg: "bg-yellow-100",
    trend: {
      up: "text-green-600",
      down: "text-red-600",
      stable: "text-gray-600",
    },
  },
  red: {
    icon: "text-red-600",
    iconBg: "bg-red-100",
    trend: {
      up: "text-green-600",
      down: "text-red-600",
      stable: "text-gray-600",
    },
  },
  gray: {
    icon: "text-gray-600",
    iconBg: "bg-gray-100",
    trend: {
      up: "text-green-600",
      down: "text-red-600",
      stable: "text-gray-600",
    },
  },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
  description,
  color,
}) => {
  const config = colorConfig[color];

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return TrendingUp;
      case "down":
        return TrendingDown;
      default:
        return Minus;
    }
  };

  const formatChange = (changeValue: number) => {
    const absChange = Math.abs(changeValue);
    const sign = trend === "up" ? "+" : trend === "down" ? "-" : "";
    return `${sign}${absChange.toFixed(1)}%`;
  };

  const TrendIcon = getTrendIcon();

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>

          {change !== undefined && (
            <div className="flex items-center space-x-1">
              <TrendIcon className={`h-4 w-4 ${config.trend[trend]}`} />
              <span className={`text-sm font-medium ${config.trend[trend]}`}>
                {formatChange(change)}
              </span>
            </div>
          )}

          {description && (
            <p className="text-xs text-gray-500 mt-2">{description}</p>
          )}
        </div>

        <div className={`flex-shrink-0 p-3 rounded-full ${config.iconBg}`}>
          <Icon className={`h-6 w-6 ${config.icon}`} />
        </div>
      </div>
    </motion.div>
  );
};
