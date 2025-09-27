import { painPoints } from "@/app/(marketing)/content";
import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { MarketingPageLayout } from "@/app/(marketing)/components/MarketingPageLayout";

export default function WhyStayzaPage() {
  return (
    <MarketingPageLayout
      title="Why modern agencies choose Stayza Pro"
      description="Marketplaces dilute your brand and slow you down. Stayza Pro gives every realtor a booking site that feels bespoke while the platform handles trust, payouts, and compliance."
    >
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[rgba(255,255,255,0.96)] via-[rgba(248,250,252,0.92)] to-[rgba(226,232,240,0.88)] p-10 shadow-[0_28px_90px_rgba(15,23,42,0.18)]">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-marketing-muted">
              Why brands switch
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-marketing-foreground">
              The pain we remove for growth teams
            </h2>
            <p className="mt-4 text-sm text-marketing-muted">
              A unified booking OS designed so every realtor can own their guest
              journey while headquarters retains control, insight, and trust
              signals.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <CTAButton label="Compare plans" href="/get-started" />
              <CTAButton
                label="Share executive summary"
                variant="outline"
                href="/contact"
              />
            </div>
          </div>
          <div className="grid gap-5">
            {painPoints.map(({ title, description, Icon }) => (
              <article
                key={title}
                className="flex items-start gap-4 rounded-2xl border border-marketing-subtle/70 bg-white/95 px-5 py-4 shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--marketing-accent)]/15 text-[var(--marketing-accent-foreground)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-marketing-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm text-marketing-muted">
                    {description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-white/30 bg-gradient-to-br from-[rgba(15,23,42,0.92)] via-[rgba(30,64,175,0.88)] to-[rgba(8,47,73,0.9)] p-8 text-white shadow-[0_26px_80px_rgba(15,23,42,0.42)]">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">
            Confidence metrics
          </p>
          <h3 className="mt-4 text-2xl font-semibold">
            What leadership teams report after 90 days
          </h3>
          <ul className="mt-6 space-y-4 text-sm text-white/80">
            <li className="rounded-2xl bg-white/10 p-4">
              47% faster realtor onboarding with templated microsites and
              automated KYC.
            </li>
            <li className="rounded-2xl bg-white/10 p-4">
              61% fewer support escalations thanks to unified audit trails and
              synced communications.
            </li>
            <li className="rounded-2xl bg-white/10 p-4">
              3.2× increase in repeat guest bookings within branded ecosystems.
            </li>
          </ul>
        </div>
        <div className="rounded-3xl border border-dashed border-marketing-subtle/70 bg-white/95 p-8 text-sm text-marketing-muted shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
          <p>
            Stayza Pro keeps your brand, revenue, and guest trust in one place —
            no marketplaces, no spreadsheets, no hidden commissions.
          </p>
          <p className="mt-3">
            Ready to move? Our product team can share migration playbooks,
            rollout timelines, and ROI benchmarks tailored to your portfolio.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <CTAButton
              label="Request migration blueprint"
              variant="outline"
              href="/early-access"
            />
            <CTAButton
              label="Chat with the team"
              variant="ghost"
              href="/contact"
            />
          </div>
        </div>
      </section>
    </MarketingPageLayout>
  );
}
