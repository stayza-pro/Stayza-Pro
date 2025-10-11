"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useBranding } from "@/hooks/useBranding";
import { useRouter } from "next/navigation";
import { getRealtorSubdomain } from "@/utils/subdomain";
import {
  User as UserIcon,
  Home as HomeIcon,
  Building2 as BuildingOfficeIcon,
  Calendar as CalendarIcon,
  DollarSign as DollarSignIcon,
  Star as StarIcon,
  Settings as CogIcon,
  Bell as BellIcon,
  Search as MagnifyingGlassIcon,
  Menu as Bars3Icon,
  X as XMarkIcon,
} from "lucide-react";

interface RealtorDashboardLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: HomeIcon,
  },
  {
    name: "Properties",
    href: "/properties",
    icon: BuildingOfficeIcon,
  },
  {
    name: "Bookings",
    href: "/bookings",
    icon: CalendarIcon,
  },
  {
    name: "Payments",
    href: "/payments",
    icon: DollarSignIcon,
  },
  {
    name: "Reviews",
    href: "/reviews",
    icon: StarIcon,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: CogIcon,
  },
];

export function RealtorDashboardLayout({
  children,
}: RealtorDashboardLayoutProps) {
  const { user } = useAuth();
  const { branding, isLoading: brandingLoading } = useBranding();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const realtorSubdomain = getRealtorSubdomain();

  const handleLogout = async () => {
    try {
      // Clear auth state
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      // Redirect to main domain login
      window.location.href = "http://localhost:3000/realtor/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Use custom branding colors if available
  const brandColors = {
    primary: branding?.primaryColor || "#3B82F6",
    secondary: branding?.secondaryColor || "#1E40AF",
    accent: branding?.accentColor || "#F59E0B",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? "block" : "hidden"
        }`}
      >
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            {branding?.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.businessName || "Realtor"}
                className="h-8 w-auto"
              />
            ) : (
              <h1
                className="text-xl font-bold"
                style={{ color: brandColors.primary }}
              >
                {branding?.businessName || realtorSubdomain || "Realtor"}
              </h1>
            )}
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigationItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                style={
                  {
                    "--hover-color": brandColors.primary,
                  } as React.CSSProperties
                }
              >
                <item.icon className="mr-3 h-6 w-6" />
                {item.name}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex items-center h-16 px-4 border-b border-gray-200">
            {branding?.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.businessName || "Realtor"}
                className="h-8 w-auto"
              />
            ) : (
              <h1
                className="text-xl font-bold"
                style={{ color: brandColors.primary }}
              >
                {branding?.businessName || realtorSubdomain || "Realtor"}
              </h1>
            )}
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigationItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                style={
                  {
                    "--hover-color": brandColors.primary,
                  } as React.CSSProperties
                }
              >
                <item.icon className="mr-3 h-6 w-6" />
                {item.name}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <div
          className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200"
          style={{ borderBottomColor: brandColors.primary + "20" }}
        >
          <div className="flex h-16 items-center gap-x-4 px-4 sm:gap-x-6 sm:px-6 lg:px-8">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Separator */}
            <div className="h-6 w-px bg-gray-200 lg:hidden" />

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              {/* Search */}
              <form className="relative flex flex-1" action="#" method="GET">
                <label htmlFor="search-field" className="sr-only">
                  Search
                </label>
                <MagnifyingGlassIcon className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400" />
                <input
                  id="search-field"
                  className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                  placeholder="Search properties, bookings..."
                  type="search"
                  name="search"
                />
              </form>
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                {/* Notifications */}
                <button
                  type="button"
                  className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
                >
                  <BellIcon className="h-6 w-6" />
                </button>

                {/* Separator */}
                <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    className="-m-1.5 flex items-center p-1.5"
                    onClick={handleLogout}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: brandColors.primary + "20" }}
                    >
                      <UserIcon
                        className="h-5 w-5"
                        style={{ color: brandColors.primary }}
                      />
                    </div>
                    <span className="hidden lg:flex lg:items-center">
                      <span className="ml-4 text-sm font-semibold leading-6 text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
