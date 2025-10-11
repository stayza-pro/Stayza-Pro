"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useBranding } from "@/hooks/useBranding";
import { getRealtorSubdomain } from "@/utils/subdomain";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  ArrowUp,
  ArrowDown,
  Copy,
  Eye,
} from "lucide-react";

export default function RevenuePage() {
  const { user } = useAuth();
  const { branding } = useBranding();
  const realtorSubdomain = getRealtorSubdomain();

  const brandColors = branding?.colors || {
    primary: "#3B82F6",
    secondary: "#1E40AF",
    accent: "#F59E0B",
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 flex-shrink-0">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Welcome back, {user?.firstName || "User"} 👋
            </h1>
            <p className="text-gray-600 flex items-center space-x-2">
              <span>Your website:</span>
              <span
                className="font-semibold px-3 py-1 rounded-md text-sm"
                style={{
                  color: brandColors.primary,
                  backgroundColor: brandColors.primary + "15",
                }}
              >
                {realtorSubdomain || "yourcompany"}.stayza.pro
              </span>
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() =>
                copyToClipboard(
                  `https://${realtorSubdomain || "yourcompany"}.stayza.pro`
                )
              }
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </button>
            <button
              onClick={() =>
                window.open(
                  `https://${realtorSubdomain || "yourcompany"}.stayza.pro`,
                  "_blank"
                )
              }
              className="px-4 py-2 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center space-x-2"
              style={{ backgroundColor: brandColors.primary }}
            >
              <Eye className="w-4 h-4" />
              <span>Preview Site</span>
            </button>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Revenue</h2>
                <p className="text-gray-600 mt-1">
                  Track your earnings and financial performance
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                  This Month
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                  Export Report
                </button>
              </div>
            </div>
          </div>

          {/* Revenue Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <ArrowUp className="w-3 h-3 mr-1" />
                  +12%
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">$0</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <ArrowUp className="w-3 h-3 mr-1" />
                  +8%
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">$0</p>
                <p className="text-xs text-gray-500 mt-1">October 2025</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex items-center text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
                  <ArrowDown className="w-3 h-3 mr-1" />
                  -2%
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Month</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">$0</p>
                <p className="text-xs text-gray-500 mt-1">September 2025</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Per Booking</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">$0</p>
                <p className="text-xs text-gray-500 mt-1">Average earnings</p>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Revenue Over Time
              </h3>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  Week
                </button>
                <button className="px-3 py-1 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-lg">
                  Month
                </button>
                <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  Year
                </button>
              </div>
            </div>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Revenue chart will appear here</p>
                <p className="text-sm text-gray-400 mt-1">
                  Start earning to see your revenue trends
                </p>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Transactions
            </h3>
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No transactions yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Your earnings will be listed here
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
