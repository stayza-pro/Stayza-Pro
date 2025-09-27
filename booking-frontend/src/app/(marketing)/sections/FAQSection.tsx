import { faqItems, palette } from "@/app/(marketing)/content";
import { SectionTitle } from "@/app/(marketing)/components/SectionTitle";

export function FAQSection() {
  return (
    <section
      id="faq"
      className="py-24"
      style={{ backgroundColor: palette.neutralLight }}
    >
      <div className="mx-auto max-w-6xl space-y-12 px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="FAQ"
          title="Answers teams ask before they switch"
          description="Need more context? Book a walkthrough and we’ll tailor the setup to your workflow."
        />
        <div className="grid gap-6 md:grid-cols-2">
          {faqItems.map((faq) => (
            <article key={faq.question} className="marketing-card p-6">
              <h3 className="text-base font-semibold text-marketing-foreground">
                {faq.question}
              </h3>
              <p className="mt-3 text-sm text-marketing-muted">{faq.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
