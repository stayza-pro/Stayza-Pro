"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { Loading } from "../ui";
import { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectTo = "/auth/login",
}) => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();

  const normalizeRole = (role?: UserRole | null) => {
    if (!role) return undefined;
    if (role === "REALTOR") {
      return "HOST";
    }
    return role;
  };

  const userRole = normalizeRole(user?.role ?? null);
  const requiredNormalizedRole = normalizeRole(requiredRole ?? null);
  const rawRole = user?.role;

  useEffect(() => {
    // Check authentication status on mount
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    if (requiredNormalizedRole && userRole !== requiredNormalizedRole) {
      // Redirect based on user role if they don't have required permission
      switch (rawRole) {
        case "ADMIN":
          router.push("/admin/dashboard");
          break;
        case "REALTOR":
          router.push("/host/dashboard");
          break;
        case "GUEST":
          router.push("/dashboard");
          break;
        default:
          router.push("/auth/login");
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    userRole,
    requiredNormalizedRole,
    rawRole,
    router,
    redirectTo,
  ]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  // Don't render children if not authenticated or wrong role
  if (
    !isAuthenticated ||
    (requiredNormalizedRole && userRole !== requiredNormalizedRole)
  ) {
    return null;
  }

  return <>{children}</>;
};
