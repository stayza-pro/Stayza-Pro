"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { Loading } from "../ui";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "GUEST" | "HOST" | "ADMIN";
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectTo = "/auth/login",
}) => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    // Check authentication status on mount
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(redirectTo);
        return;
      }

      if (requiredRole && user?.role !== requiredRole) {
        // Redirect based on user role if they don't have required permission
        switch (user?.role) {
          case "ADMIN":
            router.push("/admin/dashboard");
            break;
          case "HOST":
            router.push("/host/dashboard");
            break;
          case "GUEST":
            router.push("/dashboard");
            break;
          default:
            router.push("/auth/login");
        }
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router, redirectTo]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  // Don't render children if not authenticated or wrong role
  if (!isAuthenticated || (requiredRole && user?.role !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
};
