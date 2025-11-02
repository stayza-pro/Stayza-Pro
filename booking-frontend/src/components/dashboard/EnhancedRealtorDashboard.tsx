"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useBranding } from "@/hooks/useBranding";
import { getRealtorSubdomain } from "@/utils/subdomain";
import { RealtorDashboard } from "@/components/dashboard/RealtorDashboard";
import {
  Building2,
  Calendar,
  DollarSign,
  Star,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Shield,
  MessageSquare,
  Copy,
  Eye,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface MVPFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  status: "complete" | "enhanced" | "new";
  color: string;
}

const MVP_FEATURES: MVPFeature[] = [
  {
    id: "properties",
    title: "Properties Management",
    description:
      "Add, edit, manage properties with images, pricing, and availability",
    icon: Building2,
    href: "/properties",
    status: "complete",
    color: "bg-blue-50 border-blue-200 text-blue-700",
  },
  {
    id: "bookings",
    title: "Bookings Management",
    description: "View, accept, reject bookings with guest contact information",
    icon: Calendar,
    href: "/bookings",
    status: "complete",
    color: "bg-green-50 border-green-200 text-green-700",
  },
  {
    id: "payments",
    title: "Payments & Earnings",
    description:
      "Track revenue, commission breakdown, and downloadable receipts",
    icon: DollarSign,
    href: "/payments",
    status: "complete",
    color: "bg-purple-50 border-purple-200 text-purple-700",
  },
  {
    id: "reviews",
    title: "Reviews & Reputation",
    description:
      "Manage guest reviews, respond publicly, and report fake reviews",
    icon: Star,
    href: "/reviews",
    status: "enhanced",
    color: "bg-yellow-50 border-yellow-200 text-yellow-700",
  },
  {
    id: "profile",
    title: "Business Profile",
    description: "Manage brand colors, logo, subdomain, and CAC verification",
    icon: Users,
    href: "/profile",
    status: "new",
    color: "bg-indigo-50 border-indigo-200 text-indigo-700",
  },
  {
    id: "support",
    title: "Support & Dispute Center",
    description:
      "Report guest issues, request refunds, and communicate with admin",
    icon: MessageSquare,
    href: "/support",
    status: "new",
    color: "bg-pink-50 border-pink-200 text-pink-700",
  },
];

