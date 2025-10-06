"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  Mail,
  Phone,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

export default function PendingApprovalPage() {
  const router = useRouter();

  const handleRefresh = () => {
    // For now, just reload the page
    // In a real app, this would check the approval status
    window.location.reload();
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
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-600 mb-6">
            <Clock className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold text-marketing-foreground mb-2">
            Application Under Review
          </h1>
          <p className="text-lg text-marketing-muted">
            Your realtor application is being reviewed by our team
          </p>
        </div>

        {/* Status Card */}
        <div className="marketing-card-elevated p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="h-3 w-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-yellow-700 uppercase tracking-wide">
                Pending Approval
              </span>
            </div>
            <p className="text-gray-600">
              We're currently reviewing your business information and documents.
              This process typically takes 24-48 hours.
            </p>
          </div>

          {/* What's Next */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">What happens next:</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Document Verification
                  </p>
                  <p className="text-sm text-gray-600">
                    We'll verify your business registration and documentation
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Business Profile Review
                  </p>
                  <p className="text-sm text-gray-600">
                    Our team will review your business information and branding
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Approval Notification
                  </p>
                  <p className="text-sm text-gray-600">
                    You'll receive an email when your application is approved
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-blue-900">Need help?</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 text-blue-700">
                <Mail className="h-4 w-4" />
                <span>support@stayza.com</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-700">
                <Phone className="h-4 w-4" />
                <span>+234 (0) 800 STAYZA</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleRefresh}
              className="marketing-button-ghost w-full flex items-center justify-center text-sm font-medium"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Status
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-marketing-muted">
            Questions about the approval process?{" "}
            <Link
              href="/contact"
              className="font-medium text-marketing-primary hover:opacity-80"
            >
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
