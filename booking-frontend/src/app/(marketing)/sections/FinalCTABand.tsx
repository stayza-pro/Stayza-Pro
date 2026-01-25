import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { palette } from "@/app/(marketing)/content";

export function FinalCTABand() {
  return (
    <section className="py-24" style={{ backgroundColor: palette.primary }}>
      <div className="mx-auto max-w-4xl space-y-6 px-4 text-center text-white sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold md:text-4xl">
          Launch Your Branded Realtor Hub, Escrow Protection, and Close Deals
          Faster
        </h2>
        <div className="flex items-center justify-center">
          <CTAButton label="Join Waitlist" href="/join-waitlist" />
        </div>
        <p className="text-sm text-white/70">
          Set up your branded booking site in minutes with your logo and colors
          at yourbusiness.stayza.pro. Upload unlimited listings, manage
          bookings, and collect payments automatically—no spreadsheets, no
          headaches. Guests can browse, favorite, and review properties, while
          CAC-verified realtors stand out with a trust badge. Platform takes 10%
          commission on room fees, you keep 90% plus 100% of cleaning fees. Join
          100+ property professionals building their booking business.
        </p>
      </div>
    </section>
  );
}
