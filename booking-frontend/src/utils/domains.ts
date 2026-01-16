/**
 * Multi-domain utility functions for Stayza platform
 * Handles transitions between main domain and subdomains for different user types
 */

export interface DomainConfig {
  mainDomain: string;
  devDomain: string;
  isDev: boolean;
  currentHostname: string;
  currentPort: string;
}

export interface UserContext {
  role: "ADMIN" | "REALTOR" | "GUEST";
  subdomain?: string;
  isVerified?: boolean;
}

/**
 * Get domain configuration based on environment
 */
export function getDomainConfig(): DomainConfig {
  if (typeof window === "undefined") {
    // Server-side defaults
    return {
      mainDomain: process.env.NEXT_PUBLIC_MAIN_DOMAIN || "stayza.pro",
      devDomain: process.env.NEXT_PUBLIC_DEV_DOMAIN || "localhost:3000",
      isDev: process.env.NODE_ENV === "development",
      currentHostname: "localhost",
      currentPort: "3000",
    };
  }

  const hostname = window.location.hostname;
  const port = window.location.port;
  const isDev = hostname === "localhost" || hostname.includes("localhost");

  return {
    mainDomain: process.env.NEXT_PUBLIC_MAIN_DOMAIN || "stayza.pro",
    devDomain: process.env.NEXT_PUBLIC_DEV_DOMAIN || "localhost:3000",
    isDev,
    currentHostname: hostname,
    currentPort: port,
  };
}

/**
 * Build URL for main domain (stayza.pro or localhost:3000)
 */
export function buildMainDomainUrl(path: string = "/"): string {
  const config = getDomainConfig();

  if (config.isDev) {
    return `http://localhost:${config.currentPort}${path}`;
  }

  return `https://${config.mainDomain}${path}`;
}

/**
 * Build URL for subdomain (subdomain.stayza.pro or subdomain.localhost:3000)
 */
export function buildSubdomainUrl(
  subdomain: string,
  path: string = "/"
): string {
  const config = getDomainConfig();

  if (config.isDev) {
    return `http://${subdomain}.localhost:${config.currentPort}${path}`;
  }

  return `https://${subdomain}.${config.mainDomain}${path}`;
}

/**
 * Get current subdomain from hostname
 */
export function getCurrentSubdomain(): string | null {
  if (typeof window === "undefined") return null;

  const hostname = window.location.hostname;
  const parts = hostname.split(".");

  // For localhost:3000 format, subdomain is first part
  if (hostname.includes("localhost")) {
    if (parts.length > 1 && parts[0] !== "localhost") {
      return parts[0];
    }
    return null;
  }

  // For production domains like subdomain.stayza.pro
  if (parts.length > 2) {
    const subdomain = parts[0];
    if (subdomain !== "www" && subdomain !== "admin") {
      return subdomain;
    }
  }

  return null;
}

/**
 * Check if current domain is main domain (no subdomain)
 */
export function isMainDomain(): boolean {
  return getCurrentSubdomain() === null;
}

/**
 * Check if current domain is admin subdomain
 */
export function isAdminDomain(): boolean {
  const config = getDomainConfig();

  if (config.isDev) {
    return window.location.hostname === `admin.localhost`;
  }

  return window.location.hostname === `admin.${config.mainDomain}`;
}

/**
 * Check if current domain is realtor subdomain
 */
export function isRealtorDomain(): boolean {
  const subdomain = getCurrentSubdomain();
  return subdomain !== null && subdomain !== "admin" && subdomain !== "www";
}

/**
 * Get appropriate dashboard URL based on user context
 */
export function getDashboardUrl(userContext: UserContext): string {
  

  switch (userContext.role) {
    case "ADMIN":
      
      return buildMainDomainUrl("/admin");

    case "REALTOR":
      if (!userContext.subdomain) {
        
        throw new Error("Realtor subdomain is required");
      }

      if (!userContext.isVerified) {
        
        return buildMainDomainUrl("/realtor/dashboard");
      }

      
      return buildSubdomainUrl(userContext.subdomain, "/realtor/dashboard");

    case "GUEST":
      const currentSubdomain = getCurrentSubdomain();
      if (currentSubdomain) {
        
        return buildSubdomainUrl(currentSubdomain, "/account");
      }

      
      return buildMainDomainUrl("/account");

    default:
      
      return buildMainDomainUrl("/");
  }
}

/**
 * Get appropriate login URL based on current context and user type
 */
export function getLoginUrl(userRole?: "ADMIN" | "REALTOR" | "GUEST"): string {
  

  const currentSubdomain = getCurrentSubdomain();

  if (userRole === "ADMIN" || isAdminDomain()) {
    
    return buildMainDomainUrl("/admin/login");
  }

  if (userRole === "REALTOR") {
    
    return buildMainDomainUrl("/realtor/login");
  }

  if (userRole === "GUEST" || currentSubdomain) {
    if (currentSubdomain) {
      
      return buildSubdomainUrl(currentSubdomain, "/login");
    }
  }

  
  return buildMainDomainUrl("/login");
}

/**
 * Get appropriate logout redirect URL based on current context
 */
export function getLogoutRedirectUrl(
  userRole?: "ADMIN" | "REALTOR" | "GUEST"
): string {
  

  const currentSubdomain = getCurrentSubdomain();

  if (userRole === "ADMIN" || isAdminDomain()) {
    
    return buildMainDomainUrl("/");
  }

  if (userRole === "REALTOR") {
    
    return buildMainDomainUrl("/");
  }

  if (userRole === "GUEST" && currentSubdomain) {
    
    return buildSubdomainUrl(currentSubdomain, "/");
  }

  
  return buildMainDomainUrl("/");
}

/**
 * Get email verification redirect URL
 */
export function getEmailVerificationRedirectUrl(
  userContext: UserContext
): string {
  

  // After email verification, redirect to appropriate dashboard
  return getDashboardUrl(userContext);
}

/**
 * Get registration success redirect URL for realtors
 */
export function getRealtorRegistrationRedirectUrl(
  subdomain: string,
  isVerified: boolean = false
): string {
  

  if (isVerified) {
    
    return buildSubdomainUrl(subdomain, "/realtor/dashboard");
  }

  
  return buildMainDomainUrl(
    `/realtor/dashboard?verification-pending=true&subdomain=${subdomain}`
  );
}

/**
 * Navigate to URL with proper environment handling
 */
export function navigateToUrl(url: string, replace: boolean = false): void {
  

  if (typeof window !== "undefined") {
    if (replace) {
      window.location.replace(url);
    } else {
      window.location.href = url;
    }
  }
}

/**
 * Check if URL belongs to same domain/subdomain
 */
export function isSameDomain(url: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    const targetUrl = new URL(url);
    const currentUrl = new URL(window.location.href);

    return targetUrl.hostname === currentUrl.hostname;
  } catch {
    return false;
  }
}

/**
 * Get user context from auth state and current domain
 */
export function buildUserContext(user: any, realtorData?: any): UserContext {
  if (!user) {
    const currentSubdomain = getCurrentSubdomain();
    return {
      role: "GUEST",
      subdomain: currentSubdomain || undefined,
    };
  }

  const userContext: UserContext = {
    role: user.role || "GUEST",
  };

  if (user.role === "REALTOR" && realtorData) {
    userContext.subdomain = realtorData.slug;
    userContext.isVerified =
      user.isEmailVerified && realtorData.status === "APPROVED";
  }

  return userContext;
}
