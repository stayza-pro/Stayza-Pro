"use client";

import React from "react";
import { BrandTokenProvider, useBrandTokens } from "@/providers/BrandTokenProvider";
import { GuestNavbar } from "@/components/guest/sections/GuestNavbar";
import { Footer } from "@/components/guest/sections/Footer";
import { MobileBottomNav } from "@/components/guest/sections/MobileBottomNav";
import { useCurrentUser } from "@/hooks/useCurrentUser";

function GuestLayoutInner({ children }: { children: React.ReactNode }) {
  const tokens = useBrandTokens();
  const { isAuthenticated } = useCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Skip nav for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Skip to main content
      </a>

      <GuestNavbar
        agencyName={tokens.realtorName}
        tagline={tokens.tagline}
        primaryColor={tokens.primary}
        logo={tokens.logoUrl}
      />

      <main id="main-content" className="flex-1 pb-20 md:pb-0">
        {children}
      </main>

      <div className="hidden md:block">
        <Footer
          realtorName={tokens.realtorName}
          tagline={tokens.tagline}
          logo={tokens.logoUrl}
          description={tokens.description}
          primaryColor={tokens.primary}
          secondaryColor={tokens.secondary}
          accentColor={tokens.accent}
          realtorId={tokens.realtorId || undefined}
        />
      </div>

      <MobileBottomNav isAuthenticated={isAuthenticated} />
    </div>
  );
}

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <BrandTokenProvider>
      <GuestLayoutInner>{children}</GuestLayoutInner>
    </BrandTokenProvider>
  );
}
