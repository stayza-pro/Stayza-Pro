import { Metadata } from "next";
import Link from "next/link";
import {
  Globe,
  CreditCard,
  Calendar,
  MessageSquare,
  BarChart3,
  Shield,
  CheckCircle,
  MonitorSmartphone,
  Wallet,
  Zap,
} from "lucide-react";
import { Navigation } from "@/app/(marketing)/sections/Navigation";
import { FooterSection } from "@/app/(marketing)/sections/FooterSection";
import { palette } from "@/app/(marketing)/content";
import { SectionTitle } from "@/app/(marketing)/components/SectionTitle";
import { CTAButton } from "@/app/(marketing)/components/CTAButton";

export const metadata: Metadata = {
  title: "Booking Website for Realtors - Branded Property Management Platform",
  description:
    "Create a professional booking website for your real estate business. Accept direct bookings and payments via Paystack, manage multiple properties, automate guest communication, and track commissions. Perfect for property managers, realtors, and serviced apartment businesses.",
  keywords: [
    "booking website for realtors",
    "realtor booking system",
    "property management website",
    "real estate booking platform",
    "branded booking website",
    "direct booking for properties",
  ],
  alternates: {
    canonical: "/booking-website-for-realtors",
  },
};

export default function BookingWebsiteForRealtorsPage() {
  const features = [
    {
      icon: Globe,
      title: "Your Branded Booking Portal",
      description:
        "Get a fully customizable booking website with your branding, colors, and domain. Guests book directly from your site without third-party interference.",
    },
    {
      icon: CreditCard,
      title: "Integrated Payment Processing",
      description:
        "Accept payments securely through Paystack. Automatic escrow protection holds funds until check-in, protecting both you and your guests.",
    },
    {
      icon: Calendar,
      title: "Real-Time Availability Management",
      description:
        "Update property availability instantly. Calendar synchronization prevents double bookings and keeps your listings always current.",
    },
    {
      icon: MessageSquare,
      title: "Built-In Guest Communication",
      description:
        "Communicate with guests directly through the platform. Automated booking confirmations and reminders reduce your administrative workload.",
    },
    {
      icon: BarChart3,
      title: "Performance Analytics Dashboard",
      description:
        "Track bookings, revenue, occupancy rates, and guest reviews. Make data-driven decisions to optimize your property performance.",
    },
    {
      icon: Shield,
      title: "Dispute Resolution & Review System",
      description:
        "Handle disputes professionally with built-in resolution workflows. Collect and display verified guest reviews to build trust.",
    },
  ];

  const benefits = [
    "Own your customer relationships - no middlemen",
    "Keep more revenue with transparent commission tracking",
    "Multi-property management from one dashboard",
    "Automated guest check-in and check-out processes",
    "Mobile-friendly booking experience for guests",
    "Secure escrow payment system",
    "Professional booking receipts and invoices",
    "24/7 access to your booking dashboard",
  ];

  const useCases = [
    {
      title: "Short-Let Property Managers",
      description:
        "Manage multiple vacation rentals and serviced apartments with automated booking workflows and guest communication.",
    },
    {
      title: "Real Estate Professionals",
      description:
        "Offer temporary housing solutions to clients with a professional booking system that handles payments and scheduling.",
    },
    {
      title: "Serviced Apartment Businesses",
      description:
        "Scale your serviced apartment business with a platform that handles bookings, payments, and guest management automatically.",
    },
  ];

  return (
    <div className="marketing-theme min-h-screen antialiased">
      {/* Hero with Navigation */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: palette.primary }}
      >
        {/* Background orbs */}
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

          {/* Hero Content */}
          <div className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center text-white">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] mb-8">
                For Property Managers
              </span>
              <h1 className="text-4xl font-bold leading-tight md:text-6xl mb-6">
                Booking Website for Realtors
              </h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed max-w-3xl mx-auto">
                Launch your professional property booking website in minutes.
                Accept direct bookings, process payments securely via Paystack,
                and manage your entire portfolio from one platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <CTAButton label="Get Started Free" href="/join-waitlist" />
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold text-white transition-colors rounded-xl border-2 border-white/30 hover:border-white/50 hover:bg-white/10"
                >
                  See How It Works
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="bg-marketing-surface text-marketing-foreground">
        {/* Problem Statement */}
        <section className="py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="why you need this"
              title="Why Realtors Need Their Own Booking Website"
              description="Traditional property listing platforms charge high commissions (15-20%) and control your customer relationships. You don't own the booking data, can't communicate directly with guests, and depend entirely on their platform for your revenue."
            />
            <div className="mt-8 prose prose-lg max-w-none text-marketing-muted">
              <p>
                With your own booking website, you control the customer
                experience, keep more revenue, and build long-term relationships
                with guests who book directly. It's professional, scalable, and
                puts you in charge of your business.
              </p>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section
          className="py-24"
          style={{ backgroundColor: palette.neutralLight }}
        >
          <div className="mx-auto max-w-6xl space-y-12 px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="complete platform"
              title="Everything You Need to Run Your Booking Business"
              description="Comprehensive tools for property management and guest bookings"
            />

            <div className="grid gap-8 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={index}
                    className="marketing-card relative overflow-hidden p-8"
                  >
                    <div
                      className="absolute right-[-18%] top-[-20%] h-28 w-28 rounded-full"
                      style={{
                        backgroundColor: "var(--marketing-primary-mist)",
                      }}
                    />
                    <div className="relative">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: "var(--marketing-primary-soft)",
                        }}
                      >
                        <Icon
                          className="h-6 w-6"
                          style={{ color: palette.primary }}
                        />
                      </div>
                      <h3 className="mt-6 text-xl font-semibold text-marketing-foreground">
                        {feature.title}
                      </h3>
                      <p className="mt-3 text-sm text-marketing-muted leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section
          className="py-24"
          style={{ backgroundColor: palette.secondary }}
        >
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-12 text-center text-white">
              What You Get with Stayza Pro
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 text-white">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 mt-1" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="perfect for"
              title="Who Benefits from Stayza Pro"
            />
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {useCases.map((useCase, index) => (
                <article key={index} className="marketing-card p-8 text-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    style={{
                      backgroundColor: "var(--marketing-secondary-soft)",
                    }}
                  >
                    <span
                      className="text-2xl font-bold"
                      style={{ color: palette.secondary }}
                    >
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-marketing-foreground mb-3">
                    {useCase.title}
                  </h3>
                  <p className="text-marketing-muted leading-relaxed">
                    {useCase.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section
          className="py-24"
          style={{ backgroundColor: palette.neutralLight }}
        >
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="simple setup"
              title="Get Your Booking Website in 4 Steps"
            />
            <div className="mt-12 space-y-6">
              {[
                {
                  step: "1",
                  title: "Sign Up & Customize",
                  desc: "Create your account and customize your booking portal with your branding, colors, and property listings.",
                  icon: MonitorSmartphone,
                },
                {
                  step: "2",
                  title: "Connect Paystack Payment",
                  desc: "Link your Paystack account to accept secure payments with automatic escrow protection.",
                  icon: Wallet,
                },
                {
                  step: "3",
                  title: "Add Your Properties",
                  desc: "Upload property details, photos, pricing, and availability. Set your commission rates and booking rules.",
                  icon: Globe,
                },
                {
                  step: "4",
                  title: "Go Live & Accept Bookings",
                  desc: "Share your booking website link and start accepting direct bookings from guests immediately.",
                  icon: Zap,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.step}
                    className="marketing-card flex gap-6 p-6"
                  >
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: "var(--marketing-primary-soft)",
                      }}
                    >
                      <Icon
                        className="h-6 w-6"
                        style={{ color: palette.primary }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: palette.secondary }}
                        >
                          STEP {item.step}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-marketing-foreground mb-2">
                        {item.title}
                      </h3>
                      <p className="text-marketing-muted leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              title="Frequently Asked Questions"
              description="Everything you need to know about getting started"
            />
            <div className="mt-12 space-y-6">
              {[
                {
                  q: "How much does it cost to create a booking website?",
                  a: "Stayza Pro operates on a commission-based model. You only pay a small commission on successful bookings, with no upfront costs or monthly fees.",
                },
                {
                  q: "Can I use my own domain name?",
                  a: "Yes, you can connect your custom domain to your Stayza Pro booking website for a fully branded experience.",
                },
                {
                  q: "How do I receive payments from guests?",
                  a: "Payments are processed through Paystack and held in escrow until guest check-in. After successful check-in, funds are automatically released to your account minus the platform commission.",
                },
                {
                  q: "Can I manage multiple properties?",
                  a: "Yes, Stayza Pro supports unlimited properties. Manage all your listings, bookings, and guest communications from one centralized dashboard.",
                },
                {
                  q: "Is the booking website mobile-friendly?",
                  a: "Absolutely. Your booking website is fully responsive and optimized for mobile devices, ensuring guests can book easily from any device.",
                },
              ].map((faq, index) => (
                <div key={index} className="marketing-card p-6">
                  <h3 className="text-lg font-semibold text-marketing-foreground mb-3 flex items-start gap-3">
                    <span
                      style={{ color: palette.secondary }}
                      className="flex-shrink-0"
                    >
                      Q:
                    </span>
                    {faq.q}
                  </h3>
                  <p className="text-marketing-muted leading-relaxed ml-7">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24" style={{ backgroundColor: palette.primary }}>
          <div className="mx-auto max-w-4xl space-y-6 px-4 text-center text-white sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold md:text-4xl">
              Ready to Launch Your Booking Website?
            </h2>
            <p className="text-xl text-white/90">
              Join property managers already using Stayza Pro to accept direct
              bookings and grow their business.
            </p>
            <div className="flex items-center justify-center">
              <CTAButton label="Get Started Now" href="/join-waitlist" />
            </div>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
