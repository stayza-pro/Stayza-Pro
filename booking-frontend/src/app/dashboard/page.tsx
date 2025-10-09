"use client";

import { useAuthStore } from "../../store/authStore";
import { ModernAdminDashboard } from "../../components/dashboard/ModernAdminDashboard";
import { ModernPropertyManagement } from "../../components/dashboard/ModernPropertyManagement";
import { AnalyticsDashboard } from "../../components/dashboard/AnalyticsDashboard";
import { EnhancedAnalyticsDashboard } from "../../components/dashboard/EnhancedAnalyticsDashboard";
import { ModernDashboardLayout } from "../../components/layout/ModernDashboardLayout";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to realtor login with return URL
      router.push("/realtor/login?returnTo=/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

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

  if (!isAuthenticated || !user) {
    return null;
  }

  // Redirect users to their role-specific dashboards
  useEffect(() => {
    if (user && !isLoading) {
      switch (user.role) {
        case "ADMIN":
          router.push("/admin");
          break;
        case "REALTOR":
          router.push("/realtor");
          break;
        case "GUEST":
          router.push("/guest");
          break;
        default:
          break;
      }
    }
  }, [user, isLoading, router]);

  const renderDashboard = () => {
    switch (user?.role) {
      case "ADMIN":
        return <ModernAdminDashboard currentUser={user} />;
      case "REALTOR":
        return <ModernPropertyManagement currentUser={user} />;
      case "GUEST":
      default:
        return <ModernPropertyManagement currentUser={user} />;
    }
  };

  return (
    <ModernDashboardLayout
      currentUser={user}
      activeRoute="overview"
      onRouteChange={() => {}}
    >
      {renderDashboard()}
    </ModernDashboardLayout>
  );
}
