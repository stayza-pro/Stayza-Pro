"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

import { navLinks } from "@/app/(marketing)/content";
import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { LogoLockup } from "@/app/(marketing)/components/LogoLockup";

export function Navigation() {
  const [open, setOpen] = useState(false);

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
          className="rounded-full border border-white/20 p-2 text-white/80 transition hover:border-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--marketing-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="hidden items-center gap-8 text-sm font-medium text-white/80 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <CTAButton label="Start for free" href="/get-started" />
        </div>
      </nav>

      {open && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-medium text-white backdrop-blur md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              {link.label}
            </Link>
          ))}
          <CTAButton
            label="Start for free"
            variant="solid"
            href="/get-started"
            className="w-full justify-center"
          />
        </div>
      )}
    </header>
  );
}
