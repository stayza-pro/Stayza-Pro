"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  XCircle,
  Mail,
  Phone,
  RefreshCw,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";

export default function ApplicationRejectedPage() {
  const router = useRouter();

  const handleReapply = () => {
    // Clear tokens and redirect to registration
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/register/realtor");
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen marketing-theme-wrapper flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-red-100 text-red-600 mb-6">
            <XCircle className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold text-marketing-foreground mb-2">
            Application Not Approved
          </h1>
          <p className="text-lg text-marketing-muted">
            We were unable to approve your realtor application at this time
          </p>
        </div>

        {/* Status Card */}
        <div className="marketing-card-elevated p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="h-3 w-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-red-700 uppercase tracking-wide">
                Application Rejected
              </span>
            </div>
          </div>

          {/* Common Reasons */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              Common reasons for rejection:
            </h3>
            <div className="space-y-2 text-sm text-gray-600 ml-7">
              <ul className="list-disc space-y-1">
                <li>Incomplete or invalid business registration documents</li>
                <li>Business email address could not be verified</li>
                <li>Insufficient business information provided</li>
                <li>Unable to verify business legitimacy</li>
                <li>Policy compliance issues</li>
              </ul>
            </div>
          </div>

          {/* What You Can Do */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-blue-900">What you can do:</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• Review and update your business information</p>
              <p>• Ensure all required documents are valid and up-to-date</p>
              <p>• Contact our support team for specific feedback</p>
              <p>• Resubmit your application with corrected information</p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-gray-900">
              Need specific feedback?
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Our support team can provide detailed reasons for the rejection
              and help you with the reapplication process.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-gray-700">
                <Mail className="h-4 w-4" />
                <span>realtor-support@stayza.com</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700">
                <Phone className="h-4 w-4" />
                <span>+234 (0) 800 STAYZA</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleReapply}
              className="w-full marketing-button-primary"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Submit New Application
            </button>
            <div className="flex space-x-3">
              <Link
                href="/contact"
                className="marketing-button-ghost flex-1 text-center text-sm font-medium"
              >
                Contact Support
              </Link>
              <button
                onClick={handleLogout}
                className="flex-1 text-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1 inline" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-marketing-muted">
            Still experiencing issues?{" "}
            <Link
              href="/contact"
              className="font-medium text-marketing-primary hover:opacity-80"
            >
              Get help from our team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
