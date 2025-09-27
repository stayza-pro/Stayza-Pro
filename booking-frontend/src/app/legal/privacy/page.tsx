import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { MarketingPageLayout } from "@/app/(marketing)/components/MarketingPageLayout";

const sections = [
  {
    heading: "Information we collect",
    copy: "We store account details you provide (name, email, agency info) and booking metadata required to operate the platform. Payment details are processed by Stripe or Paystack and never reside on our servers.",
  },
  {
    heading: "How we use data",
    copy: "Data powers booking confirmations, payout reconciliation, analytics, and support. We do not sell or broker your information.",
  },
  {
    heading: "Your controls",
    copy: "You can request deletion of personal data, export booking records, or update payment processors at any time by contacting hello@stayza.pro.",
  },
];

export default function PrivacyPage() {
  return (
    <MarketingPageLayout
      title="Privacy policy"
      description="Transparency matters. Here&rsquo;s how Stayza Pro handles and protects your data."
    >
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6 rounded-3xl border border-white/15 bg-gradient-to-br from-[rgba(255,255,255,0.98)] via-[rgba(248,250,252,0.92)] to-[rgba(226,232,240,0.88)] p-10 shadow-[0_28px_90px_rgba(15,23,42,0.18)]">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-marketing-muted">
            Data principles
          </p>
          <h2 className="text-3xl font-semibold text-marketing-foreground">
            We only collect what keeps your bookings running
          </h2>
          <p className="text-sm text-marketing-muted">
            Data powers trust between guests, realtors, and your finance team.
            We protect that trust with clear boundaries.
          </p>
          <div className="space-y-4">
            {sections.map((section) => (
              <article
                key={section.heading}
                className="rounded-2xl border border-marketing-subtle/70 bg-white/95 px-5 py-4 shadow-sm"
              >
                <h3 className="text-base font-semibold text-marketing-foreground">
                  {section.heading}
                </h3>
                <p className="mt-2 text-sm text-marketing-muted">
                  {section.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-[rgba(255,255,255,0.24)] bg-gradient-to-br from-[rgba(17,24,39,0.94)] via-[rgba(30,64,175,0.86)] to-[rgba(8,47,73,0.92)] p-10 text-white shadow-[0_32px_100px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">
            Compliance commitments
          </p>
          <h3 className="mt-4 text-2xl font-semibold">
            Controls you can rely on
          </h3>
          <ul className="mt-6 space-y-4 text-sm text-white/80">
            <li className="rounded-2xl bg-white/10 p-4">
              SOC 2 aligned policies with quarterly external reviews.
            </li>
            <li className="rounded-2xl bg-white/10 p-4">
              Region-specific data residency backed by encrypted backups.
            </li>
            <li className="rounded-2xl bg-white/10 p-4">
              Role-based access and audit trails across every data touchpoint.
            </li>
          </ul>
          <div className="mt-8 space-y-3 text-sm text-white/75">
            <p>Questions or DPA requests? Reach our privacy desk anytime.</p>
            <CTAButton
              label="Email privacy team"
              variant="outline"
              href="mailto:privacy@stayza.pro"
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-dashed border-marketing-subtle/70 bg-white/95 p-8 text-sm text-marketing-muted shadow-[0_20px_70px_rgba(15,23,42,0.12)]">
        <p>
          Need a signed agreement or custom terms? We provide a data processing
          addendum with every enterprise plan and can collaborate with your
          counsel on bespoke requirements.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <CTAButton
            label="View security overview"
            variant="ghost"
            href="/legal/security"
          />
          <CTAButton
            label="Talk to legal"
            variant="outline"
            href="mailto:legal@stayza.pro"
          />
        </div>
      </section>
    </MarketingPageLayout>
  );
}
