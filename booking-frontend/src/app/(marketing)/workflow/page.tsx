"use client";

import { motion, useReducedMotion } from "framer-motion";
import { WorkflowSection } from "@/app/(marketing)/sections/WorkflowSection";
import { SectionTitle } from "@/app/(marketing)/components/SectionTitle";
import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { Navigation } from "@/app/(marketing)/sections/Navigation";
import { FooterSection } from "@/app/(marketing)/sections/FooterSection";
import { palette } from "@/app/(marketing)/content";
import {
  Clock,
  MessageSquare,
  CreditCard,
  CheckCircle,
  ArrowRight,
  Zap,
  Calendar,
  Mail,
} from "lucide-react";

const workflowSteps = [
  {
    step: "1",
    title: "Guest Books Property",
    description:
      "Guest completes booking on your branded page with secure payment processing.",
    icon: Calendar,
  },
  {
    step: "2",
    title: "Automatic Confirmation",
    description:
      "Instant booking confirmation sent with your branding and check-in details.",
    icon: CheckCircle,
  },
  {
    step: "3",
    title: "Smart Communication",
    description:
      "Automated pre-arrival, check-in, and post-stay messages keep guests informed.",
    icon: MessageSquare,
  },
  {
    step: "4",
    title: "Secure Payouts",
    description:
      "Automatic split payouts to property owners and your commission account.",
    icon: CreditCard,
  },
];

const automationFeatures = [
  {
    title: "Smart Scheduling",
    description:
      "Automatically coordinate cleaning, maintenance, and check-in times based on bookings.",
    icon: Clock,
  },
  {
    title: "Dynamic Messaging",
    description:
      "Send personalized messages based on guest journey stage and property details.",
    icon: Mail,
  },
  {
    title: "Instant Processing",
    description:
      "Real-time booking confirmations, payment processing, and calendar updates.",
    icon: Zap,
  },
];

export default function WorkflowPage() {
  return (
    <div className="marketing-theme min-h-screen antialiased">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden py-16 lg:py-24"
        style={{ backgroundColor: palette.primary }}
      >
        <Navigation />
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold leading-tight md:text-6xl text-white">
            Automated <span className="text-white">Workflows</span>
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-lg md:text-xl text-white/90">
            Streamline every aspect of your property management with intelligent
            automation. From booking to checkout, let Stayza handle the details
            while you focus on growth.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-10">
            <CTAButton label="Join Waitlist" href="/#waitlist" />
            <CTAButton
              label="See It In Action"
              variant="ghost"
              href="/demo/realtor"
            />
          </div>
        </div>
      </section>

      <main className="bg-marketing-surface text-marketing-foreground">
        {/* Main Workflow Section */}
        <WorkflowSection />

        {/* Step-by-Step Process */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="seamless process"
              title="From booking to payout in 4 automated steps"
              description="Watch how Stayza transforms complex property management into a smooth, automated experience."
            />
            <div className="mt-16 space-y-8">
              {workflowSteps.map(
                ({ step, title, description, icon: Icon }, index) => (
                  <div key={step} className="flex items-center gap-8">
                    <div className="marketing-card p-6 flex-1">
                      <div className="flex items-center gap-4">
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
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span
                              className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                              style={{ backgroundColor: palette.primary }}
                            >
                              {step}
                            </span>
                            <h3 className="text-xl font-semibold text-marketing-foreground">
                              {title}
                            </h3>
                          </div>
                          <p className="mt-2 text-marketing-muted">
                            {description}
                          </p>
                        </div>
                      </div>
                    </div>
                    {index < workflowSteps.length - 1 && (
                      <ArrowRight
                        className="h-6 w-6"
                        style={{ color: palette.primary }}
                      />
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* Automation Features */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="intelligent automation"
              title="Smart features that work while you sleep"
              description="Advanced automation capabilities that handle the routine tasks so you can focus on growing your business."
            />
            <div className="mt-16 grid gap-8 lg:grid-cols-3">
              {automationFeatures.map(({ title, description, icon: Icon }) => (
                <div
                  key={title}
                  className="marketing-card p-6 transition-transform motion-safe:hover:-translate-y-1"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl mb-6"
                    style={{
                      backgroundColor: "var(--marketing-secondary-soft)",
                    }}
                  >
                    <Icon
                      className="h-6 w-6"
                      style={{ color: palette.secondary }}
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-marketing-foreground mb-3">
                    {title}
                  </h3>
                  <p className="text-marketing-muted">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
