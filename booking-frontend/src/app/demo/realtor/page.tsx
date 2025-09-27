import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { MarketingPageLayout } from "@/app/(marketing)/components/MarketingPageLayout";

const keyFlows = [
  "Guests browse property galleries with map and filter controls",
  "Wishlists keep returning travellers engaged and ready to book",
  "Checkout captures guest details, payments, and legal agreements in one flow",
  "Realtors receive instant payouts, receipts, and audit logs",
];

export default function RealtorDemoPage() {
  return (
    <MarketingPageLayout
      title="Preview a realtor booking hub"
      description="See how branded sites feel to guests before you invite your first listing."
      heroSlot={<CTAButton label="Start for free" href="/get-started" />}
    >
      <section className="space-y-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-marketing-subtle">
        <h2 className="text-2xl font-semibold text-marketing-foreground">
          Walkthrough highlights
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {keyFlows.map((flow) => (
            <li
              key={flow}
              className="rounded-2xl bg-marketing-surface px-4 py-3 text-sm text-marketing-foreground"
            >
              • {flow}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-marketing-subtle">
        <h2 className="text-2xl font-semibold text-marketing-foreground">
          Explore the interface
        </h2>
        <p className="text-marketing-muted">
          Jump into a guided demo environment with sample listings, pricing
          rules, and automated payouts already configured.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <p className="rounded-2xl bg-marketing-surface px-4 py-3 text-sm text-marketing-foreground">
            • Branded listing pages complete with maps, galleries, and reviews.
          </p>
          <p className="rounded-2xl bg-marketing-surface px-4 py-3 text-sm text-marketing-foreground">
            • Automated receipts, agreements, and payout summaries generated
            instantly.
          </p>
          <p className="rounded-2xl bg-marketing-surface px-4 py-3 text-sm text-marketing-foreground">
            • Admin dashboards log every change so you never lose context.
          </p>
          <p className="rounded-2xl bg-marketing-surface px-4 py-3 text-sm text-marketing-foreground">
            • Guest wishlists and saved searches keep demand flowing back to
            you.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <CTAButton
            label="Launch interactive demo"
            href="https://demo.stayza.pro"
          />
          <CTAButton
            label="Book a guided walkthrough"
            variant="ghost"
            href="/early-access"
          />
        </div>
      </section>
    </MarketingPageLayout>
  );
}
