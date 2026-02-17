export interface TenantInfo {
  subdomain: string;
  type: "admin" | "realtor" | "main";
  isMultiTenant: boolean;
}

// Client-side only function for use in client components
export function getSubdomainInfo(): TenantInfo {
  if (typeof window === "undefined") {
    // Return default for SSR
    return {
      subdomain: "",
      type: "main",
      isMultiTenant: false,
    };
  }

  // Client-side subdomain detection
  const hostname = window.location.hostname;
  const subdomain = hostname.split(".")[0];

  if (subdomain === "admin") {
    return {
      subdomain,
      type: "admin",
      isMultiTenant: true,
    };
  } else if (
    subdomain !== "www" &&
    subdomain !== "localhost" &&
    subdomain !== hostname
  ) {
    return {
      subdomain,
      type: "realtor",
      isMultiTenant: true,
    };
  } else {
    return {
      subdomain: "",
      type: "main",
      isMultiTenant: false,
    };
  }
}

export function getRealtorSubdomain(): string | null {
  const tenantInfo = getSubdomainInfo();
  return tenantInfo.type === "realtor" ? tenantInfo.subdomain : null;
}

export function isAdminSubdomain(): boolean {
  const tenantInfo = getSubdomainInfo();
  return tenantInfo.type === "admin";
}

export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.host}`;
  }

  // For SSR, return a default value
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://localhost:3000`;
}

export function buildSubdomainUrl(subdomain: string, path = "/"): string {
  const currentUrl = getBaseUrl();
  const url = new URL(currentUrl);

  // Replace or add subdomain
  const hostParts = url.hostname.split(".");
  if (hostParts[0] === subdomain) {
    // Already on correct subdomain
    return `${url.protocol}//${url.host}${path}`;
  }

  // Build new hostname with subdomain
  let newHostname;
  if (url.hostname === "localhost") {
    newHostname = `${subdomain}.localhost`;
  } else {
    // For production domains like stayza.com
    if (hostParts.length === 2) {
      // stayza.com -> subdomain.stayza.com
      newHostname = `${subdomain}.${url.hostname}`;
    } else {
      // www.stayza.com -> subdomain.stayza.com
      hostParts[0] = subdomain;
      newHostname = hostParts.join(".");
    }
  }

  const portPart = url.port ? `:${url.port}` : "";
  return `${url.protocol}//${newHostname}${portPart}${path}`;
}

// Get the main domain URL (without subdomain)
export function getMainDomainUrl(path = "/"): string {
  if (typeof window === "undefined") {
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    return `${protocol}://localhost:3000${path}`;
  }

  const url = new URL(window.location.href);
  const hostParts = url.hostname.split(".");

  let mainHostname;
  if (url.hostname === "localhost" || hostParts.length === 1) {
    // Already on localhost or single domain
    mainHostname = "localhost";
  } else if (url.hostname.includes("localhost")) {
    // subdomain.localhost -> localhost
    mainHostname = "localhost";
  } else {
    // subdomain.stayza.com or www.stayza.com -> stayza.com
    if (hostParts.length > 2) {
      mainHostname = hostParts.slice(-2).join(".");
    } else {
      mainHostname = url.hostname;
    }
  }

  // Preserve port for development
  const port = url.port ? `:${url.port}` : "";
  return `${url.protocol}//${mainHostname}${port}${path}`;
}
