import { faqItems } from "@/app/(marketing)/content";
import { MarketingPageLayout } from "@/app/(marketing)/components/MarketingPageLayout";

export default function FAQPage() {
  return (
    <MarketingPageLayout
      title="Frequently asked questions"
      description="Answers for agencies evaluating a branded booking experience powered by Stayza Pro."
    >
      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-marketing-subtle">
        {faqItems.map((item) => (
          <article
            key={item.question}
            className="rounded-2xl bg-marketing-surface px-4 py-4"
          >
            <h2 className="text-lg font-semibold text-marketing-foreground">
              {item.question}
            </h2>
            <p className="mt-2 text-sm text-marketing-muted">{item.answer}</p>
          </article>
        ))}
      </section>

      <section className="space-y-3 rounded-3xl border border-dashed border-marketing-subtle px-6 py-5 text-sm text-marketing-muted">
        <p>
          Still have questions? Email{" "}
          <a
            className="text-marketing-foreground underline"
            href="mailto:hello@stayza.pro"
          >
            hello@stayza.pro
          </a>{" "}
          and we&rsquo;ll respond within one business day.
        </p>
      </section>
    </MarketingPageLayout>
  );
}
