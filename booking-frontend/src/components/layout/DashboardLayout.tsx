"use client";

import React from "react";
import { Layout } from "./Layout";
import { ProtectedRoute } from "../auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: "GUEST" | "HOST" | "ADMIN";
  className?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  requiredRole,
  className = "",
}) => {
  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <Layout
        showSidebar={true}
        showFooter={false}
        className={`bg-gray-50 ${className}`}
      >
        {children}
      </Layout>
    </ProtectedRoute>
  );
};
