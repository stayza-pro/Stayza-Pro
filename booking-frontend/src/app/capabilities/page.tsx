import { featurePillars } from "@/app/(marketing)/content";
import { MarketingPageLayout } from "@/app/(marketing)/components/MarketingPageLayout";

export default function CapabilitiesPage() {
  return (
    <MarketingPageLayout
      title="Capabilities that keep bookings under your brand"
      description="From branded microsites to automated payouts, Stayza Pro consolidates every moving piece of your booking operation."
    >
      <section className="grid gap-6 sm:grid-cols-2">
        {featurePillars.map(({ title, copy, Icon }) => (
          <article
            key={title}
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-marketing-subtle"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-marketing-primary-soft">
              <Icon className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold text-marketing-foreground">
              {title}
            </h2>
            <p className="mt-3 text-sm text-marketing-muted">{copy}</p>
          </article>
        ))}
      </section>
    </MarketingPageLayout>
  );
}
