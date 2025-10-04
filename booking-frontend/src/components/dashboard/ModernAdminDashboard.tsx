"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Home,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  MoreHorizontal,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react";
import { User as UserType } from "@/types";
import Image from "next/image";

interface ModernAdminDashboardProps {
  currentUser: UserType;
}

export const ModernAdminDashboard: React.FC<ModernAdminDashboardProps> = ({
  currentUser,
}) => {
  const [timeRange, setTimeRange] = useState("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data - replace with real API calls
  const stats = {
    totalUsers: 12543,
    totalProperties: 857,
    totalBookings: 3241,
    totalRevenue: 2847500,
    activeUsers: 8392,
    pendingApprovals: 23,
    reportedContent: 7,
    averageRating: 4.7,
  };

  const trends = {
    users: 12.5,
    properties: 8.3,
    bookings: -2.1,
    revenue: 15.8,
  };

  const recentActivity = [
    {
      id: 1,
      type: "booking",
      message: "New booking for Ocean View Villa",
      user: "Sarah Johnson",
      time: "2 minutes ago",
      status: "success",
    },
    {
      id: 2,
      type: "property",
      message: "Property submitted for approval",
      user: "Michael Chen",
      time: "5 minutes ago",
      status: "pending",
    },
    {
      id: 3,
      type: "user",
      message: "New user registration",
      user: "Emily Davis",
      time: "10 minutes ago",
      status: "info",
    },
    {
      id: 4,
      type: "report",
      message: "Content reported by user",
      user: "Admin System",
      time: "15 minutes ago",
      status: "warning",
    },
  ];

  const topProperties = [
    {
      id: 1,
      title: "Luxury Oceanfront Villa",
      location: "Lekki, Lagos",
      bookings: 47,
      revenue: 845000,
      rating: 4.9,
      image: "/api/placeholder/60/60",
    },
    {
      id: 2,
      title: "Modern City Apartment",
      location: "Victoria Island, Lagos",
      bookings: 32,
      revenue: 560000,
      rating: 4.8,
      image: "/api/placeholder/60/60",
    },
    {
      id: 3,
      title: "Cozy Beach House",
      location: "Ikoyi, Lagos",
      bookings: 28,
      revenue: 420000,
      rating: 4.7,
      image: "/api/placeholder/60/60",
    },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsRefreshing(false);
  };

  const StatCard = ({
    title,
    value,
    trend,
    icon: Icon,
    color,
    description,
  }: {
    title: string;
    value: string | number;
    trend?: number;
    icon: any;
    color: string;
    description?: string;
  }) => (
    <motion.div
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center space-x-1 ${
              trend >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend >= 0 ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-gray-900">
          {typeof value === "number" ? value.toLocaleString() : value}
        </h3>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {currentUser.firstName}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your platform today.
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
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          trend={trends.users}
          icon={Users}
          color="bg-blue-500"
          description={`${stats.activeUsers.toLocaleString()} active users`}
        />
        <StatCard
          title="Properties"
          value={stats.totalProperties}
          trend={trends.properties}
          icon={Home}
          color="bg-green-500"
          description={`${stats.pendingApprovals} pending approval`}
        />
        <StatCard
          title="Bookings"
          value={stats.totalBookings}
          trend={trends.bookings}
          icon={Calendar}
          color="bg-purple-500"
          description="This month"
        />
        <StatCard
          title="Revenue"
          value={`₦${(stats.totalRevenue / 1000000).toFixed(1)}M`}
          trend={trends.revenue}
          icon={DollarSign}
          color="bg-orange-500"
          description="Total platform revenue"
        />
      </div>

      {/* Alerts and Quick Actions */}
      {(stats.pendingApprovals > 0 || stats.reportedContent > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.pendingApprovals > 0 && (
            <motion.div
              className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800">
                      Pending Approvals
                    </h3>
                    <p className="text-yellow-700 text-sm">
                      {stats.pendingApprovals} properties awaiting review
                    </p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition-colors">
                  Review
                </button>
              </div>
            </motion.div>
          )}

          {stats.reportedContent > 0 && (
            <motion.div
              className="bg-red-50 border border-red-200 rounded-2xl p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-800">
                      Reported Content
                    </h3>
                    <p className="text-red-700 text-sm">
                      {stats.reportedContent} items need moderation
                    </p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors">
                  Moderate
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <motion.div
          className="bg-white rounded-2xl shadow-sm border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Activity
              </h2>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreHorizontal className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4">
                <div
                  className={`p-2 rounded-lg ${
                    activity.status === "success"
                      ? "bg-green-100"
                      : activity.status === "warning"
                      ? "bg-yellow-100"
                      : activity.status === "pending"
                      ? "bg-blue-100"
                      : "bg-gray-100"
                  }`}
                >
                  {activity.status === "success" && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  {activity.status === "warning" && (
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  )}
                  {activity.status === "pending" && (
                    <Clock className="w-4 h-4 text-blue-600" />
                  )}
                  {activity.status === "info" && (
                    <Users className="w-4 h-4 text-gray-600" />
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.message}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {activity.user}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {activity.time}
                    </span>
                  </div>
                </div>

                <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <Eye className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ))}

            <button className="w-full py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors">
              View all activity
            </button>
          </div>
        </motion.div>

        {/* Top Properties */}
        <motion.div
          className="bg-white rounded-2xl shadow-sm border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Top Properties
              </h2>
              <button className="text-sm text-blue-600 font-medium hover:text-blue-700">
                View all
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {topProperties.map((property) => (
              <div key={property.id} className="flex items-center space-x-4">
                <Image
                  src={property.image}
                  alt={property.title}
                  width={60}
                  height={60}
                  className="w-15 h-15 rounded-xl object-cover"
                />

                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">
                    {property.title}
                  </h3>
                  <p className="text-xs text-gray-500">{property.location}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        {property.bookings} bookings
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span className="text-xs text-gray-600">
                        {property.rating}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    ₦{(property.revenue / 1000).toFixed(0)}K
                  </p>
                  <p className="text-xs text-gray-500">revenue</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Avg. Rating",
            value: stats.averageRating,
            icon: Star,
            color: "text-yellow-600",
          },
          {
            label: "Active Hosts",
            value: "847",
            icon: Users,
            color: "text-blue-600",
          },
          {
            label: "Monthly Growth",
            value: "+12.5%",
            icon: TrendingUp,
            color: "text-green-600",
          },
          {
            label: "Response Time",
            value: "2.3h",
            icon: Clock,
            color: "text-purple-600",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            className="bg-white rounded-xl p-4 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-600">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
