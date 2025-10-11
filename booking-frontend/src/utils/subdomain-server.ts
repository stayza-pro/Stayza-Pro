import { headers } from "next/headers";
import type { TenantInfo } from "./subdomain";

// Server-side only function for use in Server Components
export function getSubdomainInfoServer(): TenantInfo {
  const headersList = headers();
  const host = headersList.get("host") || "";

  // Parse subdomain from host header
  const hostname = host.split(":")[0]; // Remove port if present
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

export function getBaseUrlServer(): string {
  const headersList = headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  return `${protocol}://${host}`;
}
