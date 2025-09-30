"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { lightOnDarkCTAStyles } from "@/app/(marketing)/components/buttonStyles";
import { SectionHero } from "@/app/(marketing)/components/SectionHero";
import { SectionPageShell } from "@/app/(marketing)/components/SectionPageShell";

const plans = [
  {
    id: "launch",
    name: "Launch Plan",
    price: "$0",
    cadence: "per month",
    tagline: "Validate direct bookings with a polished microsite in minutes.",
    badge: "Best for new teams",
    href: "/register/realtor?plan=free",
    features: [
      "Branded ourapp.com/agency URL with your colours",
      "Up to 2 live listings with availability calendar",
      "Automated split payouts and PDF receipts",
      "Guest wishlists, reviews, and basic analytics",
    ],
  },
  {
    id: "scale",
    name: "Scale Plan",
    price: "$79",
    cadence: "per month",
    tagline: "Everything agencies need to automate revenue and compliance.",
    badge: "Most popular",
    href: "/register/realtor?plan=pro",
    features: [
      "Unlimited listings, team seats, and seasonal pricing rules",
      "Advanced revenue analytics and cohort dashboards",
      "Dispute workflows with full audit trails",
      "Priority onboarding with migration concierge",
    ],
  },
];

const epiphanyStatements = [
  "Your brand stays front and centre on every booking.",
  "Payouts land instantly without spreadsheets or emails.",
  "Every admin action is logged, so trust scales with you.",
];

export default function GetStartedPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState(plans[1]);
  const [isPending, startTransition] = useTransition();

  const handleContinue = () => {
    startTransition(() => {
      router.push(selectedPlan.href);
    });
  };

  return (
    <SectionPageShell>
      <SectionHero
        kicker="Stayza Pro Platform"
        title="Choose your Stayza Pro launch path"
        description="Every plan launches a fully branded booking experience. Pick the momentum you need today—upgrade as your portfolio grows."
        actions={
          <>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/80">
              Instant setup
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/80">
              Automated payouts
            </span>
            <CTAButton
              label="Prefer white-glove onboarding?"
              variant="outline"
              href="https://cal.com/stayza-pro/discovery"
              styleOverrides={lightOnDarkCTAStyles}
            />
          </>
        }
      />
      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            <div className="rounded-3xl border border-marketing-subtle/60 bg-gradient-to-br from-white to-[rgba(243,244,246,0.85)] p-8 shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-marketing-muted">
                Pick a plan
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-marketing-foreground">
                Stayza Pro pricing
              </h2>
              <p className="mt-3 text-sm text-marketing-muted">
                Select the plan that mirrors your team&rsquo;s stage. We route
                you to a tailored signup that pre-loads the right onboarding
                checklist.
              </p>
              <div className="mt-6 grid gap-6">
                {plans.map((plan) => {
                  const isActive = plan.id === selectedPlan.id;

                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan)}
                      className={`group rounded-2xl border p-6 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--marketing-focus)] focus-visible:ring-offset-2 ${
                        isActive
                          ? "border-[var(--marketing-accent)] bg-gradient-to-br from-[rgba(249,115,22,0.12)] to-white shadow-[0_20px_60px_rgba(249,115,22,0.18)]"
                          : "border-marketing-subtle/70 bg-white/90 hover:border-[var(--marketing-accent)]/70 hover:shadow-[0_12px_50px_rgba(15,23,42,0.08)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-semibold text-marketing-foreground">
                              {plan.name}
                            </h3>
                            {plan.badge ? (
                              <span className="rounded-full bg-[var(--marketing-accent)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--marketing-accent)]">
                                {plan.badge}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm text-marketing-muted">
                            {plan.tagline}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-semibold text-[var(--marketing-primary)]">
                            {plan.price}
                          </p>
                          <p className="text-xs uppercase tracking-[0.2em] text-marketing-muted">
                            {plan.cadence}
                          </p>
                        </div>
                      </div>
                      <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                        {plan.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-start gap-2 text-sm text-marketing-foreground/90"
                          >
                            <span className="mt-1 h-2 w-2 rounded-full bg-[var(--marketing-accent)]" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-3xl border border-[rgba(255,255,255,0.3)] bg-gradient-to-br from-[rgba(17,24,39,0.92)] to-[rgba(30,64,175,0.9)] p-8 text-white shadow-[0_28px_90px_rgba(15,23,42,0.45)]">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">
                Next steps
              </p>
              <h2 className="mt-4 text-2xl font-semibold">
                {selectedPlan.name}: what happens after you choose
              </h2>
              <p className="mt-3 text-sm text-white/75">
                We route you to a plan-specific signup flow. Once you confirm
                your agency details, we spin up your microsite, connect payouts,
                and guide you through your first property in under 15 minutes.
              </p>
              <div className="mt-6 space-y-3 text-sm text-white/80">
                {epiphanyStatements.map((statement) => (
                  <div
                    key={statement}
                    className="flex items-start gap-3 rounded-2xl bg-white/5 p-3"
                  >
                    <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-white/60" />
                    <span>{statement}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <CTAButton
                  label={isPending ? "Redirecting..." : "Continue to signup"}
                  href={selectedPlan.href}
                  styleOverrides={lightOnDarkCTAStyles}
                />
                <CTAButton
                  label={
                    isPending
                      ? "Launching flow..."
                      : "Continue with selected plan"
                  }
                  variant="ghost"
                  onClick={handleContinue}
                  disabled={isPending}
                  icon={null}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-marketing-subtle/70 bg-white/95 p-8 shadow-[0_18px_70px_rgba(15,23,42,0.12)]">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-marketing-muted">
                Want a guided tour first?
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <CTAButton
                  label="Preview a Realtor Site"
                  variant="ghost"
                  href="/demo/realtor"
                />
                <CTAButton
                  label="Chat with onboarding"
                  variant="outline"
                  href="/contact"
                />
              </div>
              <p className="mt-4 text-xs text-marketing-muted">
                We respond to onboarding questions within one business day and
                can have your microsite production-ready in under a week.
              </p>
            </div>
          </div>
        </section>
      </div>
    </SectionPageShell>
  );
}
