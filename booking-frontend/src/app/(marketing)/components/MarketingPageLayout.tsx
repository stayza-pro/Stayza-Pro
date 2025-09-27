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
    <div className="marketing-theme min-h-screen bg-marketing-surface text-marketing-foreground antialiased">
      <Navigation />
      <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-4xl font-bold md:text-5xl">{title}</h1>
          {description ? (
            <p className="text-lg text-marketing-muted md:text-xl">
              {description}
            </p>
          ) : null}
          {heroSlot}
        </div>
        <div className="mt-12 space-y-12 pb-8">{children}</div>
      </main>
      <FooterSection />
    </div>
  );
}
