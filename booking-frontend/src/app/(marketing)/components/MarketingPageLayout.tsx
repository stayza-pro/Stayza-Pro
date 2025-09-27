import type { ReactNode } from "react";

import { Navigation } from "@/app/(marketing)/sections/Navigation";
import { FooterSection } from "@/app/(marketing)/sections/FooterSection";

interface MarketingPageLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  heroSlot?: ReactNode;
}

export function MarketingPageLayout({
  title,
  description,
  children,
  heroSlot,
}: MarketingPageLayoutProps) {
  return (
    <div className="marketing-theme relative min-h-screen overflow-hidden bg-gradient-to-br from-[var(--marketing-primary)] via-[rgba(30,58,138,0.82)] to-[rgba(4,120,87,0.72)] text-marketing-foreground antialiased">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[-15%] top-[-20%] h-[460px] w-[460px] rounded-full bg-[rgba(249,115,22,0.28)] blur-3xl" />
        <div className="absolute left-[-12%] bottom-[-25%] h-[520px] w-[520px] rounded-full bg-[rgba(59,130,246,0.22)] blur-3xl" />
      </div>

      <div className="relative">
        <Navigation />
        <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-16 sm:px-6 lg:px-8">
          <section className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-[0_40px_120px_rgba(15,23,42,0.32)] backdrop-blur-xl sm:p-10">
            <div className="max-w-3xl space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                Stayza Pro Platform
              </p>
              <h1 className="text-4xl font-semibold text-white md:text-5xl">
                {title}
              </h1>
              {description ? (
                <p className="text-lg text-white/80 md:text-xl">
                  {description}
                </p>
              ) : null}
              {heroSlot ? <div className="pt-2">{heroSlot}</div> : null}
            </div>
          </section>

          <div className="mt-16 space-y-12">
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-12">
                <div className="rounded-3xl bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),rgba(255,255,255,0.04)_60%)] p-[1px]">
                  <div className="rounded-[calc(1.5rem-1px)] bg-white/95 p-10 shadow-[0_18px_60px_rgba(15,23,42,0.18)]">
                    <div className="space-y-12">{children}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <FooterSection />
      </div>
    </div>
  );
}
