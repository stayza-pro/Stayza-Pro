import {
  caseStudies,
  integrationBadges,
  palette,
  waitlistDetails,
} from "@/app/(marketing)/content";
import { SectionTitle } from "@/app/(marketing)/components/SectionTitle";
import { CTAButton } from "@/app/(marketing)/components/CTAButton";

export function SignalsSection() {
  return (
    <section
      id="signals"
      className="py-24"
      style={{ backgroundColor: palette.neutralLight }}
    >
      <div className="mx-auto max-w-6xl space-y-12 px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="platform features"
          title="Built for Nigerian property professionals launching soon"
          description="Join 500+ realtors on the waitlist. Get your branded booking site, escrow-protected payments, and CAC verification when we launch."
        />
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-6 sm:grid-cols-2">
            {caseStudies.map((study) => (
              <article key={study.company} className="marketing-card p-6">
                <p className="text-sm font-semibold text-marketing-muted">
                  {study.industry}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-marketing-foreground">
                  {study.company}
                </h3>
                <p className="mt-4 text-base font-semibold text-emerald-600">
                  {study.result}
                </p>
                <p className="mt-2 text-sm text-marketing-muted">
                  {study.delta}
                </p>
              </article>
            ))}
          </div>
          <aside className="space-y-6">
            <div className="marketing-card p-6">
              <h3 className="text-lg font-semibold text-marketing-foreground">
                {waitlistDetails.headline}
              </h3>
              <p className="mt-2 text-sm text-marketing-muted">
                {waitlistDetails.subcopy}
              </p>
              <ul className="mt-4 space-y-3 text-sm text-marketing-muted">
                {waitlistDetails.bulletPoints.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-1 block h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: "var(--marketing-secondary-soft)",
                      }}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <CTAButton
                  label={waitlistDetails.buttonLabel}
                  variant="outline"
                  href="/join-waitlist"
                />
              </div>
            </div>
            <div className="marketing-card p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-marketing-muted">
                Integrates with
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4">
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
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
