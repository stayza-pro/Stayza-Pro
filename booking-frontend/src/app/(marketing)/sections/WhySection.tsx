import { painPoints, palette } from "@/app/(marketing)/content";
import { SectionTitle } from "@/app/(marketing)/components/SectionTitle";

export function WhySection() {
  return (
    <section id="why" className="py-24">
      <div className="mx-auto grid max-w-6xl items-start gap-16 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="space-y-6">
          <SectionTitle
            eyebrow="why realtors switch"
            title="Generic marketplaces weren’t built for modern agencies"
            description="Stayza Pro gives every realtor a branded booking hub, automated split payouts, and an audit trail that keeps admins in control."
            align="left"
          />
          <div className="flex flex-wrap gap-4 pt-4">
            <MetricPill value="100%" label="Your brand front and center" />
            <MetricPill value="0 hrs" label="Wasted on manual payouts" />
            <MetricPill
              value="1 link"
              label="For bookings, payments, receipts"
            />
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {painPoints.map(({ title, description, Icon }) => (
            <article
              key={title}
              className="marketing-card p-6 transition-transform motion-safe:hover:-translate-y-1"
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: "var(--marketing-secondary-soft)" }}
              >
                <Icon
                  className="h-6 w-6"
                  style={{ color: palette.secondary }}
                />
              </div>
              <h3 className="text-lg font-semibold text-marketing-foreground">
                {title}
              </h3>
              <p className="mt-2 text-sm text-marketing-muted">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function MetricPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="marketing-pill">
      <p
        className="text-2xl font-semibold"
        style={{ color: palette.secondary }}
      >
        {value}
      </p>
      <p className="mt-1 text-sm text-marketing-muted">{label}</p>
    </div>
  );
}
