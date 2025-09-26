"use client";

import { useAuthStore } from "../../store/authStore";
import { GuestDashboard } from "../../components/dashboard/GuestDashboard";
import { HostDashboard } from "../../components/dashboard/HostDashboard";
import { AdminDashboard } from "../../components/dashboard/AdminDashboard";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
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

  const renderDashboard = () => {
    switch (user.role) {
      case "ADMIN":
        return <AdminDashboard currentUser={user} />;
      case "HOST":
        return <HostDashboard user={user} />;
      case "GUEST":
      default:
        return <GuestDashboard user={user} />;
    }
  };

  return <DashboardLayout>{renderDashboard()}</DashboardLayout>;
}
