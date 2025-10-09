import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["en", "fr", "pt"],

  // Used when no locale matches
  defaultLocale: "en",

  // The pathname for each locale
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
    "/dashboard": "/dashboard",
    "/guest/login": {
      en: "/guest/login",
      fr: "/guest/connexion",
      pt: "/guest/login",
    },
    "/guest/register": {
      en: "/guest/register",
      fr: "/guest/inscription",
      pt: "/guest/registro",
    },
    "/realtor/login": {
      en: "/realtor/login",
      fr: "/realtor/connexion",
      pt: "/realtor/login",
    },
    "/realtor/register": {
      en: "/realtor/register",
      fr: "/realtor/inscription",
      pt: "/realtor/registro",
    },
    "/admin/login": {
      en: "/admin/login",
      fr: "/admin/connexion",
      pt: "/admin/login",
    },
  },
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
