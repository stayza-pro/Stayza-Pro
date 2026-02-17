import { config } from "../config";
import { prisma } from "@/config/database";

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

const toSafeHost = (value?: string | null): string => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const parsed = raw.includes("://") ? new URL(raw) : new URL(`http://${raw}`);
    return parsed.hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    return raw
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      .split(":")[0]
      .replace(/\.$/, "");
  }
};

const getPortFromHostLike = (value?: string | null): string | null => {
  const raw = String(value || "").trim();
  if (!raw) return null;

  try {
    const parsed = raw.includes("://") ? new URL(raw) : new URL(`http://${raw}`);
    return parsed.port || null;
  } catch {
    const match = raw.match(/:(\d+)(?:\/|$)/);
    return match?.[1] || null;
  }
};

const isLocalHost = (host: string): boolean =>
  host === "localhost" ||
  host.endsWith(".localhost") ||
  host === "127.0.0.1";

const toRootDomain = (host: string): string => {
  if (!host) return "";
  if (isLocalHost(host)) return host;

  const parts = host.split(".").filter(Boolean);
  if (parts.length <= 2) {
    return host;
  }

  return parts.slice(-2).join(".");
};

const getFrontendHostAndProtocol = (): { host: string; protocol: string } => {
  const raw = String(process.env.FRONTEND_URL || config.FRONTEND_URL || "").trim();
  if (!raw) {
    return { host: "", protocol: "https" };
  }

  try {
    const parsed = new URL(raw);
    return {
      host: toSafeHost(parsed.hostname),
      protocol: parsed.protocol === "http:" ? "http" : "https",
    };
  } catch {
    const host = toSafeHost(raw);
    return {
      host,
      protocol: host && isLocalHost(host) ? "http" : "https",
    };
  }
};

/**
 * Get current domain configuration based on environment
 */
export function getDomainConfig(requestHost?: string): DomainConfig {
  const isProduction = config.NODE_ENV === "production";
  const { host: frontendHost, protocol: frontendProtocol } =
    getFrontendHostAndProtocol();

  const explicitMainDomainFromEnv = toSafeHost(
    process.env.MAIN_DOMAIN || config.MAIN_DOMAIN || "",
  );
  const requestDomain = toRootDomain(toSafeHost(requestHost)).replace(/^www\./, "");
  const frontendDomain = toRootDomain(frontendHost).replace(/^www\./, "");
  const configuredMainDomain = explicitMainDomainFromEnv.replace(/^www\./, "");

  if (
    frontendDomain &&
    frontendDomain.includes(".") &&
    !isLocalHost(frontendDomain)
  ) {
    return {
      isProduction: true,
      mainDomain: frontendDomain,
      baseDomain: frontendDomain,
      protocol: frontendProtocol,
    };
  }

  if (
    isProduction &&
    configuredMainDomain &&
    configuredMainDomain.includes(".") &&
    !isLocalHost(configuredMainDomain)
  ) {
    return {
      isProduction: true,
      mainDomain: configuredMainDomain,
      baseDomain: configuredMainDomain,
      protocol: "https",
    };
  }

  if (
    configuredMainDomain &&
    configuredMainDomain.includes(".") &&
    !isLocalHost(configuredMainDomain)
  ) {
    return {
      isProduction: false,
      mainDomain: configuredMainDomain,
      baseDomain: configuredMainDomain,
      protocol: "https",
    };
  }

  if (requestDomain && requestDomain.includes(".") && !isLocalHost(requestDomain)) {
    return {
      isProduction: false,
      mainDomain: requestDomain,
      baseDomain: requestDomain,
      protocol: "https",
    };
  }

  const devPort =
    getPortFromHostLike(config.DEV_DOMAIN) ||
    getPortFromHostLike(requestHost) ||
    "3000";
  const localDomain = `localhost:${devPort}`;

  return {
    isProduction: false,
    mainDomain: localDomain,
    baseDomain: localDomain,
    protocol: "http",
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

  
  return url;
}

/**
 * Get email verification URL based on user type and context
 */
export function getEmailVerificationUrl(
  token: string,
  userType: "admin" | "realtor" | "guest",
  realtorSlug?: string,
  email?: string,
  requestHost?: string,
): string {
  const params = new URLSearchParams();
  params.set("token", token);
  params.set("type", userType);
  if (email) {
    params.set("email", email);
  }

  const path = `/verify-email?${params.toString()}`;

  

  // All email verifications happen on main domain for consistency
  // The verify-email page is at the root level and handles all user types
  return buildMainDomainUrl(path, requestHost);
}

/**
 * Get dashboard URL based on user type and verification status
 */
export function getDashboardUrl(
  userType: "admin" | "realtor" | "guest",
  realtorSlug?: string,
  isVerified: boolean = false,
  requestHost?: string,
): string {
  if (userType === "admin") {
    return buildMainDomainUrl("/admin/dashboard", requestHost);
  } else if (userType === "realtor" && realtorSlug) {
    if (isVerified) {
      return buildSubdomainUrl(realtorSlug, "/dashboard", requestHost);
    } else {
      // Unverified realtors stay on main domain until verification
      return buildMainDomainUrl("/realtor/check-email", requestHost);
    }
  } else {
    // Guests typically don't have dashboards, redirect to main
    return buildMainDomainUrl("/", requestHost);
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
  realtorSlug?: string,
  requestHost?: string,
): string {
  if (userType === "realtor" && realtorSlug) {
    // After registration, realtors need to verify email first
    return buildMainDomainUrl("/realtor/check-email", requestHost);
  } else if (userType === "admin") {
    return buildMainDomainUrl("/admin/dashboard", requestHost);
  } else {
    return buildMainDomainUrl("/", requestHost);
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
  try {
    const normalized = subdomain.trim().toLowerCase();

    if (!normalized || ["www", "admin", "localhost"].includes(normalized)) {
      return false;
    }

    const realtor = await prisma.realtor.findUnique({
      where: {
        slug: normalized,
      },
      select: {
        id: true,
        status: true,
        isActive: true,
      },
    });

    if (!realtor) {
      return false;
    }

    return realtor.isActive && realtor.status === "APPROVED";
  } catch (error) {
    return false;
  }
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
