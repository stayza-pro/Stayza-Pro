import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const url = request.nextUrl.clone();

  console.log(`Middleware: ${hostname} requesting ${url.pathname}`);

  // Handle subdomain routing for multi-tenant setup
  if (hostname.includes("localhost")) {
    const subdomain = hostname.split(".")[0];

    console.log(`Subdomain detected: ${subdomain}`);

    // Realtor subdomain routing (e.g., loligpoing.localhost:3000)
    if (
      subdomain !== "www" &&
      subdomain !== "localhost" &&
      subdomain !== "admin"
    ) {
      console.log(`Processing realtor subdomain: ${subdomain}`);

      // This is a realtor subdomain - set headers for components
      const response = NextResponse.next();
      response.headers.set("x-subdomain", subdomain);
      response.headers.set("x-tenant-type", "realtor");

      // Handle realtor subdomain routes
      if (url.pathname === "/login") {
        response.headers.set("x-page-type", "realtor-login");
        console.log(
          `Routing ${subdomain}.localhost/login to realtor login page`
        );
      } else if (url.pathname === "/test") {
        response.headers.set("x-page-type", "realtor-test");
        console.log(`Routing ${subdomain}.localhost/test to realtor test page`);
      }

      return response;
    }
  }

  // Default response
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
