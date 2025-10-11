"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSubdomainInfo, getRealtorSubdomain } from "../../utils/subdomain";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useBranding } from "@/hooks/useBranding";
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
  const [tenantInfo, setTenantInfo] = useState<
    ReturnType<typeof getSubdomainInfo>
  >({
    subdomain: "",
    type: "main",
    isMultiTenant: false,
  });

  // Hydration-safe: Only get subdomain info on client-side
  useEffect(() => {
    setTenantInfo(getSubdomainInfo());
    setMounted(true);
  }, []);

  // On subdomains, if someone tries to access /login, redirect to main domain
  useEffect(() => {
    if (mounted && tenantInfo.type === "realtor" && pathname === "/login") {
      window.location.href = "http://localhost:3000/realtor/login";
    }
  }, [mounted, tenantInfo.type, pathname]);

  // Determine active nav based on current pathname
  useEffect(() => {
    const currentPath = pathname;
    if (currentPath.includes("/properties")) {
      setActiveNav("properties");
    } else if (currentPath.includes("/bookings")) {
      setActiveNav("bookings");
    } else if (currentPath.includes("/review-moderation")) {
      setActiveNav("review-moderation");
    } else if (currentPath.includes("/refund-requests")) {
      setActiveNav("refund-requests");
    } else if (currentPath.includes("/revenue")) {
      setActiveNav("revenue");
    } else if (currentPath.includes("/analytics")) {
      setActiveNav("analytics");
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
      id: "review-moderation",
      label: "Review Moderation",
      icon: Shield,
      href: "/review-moderation",
    },
    {
      id: "refund-requests",
      label: "Refund Requests",
      icon: RefreshCw,
      href: "/refund-requests",
    },
    {
      id: "revenue",
      label: "Revenue",
      icon: DollarSign,
      href: "/revenue",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      href: "/analytics",
    },
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
    <ProtectedRoute requiredRole="REALTOR">
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Sidebar */}
        <div
          className="w-72 text-white relative overflow-hidden flex-shrink-0 shadow-2xl"
          style={{ backgroundColor: brandColors.primary }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
            <div className="absolute top-1/2 right-0 w-20 h-20 bg-white rounded-full -mr-10"></div>
          </div>

          <div className="relative z-10 flex flex-col h-full">
            {/* Logo & Brand */}
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center space-x-4">
                {branding?.logo ? (
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center p-1 ring-2 ring-white/30">
                    <Image
                      src={branding.logo}
                      alt="Logo"
                      width={40}
                      height={40}
                      className="rounded-lg object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-2 ring-white/30">
                    <span className="text-lg font-bold">
                      {branding?.businessName?.charAt(0).toUpperCase() || "S"}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-lg">
                    {branding?.businessName || "Your Business"}
                  </h2>
                  <p className="text-white/80 text-sm truncate max-w-36">
                    {branding?.tagline || "Professional Dashboard"}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all group ${
                      isActive
                        ? "font-medium bg-white/20 backdrop-blur-sm border-l-4 border-white shadow-lg"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        !isActive && "group-hover:scale-110"
                      } transition-transform`}
                    />
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Footer - Powered by Stayza Pro */}
            <div className="p-4 border-t border-white/20 mt-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-white/60 font-medium">
                      Powered by
                    </p>
                    <p className="text-sm font-bold text-white">Stayza Pro</p>
                  </div>
                </div>
                <p className="text-xs text-white/50 mt-2">
                  Professional Property Management Platform
                </p>
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-xs text-white/40">
                    Version 1.0.0 • {new Date().getFullYear()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
