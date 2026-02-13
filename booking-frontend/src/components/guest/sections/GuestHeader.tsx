"use client";

import React from "react";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { GuestNavbar } from "./GuestNavbar";

interface GuestHeaderProps {
  currentPage:
    | "profile"
    | "favorites"
    | "history"
    | "messages"
    | "notifications"
    | "bookings"
    | "help"
    | "browse";
  searchPlaceholder?: string;
}

export function GuestHeader({
  currentPage,
  searchPlaceholder = "Search...",
}: GuestHeaderProps) {
  // Use realtor branding hook for consistent styling
  const {
    brandColor: primaryColor,
    realtorName,
    logoUrl,
    tagline,
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

  return (
    <GuestNavbar
      agencyName={realtorName}
      tagline={tagline || "Premium short-let properties"}
      primaryColor={primaryColor}
      logo={logoUrl}
      isSticky={true}
    />
  );
}
