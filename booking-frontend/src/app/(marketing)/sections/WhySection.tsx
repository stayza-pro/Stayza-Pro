import { painPoints, palette } from "@/app/(marketing)/content";
import { SectionTitle } from "@/app/(marketing)/components/SectionTitle";

export function WhySection() {
  return (
    <section id="why" className="py-24">
      <div className="mx-auto grid max-w-6xl items-start gap-16 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="space-y-6">
          <SectionTitle
            eyebrow="why teams switch"
            title="The traditional stack wasn’t built for stay-focused bookings"
            description="When conversations, payments, and scheduling live in different places, trust disappears fast. Stayza Pro keeps momentum alive so enquiries become confirmed stays."
            align="left"
          />
          <div className="flex flex-wrap gap-4 pt-4">
            <MetricPill value="12+" label="Manual touchpoints removed" />
            <MetricPill value="2x" label="Faster quote-to-book time" />
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
