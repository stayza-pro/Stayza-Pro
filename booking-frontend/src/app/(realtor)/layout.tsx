"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSubdomainInfo, getRealtorSubdomain } from "../../utils/subdomain";
import { buildMainDomainUrl } from "../../utils/domains";
import ProtectedRouteWrapper from "../../components/auth/ProtectedRouteWrapper";
import { useAuth } from "@/context/AuthContext";
import { useBranding } from "@/hooks/useBranding";
import { BrandProvider } from "@/components/realtor/context/BrandContext";
import { DashboardHeader } from "@/components/realtor/DashboardHeader";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import Image from "next/image";
import {
  Building2,
  Calendar,
  Settings,
  Plus,
  Shield,
  DollarSign,
  BarChart3,
  Bell,
  LayoutGrid,
  RefreshCw,
  Wallet,
  LogOut,
  AlertCircle,
  MessageCircle,
} from "lucide-react";

export default function RealtorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { branding } = useBranding();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [tenantInfo, setTenantInfo] = useState<
    ReturnType<typeof getSubdomainInfo>
  >({
    subdomain: "",
    type: "main",
    isMultiTenant: false,
  });

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      // Call logout from auth store
      const { useAuthStore } = await import("@/store/authStore");
      await useAuthStore.getState().logout();

      // Redirect to realtor login on main domain
      window.location.href = buildMainDomainUrl("/realtor/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Still redirect even if logout fails
      window.location.href = buildMainDomainUrl("/realtor/login");
    }
  };

  // Hydration-safe: Only get subdomain info on client-side
  useEffect(() => {
    setTenantInfo(getSubdomainInfo());
    setMounted(true);
  }, []);

  // On subdomains, if someone tries to access /login, redirect to main domain
  useEffect(() => {
    if (mounted && tenantInfo.type === "realtor" && pathname === "/login") {
      window.location.href = buildMainDomainUrl("/realtor/login");
    }
  }, [mounted, tenantInfo.type, pathname]);

  // Determine active nav based on current pathname
  useEffect(() => {
    const currentPath = pathname;
    if (currentPath.includes("/properties")) {
      setActiveNav("properties");
    } else if (currentPath.includes("/bookings")) {
      setActiveNav("bookings");
    } else if (currentPath.includes("/messages")) {
      setActiveNav("messages");
    } else if (currentPath.includes("/escrow")) {
      setActiveNav("escrow-tracker");
    } else if (currentPath.includes("/refund-requests")) {
      setActiveNav("refund-requests");
    } else if (currentPath.includes("/disputes")) {
      setActiveNav("disputes");
    } else if (
      currentPath.includes("/earnings") ||
      currentPath.includes("/revenue")
    ) {
      setActiveNav("earnings");
    } else if (currentPath.includes("/wallet")) {
      setActiveNav("wallet");
    } else if (currentPath.includes("/payouts")) {
      setActiveNav("payouts");
    } else if (currentPath.includes("/notifications")) {
      setActiveNav("notifications");
    } else if (currentPath.includes("/settings")) {
      setActiveNav("settings");
    } else {
      setActiveNav("dashboard");
    }
  }, [pathname]);

  // NOW we can do conditional returns - after all hooks are called
  // During SSR or before mount, render without layout to avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  // Only apply this layout on realtor subdomains (NOT on main domain)
  if (tenantInfo.type !== "realtor") {
    return <>{children}</>;
  }

  const realtorSubdomain =
    tenantInfo.type === "realtor" ? tenantInfo.subdomain : null;

  if (pathname === "/login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to Stayza login...</p>
        </div>
      </div>
    );
  }

  // Don't protect register and test pages
  const publicPages = ["/register", "/test"];
  const isPublicPage = publicPages.some((page) => pathname === page);

  if (isPublicPage) {
    // Return children without protection or dashboard layout for public pages
    return <>{children}</>;
  }

  const brandColors = branding?.colors || {
    primary: "#3B82F6",
    secondary: "#1E40AF",
    accent: "#F59E0B",
  };

  // Create brand config for BrandProvider
  const brandConfig = {
    colors: {
      primary: brandColors.primary || "#3B82F6",
      secondary: brandColors.secondary || "#1E40AF",
      accent: brandColors.accent || "#F59E0B",
      success: "#10B981",
      warning: "#F59E0B",
      danger: "#EF4444",
      muted: "#6B7280",
    },
    logo: branding?.logo,
    businessName: branding?.businessName || "Your Business",
    slug: tenantInfo.subdomain || "default",
  };

  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutGrid,
      href: "/dashboard",
    },
    {
      id: "properties",
      label: "My Properties",
      icon: Building2,
      href: "/properties",
    },
    {
      id: "bookings",
      label: "Bookings",
      icon: Calendar,
      href: "/bookings",
    },
    {
      id: "messages",
      label: "Messages",
      icon: MessageCircle,
      href: "/messages",
    },
    {
      id: "escrow-tracker",
      label: "Escrow Tracker",
      icon: Shield,
      href: "/escrow",
    },
    {
      id: "refund-requests",
      label: "Refund Requests",
      icon: RefreshCw,
      href: "/refund-requests",
    },
    {
      id: "disputes",
      label: "Disputes",
      icon: AlertCircle,
      href: "/disputes",
    },
    {
      id: "earnings",
      label: "Earnings & Analytics",
      icon: BarChart3,
      href: "/earnings",
    },
    { id: "payouts", label: "Payouts", icon: DollarSign, href: "/payouts" },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      href: "/notifications",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      href: "/settings",
    },
  ];

  // Apply ProtectedRoute for protected pages with sidebar layout
  return (
    <ProtectedRouteWrapper requiredRole="REALTOR">
      <BrandProvider brand={brandConfig}>
        <div className="flex h-screen bg-white overflow-hidden">
          {/* Left Sidebar - Clean, Flat Design */}
          <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col">
            {/* Logo & Brand */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {branding?.logo ? (
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-200">
                    <Image
                      src={branding.logo}
                      alt="Logo"
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: brandColors.primary }}
                  >
                    {branding?.businessName?.charAt(0).toUpperCase() || "S"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-900 text-sm truncate">
                    {branding?.businessName || "Your Business"}
                  </h2>
                  <p className="text-gray-500 text-xs truncate">Dashboard</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveNav(item.id);
                      router.push(item.href);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-colors ${
                      isActive
                        ? "font-medium text-white"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                    style={
                      isActive
                        ? { backgroundColor: brandColors.primary }
                        : undefined
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1 text-left text-sm">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Footer - Powered by Stayza */}
            <div className="px-4 py-4 border-t border-gray-200 space-y-3">
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-colors text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="w-5 h-5" />
                <span className="flex-1 text-left text-sm font-medium">
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </span>
              </button>

              {/* Branding */}
              <div className="text-center">
                <p className="text-xs text-gray-400">
                  Powered by{" "}
                  <span className="font-semibold text-gray-600">Stayza</span>
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  v1.0.0 • {new Date().getFullYear()}
                </p>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
            {/* Top Bar with Notification Bell */}
            <div className="flex items-center justify-end px-8 py-4 bg-white border-b border-gray-200">
              <NotificationBell iconColor={brandColors.primary} />
            </div>

            <main className="flex-1 overflow-y-auto p-8">
              {/* Show DashboardHeader on all pages except settings */}
              {!pathname.includes("/settings") && (
                <div className="mb-6">
                  <DashboardHeader />
                </div>
              )}
              {children}
            </main>
          </div>
        </div>
      </BrandProvider>
    </ProtectedRouteWrapper>
  );
}
