"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useBranding } from "@/hooks/useBranding";
import { getRealtorSubdomain } from "@/utils/subdomain";
import {
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  Copy,
  Eye,
} from "lucide-react";

export default function ReviewModerationPage() {
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
            <h2 className="text-2xl font-bold text-gray-900">
              Review Moderation
            </h2>
            <p className="text-gray-600 mt-1">
              Review and moderate guest reviews for your properties
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Reviews</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Flagged</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Reviews to Moderate
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Guest reviews will appear here for you to approve, flag, or
                respond to. Maintain quality control and manage your property
                reputation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
