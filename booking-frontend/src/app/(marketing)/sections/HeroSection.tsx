import { heroHighlights, palette } from "@/app/(marketing)/content";
import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { Navigation } from "@/app/(marketing)/sections/Navigation";

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: palette.primary }}
    >
      <div className="absolute inset-0">
        <div
          className="absolute right-[-18%] top-[-35%] h-[460px] w-[460px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-30%] left-[-8%] h-[380px] w-[380px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(4,120,87,0.25) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative">
        <Navigation />

        <div className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-8 text-white">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]">
                Launch-ready booking engine
              </span>
              <h1 className="text-4xl font-bold leading-tight md:text-6xl">
                Bring every booking touchpoint under your own brand.
              </h1>
              <p className="max-w-xl text-lg text-white/80 md:text-xl">
                Stayza Pro replaces disjointed messaging, spreadsheets, and
                payment links with one immersive booking experience your clients
                trust.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <CTAButton label="Get Started Free" />
                <CTAButton label="Preview a live microsite" variant="ghost" />
              </div>
              <div className="grid gap-4 pt-6 sm:grid-cols-3">
                {heroHighlights.map(({ title, description, Icon }) => (
                  <article
                    key={title}
                    className="rounded-2xl border border-white/15 bg-white/5 px-4 py-5 backdrop-blur transition-transform motion-safe:hover:-translate-y-1"
                  >
                    <div className="flex items-center gap-3 text-white/85">
                      <Icon className="h-5 w-5" />
                      <span className="text-xs uppercase tracking-[0.14em] text-white/60">
                        {title}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-white/75">{description}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[32px] border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur">
                <div className="space-y-6 rounded-[24px] border border-marketing-subtle bg-marketing-elevated p-6 shadow-xl">
                  <div
                    className="flex items-center justify-between"
                    role="group"
                    aria-label="Booking summary header"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-12 w-12 rounded-full"
                        style={{ backgroundColor: palette.secondary }}
                      />
                      <div>
                        <p className="text-sm font-semibold text-marketing-foreground">
                          Indigo Estates
                        </p>
                        <p className="text-xs text-marketing-muted">
                          stayza.pro/indigo
                        </p>
                      </div>
                    </div>
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        backgroundColor: "var(--marketing-primary-mist)",
                        color: palette.neutralDark,
                      }}
                    >
                      Auto-confirm
                    </span>
                  </div>
                  <div className="space-y-4 rounded-2xl border border-marketing-subtle bg-marketing-surface p-5">
                    <div className="h-44 rounded-xl bg-gradient-to-br from-slate-200 via-white to-slate-100" />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-marketing-muted">Next check-in</p>
                        <p className="font-semibold text-marketing-foreground">
                          28 Sept • 4 nights
                        </p>
                      </div>
                      <div>
                        <p className="text-marketing-muted">Forecast payout</p>
                        <p className="font-semibold text-green-600">₦312,500</p>
                      </div>
                    </div>
                    <div
                      className="flex items-center justify-between rounded-xl px-4 py-3"
                      style={{
                        backgroundColor: "var(--marketing-secondary-mist)",
                      }}
                    >
                      <div>
                        <p className="text-xs uppercase tracking-[0.12em] text-marketing-muted">
                          Payment split
                        </p>
                        <p className="text-sm font-semibold text-marketing-foreground">
                          ₦280,000 realtor • ₦32,500 platform
                        </p>
                      </div>
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5 text-emerald-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M9 12l2 2 4-4" />
                        <path d="M21 12a9 9 0 1 1-9-9" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 rounded-xl bg-[var(--marketing-secondary)] py-2.5 text-sm font-semibold text-white transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--marketing-secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--marketing-ring-offset)] motion-safe:hover:-translate-y-0.5">
                      View booking
                    </button>
                    <button className="flex-1 rounded-xl border border-marketing-subtle bg-transparent py-2.5 text-sm font-semibold text-marketing-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--marketing-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--marketing-ring-offset)] hover:bg-marketing-surface/80">
                      Send receipt
                    </button>
                  </div>
                </div>
              </div>
              <aside className="absolute -bottom-12 -right-10 hidden lg:block">
                <div className="rounded-3xl border border-white/20 bg-white/15 px-6 py-4 text-white shadow-xl backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.14em] text-white/70">
                    Realtime activity
                  </p>
                  <p className="mt-2 text-lg font-semibold">3 new enquiries</p>
                  <p className="text-xs text-white/60">in the last hour</p>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
