import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import {
  lightOnDarkCTAStyles,
  outlineOnDarkCTAStyles,
} from "@/app/(marketing)/components/buttonStyles";
import { SectionHero } from "@/app/(marketing)/components/SectionHero";
import { SectionPageShell } from "@/app/(marketing)/components/SectionPageShell";

const keyFlows = [
  "Guests browse property galleries with map and filter controls",
  "Wishlists keep returning travellers engaged and ready to book",
  "Checkout captures guest details, payments, and legal agreements in one flow",
  "Realtors receive instant payouts, receipts, and audit logs",
];

export default function RealtorDemoPage() {
  return (
    <SectionPageShell>
      <SectionHero
        kicker="Interactive walkthrough"
        title="Preview a realtor booking hub"
        description="Step inside a branded Stayza Pro experience. Explore the guest journey, revenue controls, and admin insights before you invite your first listing."
        actions={
          <>
            <CTAButton
              label="Start for free"
              href="/get-started"
              styleOverrides={lightOnDarkCTAStyles}
            />
            <CTAButton
              label="Book a guided tour"
              variant="outline"
              href="https://cal.com/stayza-pro/discovery"
              styleOverrides={outlineOnDarkCTAStyles}
              icon={null}
            />
          </>
        }
      />
      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-gradient-to-br from-[rgba(255,255,255,0.98)] to-[rgba(243,244,246,0.9)] p-8 shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-marketing-muted">
            Walkthrough highlights
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-marketing-foreground">
            A live look at the guest journey
          </h2>
          <p className="mt-2 text-sm text-marketing-muted">
            Explore the exact experience guests, realtors, and admins enjoy
            inside Stayza Pro microsites.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {keyFlows.map((flow) => (
              <li
                key={flow}
                className="rounded-2xl border border-marketing-subtle/70 bg-white/90 px-4 py-4 text-sm text-marketing-foreground shadow-sm"
              >
                {flow}
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-marketing-subtle/70 bg-white/95 p-8 shadow-[0_22px_70px_rgba(15,23,42,0.14)]">
            <h2 className="text-2xl font-semibold text-marketing-foreground">
              Explore the interface
            </h2>
            <p className="mt-3 text-sm text-marketing-muted">
              Jump into a guided demo environment with sample listings, pricing
              rules, and automated payouts already configured.
            </p>
            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl bg-marketing-surface px-4 py-3 text-sm text-marketing-foreground">
                Branded listing pages with high-converting galleries and
                location-aware maps.
              </div>
              <div className="rounded-2xl bg-marketing-surface px-4 py-3 text-sm text-marketing-foreground">
                Instant PDF agreements, receipts, and payout summaries for every
                booking.
              </div>
              <div className="rounded-2xl bg-marketing-surface px-4 py-3 text-sm text-marketing-foreground">
                Operations timeline that logs every team or guest action in
                real-time.
              </div>
              <div className="rounded-2xl bg-marketing-surface px-4 py-3 text-sm text-marketing-foreground">
                Wishlists and saved searches that keep guests loyal to your
                brand.
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <CTAButton
                label="Launch interactive demo"
                href="https://demo.stayza.pro"
              />
              <CTAButton
                label="Download feature checklist"
                variant="outline"
                href="/contact"
              />
            </div>
          </div>
          <div className="rounded-3xl border border-[rgba(255,255,255,0.3)] bg-gradient-to-br from-[rgba(17,24,39,0.95)] to-[rgba(30,64,175,0.85)] p-8 text-white shadow-[0_28px_90px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">
              Impact snapshot
            </p>
            <h3 className="mt-4 text-2xl font-semibold">
              What teams experience after switching
            </h3>
            <ul className="mt-6 space-y-4 text-sm text-white/80">
              <li className="rounded-2xl bg-white/10 p-4">
                2× more direct bookings in the first 45 days with branded
                microsites.
              </li>
              <li className="rounded-2xl bg-white/10 p-4">
                34% increase in weekend revenue using seasonal pricing controls.
              </li>
              <li className="rounded-2xl bg-white/10 p-4">
                72% fewer chargebacks thanks to verified realtor badges and
                audit-ready logs.
              </li>
            </ul>
            <div className="mt-6">
              <CTAButton
                label="Talk to a product specialist"
                variant="outline"
                href="/contact"
              />
            </div>
          </div>
        </section>
      </div>
    </SectionPageShell>
  );
}
