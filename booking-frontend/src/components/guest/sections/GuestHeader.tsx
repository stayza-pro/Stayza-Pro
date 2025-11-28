"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, User, ChevronDown } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";

interface GuestHeaderProps {
  currentPage:
    | "profile"
    | "favorites"
    | "history"
    | "messages"
    | "bookings"
    | "help";
  searchPlaceholder?: string;
}

export function GuestHeader({
  currentPage,
  searchPlaceholder = "Search...",
}: GuestHeaderProps) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [showDropdown, setShowDropdown] = useState(false);

  // Use realtor branding hook for consistent styling
  const {
    brandColor: primaryColor, // Primary brand color for header background and CTAs
    secondaryColor, // Secondary color for accents
    accentColor, // Accent color for highlights and logout button
    realtorName,
    logoUrl,
    isLoading,
  } = useRealtorBranding();

  // Prevent hydration mismatch by showing loading state during initial render
  if (isLoading) {
    return (
      <nav className="sticky top-0 z-50 backdrop-blur-lg border-b border-white/20 bg-gray-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="animate-pulse">
              <div className="h-6 bg-white/20 rounded w-32"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const getPageTitle = () => {
    switch (currentPage) {
      case "profile":
        return "My Profile";
      case "favorites":
        return "My Favorites";
      case "history":
        return "Booking History";
      case "messages":
        return "Messages";
      case "bookings":
        return "My Bookings";
      case "help":
        return "Help & Support";
      default:
        return "Dashboard";
    }
  };

  const isCurrentPage = (page: string) => currentPage === page;

  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-lg border-b border-white/20"
      style={{
        backgroundColor: `${primaryColor}dd`, // Primary color for header background
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Business Name */}
          <div className="flex items-center space-x-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full text-white font-bold"
              style={{ backgroundColor: primaryColor }} // Primary color for logo background
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={realtorName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                realtorName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{realtorName}</h1>
              <p className="text-xs text-white/80">{getPageTitle()}</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 text-white hover:text-white/80 transition-colors"
            >
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="hidden md:block font-medium">
                {user?.firstName || "Guest"}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user?.firstName || "Guest User"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>

                <button
                  onClick={() => router.push("/guest/profile")}
                  className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                    isCurrentPage("profile") ? "font-medium" : ""
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => router.push("/guest/bookings")}
                  className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                    isCurrentPage("bookings") ? "font-medium" : ""
                  }`}
                >
                  My Bookings
                </button>
                <button
                  onClick={() => router.push("/guest/favorites")}
                  className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                    isCurrentPage("favorites") ? "font-medium" : ""
                  }`}
                >
                  Favorites
                </button>
                <button
                  onClick={() => router.push("/guest/history")}
                  className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                    isCurrentPage("history") ? "font-medium" : ""
                  }`}
                >
                  History
                </button>
                <button
                  onClick={() => router.push("/guest/messages")}
                  className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                    isCurrentPage("messages") ? "font-medium" : ""
                  }`}
                >
                  Messages
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => {
                    localStorage.clear();
                    router.push("/guest/login");
                  }}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  style={{ color: accentColor }} // Accent color for logout button instead of hardcoded red
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
