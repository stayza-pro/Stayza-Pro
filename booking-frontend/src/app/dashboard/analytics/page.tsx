"use client";

import React from "react";
import { useAuthStore } from "@/store/authStore";
import { PropertyAnalyticsDashboard } from "@/components/analytics/PropertyAnalyticsDashboard";
import { ModernDashboardLayout } from "@/components/layout/ModernDashboardLayout";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AnalyticsPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user || user.role !== "REALTOR")) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== "REALTOR") {
    return null;
  }

  return (
    <ModernDashboardLayout
      currentUser={user}
      activeRoute="analytics"
      onRouteChange={() => {}}
    >
      <div className="px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <PropertyAnalyticsDashboard
            propertyId={user.id}
            propertyName={`${user.firstName} ${user.lastName}'s Properties`}
          />
        </div>
      </div>
    </ModernDashboardLayout>
  );
}
