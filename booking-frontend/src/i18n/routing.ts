import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["en", "fr", "pt"],

  // Used when no locale matches
  defaultLocale: "en",

  // The pathname for each locale - only include routes that exist in [locale] directory
  pathnames: {
    "/": "/",
    "/about": {
      en: "/about",
      fr: "/a-propos",
      pt: "/sobre",
    },
    "/properties": {
      en: "/properties",
      fr: "/proprietes",
      pt: "/propriedades",
    },
  },
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
