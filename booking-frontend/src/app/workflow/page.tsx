import { workflowSteps } from "@/app/(marketing)/content";
import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { MarketingPageLayout } from "@/app/(marketing)/components/MarketingPageLayout";

export default function WorkflowPage() {
  return (
    <MarketingPageLayout
      title="Your booking hub live in three guided steps"
      description="We designed a rollout that takes agencies from idea to live bookings without guesswork."
    >
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[rgba(255,255,255,0.96)] to-[rgba(226,232,240,0.88)] p-10 shadow-[0_26px_85px_rgba(15,23,42,0.16)]">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-marketing-muted">
              Launch blueprint
            </p>
            <h2 className="text-3xl font-semibold text-marketing-foreground">
              A co-piloted rollout for ops, marketing, and revenue teams
            </h2>
            <p className="text-sm text-marketing-muted">
              We onboard agencies in weekly sprints. Each step includes guided
              enablement, pre-built assets, and success metrics so the entire
              collective sees traction fast.
            </p>
            <div className="flex flex-wrap gap-3">
              <CTAButton label="View onboarding calendar" href="/contact" />
              <CTAButton
                label="Download go-live checklist"
                variant="outline"
                href="/early-access"
              />
            </div>
          </div>

          <ol className="relative space-y-5 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-1rem)] before:w-[2px] before:bg-gradient-to-b before:from-[var(--marketing-accent)]/80 before:to-[rgba(148,163,184,0.4)] before:content-[''] lg:space-y-6">
            {workflowSteps.map(({ title, description, Icon }, index) => (
              <li
                key={title}
                className="relative rounded-3xl border border-marketing-subtle/70 bg-white/95 p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(15,23,42,0.15)]"
              >
                <div className="absolute left-3 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--marketing-accent)] text-sm font-semibold text-[var(--marketing-accent-foreground)]">
                  {index + 1}
                </div>
                <div className="ml-14 flex flex-col gap-2">
                  <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-marketing-muted">
                    <Icon className="h-4 w-4" /> Guided sprint
                  </span>
                  <h3 className="text-lg font-semibold text-marketing-foreground">
                    {title}
                  </h3>
                  <p className="text-sm text-marketing-muted">{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-white/25 bg-gradient-to-br from-[rgba(17,24,39,0.94)] via-[rgba(30,64,175,0.86)] to-[rgba(8,47,73,0.92)] p-8 text-white shadow-[0_26px_82px_rgba(15,23,42,0.4)]">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">
            Launch enablement
          </p>
          <h3 className="mt-4 text-2xl font-semibold">
            Toolkits we plug in during rollout
          </h3>
          <ul className="mt-6 space-y-4 text-sm text-white/80">
            <li className="rounded-2xl bg-white/10 p-4">
              Migration scripts that sync legacy inventory, pricing rules, and
              guest CRM data without downtime.
            </li>
            <li className="rounded-2xl bg-white/10 p-4">
              Training decks and Looms your team can reuse with every new
              realtor onboarding.
            </li>
            <li className="rounded-2xl bg-white/10 p-4">
              Executive scorecards focused on retention, conversion, and trust
              signals week by week.
            </li>
          </ul>
          <div className="mt-6">
            <CTAButton
              label="Book rollout planning call"
              variant="outline"
              href="/contact"
            />
          </div>
        </div>
        <div className="rounded-3xl border border-dashed border-marketing-subtle/70 bg-white/95 p-8 shadow-[0_18px_62px_rgba(15,23,42,0.14)]">
          <h3 className="text-xl font-semibold text-marketing-foreground">
            What to expect from week one
          </h3>
          <p className="mt-3 text-sm text-marketing-muted">
            We start with a readiness assessment, tailor the plan, and set the
            guardrails we measure together. You&rsquo;ll know exactly who owns
            each milestone, and what &ldquo;done&rdquo; looks like.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-marketing-muted">
            <span className="rounded-full border border-marketing-subtle/70 px-3 py-1">
              ✅ Compliance checklist completed
            </span>
            <span className="rounded-full border border-marketing-subtle/70 px-3 py-1">
              ✅ Microsite theme configured
            </span>
            <span className="rounded-full border border-marketing-subtle/70 px-3 py-1">
              ✅ Payment automations activated
            </span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <CTAButton label="Get step-by-step guide" href="/get-started" />
            <CTAButton
              label="Ask about enterprise rollout"
              variant="outline"
              href="/early-access"
            />
          </div>
        </div>
      </section>
    </MarketingPageLayout>
  );
}
