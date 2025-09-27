import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { MarketingPageLayout } from "@/app/(marketing)/components/MarketingPageLayout";

const freePlanFeatures = [
  "Launch a branded ourapp.com/agency link",
  "List two properties with galleries, amenities, and availability",
  "Collect payments with automated split payouts",
  "Send PDF receipts and branded email confirmations",
];

const proPlanHighlights = [
  "Unlimited listings and team seats",
  "Advanced analytics and revenue reporting",
  "Seasonal pricing, promo codes, and channel controls",
  "Priority support with migration assistance",
];

export default function GetStartedPage() {
  return (
    <MarketingPageLayout
      title="Launch your branded booking site"
      description="Pick a plan that fits today and upgrade when you're ready. Every tier keeps your brand front and centre and automates the entire booking workflow."
      heroSlot={
        <CTAButton
          label="Apply for early access"
          variant="outline"
          href="/early-access"
        />
      }
    >
      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-marketing-subtle">
        <h2 className="text-2xl font-semibold text-marketing-foreground">
          Free plan — perfect for getting started
        </h2>
        <p className="text-marketing-muted">
          Launch in minutes, validate direct bookings, and keep 95% of every
          transaction while we handle the tech and trust.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {freePlanFeatures.map((feature) => (
            <li
              key={feature}
              className="rounded-2xl bg-marketing-surface px-4 py-3 text-sm text-marketing-foreground"
            >
              • {feature}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-marketing-subtle">
        <h2 className="text-2xl font-semibold text-marketing-foreground">
          Pro plan — scale with confidence
        </h2>
        <p className="text-marketing-muted">
          Upgrade when you need deeper insights, unlimited listings, and
          white-glove onboarding for every realtor on your team.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {proPlanHighlights.map((highlight) => (
            <li
              key={highlight}
              className="rounded-2xl bg-marketing-surface px-4 py-3 text-sm text-marketing-foreground"
            >
              • {highlight}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-3xl border border-dashed border-marketing-subtle px-6 py-5 text-sm text-marketing-muted">
        <p>
          Want help deciding? Book a 20-minute walkthrough and we&rsquo;ll map
          the perfect rollout for your agency.
        </p>
        <CTAButton
          label="Preview a Realtor Site"
          variant="ghost"
          href="/demo/realtor"
        />
      </section>
    </MarketingPageLayout>
  );
}
