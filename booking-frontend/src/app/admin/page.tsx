"use client";

import React, { useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { ModernAdminDashboard } from "../../components/dashboard/ModernAdminDashboard";
import { AdminNavigation } from "../../components/admin/AdminNavigation";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "ADMIN")) {
      router.push("/admin/login");
    }
  }, [isAuthenticated, isLoading, user?.role, router]);

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#1E3A8A" }}
      >
        <div className="text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 animate-ping rounded-full bg-white opacity-20"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white relative z-10"></div>
          </div>
          <p className="text-white text-lg font-medium mt-4">
            Loading Admin Dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      <AdminNavigation />
      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <ModernAdminDashboard currentUser={user} />
        </div>
      </main>
    </div>
  );
}
