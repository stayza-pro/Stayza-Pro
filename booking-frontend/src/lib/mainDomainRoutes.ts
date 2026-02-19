export const MAIN_DOMAIN_ALLOWED_EXACT_PATHS = new Set([
  "/",
  "/en",
  "/fr",
  "/pt",
]);

export const MAIN_DOMAIN_ALLOWED_PREFIXES = [
  "/guest",
  "/guest-landing",
  "/booking",
  "/auth",
  "/admin",
  "/how-it-works",
  "/get-started",
  "/join-waitlist",
  "/booking-website-for-realtors",
  "/become-host",
  "/help",
  "/legal",
  "/privacy",
  "/terms",
  "/realtor/login",
  "/realtor/forgot-password",
  "/realtor/reset-password",
  "/realtor/check-email",
  "/verify-email",
];

export const isAllowedMainDomainPath = (pathname: string): boolean => {
  if (MAIN_DOMAIN_ALLOWED_EXACT_PATHS.has(pathname)) {
    return true;
  }

  return MAIN_DOMAIN_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
};
