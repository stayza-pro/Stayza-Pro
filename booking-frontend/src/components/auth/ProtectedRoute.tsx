"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { setCookie } from "@/utils/cookies";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "GUEST" | "REALTOR" | "ADMIN";
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get store values and methods separately for better stability
  const { isAuthenticated, user, isLoading, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration errors by only rendering after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return; // Don't run on server

    const initAuth = async () => {
      try {
        // Check if tokens are being passed via URL (cross-subdomain redirect)
        const tokenFromUrl = searchParams.get("token");
        const refreshFromUrl = searchParams.get("refresh");

        if (tokenFromUrl && refreshFromUrl) {
          console.log("🔑 ProtectedRoute: Restoring tokens from URL...");

          // Set tokens in localStorage for this subdomain
          localStorage.setItem("accessToken", tokenFromUrl);
          localStorage.setItem("refreshToken", refreshFromUrl);

          // Set tokens in cookies for cross-subdomain access
          setCookie("accessToken", tokenFromUrl, 7);
          setCookie("refreshToken", refreshFromUrl, 30);

          // Update auth store state FIRST before checking auth
          useAuthStore.setState({
            accessToken: tokenFromUrl,
            refreshToken: refreshFromUrl,
            isAuthenticated: true, // Assume authenticated for now
          });

          console.log("✅ ProtectedRoute: Tokens restored to storage");

          // Clean up URL by removing token parameters
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete("token");
          newUrl.searchParams.delete("refresh");
          window.history.replaceState({}, "", newUrl.toString());

          // Give more time for all storage operations to complete
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Now verify tokens by fetching user profile
          try {
            console.log("🔍 ProtectedRoute: Verifying tokens with backend...");
            await checkAuth();

            // Get fresh state after checkAuth completes
            const { user: updatedUser, isAuthenticated: updatedAuth } =
              useAuthStore.getState();
            console.log("✅ ProtectedRoute: Token verification successful", {
              isAuthenticated: updatedAuth,
              hasUser: !!updatedUser,
              userRole: updatedUser?.role,
              userId: updatedUser?.id,
            });
          } catch (verifyError) {
            console.error(
              "❌ ProtectedRoute: Token verification failed:",
              verifyError
            );
            // If verification fails, checkAuth already cleared the state
          }
        } else {
          // No tokens in URL, just check existing auth state
          console.log("🔍 ProtectedRoute: Checking existing auth...");
          await checkAuth();

          // Log the auth state after checkAuth completes
          const authState = useAuthStore.getState();
          console.log("✅ ProtectedRoute: Auth check completed", {
            isAuthenticated: authState.isAuthenticated,
            hasUser: !!authState.user,
            userRole: authState.user?.role,
            userId: authState.user?.id,
          });
        }
      } catch (error) {
        console.error("❌ ProtectedRoute: Auth initialization failed:", error);
      } finally {
        setIsChecking(false);
      }
    };

    initAuth();
  }, [checkAuth, searchParams, isMounted]);

  useEffect(() => {
    if (!isChecking && !isLoading) {
      console.log("🔍 ProtectedRoute: Checking access...", {
        isAuthenticated,
        userRole: user?.role,
        requiredRole,
      });

      if (!isAuthenticated) {
        console.log(
          "❌ ProtectedRoute: Not authenticated, redirecting to:",
          redirectTo
        );
        router.push(redirectTo);
        return;
      }

      // Check role if required
      if (requiredRole && user?.role !== requiredRole) {
        console.log(
          `❌ ProtectedRoute: Role mismatch. Required: ${requiredRole}, Got: ${user?.role}`
        );
        // Redirect based on user role
        if (user?.role === "REALTOR") {
          router.push("/dashboard");
        } else if (user?.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/login");
        }
        return;
      }

      console.log("✅ ProtectedRoute: Access granted!");
    }
  }, [
    isAuthenticated,
    user,
    requiredRole,
    isChecking,
    isLoading,
    router,
    redirectTo,
  ]);

  // Show loading state while checking authentication or during SSR
  if (!isMounted || isChecking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render children (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // If role is required but doesn't match, don't render children (will redirect)
  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}
