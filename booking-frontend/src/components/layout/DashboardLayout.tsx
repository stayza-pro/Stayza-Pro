"use client";

import React from "react";
import { Layout } from "./Layout";
import { ProtectedRoute } from "../auth";
import { UserRole } from "@/types";

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
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
