import { Metadata } from "next";
import { HeroSection } from "@/app/(marketing)/sections/HeroSection";
import { TrustBar } from "@/app/(marketing)/sections/TrustBar";
import { WhySection } from "@/app/(marketing)/sections/WhySection";
import { CapabilitiesSection } from "@/app/(marketing)/sections/CapabilitiesSection";
import { WorkflowSection } from "@/app/(marketing)/sections/WorkflowSection";
import { ControlCenterSection } from "@/app/(marketing)/sections/ControlCenterSection";
import { ExperienceSection } from "@/app/(marketing)/sections/ExperienceSection";
import { SignalsSection } from "@/app/(marketing)/sections/SignalsSection";
import { WaitlistSection } from "@/app/(marketing)/sections/WaitlistSection";
import { FAQSection } from "@/app/(marketing)/sections/FAQSection";
import { FinalCTABand } from "@/app/(marketing)/sections/FinalCTABand";
import { FooterSection } from "@/app/(marketing)/sections/FooterSection";
import { baseMetadata, jsonLd, organizationSchema } from "@/lib/seo";

export const metadata: Metadata = baseMetadata;

export default function HomePage() {
  return (
    <>
      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      <div className="marketing-theme min-h-screen antialiased">
        <HeroSection />
        <TrustBar />
        <main className="bg-marketing-surface text-marketing-foreground">
          <WhySection />
          <CapabilitiesSection />
          <WorkflowSection />
          <ControlCenterSection />
          <ExperienceSection />
          <SignalsSection />
          <WaitlistSection />
          <FAQSection />
          <FinalCTABand />
        </main>
        <FooterSection />
      </div>
    </>
  );
}
