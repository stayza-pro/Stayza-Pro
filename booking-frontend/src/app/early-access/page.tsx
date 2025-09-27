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
      <section className="space-y-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-marketing-subtle">
        <h2 className="text-2xl font-semibold text-marketing-foreground">
          How the cohort works
        </h2>
        <ol className="space-y-4">
          {onboardingSteps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl bg-marketing-surface px-4 py-3"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-marketing-muted">
                Step {index + 1}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-marketing-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-marketing-muted">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-4 rounded-3xl border border-dashed border-marketing-subtle px-6 py-5">
        <h2 className="text-2xl font-semibold text-marketing-foreground">
          What you get during early access
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {cohortPerks.map((perk) => (
            <li
              key={perk}
              className="rounded-2xl bg-marketing-surface px-4 py-3 text-sm text-marketing-foreground"
            >
              • {perk}
            </li>
          ))}
        </ul>
        <p className="text-sm text-marketing-muted">
          Fill out the short application below and we&rsquo;ll get back to you
          within two business days.
        </p>
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-marketing-subtle">
        <h2 className="text-2xl font-semibold text-marketing-foreground">
          Apply now
        </h2>
        <p className="text-marketing-muted">
          Email{" "}
          <a
            className="text-marketing-foreground underline"
            href="mailto:hello@stayza.pro"
          >
            hello@stayza.pro
          </a>{" "}
          with your agency name, portfolio size, and payment processor
          preference. We&rsquo;ll schedule a kickoff call that fits your
          timeline.
        </p>
      </section>
    </MarketingPageLayout>
  );
}
