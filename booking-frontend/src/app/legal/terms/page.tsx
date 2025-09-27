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
      {clauses.map((clause) => (
        <section
          key={clause.heading}
          className="space-y-3 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-marketing-subtle"
        >
          <h2 className="text-xl font-semibold text-marketing-foreground">
            {clause.heading}
          </h2>
          <p className="text-sm text-marketing-muted">{clause.copy}</p>
        </section>
      ))}
      <section className="space-y-2 rounded-3xl border border-dashed border-marketing-subtle px-6 py-5 text-sm text-marketing-muted">
        <p>
          For legal enquiries, contact{" "}
          <a
            className="text-marketing-foreground underline"
            href="mailto:legal@stayza.pro"
          >
            legal@stayza.pro
          </a>
          .
        </p>
      </section>
    </MarketingPageLayout>
  );
}
