"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Home,
  DollarSign,
  TrendingUp,
  Settings,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { getAnalytics, getAllRealtors } from "@/services/adminService";
import { toast } from "react-hot-toast";

interface AdminActionItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  count?: number;
  urgent?: boolean;
  color: string;
}

interface AdminActionsWidgetProps {
  className?: string;
}

export default function AdminActionsWidget({
  className = "",
}: AdminActionsWidgetProps) {
  const [pendingActions, setPendingActions] = useState({
    pendingRealtors: 0,
    suspendedRealtors: 0,
    pendingProperties: 0,
    lowRevenue: false,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch real-time data
  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch analytics data
      const analyticsData = await getAnalytics("30d");

      // Fetch realtor data for pending and suspended counts
      const pendingRealtors = await getAllRealtors({
        status: "PENDING",
        limit: 1000,
      });

      const suspendedRealtors = await getAllRealtors({
        status: "SUSPENDED",
        limit: 1000,
      });

      setPendingActions({
        pendingRealtors: pendingRealtors.pagination.total,
        suspendedRealtors: suspendedRealtors.pagination.total,
        pendingProperties: analyticsData.overview.inactiveProperties || 0,
        lowRevenue: analyticsData.overview.revenueGrowth < 0,
      });

      if (isRefresh) {
        toast.success("Data refreshed successfully!");
      }
    } catch (error) {
      
      // Keep default values on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Refresh data every 30 seconds
    const interval = setInterval(() => fetchData(), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchData(true);
  };

  const adminActions: AdminActionItem[] = [
    {
      id: "pending-realtors",
      title: "Pending Realtor Approvals",
      description: "Review and approve new realtor registrations",
      icon: UserCheck,
      href: "/admin/realtors?status=PENDING",
      count: pendingActions.pendingRealtors,
      urgent: pendingActions.pendingRealtors > 10,
      color: "bg-orange-50 text-orange-700 border-orange-200",
    },
    {
      id: "suspended-users",
      title: "Suspended Users",
      description: "Review and manage suspended accounts",
      icon: UserX,
      href: "/admin/realtors?status=SUSPENDED",
      count: pendingActions.suspendedRealtors,
      urgent: false,
      color: "bg-red-50 text-red-700 border-red-200",
    },
    {
      id: "property-management",
      title: "Property Approvals",
      description: "Review pending property listings",
      icon: Home,
      href: "/admin/properties",
      count: pendingActions.pendingProperties,
      urgent: false,
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      id: "revenue-tracking",
      title: "Revenue Analytics",
      description: "Monitor platform earnings and commission",
      icon: DollarSign,
      href: "/admin/analytics?tab=revenue",
      urgent: pendingActions.lowRevenue,
      color: "bg-green-50 text-green-700 border-green-200",
    },
    {
      id: "user-management",
      title: "All Users",
      description: "Comprehensive user management system",
      icon: Users,
      href: "/admin/realtors",
      color: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      id: "platform-settings",
      title: "Platform Settings",
      description: "Configure commission rates and branding",
      icon: Settings,
      href: "/admin/settings",
      color: "bg-gray-50 text-gray-700 border-gray-200",
    },
  ];

  if (loading) {
    return (
      <div
        className={`bg-white rounded-lg border border-gray-200 ${className}`}
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Admin Actions
            </h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Loading administrative data...
          </p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Admin Actions</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Real-time access to core administrative functions
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminActions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              className={`relative p-4 rounded-lg border-2 group cursor-pointer ${action.color}`}
            >
              {action.urgent && (
                <div className="absolute -top-1 -right-1">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-medium truncate">
                      {action.title}
                    </h4>
                    <p className="text-xs mt-1 opacity-80">
                      {action.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {action.count !== undefined && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/50">
                      {action.count}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total Pending Actions:</span>
          <span className="font-medium text-gray-900">
            {pendingActions.pendingRealtors + pendingActions.pendingProperties}
          </span>
        </div>
      </div>
    </div>
  );
}
