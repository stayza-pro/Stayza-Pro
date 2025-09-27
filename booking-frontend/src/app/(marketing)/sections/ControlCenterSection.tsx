import { capabilityColumns, palette } from "@/app/(marketing)/content";
import { SectionTitle } from "@/app/(marketing)/components/SectionTitle";

export function ControlCenterSection() {
  return (
    <section
      className="py-24"
      style={{ backgroundColor: palette.neutralLight }}
    >
      <div className="mx-auto max-w-6xl space-y-12 px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="control centre"
          title="Total control without the chaos"
          description="One dashboard for portfolios, payments, and guest trust — switch on what you need and grow without breaking your flow."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {capabilityColumns.map((column) => (
            <article key={column.heading} className="marketing-card p-6">
              <h3
                className="text-lg font-semibold"
                style={{ color: palette.primary }}
              >
                {column.heading}
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-marketing-muted">
                {column.bullets.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-1 block h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: "var(--marketing-secondary-soft)",
                      }}
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
