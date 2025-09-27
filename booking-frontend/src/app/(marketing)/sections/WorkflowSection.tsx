import { workflowSteps, palette } from "@/app/(marketing)/content";
import { SectionTitle } from "@/app/(marketing)/components/SectionTitle";

export function WorkflowSection() {
  return (
    <section id="workflow" className="py-24">
      <div className="mx-auto max-w-5xl space-y-12 px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="workflow"
          title="Your booking hub, live in minutes"
          description="No tech headaches. Just three guided steps from sign-up to first payout."
        />
        <div className="relative">
          <div
            className="pointer-events-none absolute left-5 top-0 hidden h-full border-l-2 border-dashed md:block"
            style={{ borderColor: "var(--marketing-secondary-line)" }}
            aria-hidden="true"
          />
          <ol className="space-y-10">
            {workflowSteps.map(({ title, description, Icon }, index) => (
              <li key={title} className="relative md:pl-16">
                <div
                  className="absolute left-0 hidden h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white md:flex"
                  style={{ backgroundColor: palette.secondary }}
                >
                  {index + 1}
                </div>
                <article className="marketing-card px-6 py-6">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: "var(--marketing-secondary-soft)",
                      }}
                    >
                      <Icon
                        className="h-6 w-6"
                        style={{ color: palette.secondary }}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-marketing-foreground">
                        {title}
                      </h3>
                      <p className="mt-2 text-sm text-marketing-muted">
                        {description}
                      </p>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
