import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { palette } from "@/app/(marketing)/content";

export function FinalCTABand() {
  return (
    <section className="py-24" style={{ backgroundColor: palette.primary }}>
      <div className="mx-auto max-w-4xl space-y-6 px-4 text-center text-white sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold md:text-4xl">
          Ready to deliver a booking journey your brand can be proud of?
        </h2>
        <div className="flex items-center justify-center">
          <CTAButton label="Get Started Free" />
        </div>
        <p className="text-sm text-white/70">
          Publish your microsite, connect payments, and invite teammates in
          minutes. Upgrade only when you need more power.
        </p>
      </div>
    </section>
  );
}
