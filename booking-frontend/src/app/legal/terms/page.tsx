import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { MarketingPageLayout } from "@/app/(marketing)/components/MarketingPageLayout";

const clauses = [
  {
    heading: "1. Service scope",
    copy: "Stayza Pro provides hosted booking microsites, payment routing, and operational tooling for real estate agencies and their representatives.",
  },
  {
    heading: "2. Account responsibility",
    copy: "Agencies manage user access and agree to maintain accurate property, pricing, and legal information. Misuse may result in suspension.",
  },
  {
    heading: "3. Fees & payouts",
    copy: "Platform fees are deducted automatically per transaction. Payouts are processed through Stripe Connect or Paystack Split based on your configuration.",
  },
  {
    heading: "4. Data & compliance",
    copy: "You retain ownership of your content. We operate in line with applicable privacy and payment regulations in supported regions.",
  },
];

export default function TermsPage() {
  return (
    <MarketingPageLayout
      title="Terms of service"
      description="Review the agreement that governs your use of Stayza Pro."
    >
      <section className="rounded-3xl border border-white/15 bg-gradient-to-br from-[rgba(255,255,255,0.98)] via-[rgba(248,250,252,0.9)] to-[rgba(226,232,240,0.86)] p-10 shadow-[0_30px_96px_rgba(15,23,42,0.18)]">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-marketing-muted">
          Core agreement
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-marketing-foreground">
          The pillars of operating on Stayza Pro
        </h2>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {clauses.map((clause) => (
            <article
              key={clause.heading}
              className="rounded-2xl border border-marketing-subtle/70 bg-white/95 px-5 py-4 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-marketing-muted">
                {clause.heading}
              </p>
              <p className="mt-3 text-sm text-marketing-muted">{clause.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-[rgba(255,255,255,0.24)] bg-gradient-to-br from-[rgba(17,24,39,0.94)] via-[rgba(30,64,175,0.86)] to-[rgba(8,47,73,0.92)] p-10 text-white shadow-[0_32px_100px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">
            Enterprise-ready guardrails
          </p>
          <h3 className="mt-4 text-2xl font-semibold">
            Custom agreements & rider support
          </h3>
          <p className="mt-3 text-sm text-white/80">
            Need bespoke language for partner portals or marketplace
            integrations? Our legal team collaborates with your counsel to align
            on risk, compliance, and shared liability.
          </p>
          <div className="mt-6 space-y-3 text-sm text-white/75">
            <p>We provide:</p>
            <ul className="space-y-2">
              <li className="rounded-2xl bg-white/10 p-3">
                Data processing addendum and global transfer clauses.
              </li>
              <li className="rounded-2xl bg-white/10 p-3">
                Service level commitments and uptime guarantees.
              </li>
              <li className="rounded-2xl bg-white/10 p-3">
                Co-marketing guidelines for franchise and brokerage partners.
              </li>
            </ul>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <CTAButton
              label="Request enterprise terms"
              variant="outline"
              href="mailto:legal@stayza.pro"
            />
            <CTAButton
              label="Discuss with legal"
              variant="ghost"
              href="/contact"
            />
          </div>
        </div>
        <div className="rounded-3xl border border-dashed border-marketing-subtle/70 bg-white/95 p-10 text-sm text-marketing-muted shadow-[0_22px_72px_rgba(15,23,42,0.12)]">
          <h3 className="text-xl font-semibold text-marketing-foreground">
            Quick references
          </h3>
          <ul className="mt-4 space-y-3">
            <li>
              📄 Review our
              <a
                className="ml-1 text-marketing-foreground underline"
                href="/legal/privacy"
              >
                privacy policy
              </a>
              for data handling details.
            </li>
            <li>
              🔐 Explore the
              <a
                className="ml-1 text-marketing-foreground underline"
                href="/legal/security"
              >
                security overview
              </a>
              to understand infrastructure and access controls.
            </li>
            <li>
              🤝 For partnership addendums, email
              <a
                className="ml-1 text-marketing-foreground underline"
                href="mailto:partnerships@stayza.pro"
              >
                partnerships@stayza.pro
              </a>
              .
            </li>
          </ul>
        </div>
      </section>
    </MarketingPageLayout>
  );
}
