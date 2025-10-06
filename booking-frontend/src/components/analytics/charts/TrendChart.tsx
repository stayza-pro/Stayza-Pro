"use client";

import React from "react";
import { motion } from "framer-motion";

interface TrendChartProps {
  data: Array<{
    date: string;
    value: number;
  }>;
  color: "blue" | "green" | "purple" | "yellow" | "red";
  formatValue?: (value: number) => string;
  height?: number;
}

const colorConfig = {
  blue: {
    stroke: "#3B82F6",
    fill: "rgba(59, 130, 246, 0.1)",
    gradient: "from-blue-500/20 to-transparent",
  },
  green: {
    stroke: "#10B981",
    fill: "rgba(16, 185, 129, 0.1)",
    gradient: "from-green-500/20 to-transparent",
  },
  purple: {
    stroke: "#8B5CF6",
    fill: "rgba(139, 92, 246, 0.1)",
    gradient: "from-purple-500/20 to-transparent",
  },
  yellow: {
    stroke: "#F59E0B",
    fill: "rgba(245, 158, 11, 0.1)",
    gradient: "from-yellow-500/20 to-transparent",
  },
  red: {
    stroke: "#EF4444",
    fill: "rgba(239, 68, 68, 0.1)",
    gradient: "from-red-500/20 to-transparent",
  },
};

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  color,
  formatValue = (value) => value.toString(),
  height = 200,
}) => {
  const config = colorConfig[color];

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <p>No data available</p>
      </div>
    );
  }

  // Calculate dimensions and scaling
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = 400;
  const chartHeight = height - margin.top - margin.bottom;
  const width = chartWidth - margin.left - margin.right;

  // Find min/max values for scaling
  const values = data.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue;
  const padding = valueRange * 0.1; // 10% padding

  const yMin = Math.max(0, minValue - padding);
  const yMax = maxValue + padding;
  const yRange = yMax - yMin;

  // Create scale functions
  const xScale = (index: number) => (index / (data.length - 1)) * width;
  const yScale = (value: number) =>
    chartHeight - ((value - yMin) / yRange) * chartHeight;

  // Generate path for the line
  const pathData = data
    .map((d, i) => {
      const x = xScale(i);
      const y = yScale(d.value);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(" ");

  // Generate area path
  const areaData = `${pathData} L ${xScale(
    data.length - 1
  )} ${chartHeight} L ${xScale(0)} ${chartHeight} Z`;

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Get y-axis ticks
  const getYTicks = () => {
    const tickCount = 4;
    const ticks = [];
    for (let i = 0; i <= tickCount; i++) {
      const value = yMin + (yRange * i) / tickCount;
      ticks.push(value);
    }
    return ticks;
  };

  const yTicks = getYTicks();

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <svg width={chartWidth} height={height} className="overflow-visible">
          <defs>
            <linearGradient
              id={`gradient-${color}`}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                style={{ stopColor: config.stroke, stopOpacity: 0.3 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: config.stroke, stopOpacity: 0 }}
              />
            </linearGradient>
          </defs>

          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Grid lines */}
            {yTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={0}
                  y1={yScale(tick)}
                  x2={width}
                  y2={yScale(tick)}
                  stroke="#E5E7EB"
                  strokeWidth={1}
                  strokeDasharray="2,2"
                />
                <text
                  x={-10}
                  y={yScale(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize="12"
                  fill="#6B7280"
                >
                  {formatValue(tick)}
                </text>
              </g>
            ))}

            {/* Area under curve */}
            <motion.path
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              d={areaData}
              fill={`url(#gradient-${color})`}
            />

            {/* Line */}
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              d={pathData}
              fill="none"
              stroke={config.stroke}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {data.map((d, i) => (
              <motion.circle
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.8 + i * 0.1 }}
                cx={xScale(i)}
                cy={yScale(d.value)}
                r={3}
                fill={config.stroke}
                stroke="white"
                strokeWidth={2}
                className="cursor-pointer hover:r-4 transition-all"
              >
                <title>{`${formatDate(d.date)}: ${formatValue(
                  d.value
                )}`}</title>
              </motion.circle>
            ))}

            {/* X-axis labels */}
            {data.map((d, i) => {
              // Show every nth label to avoid overcrowding
              const showLabel =
                data.length <= 7 ||
                i % Math.ceil(data.length / 5) === 0 ||
                i === data.length - 1;
              if (!showLabel) return null;

              return (
                <text
                  key={i}
                  x={xScale(i)}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#6B7280"
                >
                  {formatDate(d.date)}
                </text>
              );
            })}
          </g>
        </svg>

        {/* Current value indicator */}
        {data.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="absolute top-4 right-4 bg-white rounded-lg border border-gray-200 px-3 py-2 shadow-sm"
          >
            <p className="text-xs text-gray-600">Current</p>
            <p
              className="text-sm font-semibold"
              style={{ color: config.stroke }}
            >
              {formatValue(data[data.length - 1].value)}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
