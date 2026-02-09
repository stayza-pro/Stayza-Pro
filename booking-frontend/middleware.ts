import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SUBDOMAIN_LOGIN_PATHS = new Set(["/login", "/realtor/login"]);

const getHostname = (hostHeader: string): string => {
  return hostHeader.split(":")[0].toLowerCase();
};

const isLocalhostHost = (hostname: string): boolean => {
  return hostname === "localhost" || hostname.endsWith(".localhost");
};

const getRootDomain = (hostname: string): string => {
  if (isLocalhostHost(hostname)) return "localhost";

  const hostParts = hostname.split(".");
  if (hostParts.length >= 2) {
    return hostParts.slice(-2).join(".");
  }

  return hostname;
};

export function middleware(request: NextRequest) {
  const hostHeader = request.headers.get("host") || request.nextUrl.host;
  const hostname = getHostname(hostHeader);
  const url = request.nextUrl.clone();

  const hostParts = hostname.split(".");
  const isLocalhost = isLocalhostHost(hostname);

  let subdomain = "";
  let isSubdomain = false;
  let tenantType = "main";

  if (isLocalhost) {
    // Development: subdomain.localhost
    if (hostParts.length > 1 && hostParts[0] !== "localhost") {
      subdomain = hostParts[0];
      isSubdomain = true;
    }
  } else {
    // Production: subdomain.stayza.pro
    if (hostParts.length > 2) {
      subdomain = hostParts[0];
      isSubdomain = true;
    }
  }

  if (isSubdomain) {
    if (subdomain === "admin") {
      tenantType = "admin";
    } else if (subdomain !== "www") {
      tenantType = "realtor";
    }
  }

  // Realtor subdomains should never serve local /login pages.
  // Redirect gracefully to main-domain realtor login.
  if (tenantType === "realtor" && SUBDOMAIN_LOGIN_PATHS.has(url.pathname)) {
    const redirectUrl = url.clone();
    redirectUrl.hostname = getRootDomain(hostname);
    redirectUrl.pathname = "/realtor/login";
    return NextResponse.redirect(redirectUrl, 307);
  }

  const response = NextResponse.next();
  response.headers.set("x-subdomain", subdomain);
  response.headers.set("x-tenant-type", tenantType);
  response.headers.set("x-is-subdomain", isSubdomain.toString());

  if (tenantType === "admin") {
    response.headers.set("x-admin-subdomain", "true");
  } else if (tenantType === "realtor") {
    response.headers.set("x-realtor-subdomain", subdomain);

    if (url.pathname === "/") {
      response.headers.set("x-page-type", "realtor-home");
    } else if (url.pathname === "/login" || url.pathname === "/signup") {
      response.headers.set("x-page-type", "guest-auth");
    } else if (url.pathname.startsWith("/realtor/")) {
      response.headers.set("x-page-type", "realtor-dashboard");
    }
  } else {
    response.headers.set("x-main-domain", "true");

    if (url.pathname.startsWith("/admin/")) {
      response.headers.set("x-page-type", "admin-access");
    } else if (url.pathname.startsWith("/realtor/")) {
      response.headers.set("x-page-type", "realtor-access");
    } else if (url.pathname === "/register") {
      response.headers.set("x-page-type", "realtor-registration");
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)",
  ],
};
