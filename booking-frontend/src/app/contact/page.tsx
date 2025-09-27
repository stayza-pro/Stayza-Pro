import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import {
  lightOnDarkCTAStyles,
  outlineOnDarkCTAStyles,
} from "@/app/(marketing)/components/buttonStyles";
import { SectionHero } from "@/app/(marketing)/components/SectionHero";
import { SectionPageShell } from "@/app/(marketing)/components/SectionPageShell";

const contactChannels = [
  {
    title: "Sales & onboarding",
    description: "Talk through pricing, rollout timelines, and integrations.",
    action: {
      label: "Book a discovery call",
      href: "https://cal.com/stayza-pro/discovery",
    },
  },
  {
    title: "Support",
    description:
      "Existing customers can open a ticket for configuration help or incident response.",
    action: {
      label: "Open support portal",
      href: "https://support.stayza.pro",
    },
  },
  {
    title: "Partnerships",
    description:
      "Explore co-marketing, integrations, or reseller opportunities.",
    action: {
      label: "Email partnerships",
      href: "mailto:partnerships@stayza.pro",
    },
  },
];

export default function ContactPage() {
  return (
    <SectionPageShell>
      <SectionHero
        kicker="We reply within one business day"
        title="Contact the Stayza Pro team"
        description="We&rsquo;re here to help you launch and scale branded booking microsites for every realtor on your roster."
        actions={
          <>
            <CTAButton
              label="Book a discovery call"
              href="https://cal.com/stayza-pro/discovery"
              styleOverrides={lightOnDarkCTAStyles}
            />
            <CTAButton
              label="Email hello@stayza.pro"
              variant="outline"
              href="mailto:hello@stayza.pro"
              styleOverrides={outlineOnDarkCTAStyles}
              icon={null}
            />
          </>
        }
      />
      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[rgba(255,255,255,0.98)] via-[rgba(248,250,252,0.92)] to-[rgba(226,232,240,0.86)] p-10 shadow-[0_28px_90px_rgba(15,23,42,0.18)]">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-marketing-muted">
                How can we help?
              </p>
              <h2 className="text-3xl font-semibold text-marketing-foreground">
                Tap the crew focused on your next milestone
              </h2>
              <p className="text-sm text-marketing-muted">
                Pick the lane that matches your goals. We connect you with
                specialists who can move from first call to rollout planning in
                days, not weeks.
              </p>
              <div className="flex flex-wrap gap-3">
                <CTAButton
                  label="Book a 15-minute consult"
                  href="https://cal.com/stayza-pro/discovery"
                />
                <CTAButton
                  label="Download enablement deck"
                  variant="outline"
                  href="/workflow"
                />
              </div>
            </div>
            <div className="grid gap-5">
              {contactChannels.map((channel) => (
                <article
                  key={channel.title}
                  className="rounded-3xl border border-marketing-subtle/70 bg-white/95 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(15,23,42,0.16)]"
                >
                  <h3 className="text-lg font-semibold text-marketing-foreground">
                    {channel.title}
                  </h3>
                  <p className="mt-2 text-sm text-marketing-muted">
                    {channel.description}
                  </p>
                  <div className="mt-4">
                    <CTAButton
                      label={channel.action.label}
                      href={channel.action.href}
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/25 bg-gradient-to-br from-[rgba(17,24,39,0.95)] via-[rgba(30,64,175,0.88)] to-[rgba(8,47,73,0.9)] p-8 text-white shadow-[0_26px_82px_rgba(15,23,42,0.4)]">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">
              Prefer a guided session?
            </p>
            <h3 className="mt-4 text-2xl font-semibold">
              Join a live product walkthrough every Thursday
            </h3>
            <p className="mt-3 text-sm text-white/80">
              See booking flows, payouts, audit logs, and guest messaging in a
              20-minute interactive demo. Bring your stakeholders—there&rsquo;s
              time for Q&amp;A at the end.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <CTAButton
                label="Reserve a seat"
                variant="outline"
                href="https://cal.com/stayza-pro/discovery"
                styleOverrides={outlineOnDarkCTAStyles}
              />
              <CTAButton
                label="Share with your team"
                variant="ghost"
                href="/contact"
              />
            </div>
          </div>
          <div className="rounded-3xl border border-dashed border-marketing-subtle/70 bg-white/95 p-8 text-sm text-marketing-muted shadow-[0_20px_66px_rgba(15,23,42,0.14)]">
            <p>
              Prefer email? Reach us directly at
              <a
                className="ml-1 font-semibold text-marketing-foreground underline"
                href="mailto:hello@stayza.pro"
              >
                hello@stayza.pro
              </a>
              — we respond within one business day.
            </p>
            <p className="mt-3">
              If you&rsquo;re already a customer, log into the support portal
              for faster triage or reply inside the app chat to reach your
              success manager.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <CTAButton
                label="Open support portal"
                href="https://support.stayza.pro"
              />
              <CTAButton
                label="Ping success manager"
                variant="outline"
                href="mailto:success@stayza.pro"
              />
            </div>
          </div>
        </section>
      </div>
    </SectionPageShell>
  );
}
