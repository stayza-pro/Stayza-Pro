"use client";

import React from "react";
import { NotificationList } from "@/components/notifications/NotificationList";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { Footer } from "@/components/guest/sections/Footer";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";

export default function GuestNotificationsPage() {
  const {
    brandColor: primaryColor,
    realtorName,
    logoUrl,
    tagline,
    description,
  } = useRealtorBranding();

  return (
    <div className="min-h-screen bg-gray-50">
      <GuestHeader currentPage="browse" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NotificationList />
      </main>

      <Footer
        realtorName={realtorName}
        logo={logoUrl}
        tagline={tagline || "Premium short-let properties"}
        description={description || "Experience luxury accommodations"}
        primaryColor={primaryColor}
      />
    </div>
  );
}
