import { faqItems } from "@/app/(marketing)/content";
import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { MarketingPageLayout } from "@/app/(marketing)/components/MarketingPageLayout";

export default function FAQPage() {
  return (
    <MarketingPageLayout
      title="Frequently asked questions"
      description="Answers for agencies evaluating a branded booking experience powered by Stayza Pro."
    >
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[rgba(255,255,255,0.98)] via-[rgba(248,250,252,0.92)] to-[rgba(226,232,240,0.86)] p-10 shadow-[0_26px_85px_rgba(15,23,42,0.16)]">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-marketing-muted">
              Evaluator library
            </p>
            <h2 className="text-3xl font-semibold text-marketing-foreground">
              Everything ops, finance, and compliance teams ask
            </h2>
            <p className="text-sm text-marketing-muted">
              Pull the answers your stakeholders need to sign off on brand-led
              booking infrastructure. Share this page internally or request a
              tailored response pack.
            </p>
            <div className="flex flex-wrap gap-3">
              <CTAButton label="Request tailored answers" href="/contact" />
              <CTAButton
                label="See rollout workflow"
                variant="outline"
                href="/workflow"
              />
            </div>
          </div>
          <div className="rounded-[28px] border border-marketing-subtle/70 bg-white/95 p-1 shadow-inner">
            <div className="grid max-h-[520px] gap-3 overflow-y-auto p-6">
              {faqItems.map((item) => (
                <article
                  key={item.question}
                  className="rounded-2xl border border-marketing-subtle/60 bg-white px-5 py-4 hover:border-[var(--marketing-accent)]/50 hover:shadow-[0_14px_36px_rgba(15,23,42,0.12)]"
                >
                  <h3 className="text-base font-semibold text-marketing-foreground">
                    {item.question}
                  </h3>
                  <p className="mt-2 text-sm text-marketing-muted">
                    {item.answer}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/25 bg-gradient-to-br from-[rgba(17,24,39,0.95)] via-[rgba(30,64,175,0.88)] to-[rgba(8,47,73,0.92)] p-8 text-white shadow-[0_28px_90px_rgba(15,23,42,0.42)]">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">
            Need to weigh risk?
          </p>
          <h3 className="mt-4 text-2xl font-semibold">
            Compliance, security, and financial controls
          </h3>
          <p className="mt-3 text-sm text-white/80">
            We operate a SOC 2-aligned program, segregated ledgers per
            marketplace, and real-time audit logs so you can maintain trust
            without extra tooling.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <CTAButton
              label="Review security posture"
              variant="outline"
              href="/legal/security"
            />
            <CTAButton
              label="View data processing addendum"
              variant="ghost"
              href="/legal/privacy"
            />
          </div>
        </div>
        <div className="rounded-3xl border border-dashed border-marketing-subtle/70 bg-white/95 p-8 text-sm text-marketing-muted shadow-[0_18px_62px_rgba(15,23,42,0.14)]">
          <p>
            Still have questions? Email
            <a
              className="ml-1 font-semibold text-marketing-foreground underline"
              href="mailto:hello@stayza.pro"
            >
              hello@stayza.pro
            </a>
            — you&rsquo;ll hear back within one business day.
          </p>
          <p className="mt-3">
            Prefer live support? Book a 15-minute fit check with our product
            specialists to confirm Stayza Pro is aligned with your roadmap.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <CTAButton label="Book a fit check" href="/contact" />
            <CTAButton
              label="Invite stakeholders"
              variant="outline"
              href="/early-access"
            />
          </div>
        </div>
      </section>
    </MarketingPageLayout>
  );
}
