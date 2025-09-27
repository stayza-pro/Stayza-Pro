import {
  operationsMetrics,
  operationsSnapshots,
  palette,
} from "@/app/(marketing)/content";
import { SectionTitle } from "@/app/(marketing)/components/SectionTitle";

export function ExperienceSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl space-y-12 px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="experience"
          title="Guest experiences that win repeat bookings"
          description="From wishlists to instant payouts, every interaction is designed to feel clear, fast, and reliable — no surprises, no friction."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {operationsSnapshots.map((card) => (
            <article key={card.title} className="marketing-card p-6">
              <h3 className="text-lg font-semibold text-marketing-foreground">
                {card.title}
              </h3>
              <p className="mt-3 text-sm text-marketing-muted">
                {card.description}
              </p>
            </article>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {operationsMetrics.map((metric) => (
            <div key={metric.label} className="marketing-pill">
              <p
                className="text-2xl font-semibold"
                style={{ color: palette.secondary }}
              >
                {metric.value}
              </p>
              <p className="mt-1 text-sm font-medium text-marketing-muted">
                {metric.label}
              </p>
              {metric.hint && (
                <p className="mt-1 text-xs text-marketing-subtle">
                  {metric.hint}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
