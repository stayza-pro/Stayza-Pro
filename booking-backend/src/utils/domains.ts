import { config } from "../config";

/**
 * Domain utility functions for multi-tenant architecture in the backend
 * Handles URL generation for email links and API responses
 */

export interface DomainConfig {
  isProduction: boolean;
  mainDomain: string;
  baseDomain: string;
  protocol: string;
}

/**
 * Get current domain configuration based on environment
 */
export function getDomainConfig(requestHost?: string): DomainConfig {
  const isProduction = config.NODE_ENV === "production";

  // Dynamic domain detection based on request or config
  let mainDomain: string;
  let baseDomain: string;

  if (requestHost && !isProduction) {
    // Development: Extract port from request host if available
    const hostParts = requestHost.split(":");
    const port = hostParts[1] || "3000"; // Default to 3000 for frontend
    mainDomain = `localhost:${port}`;
    baseDomain = `localhost:${port}`;
  } else if (isProduction) {
    mainDomain = config.MAIN_DOMAIN;
    baseDomain = config.MAIN_DOMAIN;
  } else {
    // Fallback to config
    mainDomain = config.DEV_DOMAIN;
    baseDomain = config.DEV_DOMAIN;
  }

  const protocol = isProduction ? "https" : "http";

  console.log("[Backend Domain Config]", {
    isProduction,
    mainDomain,
    baseDomain,
    protocol,
    nodeEnv: config.NODE_ENV,
    requestHost,
  });

  return {
    isProduction,
    mainDomain,
    baseDomain,
    protocol,
  };
}

/**
 * Build URL for main domain (admin functions, general pages)
 */
export function buildMainDomainUrl(
  path: string = "",
  requestHost?: string
): string {
  const { protocol, mainDomain } = getDomainConfig(requestHost);
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${protocol}://${mainDomain}${cleanPath}`;

  console.log("[Backend] Building main domain URL:", {
    path,
    url,
    requestHost,
  });
  return url;
}

/**
 * Build URL for realtor subdomain
 */
export function buildSubdomainUrl(
  subdomain: string,
  path: string = "",
  requestHost?: string
): string {
  const { protocol, baseDomain } = getDomainConfig(requestHost);
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${protocol}://${subdomain}.${baseDomain}${cleanPath}`;

  console.log("[Backend] Building subdomain URL:", {
    subdomain,
    path,
    url,
    requestHost,
  });
  return url;
}

/**
 * Get email verification URL based on user type and context
 */
export function getEmailVerificationUrl(
  token: string,
  userType: "admin" | "realtor" | "guest",
  realtorSlug?: string,
  email?: string
): string {
  const params = new URLSearchParams();
  params.set("token", token);
  params.set("type", userType);
  if (email) {
    params.set("email", email);
  }

  const path = `/verify-email?${params.toString()}`;

  console.log("[Backend] Generated verification URL path:", path);

  // All email verifications happen on main domain for consistency
  // The verify-email page is at the root level and handles all user types
  return buildMainDomainUrl(path);
}

/**
 * Get dashboard URL based on user type and verification status
 */
export function getDashboardUrl(
  userType: "admin" | "realtor" | "guest",
  realtorSlug?: string,
  isVerified: boolean = false
): string {
  if (userType === "admin") {
    return buildMainDomainUrl("/admin/dashboard");
  } else if (userType === "realtor" && realtorSlug) {
    if (isVerified) {
      return buildSubdomainUrl(realtorSlug, "/dashboard");
    } else {
      // Unverified realtors stay on main domain until verification
      return buildMainDomainUrl("/realtor/check-email");
    }
  } else {
    // Guests typically don't have dashboards, redirect to main
    return buildMainDomainUrl("/");
  }
}

/**
 * Get login URL for user type
 */
export function getLoginUrl(userType?: "admin" | "realtor" | "guest"): string {
  if (userType === "admin") {
    return buildMainDomainUrl("/admin/login");
  } else {
    return buildMainDomainUrl("/login");
  }
}

/**
 * Get registration success redirect URL
 */
export function getRegistrationSuccessUrl(
  userType: "admin" | "realtor" | "guest",
  realtorSlug?: string
): string {
  if (userType === "realtor" && realtorSlug) {
    // After registration, realtors need to verify email first
    return buildMainDomainUrl("/realtor/check-email");
  } else if (userType === "admin") {
    return buildMainDomainUrl("/admin/dashboard");
  } else {
    return buildMainDomainUrl("/");
  }
}

/**
 * Extract subdomain from request host header
 */
export function extractSubdomain(host: string): string | null {
  const { baseDomain } = getDomainConfig();

  if (host.includes(baseDomain)) {
    const subdomain = host.replace(`.${baseDomain}`, "");
    return subdomain !== baseDomain ? subdomain : null;
  }

  return null;
}

/**
 * Validate if a subdomain corresponds to a valid realtor
 */
export async function validateRealtorSubdomain(
  subdomain: string
): Promise<boolean> {
  // This would typically query the database to check if the realtor exists
  // For now, return true - implement actual validation as needed
  console.log("[Backend] Validating realtor subdomain:", subdomain);
  return true;
}

/**
 * Get CORS origin patterns for multi-domain setup
 */
export function getCorsOriginPatterns(): (string | RegExp)[] {
  const { protocol, baseDomain } = getDomainConfig();

  return [
    `${protocol}://${baseDomain}`,
    new RegExp(
      `^${protocol}://[a-zA-Z0-9-]+\\.${baseDomain.replace(".", "\\.")}$`
    ),
  ];
}
