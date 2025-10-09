"use client";

import React, { useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { ModernPropertyManagement } from "../../components/dashboard/ModernPropertyManagement";
import { ModernDashboardLayout } from "../../components/layout/ModernDashboardLayout";
import { useRouter } from "next/navigation";
import { useBranding } from "../../hooks/useBranding";

export default function RealtorDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { branding, isLoading: brandingLoading } = useBranding();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "REALTOR")) {
      router.push("/realtor/login");
    }
  }, [isAuthenticated, isLoading, user?.role, router]);

  if (isLoading || brandingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">
            Loading {branding?.businessName || "Your Dashboard"}...
          </p>
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
      activeRoute="overview"
      onRouteChange={() => {}}
      branding={branding || undefined}
    >
      <ModernPropertyManagement currentUser={user} />
    </ModernDashboardLayout>
  );
}
