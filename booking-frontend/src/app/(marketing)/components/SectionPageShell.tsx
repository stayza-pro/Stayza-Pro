import type { ReactNode } from "react";

import { Navigation } from "@/app/(marketing)/sections/Navigation";
import { TrustBar } from "@/app/(marketing)/sections/TrustBar";
import { FinalCTABand } from "@/app/(marketing)/sections/FinalCTABand";
import { FooterSection } from "@/app/(marketing)/sections/FooterSection";

interface SectionPageShellProps {
  children: ReactNode;
  showTrustBar?: boolean;
  showFinalCTA?: boolean;
}

export function SectionPageShell({
  children,
  showTrustBar = true,
  showFinalCTA = true,
}: SectionPageShellProps) {
  return (
    <div className="marketing-theme min-h-screen bg-marketing-surface text-marketing-foreground antialiased">
      <div className="bg-gradient-to-br from-[var(--marketing-primary)] via-[rgba(30,58,138,0.88)] to-[rgba(4,120,87,0.72)] text-white">
        <Navigation />
      </div>
      {showTrustBar ? <TrustBar /> : null}
      <main>
        {children}
        {showFinalCTA ? <FinalCTABand /> : null}
      </main>
      <FooterSection />
    </div>
  );
}
