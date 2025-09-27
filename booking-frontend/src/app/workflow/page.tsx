import { workflowSteps } from "@/app/(marketing)/content";
import { MarketingPageLayout } from "@/app/(marketing)/components/MarketingPageLayout";

export default function WorkflowPage() {
  return (
    <MarketingPageLayout
      title="Your booking hub live in three guided steps"
      description="We designed a rollout that takes agencies from idea to live bookings without guesswork."
    >
      <ol className="space-y-4">
        {workflowSteps.map(({ title, description, Icon }, index) => (
          <li
            key={title}
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-marketing-subtle"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-marketing-secondary-soft text-marketing-foreground">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-marketing-muted">
                  Step {index + 1}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-marketing-foreground">
                  {title}
                </h2>
                <p className="mt-2 text-sm text-marketing-muted">
                  {description}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </MarketingPageLayout>
  );
}
