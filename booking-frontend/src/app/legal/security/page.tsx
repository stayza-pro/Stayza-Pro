import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { MarketingPageLayout } from "@/app/(marketing)/components/MarketingPageLayout";

const commitments = [
  {
    heading: "Infrastructure",
    copy: "Stayza Pro is hosted on SOC 2 compliant infrastructure with automated backups, redundancy, and continuous monitoring.",
  },
  {
    heading: "Payments",
    copy: "All card data is handled by Stripe or Paystack. We never store or transmit raw payment information on Stayza Pro servers.",
  },
  {
    heading: "Access controls",
    copy: "Role-based permissions let you restrict who can approve listings, manage payouts, or handle disputes across your portfolio.",
  },
];

export default function SecurityPage() {
  return (
    <MarketingPageLayout
      title="Security overview"
      description="We combine trusted payment infrastructure with audit-ready tooling so your team can operate with confidence."
    >
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6 rounded-3xl border border-white/15 bg-gradient-to-br from-[rgba(255,255,255,0.98)] via-[rgba(248,250,252,0.92)] to-[rgba(226,232,240,0.86)] p-10 shadow-[0_30px_96px_rgba(15,23,42,0.18)]">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-marketing-muted">
            Security foundations
          </p>
          <h2 className="text-3xl font-semibold text-marketing-foreground">
            Built on verified infrastructure and payments
          </h2>
          <div className="space-y-4">
            {commitments.map((commitment) => (
              <article
                key={commitment.heading}
                className="rounded-2xl border border-marketing-subtle/70 bg-white/95 px-5 py-4 shadow-sm"
              >
                <h3 className="text-base font-semibold text-marketing-foreground">
                  {commitment.heading}
                </h3>
                <p className="mt-2 text-sm text-marketing-muted">
                  {commitment.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-[rgba(255,255,255,0.24)] bg-gradient-to-br from-[rgba(17,24,39,0.94)] via-[rgba(30,64,175,0.88)] to-[rgba(8,47,73,0.9)] p-10 text-white shadow-[0_32px_100px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">
            Operational safeguards
          </p>
          <h3 className="mt-4 text-2xl font-semibold">
            How we keep agencies and guests protected
          </h3>
          <ul className="mt-6 space-y-4 text-sm text-white/80">
            <li className="rounded-2xl bg-white/10 p-4">
              Continuous vulnerability scanning, dependency patching, and
              third-party penetration tests.
            </li>
            <li className="rounded-2xl bg-white/10 p-4">
              Immutable audit logs capturing payouts, disputes, and admin
              actions in real-time.
            </li>
            <li className="rounded-2xl bg-white/10 p-4">
              Granular role-based access with mandatory 2FA for payout and
              compliance roles.
            </li>
          </ul>
          <div className="mt-6 space-y-3 text-sm text-white/75">
            <p>Need a detailed security brief or vendor questionnaire?</p>
            <CTAButton
              label="Request security pack"
              variant="outline"
              href="mailto:security@stayza.pro"
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-dashed border-marketing-subtle/70 bg-white/95 p-8 text-sm text-marketing-muted shadow-[0_20px_70px_rgba(15,23,42,0.12)]">
        <p>
          We collaborate with your security and compliance leads to complete
          onboarding questionnaires, share documentation, and align on incident
          response. Expect an initial turnaround within two business days.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <CTAButton
            label="View privacy policy"
            variant="ghost"
            href="/legal/privacy"
          />
          <CTAButton
            label="Schedule technical review"
            variant="outline"
            href="https://cal.com/stayza-pro/security"
          />
        </div>
      </section>
    </MarketingPageLayout>
  );
}
