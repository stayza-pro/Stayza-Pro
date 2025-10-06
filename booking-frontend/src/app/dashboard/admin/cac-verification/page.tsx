"use client";

import React from "react";
import { useAuthStore } from "@/store/authStore";
import { ModernDashboardLayout } from "@/components/layout/ModernDashboardLayout";
import { CacManagement } from "@/components/admin/CacManagement";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminCacVerificationPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "ADMIN")) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, user?.role, router]);

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

  if (!isAuthenticated || !user || user.role !== "ADMIN") {
    return null; // Will redirect to login
  }

  return (
    <ModernDashboardLayout
      currentUser={user}
      activeRoute="cac-verification"
      onRouteChange={() => {}}
    >
      <CacManagement />
    </ModernDashboardLayout>
  );
}
