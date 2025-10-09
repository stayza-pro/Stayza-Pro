"use client";

import React, { useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { ModernDashboardLayout } from "../../components/layout/ModernDashboardLayout";
import { useRouter } from "next/navigation";
import { useBranding } from "../../hooks/useBranding";

export default function GuestDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { branding, isLoading: brandingLoading } = useBranding();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "GUEST")) {
      router.push("/guest/login");
    }
  }, [isAuthenticated, isLoading, user?.role, router]);

  if (isLoading || brandingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading Your Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== "GUEST") {
    return null;
  }

  return (
    <ModernDashboardLayout
      currentUser={user}
      activeRoute="overview"
      onRouteChange={() => {}}
      branding={branding || undefined}
    >
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome back, {user.firstName}!
          </h2>
          <p className="text-gray-600">
            Manage your bookings and discover amazing properties.
          </p>
        </div>

        {/* Guest-specific dashboard content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Bookings
            </h3>
            <p className="text-gray-500">No recent bookings</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Favorite Properties
            </h3>
            <p className="text-gray-500">No favorites yet</p>
          </div>
        </div>
      </div>
    </ModernDashboardLayout>
  );
}
