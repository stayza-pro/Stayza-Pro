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
      {sections.map((section) => (
        <section
          key={section.heading}
          className="space-y-3 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-marketing-subtle"
        >
          <h2 className="text-xl font-semibold text-marketing-foreground">
            {section.heading}
          </h2>
          <p className="text-sm text-marketing-muted">{section.copy}</p>
        </section>
      ))}
      <section className="space-y-2 rounded-3xl border border-dashed border-marketing-subtle px-6 py-5 text-sm text-marketing-muted">
        <p>
          Questions? Reach our privacy team at{" "}
          <a
            className="text-marketing-foreground underline"
            href="mailto:privacy@stayza.pro"
          >
            privacy@stayza.pro
          </a>
          .
        </p>
      </section>
    </MarketingPageLayout>
  );
}
