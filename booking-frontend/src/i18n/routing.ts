import NextLink, { type LinkProps } from "next/link";
import { createElement, type ReactNode } from "react";

export const locales = ["en", "fr", "pt"] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";

export const routing = {
  locales,
  defaultLocale,
  pathnames: {
    "/": "/",
    "/properties": "/properties",
    "/booking": "/booking",
    "/help": "/help",
    "/contact": "/contact",
  },
};

export const isValidLocale = (value: string): value is AppLocale =>
  locales.includes(value as AppLocale);

export const normalizeLocale = (value?: string | null): AppLocale => {
  if (value && isValidLocale(value)) {
    return value;
  }
  return defaultLocale;
};

export const stripLocalePrefix = (pathname: string): string => {
  if (!pathname.startsWith("/")) {
    return `/${pathname}`;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "/";

  if (isValidLocale(segments[0])) {
    const stripped = segments.slice(1).join("/");
    return stripped ? `/${stripped}` : "/";
  }

  return pathname;
};

export const getLocaleFromPathname = (pathname: string): AppLocale => {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && isValidLocale(segments[0])) {
    return segments[0];
  }
  return defaultLocale;
};

const isExternalHref = (href: string) =>
  href.startsWith("http://") ||
  href.startsWith("https://") ||
  href.startsWith("mailto:") ||
  href.startsWith("tel:") ||
  href.startsWith("#");

export const localizePath = (href: string, locale?: string): string => {
  if (isExternalHref(href)) {
    return href;
  }

  const normalizedLocale = normalizeLocale(locale);
  const stripped = stripLocalePrefix(href);

  return stripped === "/" ? `/${normalizedLocale}` : `/${normalizedLocale}${stripped}`;
};

type LocalizedLinkProps = Omit<LinkProps, "href"> & {
  href: string;
  locale?: AppLocale;
  children: ReactNode;
  className?: string;
};

export const Link = ({ href, locale, children, ...props }: LocalizedLinkProps) =>
  createElement(
    NextLink,
    { href: localizePath(href, locale), ...props },
    children
  );
