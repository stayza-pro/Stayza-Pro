import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { palette } from "@/app/(marketing)/content";

export function FinalCTABand() {
  return (
    <section className="py-24" style={{ backgroundColor: palette.primary }}>
      <div className="mx-auto max-w-4xl space-y-6 px-4 text-center text-white sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold md:text-4xl">
          Launch Your Branded Realtor Hub, Automate Payouts, and Close Deals
          Faster
        </h2>
        <div className="flex items-center justify-center">
          <CTAButton label="Join Waitlist" href="/#waitlist" />
        </div>
        <p className="text-sm text-white/70">
          Set up your custom mini-site in minutes with your logo and colors.
          Upload listings, manage bookings, and collect payments
          automatically—no spreadsheets, no headaches. Guests can browse,
          favorite, and review properties, while verified realtors stand out
          with a trust badge. Upgrade to Pro for unlimited listings, analytics,
          and full branding. Trusted by 100+ Lagos realtors to save time and
          boost revenue.
        </p>
      </div>
    </section>
  );
}
