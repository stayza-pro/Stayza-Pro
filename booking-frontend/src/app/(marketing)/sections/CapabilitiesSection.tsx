import { featurePillars, palette } from "@/app/(marketing)/content";
import { SectionTitle } from "@/app/(marketing)/components/SectionTitle";

export function CapabilitiesSection() {
  return (
    <section
      id="capabilities"
      className="py-24"
      style={{ backgroundColor: palette.neutralLight }}
    >
      <div className="mx-auto max-w-6xl space-y-12 px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="capabilities"
          title="All-in-one power for realtors who rent smarter"
          description="Stop juggling tools. From branding to bookings, payouts to compliance—one platform covers every part of the shortlet experience."
        />
        <div className="grid gap-8 lg:grid-cols-3">
          {featurePillars.map(({ title, copy, Icon }) => (
            <article
              key={title}
              className="marketing-card relative overflow-hidden p-8"
            >
              <div
                className="absolute right-[-18%] top-[-20%] h-28 w-28 rounded-full"
                style={{ backgroundColor: "var(--marketing-primary-mist)" }}
              />
              <div className="relative">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "var(--marketing-primary-soft)" }}
                >
                  <Icon
                    className="h-6 w-6"
                    style={{ color: palette.primary }}
                  />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-marketing-foreground">
                  {title}
                </h3>
                <p className="mt-3 text-sm text-marketing-muted">{copy}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
