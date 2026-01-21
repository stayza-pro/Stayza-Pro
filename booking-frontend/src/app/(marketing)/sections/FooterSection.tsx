import Link from "next/link";

import { navLinks, brand } from "@/app/(marketing)/content";
import { LogoLockup } from "@/app/(marketing)/components/LogoLockup";

const footerLinks = [
  { label: "Help", href: "/help" },
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Terms", href: "/legal/terms" },
];

export function FooterSection() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="py-12"
      style={{
        backgroundColor: "var(--marketing-footer-bg)",
        color: "var(--marketing-footer-fg)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <LogoLockup tone="light" href="/en" />
            <p
              className="mt-3 max-w-xs text-sm"
              style={{ color: "var(--marketing-footer-muted)" }}
            >
              {brand.tagline}
            </p>
          </div>
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-6 text-sm"
            style={{ color: "var(--marketing-footer-muted)" }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--marketing-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--marketing-footer-bg)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div
            className="flex flex-wrap items-center gap-4 text-xs"
            style={{ color: "var(--marketing-footer-muted)" }}
          >
            {footerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--marketing-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--marketing-footer-bg)]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <p
          className="mt-8 text-xs"
          style={{ color: "var(--marketing-footer-muted)" }}
        >
          © {currentYear} Stayza Pro. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
