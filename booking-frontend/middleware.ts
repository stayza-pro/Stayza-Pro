import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const url = request.nextUrl.clone();

  console.log(`🔍 Middleware: ${hostname} requesting ${url.pathname}`);

  // Parse hostname and subdomain
  const hostParts = hostname.split(".");
  const isLocalhost = hostname.includes("localhost");
  const isDev = process.env.NODE_ENV === "development";

  let subdomain = "";
  let isSubdomain = false;
  let tenantType = "main";

  if (isLocalhost && isDev) {
    // Development: subdomain.localhost:3000
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

  // Determine tenant type
  if (isSubdomain) {
    if (subdomain === "admin") {
      tenantType = "admin";
    } else if (subdomain !== "www") {
      tenantType = "realtor";
    }
  }

  console.log(
    `🏷️ Parsed: subdomain="${subdomain}", type="${tenantType}", isSubdomain=${isSubdomain}`
  );

  // Create response with tenant information
  const response = NextResponse.next();
  response.headers.set("x-subdomain", subdomain);
  response.headers.set("x-tenant-type", tenantType);
  response.headers.set("x-is-subdomain", isSubdomain.toString());

  // Handle admin subdomain
  if (tenantType === "admin") {
    console.log(`🔧 Admin subdomain detected: ${subdomain}`);
    response.headers.set("x-admin-subdomain", "true");

    // Admin-specific routing logic can go here
    if (url.pathname === "/" || url.pathname === "/login") {
      console.log(`🔧 Admin root/login access on admin subdomain`);
    }
  }

  // Handle realtor subdomain
  else if (tenantType === "realtor") {
    console.log(`🏢 Realtor subdomain detected: ${subdomain}`);
    response.headers.set("x-realtor-subdomain", subdomain);

    // Set specific page types for realtor subdomain routes
    if (url.pathname === "/") {
      response.headers.set("x-page-type", "realtor-home");
      console.log(`🏢 Realtor home page: ${subdomain}`);
    } else if (url.pathname === "/login" || url.pathname === "/signup") {
      response.headers.set("x-page-type", "guest-auth");
      console.log(
        `🏢 Guest auth on realtor subdomain: ${subdomain}${url.pathname}`
      );
    } else if (url.pathname.startsWith("/realtor/")) {
      response.headers.set("x-page-type", "realtor-dashboard");
      console.log(`🏢 Realtor dashboard access: ${subdomain}${url.pathname}`);
    }
  }

  // Handle main domain
  else {
    console.log(`🌐 Main domain access`);
    response.headers.set("x-main-domain", "true");

    // Main domain routing logic
    if (url.pathname.startsWith("/admin/")) {
      response.headers.set("x-page-type", "admin-access");
      console.log(`🌐 Admin access on main domain`);
    } else if (url.pathname.startsWith("/realtor/")) {
      response.headers.set("x-page-type", "realtor-access");
      console.log(`🌐 Realtor access on main domain`);
    } else if (url.pathname === "/register") {
      response.headers.set("x-page-type", "realtor-registration");
      console.log(`🌐 Realtor registration on main domain`);
    }
  }

  // Handle protected routes and redirections
  // This is where you could add authentication checks if needed

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)",
  ],
};
