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
      <section className="grid gap-6 sm:grid-cols-2">
        {caseStudies.map((study) => (
          <article
            key={study.company}
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-marketing-subtle"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-marketing-muted">
              {study.industry}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-marketing-foreground">
              {study.company}
            </h2>
            <p className="mt-4 text-lg font-semibold text-emerald-600">
              {study.result}
            </p>
            <p className="mt-2 text-sm text-marketing-muted">{study.delta}</p>
          </article>
        ))}
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-marketing-subtle">
        <h2 className="text-2xl font-semibold text-marketing-foreground">
          Integrations agencies rely on
        </h2>
        <div className="flex flex-wrap gap-3">
          {integrationBadges.map((integration) => (
            <span
              key={integration.name}
              className="rounded-xl border border-marketing-subtle px-4 py-2 text-sm font-semibold"
              style={{ color: integration.colour }}
            >
              {integration.name}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-3xl border border-dashed border-marketing-subtle px-6 py-5 text-sm text-marketing-muted">
        <p>{waitlistDetails.subcopy}</p>
        <CTAButton
          label="Apply for early access"
          variant="ghost"
          href="/early-access"
        />
      </section>
    </MarketingPageLayout>
  );
}
