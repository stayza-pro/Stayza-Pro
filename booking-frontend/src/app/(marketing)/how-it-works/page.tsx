"use client";

import React from "react";
import { Navigation } from "@/app/(marketing)/sections/Navigation";
import { FooterSection } from "@/app/(marketing)/sections/FooterSection";
import { WhySection } from "@/app/(marketing)/sections/WhySection";
import { CapabilitiesSection } from "@/app/(marketing)/sections/CapabilitiesSection";
import { FAQSection } from "@/app/(marketing)/sections/FAQSection";
import { SectionTitle } from "@/app/(marketing)/components/SectionTitle";
import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { palette } from "@/app/(marketing)/content";
import {
  Search,
  Calendar,
  CreditCard,
  Key,
  Star,
  Shield,
  HeadphonesIcon,
  CheckCircle,
} from "lucide-react";

export const metadata = {
  title: "How It Works - Property Booking System for Realtors",
  description:
    "Learn how Stayza works for realtors and guests. Branded booking sites, automated payments with escrow, real-time calendars. Simple 4-step process to start accepting bookings.",
  openGraph: {
    title: "How It Works - Property Booking System for Realtors",
    description:
      "Learn how Stayza works for realtors and guests. Branded booking sites, automated payments with escrow, real-time calendars.",
    url: "/how-it-works",
  },
  alternates: {
    canonical: "/how-it-works",
  },
};

export default function HowItWorksPage() {
  const guestSteps = [
    {
      icon: Search,
      title: "Browse Properties",
      description:
        "Explore our curated selection of premium short-let properties. Use filters to find your perfect match.",
    },
    {
      icon: Calendar,
      title: "Select Your Dates",
      description:
        "Check availability and choose your check-in and check-out dates. See instant pricing with no hidden fees.",
    },
    {
      icon: CreditCard,
      title: "Secure Booking",
      description:
        "Complete your booking with our secure payment system. Get instant confirmation via email.",
    },
    {
      icon: Key,
      title: "Check In & Enjoy",
      description:
        "Receive check-in details and enjoy your stay. Contact your host anytime through our messaging system.",
    },
  ];

  const realtorSteps = [
    {
      icon: Key,
      title: "Create Your Account",
      description:
        "Sign up and complete your business verification. Add your properties with detailed descriptions and photos.",
    },
    {
      icon: Calendar,
      title: "Manage Bookings",
      description:
        "Receive booking requests and manage your calendar. Set your own pricing and availability.",
    },
    {
      icon: CreditCard,
      title: "Get Paid",
      description:
        "Receive secure payments directly to your account. Track your revenue with detailed analytics.",
    },
    {
      icon: Star,
      title: "Build Your Brand",
      description:
        "Get reviews from guests and build your reputation. Customize your branded booking site.",
    },
  ];

  const features = [
    {
      icon: Shield,
      title: "Secure & Safe",
      description:
        "All payments are secured with industry-standard encryption. Your data is protected.",
    },
    {
      icon: HeadphonesIcon,
      title: "24/7 Support",
      description:
        "Our support team is always available to help with any questions or concerns.",
    },
    {
      icon: CheckCircle,
      title: "Verified Properties",
      description:
        "All properties and hosts are verified to ensure quality and authenticity.",
    },
  ];

  return (
    <div className="marketing-theme min-h-screen antialiased">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: palette.primary }}
      >
        <Navigation />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24 pt-16">
          <div className="mx-auto max-w-4xl text-center text-white">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] mb-8">
              Step by Step
            </span>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl mb-6">
              How Stayza Pro Works
            </h1>
            <p className="text-xl text-white/90 leading-relaxed max-w-3xl mx-auto">
              Discover how easy it is to book your perfect stay or list your
              property on our platform
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="bg-marketing-surface text-marketing-foreground">
        {/* For Guests Section */}
        <section
          className="py-24"
          style={{ backgroundColor: palette.neutralLight }}
        >
          <div className="mx-auto max-w-6xl space-y-12 px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="for guests"
              title="Book Your Perfect Stay"
              description="Book your perfect stay in 4 simple steps"
            />

            <div className="grid gap-8 lg:grid-cols-4">
              {guestSteps.map((step, index) => {
                const Icon = step.icon;
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
                      <div
                        className="absolute -top-6 -left-6 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: palette.primary }}
                      >
                        {index + 1}
                      </div>
                      <h3 className="mt-6 text-xl font-semibold text-marketing-foreground">
                        {step.title}
                      </h3>
                      <p className="mt-3 text-sm text-marketing-muted leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="flex items-center justify-center">
              <CTAButton
                label="Start Listing Properties"
                href="/realtor/onboarding"
              />
            </div>
          </div>
        </section>

        {/* For Property Owners Section */}
        <section className="py-24">
          <div className="mx-auto max-w-6xl space-y-12 px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="for property owners"
              title="Start Earning with Your Property"
              description="Start earning with your property in 4 easy steps"
            />

            <div className="grid gap-8 lg:grid-cols-4">
              {realtorSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article
                    key={index}
                    className="marketing-card relative overflow-hidden p-8"
                  >
                    <div
                      className="absolute right-[-18%] top-[-20%] h-28 w-28 rounded-full"
                      style={{
                        backgroundColor: "var(--marketing-secondary-mist)",
                      }}
                    />
                    <div className="relative">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: "var(--marketing-secondary-soft)",
                        }}
                      >
                        <Icon
                          className="h-6 w-6"
                          style={{ color: palette.secondary }}
                        />
                      </div>
                      <div
                        className="absolute -top-6 -left-6 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: palette.secondary }}
                      >
                        {index + 1}
                      </div>
                      <h3 className="mt-6 text-xl font-semibold text-marketing-foreground">
                        {step.title}
                      </h3>
                      <p className="mt-3 text-sm text-marketing-muted leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="flex items-center justify-center">
              <CTAButton label="Become a Host" href="/realtor/onboarding" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          className="py-24"
          style={{ backgroundColor: palette.neutralLight }}
        >
          <div className="mx-auto max-w-6xl space-y-12 px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="why choose us"
              title="The Best Experience for Everyone"
              description="We provide the best experience for both guests and hosts"
            />

            <div className="grid gap-8 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={index}
                    className="marketing-card p-8 text-center"
                  >
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                      style={{
                        backgroundColor: "var(--marketing-accent-soft)",
                      }}
                    >
                      <Icon
                        className="h-8 w-8"
                        style={{ color: palette.accent }}
                      />
                    </div>
                    <h3 className="text-xl font-semibold text-marketing-foreground mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-marketing-muted leading-relaxed">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why Stayza Section */}
        <WhySection />

        {/* Capabilities Section */}
        <CapabilitiesSection />

        {/* FAQ Section */}
        <FAQSection />

        {/* CTA Section */}
        <section className="py-24" style={{ backgroundColor: palette.primary }}>
          <div className="mx-auto max-w-4xl space-y-6 px-4 text-center text-white sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold md:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-white/90">
              Join thousands of guests and hosts who trust our platform for
              their short-let needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <CTAButton
                label="List Your Property"
                href="/realtor/onboarding"
              />
            </div>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
