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
      {commitments.map((commitment) => (
        <section
          key={commitment.heading}
          className="space-y-3 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-marketing-subtle"
        >
          <h2 className="text-xl font-semibold text-marketing-foreground">
            {commitment.heading}
          </h2>
          <p className="text-sm text-marketing-muted">{commitment.copy}</p>
        </section>
      ))}
      <section className="space-y-2 rounded-3xl border border-dashed border-marketing-subtle px-6 py-5 text-sm text-marketing-muted">
        <p>
          Need a security review package? Email{" "}
          <a
            className="text-marketing-foreground underline"
            href="mailto:security@stayza.pro"
          >
            security@stayza.pro
          </a>
          .
        </p>
      </section>
    </MarketingPageLayout>
  );
}
