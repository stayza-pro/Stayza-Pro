"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";

export default function GuestDashboardPage() {
  const router = useRouter();
  const { brandColor: primaryColor } = useRealtorBranding();

  useEffect(() => {
    // Redirect to guest landing page instead of showing dashboard
    router.push("/guest-landing");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
          style={{ borderBottomColor: primaryColor }}
        ></div>
        <p className="mt-2 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
