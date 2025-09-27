import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { MarketingPageLayout } from "@/app/(marketing)/components/MarketingPageLayout";

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
    <MarketingPageLayout
      title="Contact the Stayza Pro team"
      description="We&rsquo;re here to help you launch and scale branded booking microsites for every realtor on your roster."
    >
      <section className="grid gap-6 sm:grid-cols-2">
        {contactChannels.map((channel) => (
          <article
            key={channel.title}
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-marketing-subtle"
          >
            <h2 className="text-xl font-semibold text-marketing-foreground">
              {channel.title}
            </h2>
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
      </section>

      <section className="space-y-2 rounded-3xl border border-dashed border-marketing-subtle px-6 py-5 text-sm text-marketing-muted">
        <p>
          Prefer email? Reach us directly at{" "}
          <a
            className="text-marketing-foreground underline"
            href="mailto:hello@stayza.pro"
          >
            hello@stayza.pro
          </a>{" "}
          — we respond within one business day.
        </p>
      </section>
    </MarketingPageLayout>
  );
}
