import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  getDashboardUrl,
  getLoginUrl,
  getLogoutRedirectUrl,
  getEmailVerificationRedirectUrl,
  getRealtorRegistrationRedirectUrl,
  navigateToUrl,
  isSameDomain,
  buildUserContext,
  getCurrentSubdomain,
  isMainDomain,
  UserContext,
} from "@/utils/domains";

/**
 * Custom hook for handling navigation with domain awareness
 */
export function useMultiDomainNavigation() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  /**
   * Navigate to dashboard based on user context
   */
  const goToDashboard = (realtorData?: any) => {
    console.log("🏠 Navigating to dashboard");

    const userContext = buildUserContext(user, realtorData);
    const dashboardUrl = getDashboardUrl(userContext);

    if (isSameDomain(dashboardUrl)) {
      console.log("📍 Same domain navigation - using Next.js router");
      const url = new URL(dashboardUrl);
      router.push(url.pathname + url.search);
    } else {
      console.log("🌍 Cross-domain navigation - using window.location");
      navigateToUrl(dashboardUrl);
    }
  };

  /**
   * Navigate to login page
   */
  const goToLogin = (userRole?: "ADMIN" | "REALTOR" | "GUEST") => {
    console.log("🔐 Navigating to login");

    const loginUrl = getLoginUrl(userRole);

    if (isSameDomain(loginUrl)) {
      console.log("📍 Same domain navigation - using Next.js router");
      const url = new URL(loginUrl);
      router.push(url.pathname + url.search);
    } else {
      console.log("🌍 Cross-domain navigation - using window.location");
      navigateToUrl(loginUrl);
    }
  };

  /**
   * Handle logout with proper redirect
   */
  const handleLogout = async (userRole?: "ADMIN" | "REALTOR" | "GUEST") => {
    console.log("🚪 Handling logout");

    try {
      await logout();

      const logoutRedirectUrl = getLogoutRedirectUrl(userRole || user?.role);

      if (isSameDomain(logoutRedirectUrl)) {
        console.log("📍 Same domain redirect - using Next.js router");
        const url = new URL(logoutRedirectUrl);
        router.replace(url.pathname + url.search);
      } else {
        console.log("🌍 Cross-domain redirect - using window.location");
        navigateToUrl(logoutRedirectUrl, true);
      }
    } catch (error) {
      console.error("❌ Logout error:", error);
      // Force redirect even if logout fails
      const logoutRedirectUrl = getLogoutRedirectUrl(userRole || user?.role);
      navigateToUrl(logoutRedirectUrl, true);
    }
  };

  /**
   * Handle email verification success
   */
  const handleEmailVerificationSuccess = (realtorData?: any) => {
    console.log("📧 Handling email verification success");

    const userContext = buildUserContext(user, realtorData);
    const redirectUrl = getEmailVerificationRedirectUrl(userContext);

    if (isSameDomain(redirectUrl)) {
      console.log("📍 Same domain navigation - using Next.js router");
      const url = new URL(redirectUrl);
      router.push(url.pathname + url.search);
    } else {
      console.log("🌍 Cross-domain navigation - using window.location");
      navigateToUrl(redirectUrl);
    }
  };

  /**
   * Handle realtor registration success
   */
  const handleRealtorRegistrationSuccess = (
    subdomain: string,
    isVerified: boolean = false
  ) => {
    console.log(`🎉 Handling realtor registration success for ${subdomain}`);

    const redirectUrl = getRealtorRegistrationRedirectUrl(
      subdomain,
      isVerified
    );

    // Always use window.location for registration success to ensure clean state
    console.log(
      "🌍 Registration redirect - using window.location for clean state"
    );
    navigateToUrl(redirectUrl, true);
  };

  /**
   * Navigate to specific path with domain awareness
   */
  const navigateToPath = (path: string, replace: boolean = false) => {
    console.log(`🔄 Navigating to path: ${path}`);

    if (replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  };

  /**
   * Get current context information
   */
  const getCurrentContext = () => {
    return {
      subdomain: getCurrentSubdomain(),
      isMainDomain: isMainDomain(),
      user: user,
      userContext: buildUserContext(user),
    };
  };

  return {
    // Navigation functions
    goToDashboard,
    goToLogin,
    handleLogout,
    handleEmailVerificationSuccess,
    handleRealtorRegistrationSuccess,
    navigateToPath,

    // Utility functions
    getCurrentContext,

    // Direct access to router for edge cases
    router,
  };
}
