"use client";

import { Suspense } from "react";
import ProtectedRoute from "./ProtectedRoute";

interface ProtectedRouteWrapperProps {
  children: React.ReactNode;
  requiredRole?: "GUEST" | "REALTOR" | "ADMIN";
  redirectTo?: string;
}

export default function ProtectedRouteWrapper(
  props: ProtectedRouteWrapperProps
) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <ProtectedRoute {...props} />
    </Suspense>
  );
}
