import { painPoints } from "@/app/(marketing)/content";
import { MarketingPageLayout } from "@/app/(marketing)/components/MarketingPageLayout";

export default function WhyStayzaPage() {
  return (
    <MarketingPageLayout
      title="Why modern agencies choose Stayza Pro"
      description="Marketplaces dilute your brand and slow you down. Stayza Pro gives every realtor a booking site that looks and feels like their own while the platform handles trust, payouts, and compliance."
    >
      <section className="space-y-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-marketing-subtle">
        <h2 className="text-2xl font-semibold text-marketing-foreground">
          The pain we remove
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {painPoints.map(({ title, description, Icon }) => (
            <article
              key={title}
              className="rounded-2xl bg-marketing-surface px-4 py-5"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-marketing-secondary-soft">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-marketing-foreground">
                {title}
              </h3>
              <p className="mt-2 text-sm text-marketing-muted">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-dashed border-marketing-subtle px-6 py-5 text-sm text-marketing-muted">
        <p>
          Stayza Pro keeps your brand, revenue, and guests in one place — no
          portals, no spreadsheets, no hidden commissions.
        </p>
        <p>
          Ready to move?{" "}
          <a
            className="text-marketing-foreground underline"
            href="/get-started"
          >
            Start for free today
          </a>
          .
        </p>
      </section>
    </MarketingPageLayout>
  );
}