export default function EnhancedRealtorDashboard() {
  const { user } = useAuth();
  const { branding } = useBranding();
  const router = useRouter();
  const [realtorSubdomain, setRealtorSubdomain] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [showMVPOverview, setShowMVPOverview] = useState(false);

  // Prevent hydration mismatch by getting subdomain only on client
  useEffect(() => {
    setRealtorSubdomain(getRealtorSubdomain());
    setMounted(true);

    // Check for cross-domain authentication tokens
    const checkCrossDomainAuth = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get("accessToken");
      const refreshToken = urlParams.get("refreshToken");

      if (accessToken && refreshToken) {
        console.log(
          "🔐 Cross-domain tokens detected, setting authentication..."
        );
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        // Set cross-domain cookies
        try {
          const domain =
            window.location.hostname === "localhost"
              ? "localhost"
              : ".stayza.pro";
          document.cookie = `accessToken=${accessToken}; domain=${domain}; path=/; Secure; SameSite=None`;
          document.cookie = `refreshToken=${refreshToken}; domain=${domain}; path=/; Secure; SameSite=None`;
          console.log("🍪 Cross-domain cookies set for realtor dashboard");
        } catch (error) {
          console.warn("⚠️ Could not set cross-domain cookies:", error);
        }

        // Clean up URL
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        // Reload to trigger auth state update
        setTimeout(() => window.location.reload(), 100);
      }
    };

    checkCrossDomainAuth();
  }, []);

  const brandColors = branding?.colors || {
    primary: "#3B82F6",
    secondary: "#1E40AF",
    accent: "#F59E0B",
  };

  const copyWebsiteLink = () => {
    if (!mounted) return;
    const url = `https://${realtorSubdomain || "yourcompany"}.stayza.pro`;
    navigator.clipboard.writeText(url);
    toast.success("Website link copied to clipboard!");
  };

  const openWebsite = () => {
    if (!mounted) return;
    const url = `https://${realtorSubdomain || "yourcompany"}.stayza.pro`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header with MVP Toggle */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.firstName || "User"}! 👋
            </h1>
            <div className="flex items-center space-x-4">
              <p className="text-gray-600 flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>Your website:</span>
                {mounted ? (
                  <span
                    className="font-semibold px-3 py-1 rounded-md text-sm cursor-pointer hover:opacity-80"
                    style={{
                      color: brandColors.primary,
                      backgroundColor: brandColors.primary + "15",
                    }}
                    onClick={copyWebsiteLink}
                  >
                    {realtorSubdomain || "yourcompany"}.stayza.pro
                  </span>
                ) : (
                  <span className="font-semibold px-3 py-1 rounded-md text-sm bg-gray-100 text-gray-500">
                    Loading...
                  </span>
                )}
              </p>
              <button
                onClick={() => setShowMVPOverview(!showMVPOverview)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showMVPOverview ? "Hide" : "Show"} MVP Features
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={copyWebsiteLink}
              disabled={!mounted}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </button>
            <button
              onClick={openWebsite}
              disabled={!mounted}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Site
            </button>
          </div>
        </div>
      </div>

      {/* MVP Features Overview */}
      {showMVPOverview && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Stayza Realtor Dashboard - MVP Features
              </h2>
              <p className="text-gray-600 mt-1">
                Complete feature set built for clarity and control - no fluff
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Complete</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Enhanced</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>New</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MVP_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.id}
                  className={`border-2 rounded-lg p-6 cursor-pointer hover:shadow-md transition-all ${feature.color}`}
                  onClick={() => router.push(feature.href)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`p-3 rounded-lg ${feature.color.replace(
                        "50",
                        "100"
                      )}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex items-center space-x-1">
                      {feature.status === "complete" && (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-xs font-medium text-green-600">
                            COMPLETE
                          </span>
                        </>
                      )}
                      {feature.status === "enhanced" && (
                        <>
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <span className="text-xs font-medium text-blue-600">
                            ENHANCED
                          </span>
                        </>
                      )}
                      {feature.status === "new" && (
                        <>
                          <Plus className="h-4 w-4 text-purple-600" />
                          <span className="text-xs font-medium text-purple-600">
                            NEW
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>

                  <div className="mt-4 flex justify-end">
                    <span className="text-xs font-medium opacity-75">
                      Click to explore →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* MVP Implementation Notes */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-green-600" />
              MVP Implementation Highlights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">
                  ✅ Core Business Features
                </h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Property management with image uploads</li>
                  <li>• Booking acceptance/rejection workflow</li>
                  <li>• Revenue tracking with commission breakdown</li>
                  <li>• Guest review management and responses</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">
                  🚀 White-Label Features
                </h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Custom subdomain setup</li>
                  <li>• Brand colors and logo customization</li>
                  <li>• CAC verification system</li>
                  <li>• Professional dispute resolution</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">
                  🛡️ Transparency & Control
                </h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Clear commission rates (no hidden fees)</li>
                  <li>• Real-time earnings dashboard</li>
                  <li>• Downloadable transaction receipts</li>
                  <li>• Direct admin communication channel</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">
                  ⚡ Key Restrictions (By Design)
                </h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• No direct refund access (admin approval)</li>
                  <li>• Structured dispute resolution process</li>
                  <li>• Verified business requirements (CAC)</li>
                  <li>• Platform compliance monitoring</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/properties")}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Manage Properties
            </button>
            <button
              onClick={() => router.push("/profile")}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Users className="h-4 w-4 mr-2" />
              Setup Business Profile
            </button>
            <button
              onClick={() => router.push("/support")}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Report an Issue
            </button>
            <button
              onClick={openWebsite}
              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Globe className="h-4 w-4 mr-2" />
              Preview Website
            </button>
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      <RealtorDashboard />
    </div>
  );
}
