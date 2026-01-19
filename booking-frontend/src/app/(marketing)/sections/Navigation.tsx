"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { Menu, X } from "lucide-react";

import { navLinks, palette } from "@/app/(marketing)/content";
import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { LogoLockup } from "@/app/(marketing)/components/LogoLockup";

const navToggleStyles: CSSProperties & Record<string, string> = {
  "--nav-toggle-border":
    "color-mix(in srgb, var(--marketing-primary-foreground, #f1f5f9) 32%, transparent)",
  "--nav-toggle-color":
    "color-mix(in srgb, var(--marketing-primary-foreground, #f1f5f9) 78%, transparent)",
  "--nav-toggle-hover-border": palette.primaryForeground,
  "--nav-toggle-hover-bg":
    "color-mix(in srgb, var(--marketing-primary-foreground, #f1f5f9) 18%, transparent)",
  "--nav-toggle-hover-text": palette.primaryForeground,
  "--nav-toggle-ring": palette.primaryForeground,
};

export function Navigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    const hashIndex = href.indexOf("#");
    if (hashIndex === -1) {
      return;
    }

    const targetPath = href.slice(0, hashIndex) || "/";
    const targetId = href.slice(hashIndex + 1);
    if (!targetId || targetPath !== pathname) {
      return;
    }

    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setOpen(false);
    }
  };

  return (
    <header className="relative z-20 border-b border-white/10 px-4 py-6 sm:px-6 lg:px-8">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex max-w-7xl items-center justify-between gap-6"
      >
        <LogoLockup tone="light" />

        <button
          type="button"
          aria-label="Toggle navigation menu"
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-full border border-[var(--nav-toggle-border)] p-2 text-[color:var(--nav-toggle-color)] transition hover:border-[var(--nav-toggle-hover-border)] hover:bg-[var(--nav-toggle-hover-bg)] hover:text-[color:var(--nav-toggle-hover-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-toggle-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent md:hidden"
          style={navToggleStyles}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="hidden items-center gap-8 text-sm font-medium text-white/80 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={(e) => handleSmoothScroll(e, link.href)}
              className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <CTAButton label="Join Waitlist" href="/join-waitlist" />
        </div>
      </nav>

      {open && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-medium text-white backdrop-blur md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={(e) => handleSmoothScroll(e, link.href)}
              className="rounded-xl px-3 py-2 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              {link.label}
            </Link>
          ))}
          <CTAButton
            label="Join Waitlist"
            variant="solid"
            href="/join-waitlist"
            className="w-full justify-center"
          />
        </div>
      )}
    </header>
  );
}
