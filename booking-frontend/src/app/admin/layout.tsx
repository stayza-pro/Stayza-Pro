"use client";

import React from "react";
import { ProtectedRoute } from "../../components/auth/ProtectedRoute";
import { AdminDashboardLayout } from "../../components/layout/AdminDashboardLayout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="ADMIN" redirectTo="/admin/login">
      <AdminDashboardLayout>{children}</AdminDashboardLayout>
    </ProtectedRoute>
  );
}
