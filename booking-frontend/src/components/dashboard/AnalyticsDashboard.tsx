"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Home,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  MapPin,
  Clock,
  Filter,
  Eye,
  Target,
} from "lucide-react";

interface AnalyticsData {
  revenue: {
    total: number;
    growth: number;
    monthly: Array<{ month: string; amount: number }>;
  };
  bookings: {
    total: number;
    growth: number;
    monthly: Array<{ month: string; count: number }>;
    byStatus: Array<{ status: string; count: number; color: string }>;
  };
  properties: {
    total: number;
    growth: number;
    byType: Array<{ type: string; count: number; color: string }>;
    byLocation: Array<{ location: string; count: number; revenue: number }>;
  };
  users: {
    total: number;
    growth: number;
    active: number;
    hosts: number;
    guests: number;
    monthly: Array<{ month: string; count: number }>;
  };
  performance: {
    averageRating: number;
    occupancyRate: number;
    responseTime: string;
    conversionRate: number;
  };
}

export const AnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeChart, setActiveChart] = useState("revenue");

  // Mock analytics data
  const analyticsData: AnalyticsData = {
    revenue: {
      total: 12547500,
      growth: 23.5,
      monthly: [
        { month: "Jan", amount: 980000 },
        { month: "Feb", amount: 1200000 },
        { month: "Mar", amount: 1150000 },
        { month: "Apr", amount: 1350000 },
        { month: "May", amount: 1480000 },
        { month: "Jun", amount: 1650000 },
      ],
    },
    bookings: {
      total: 3247,
      growth: 12.8,
      monthly: [
        { month: "Jan", count: 420 },
        { month: "Feb", count: 510 },
        { month: "Mar", count: 485 },
        { month: "Apr", count: 580 },
        { month: "May", count: 620 },
        { month: "Jun", count: 632 },
      ],
      byStatus: [
        { status: "Confirmed", count: 2847, color: "#10B981" },
        { status: "Pending", count: 285, color: "#F59E0B" },
        { status: "Cancelled", count: 115, color: "#EF4444" },
      ],
    },
    properties: {
      total: 856,
      growth: 8.3,
      byType: [
        { type: "Apartments", count: 342, color: "#3B82F6" },
        { type: "Villas", count: 198, color: "#8B5CF6" },
        { type: "Houses", count: 156, color: "#10B981" },
        { type: "Condos", count: 98, color: "#F59E0B" },
        { type: "Others", count: 62, color: "#6B7280" },
      ],
      byLocation: [
        { location: "Lagos", count: 324, revenue: 8500000 },
        { location: "Abuja", count: 198, revenue: 5200000 },
        { location: "Port Harcourt", count: 156, revenue: 3400000 },
        { location: "Kano", count: 89, revenue: 2100000 },
        { location: "Ibadan", count: 67, revenue: 1800000 },
      ],
    },
    users: {
      total: 12543,
      growth: 15.7,
      active: 8392,
      hosts: 1247,
      guests: 11296,
      monthly: [
        { month: "Jan", count: 892 },
        { month: "Feb", count: 1156 },
        { month: "Mar", count: 1089 },
        { month: "Apr", count: 1298 },
        { month: "May", count: 1445 },
        { month: "Jun", count: 1523 },
      ],
    },
    performance: {
      averageRating: 4.7,
      occupancyRate: 73.2,
      responseTime: "2.3h",
      conversionRate: 18.5,
    },
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsRefreshing(false);
  };

  const MetricCard = ({
    title,
    value,
    change,
    icon: Icon,
    color,
    description,
  }: {
    title: string;
    value: string;
    change: number;
    icon: any;
    color: string;
    description?: string;
  }) => (
    <motion.div
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div
          className={`flex items-center space-x-1 ${
            change >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {change >= 0 ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">{Math.abs(change)}%</span>
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
    </motion.div>
  );

  const ChartCard = ({
    title,
    children,
    actions,
  }: {
    title: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
  }) => (
    <motion.div
      className="bg-white rounded-2xl shadow-sm border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-2">
            {actions}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Download className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  );

  const SimpleBarChart = ({
    data,
    color = "#3B82F6",
  }: {
    data: any[];
    color?: string;
  }) => (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 min-w-0 flex-1">
            {item.month || item.location || item.status || item.type}
          </span>
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full"
                style={{
                  backgroundColor: item.color || color,
                  width: `${
                    ((item.amount || item.count) /
                      Math.max(...data.map((d) => d.amount || d.count))) *
                    100
                  }%`,
                }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-900 w-16 text-right">
              {item.amount
                ? `₦${(item.amount / 1000).toFixed(0)}K`
                : item.count}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  const PieChartSimulation = ({ data }: { data: any[] }) => (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">
                {item.status || item.type}
              </p>
              <p className="text-xs text-gray-500">{item.count} items</p>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {(
                (item.count / data.reduce((sum, d) => sum + d.count, 0)) *
                100
              ).toFixed(1)}
              %
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center">
        <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
            <PieChart className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Analytics & Reports
          </h1>
          <p className="text-gray-600">
            Comprehensive insights into your platform's performance
          </p>
        </div>

        <div className="flex items-center space-x-4 mt-6 lg:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>

          <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`₦${(analyticsData.revenue.total / 1000000).toFixed(1)}M`}
          change={analyticsData.revenue.growth}
          icon={DollarSign}
          color="bg-green-500"
          description="Platform revenue"
        />
        <MetricCard
          title="Total Bookings"
          value={analyticsData.bookings.total.toLocaleString()}
          change={analyticsData.bookings.growth}
          icon={Calendar}
          color="bg-blue-500"
          description="Confirmed bookings"
        />
        <MetricCard
          title="Active Users"
          value={analyticsData.users.active.toLocaleString()}
          change={analyticsData.users.growth}
          icon={Users}
          color="bg-purple-500"
          description={`${analyticsData.users.total.toLocaleString()} total users`}
        />
        <MetricCard
          title="Properties"
          value={analyticsData.properties.total.toLocaleString()}
          change={analyticsData.properties.growth}
          icon={Home}
          color="bg-orange-500"
          description="Listed properties"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Avg. Rating",
            value: analyticsData.performance.averageRating.toString(),
            icon: Star,
            color: "text-yellow-600",
            suffix: "/5",
          },
          {
            label: "Occupancy Rate",
            value: analyticsData.performance.occupancyRate.toString(),
            icon: Target,
            color: "text-green-600",
            suffix: "%",
          },
          {
            label: "Response Time",
            value: analyticsData.performance.responseTime,
            icon: Clock,
            color: "text-blue-600",
          },
          {
            label: "Conversion Rate",
            value: analyticsData.performance.conversionRate.toString(),
            icon: TrendingUp,
            color: "text-purple-600",
            suffix: "%",
          },
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            className="bg-white rounded-xl p-6 border border-gray-100 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex justify-center mb-3">
              <metric.icon className={`w-6 h-6 ${metric.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {metric.value}
              {metric.suffix || ""}
            </p>
            <p className="text-sm text-gray-600">{metric.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Trend */}
        <ChartCard
          title="Revenue Trend"
          actions={
            <select className="text-sm border border-gray-300 rounded-lg px-3 py-1">
              <option>Monthly</option>
              <option>Weekly</option>
              <option>Daily</option>
            </select>
          }
        >
          <SimpleBarChart
            data={analyticsData.revenue.monthly}
            color="#10B981"
          />
        </ChartCard>

        {/* Booking Status Distribution */}
        <ChartCard title="Booking Status Distribution">
          <PieChartSimulation data={analyticsData.bookings.byStatus} />
        </ChartCard>

        {/* Property Types */}
        <ChartCard title="Property Types">
          <PieChartSimulation data={analyticsData.properties.byType} />
        </ChartCard>

        {/* User Growth */}
        <ChartCard title="User Growth">
          <SimpleBarChart data={analyticsData.users.monthly} color="#8B5CF6" />
        </ChartCard>
      </div>

      {/* Location Performance */}
      <ChartCard title="Performance by Location">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <span>Location</span>
            <span className="text-center">Properties</span>
            <span className="text-center">Revenue</span>
            <span className="text-center">Avg. Price</span>
            <span className="text-center">Performance</span>
          </div>

          {analyticsData.properties.byLocation.map((location, index) => (
            <motion.div
              key={location.location}
              className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-900">
                  {location.location}
                </span>
              </div>

              <div className="text-center">
                <span className="text-sm font-semibold text-gray-900">
                  {location.count}
                </span>
                <p className="text-xs text-gray-500">properties</p>
              </div>

              <div className="text-center">
                <span className="text-sm font-semibold text-gray-900">
                  ₦{(location.revenue / 1000000).toFixed(1)}M
                </span>
                <p className="text-xs text-gray-500">total revenue</p>
              </div>

              <div className="text-center">
                <span className="text-sm font-semibold text-gray-900">
                  ₦{(location.revenue / location.count / 1000).toFixed(0)}K
                </span>
                <p className="text-xs text-gray-500">avg. revenue</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Excellent</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </ChartCard>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: "Top Performing Property",
            value: "Luxury Oceanfront Villa",
            subtitle: "47 bookings this month",
            icon: TrendingUp,
            color: "text-green-600",
            bgColor: "bg-green-50",
          },
          {
            title: "Peak Booking Day",
            value: "Friday",
            subtitle: "28% more bookings",
            icon: Calendar,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
          },
          {
            title: "Average Stay Duration",
            value: "3.2 days",
            subtitle: "Increased by 0.4 days",
            icon: Clock,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
          },
        ].map((insight, index) => (
          <motion.div
            key={insight.title}
            className={`${insight.bgColor} rounded-2xl p-6 border border-gray-100`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + index * 0.1 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <insight.icon className={`w-6 h-6 ${insight.color}`} />
              <h3 className="text-sm font-medium text-gray-600">
                {insight.title}
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {insight.value}
            </p>
            <p className="text-sm text-gray-600">{insight.subtitle}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
