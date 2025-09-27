import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { MarketingPageLayout } from "@/app/(marketing)/components/MarketingPageLayout";

const onboardingSteps = [
  {
    title: "Share your branding & listings",
    description:
      "Send us your logo, colour palette, and top properties. We pre-load everything so you launch fast.",
  },
  {
    title: "Connect payouts securely",
    description:
      "Authenticate Stripe Connect or Paystack Split once. We verify compliance and test real transactions with you.",
  },
  {
    title: "Train your team & go live",
    description:
      "We guide realtors, admins, and finance teams through best practices so everyone knows what happens when bookings land.",
  },
];

const cohortPerks = [
  "Dedicated success manager for the first 60 days",
  "Migration toolkit for moving listings from spreadsheets or portals",
  "Access to exclusive templates: pricing calculators, email scripts, and dispute playbooks",
];

export default function EarlyAccessPage() {
  return (
    <MarketingPageLayout
      title="Apply for early access"
      description="We onboard a limited number of teams each month to keep migrations hands-on and outcomes predictable."
    >
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6 rounded-3xl border border-white/20 bg-gradient-to-br from-[rgba(255,255,255,0.98)] via-[rgba(248,250,252,0.9)] to-[rgba(226,232,240,0.85)] p-10 shadow-[0_28px_90px_rgba(15,23,42,0.16)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-marketing-muted">
            Guided launch cohort
          </p>
          <h2 className="text-3xl font-semibold text-marketing-foreground">
            How early access accelerates your rollout
          </h2>
          <p className="text-sm text-marketing-muted">
            We accept a handful of agencies each month and plug you into a
            structured onboarding sprint that mirrors how we go live with larger
            enterprise teams.
          </p>
          <ol className="space-y-4">
            {onboardingSteps.map((step, index) => (
              <li
                key={step.title}
                className="flex gap-4 rounded-2xl border border-marketing-subtle/70 bg-white/95 px-5 py-4 shadow-sm"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--marketing-accent)]/15 text-sm font-semibold text-[var(--marketing-accent)]">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-marketing-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-marketing-muted">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-3xl border border-[rgba(255,255,255,0.24)] bg-gradient-to-br from-[rgba(17,24,39,0.92)] via-[rgba(30,64,175,0.88)] to-[rgba(8,47,73,0.9)] p-10 text-white shadow-[0_32px_100px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">
            What&rsquo;s included
          </p>
          <h3 className="mt-4 text-2xl font-semibold">
            Your white-glove onboarding stack
          </h3>
          <ul className="mt-6 space-y-4 text-sm text-white/80">
            {cohortPerks.map((perk) => (
              <li key={perk} className="rounded-2xl bg-white/10 p-4">
                {perk}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-white/70">
            Fill out the application and include any timelines we should know.
            We confirm your slot within two business days.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-marketing-subtle/70 bg-white/95 p-10 shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-marketing-muted">
            Timeline snapshot
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-marketing-foreground">
            Week-by-week outcomes
          </h3>
          <ul className="mt-6 grid gap-3 text-sm text-marketing-muted">
            <li className="rounded-2xl border border-marketing-subtle/60 px-4 py-3">
              <span className="font-semibold text-marketing-foreground">
                Week 1:
              </span>{" "}
              Microsite theme, payouts, and compliance checklist signed off.
            </li>
            <li className="rounded-2xl border border-marketing-subtle/60 px-4 py-3">
              <span className="font-semibold text-marketing-foreground">
                Week 2:
              </span>{" "}
              Listings migrated, pricing automation configured, team training
              recorded.
            </li>
            <li className="rounded-2xl border border-marketing-subtle/60 px-4 py-3">
              <span className="font-semibold text-marketing-foreground">
                Week 3:
              </span>{" "}
              First bookings flowing with live analytics and support on call.
            </li>
          </ul>
        </div>
        <div className="rounded-3xl border border-dashed border-marketing-subtle/70 bg-white/95 p-10 text-sm text-marketing-muted shadow-[0_20px_66px_rgba(15,23,42,0.14)]">
          <h3 className="text-xl font-semibold text-marketing-foreground">
            Apply now
          </h3>
          <p className="mt-3">
            Email
            <a
              className="ml-1 font-semibold text-marketing-foreground underline"
              href="mailto:hello@stayza.pro"
            >
              hello@stayza.pro
            </a>
            with your agency name, portfolio size, and payment processor
            preference. Our team replies with a personalised onboarding plan and
            call invite.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <CTAButton
              label="Book a discovery call"
              variant="outline"
              href="https://cal.com/stayza-pro/discovery"
            />
            <CTAButton
              label="See full rollout workflow"
              variant="ghost"
              href="/workflow"
            />
          </div>
        </div>
      </section>
    </MarketingPageLayout>
  );
}
