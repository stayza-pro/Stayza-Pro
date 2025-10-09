import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match only explicitly internationalized pathnames
  matcher: [
    // Match root path for locale detection/redirect
    "/",
    // Match locale-prefixed paths
    "/(en|fr|pt)/:path*",
    // Exclude non-internationalized routes
    "/((?!api|_next/static|_next/image|favicon.ico|realtor|guest|admin|dashboard|profile|booking|property|payment|webhook|notification|email|analytics|review).*)$",
  ],
};
