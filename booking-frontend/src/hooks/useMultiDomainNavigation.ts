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
    

    const userContext = buildUserContext(user, realtorData);
    const dashboardUrl = getDashboardUrl(userContext);

    if (isSameDomain(dashboardUrl)) {
      
      const url = new URL(dashboardUrl);
      router.push(url.pathname + url.search);
    } else {
      
      navigateToUrl(dashboardUrl);
    }
  };

  /**
   * Navigate to login page
   */
  const goToLogin = (userRole?: "ADMIN" | "REALTOR" | "GUEST") => {
    

    const loginUrl = getLoginUrl(userRole);

    if (isSameDomain(loginUrl)) {
      
      const url = new URL(loginUrl);
      router.push(url.pathname + url.search);
    } else {
      
      navigateToUrl(loginUrl);
    }
  };

  /**
   * Handle logout with proper redirect
   */
  const handleLogout = async (userRole?: "ADMIN" | "REALTOR" | "GUEST") => {
    

    try {
      await logout();

      const logoutRedirectUrl = getLogoutRedirectUrl(userRole || user?.role);

      if (isSameDomain(logoutRedirectUrl)) {
        
        const url = new URL(logoutRedirectUrl);
        router.replace(url.pathname + url.search);
      } else {
        
        navigateToUrl(logoutRedirectUrl, true);
      }
    } catch (error) {
      
      // Force redirect even if logout fails
      const logoutRedirectUrl = getLogoutRedirectUrl(userRole || user?.role);
      navigateToUrl(logoutRedirectUrl, true);
    }
  };

  /**
   * Handle email verification success
   */
  const handleEmailVerificationSuccess = (realtorData?: any) => {
    

    const userContext = buildUserContext(user, realtorData);
    const redirectUrl = getEmailVerificationRedirectUrl(userContext);

    if (isSameDomain(redirectUrl)) {
      
      const url = new URL(redirectUrl);
      router.push(url.pathname + url.search);
    } else {
      
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
    

    const redirectUrl = getRealtorRegistrationRedirectUrl(
      subdomain,
      isVerified
    );

    // Always use window.location for registration success to ensure clean state
    
    navigateToUrl(redirectUrl, true);
  };

  /**
   * Navigate to specific path with domain awareness
   */
  const navigateToPath = (path: string, replace: boolean = false) => {
    

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
