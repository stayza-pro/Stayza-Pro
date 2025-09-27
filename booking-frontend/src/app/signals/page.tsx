import {
  caseStudies,
  integrationBadges,
  waitlistDetails,
} from "@/app/(marketing)/content";
import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { MarketingPageLayout } from "@/app/(marketing)/components/MarketingPageLayout";

export default function SignalsPage() {
  return (
    <MarketingPageLayout
      title="Signals from teams using Stayza Pro"
      description="Real agencies scaling branded bookings, automating payouts, and keeping admin oversight tight."
      heroSlot={
        <CTAButton label={waitlistDetails.buttonLabel} href="/early-access" />
      }
    >
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[rgba(255,255,255,0.98)] via-[rgba(248,250,252,0.92)] to-[rgba(226,232,240,0.86)] p-10 shadow-[0_28px_90px_rgba(15,23,42,0.18)]">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-marketing-muted">
              Proof in the field
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-marketing-foreground">
              Teams trading marketplaces for branded microsites
            </h2>
            <p className="mt-4 text-sm text-marketing-muted">
              Every story below is a full-funnel rollout led by Stayza Pro. We
              co-own the conversion metrics, loyalty outcomes, and trust signals
              with each partner.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <CTAButton
                label="Request case-study deck"
                variant="outline"
                href="/contact"
              />
              <CTAButton label="See the onboarding playbook" href="/workflow" />
            </div>
          </div>
          <div className="grid gap-5">
            {caseStudies.map((study) => (
              <article
                key={study.company}
                className="rounded-3xl border border-marketing-subtle/70 bg-white/95 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(15,23,42,0.16)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-marketing-muted">
                    {study.industry}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600/90">
                    {study.result}
                  </span>
                </div>
                <h3 className="mt-3 text-xl font-semibold text-marketing-foreground">
                  {study.company}
                </h3>
                <p className="mt-3 text-sm text-marketing-muted">
                  {study.delta}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-white/30 bg-gradient-to-br from-[rgba(17,24,39,0.96)] via-[rgba(30,64,175,0.9)] to-[rgba(8,47,73,0.92)] p-8 text-white shadow-[0_28px_90px_rgba(15,23,42,0.42)]">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">
            Ecosystem advantage
          </p>
          <h3 className="mt-4 text-2xl font-semibold">
            Integrations agencies rely on
          </h3>
          <p className="mt-3 text-sm text-white/80">
            Stayza Pro slots into your ops stack. We certify new integrations
            monthly, prioritising accounting, marketing, and guest CRM
            automation.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            {integrationBadges.map((integration) => (
              <span
                key={integration.name}
                className="rounded-full border bg-white/10 px-4 py-2 font-semibold"
                style={{
                  color: integration.colour,
                  borderColor: integration.colour,
                }}
              >
                <span className="opacity-80">{integration.name}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-dashed border-marketing-subtle/70 bg-white/95 p-8 shadow-[0_20px_66px_rgba(15,23,42,0.14)]">
          <h3 className="text-xl font-semibold text-marketing-foreground">
            Join the next cohort
          </h3>
          <p className="mt-3 text-sm text-marketing-muted">
            {waitlistDetails.subcopy}
          </p>
          <ul className="mt-6 space-y-3 text-sm text-marketing-muted">
            <li className="rounded-2xl border border-marketing-subtle/70 px-4 py-3">
              🎯 Limited to agencies managing 50+ active listings.
            </li>
            <li className="rounded-2xl border border-marketing-subtle/70 px-4 py-3">
              🛠️ Includes concierge migration and custom compliance review.
            </li>
            <li className="rounded-2xl border border-marketing-subtle/70 px-4 py-3">
              🤝 Weekly co-pilot sessions with product and revenue teams.
            </li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <CTAButton label="Apply for early access" href="/early-access" />
            <CTAButton
              label="Talk with current customers"
              variant="outline"
              href="/contact"
            />
          </div>
        </div>
      </section>
    </MarketingPageLayout>
  );
}
