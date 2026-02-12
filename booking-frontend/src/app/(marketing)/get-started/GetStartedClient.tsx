"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { SectionTitle } from "@/app/(marketing)/components/SectionTitle";
import { Navigation } from "@/app/(marketing)/sections/Navigation";
import { FooterSection } from "@/app/(marketing)/sections/FooterSection";
import {
  Rocket,
  Check,
  Users,
  TrendingUp,
  Globe,
  CalendarCheck,
  CreditCard,
  MonitorSmartphone,
  MessageSquare,
  ShieldCheck,
  Wallet,
} from "lucide-react";


export function GetStartedClient() {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldReduceMotion ? 0 : 0.6, ease: "easeOut" },
    },
  };

  const orbVariants = {
    animate: shouldReduceMotion
      ? {}
      : {
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3],
          transition: {
            duration: 6,
            repeat: Infinity,
            repeatType: "reverse" as const,
            ease: "easeInOut",
          },
        },
  };

  const steps = [
    {
      icon: Globe,
      title: "Claim your branded subdomain",
      description:
        "Choose yourbusiness.stayza.pro, upload your logo, and set your brand colors.",
    },
    {
      icon: CalendarCheck,
      title: "List properties and set availability",
      description:
        "Add listings, pricing, and a real-time calendar to prevent double bookings.",
    },
    {
      icon: CreditCard,
      title: "Connect Paystack escrow",
      description:
        "Collect payments securely with escrow protection and automated payouts.",
    },
    {
      icon: ShieldCheck,
      title: "Get verified and go live",
      description:
        "Submit CAC verification, earn a trust badge, and start accepting bookings.",
    },
  ];

  const featureHighlights = [
    {
      icon: MonitorSmartphone,
      title: "Branded guest booking portals",
      description:
        "Own your experience with a personalized booking site and custom branding.",
    },
    {
      icon: Wallet,
      title: "Escrow-protected payouts",
      description:
        "Funds are held safely in escrow, then split automatically after check-in.",
    },
    {
      icon: CalendarCheck,
      title: "Real-time availability calendar",
      description:
        "Block dates, prevent overlaps, and keep every listing accurate.",
    },
    {
      icon: MessageSquare,
      title: "Guest communication + reviews",
      description:
        "Automated updates, messaging, and reviews to build trust and loyalty.",
    },
    {
      icon: ShieldCheck,
      title: "Disputes + audit trail",
      description:
        "Track every booking, payment, and resolution in one place.",
    },
    {
      icon: Users,
      title: "CAC verification badge",
      description:
        "Stand out with verified business credentials and higher booking confidence.",
    },
  ];

  const pricingHighlights = [
    "No subscription or setup fees",
    "Tiered commission on room fees, based on booking value",
    "Monthly volume discounts are applied automatically when earned",
    "Escrow releases payouts automatically after check-in",
  ];

  return (
    <div className="min-h-screen marketing-theme">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col bg-marketing-primary">
        {/* Animated Background Orbs */}
        <motion.div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div
            className="absolute top-20 right-20 w-64 h-64 bg-marketing-secondary/20 rounded-full blur-3xl"
            variants={orbVariants}
            animate="animate"
          />
          <motion.div
            className="absolute bottom-40 left-20 w-96 h-96 bg-marketing-accent/20 rounded-full blur-3xl"
            variants={orbVariants}
            animate="animate"
            transition={{ delay: 1 }}
          />
          <motion.div
            className="absolute top-1/2 right-1/3 w-48 h-48 bg-marketing-primary-soft/30 rounded-full blur-2xl"
            variants={orbVariants}
            animate="animate"
            transition={{ delay: 2 }}
          />
        </motion.div>

        <Navigation />

        <div className="flex-1 flex items-center justify-center px-6 relative z-10">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium mb-8"
              variants={itemVariants}
            >
              <Rocket className="w-4 h-4 mr-2" />
              Commission-only pricing. No subscriptions.
            </motion.div>

            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight text-white mb-6"
              variants={itemVariants}
            >
              Launch your branded booking site in minutes with{" "}
              <span className="text-marketing-accent">Stayza Pro</span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-white/80 leading-relaxed mb-12 max-w-3xl mx-auto"
              variants={itemVariants}
            >
              Give guests a seamless experience with branded portals, escrow
              payments, real-time calendars, and CAC verification. You own your
              listings, your payouts, and your customer relationships.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center"
              variants={itemVariants}
            >
              <CTAButton
                variant="solid"
                href="/join-waitlist"
                label="Join Waitlist"
              />
              <CTAButton
                variant="ghost"
                href="/how-it-works"
                label="See How It Works"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <main className="bg-marketing-surface">
        <section className="py-32">
          <div className="container mx-auto px-6 max-w-7xl">
            <motion.div
              className="text-center mb-20"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
            >
              <motion.div variants={itemVariants}>
                <SectionTitle
                  title="How Stayza Pro works"
                  description="Four steps to launch and start earning"
                />
              </motion.div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    className="marketing-card p-8 text-center hover:shadow-xl transition-all duration-300"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={itemVariants}
                    transition={{ delay: index * 0.2 }}
                  >
                    <div className="relative mb-8">
                      <div className="w-20 h-20 bg-marketing-primary rounded-2xl flex items-center justify-center mx-auto">
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-marketing-accent rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-marketing-text mb-4">
                      {step.title}
                    </h3>
                    <p className="text-marketing-text-muted leading-relaxed">
                      {step.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32">
          <div className="container mx-auto px-6 max-w-7xl">
            <motion.div
              className="text-center mb-20"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
            >
              <motion.div variants={itemVariants}>
                <SectionTitle
                  title="Everything you need to run bookings"
                  description="Stayza Pro covers branding, payments, compliance, and guest experience."
                />
              </motion.div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featureHighlights.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    className="marketing-card p-8 hover:shadow-xl transition-all duration-300"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={itemVariants}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="w-14 h-14 bg-marketing-primary rounded-2xl flex items-center justify-center mb-6">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-marketing-text mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-marketing-text-muted leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Commission Section */}
        <section className="py-32">
          <div className="container mx-auto px-6 max-w-5xl">
            <motion.div
              className="text-center mb-14"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
            >
              <motion.div variants={itemVariants}>
                <SectionTitle
                  title="Commission-only pricing"
                  description="Pay nothing upfront. Stayza Pro earns only when bookings are confirmed."
                />
              </motion.div>
            </motion.div>

            <motion.div
              className="marketing-card p-10"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={itemVariants}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-marketing-secondary mb-4">
                    Simple, transparent pricing
                  </p>
                  <h3 className="text-3xl font-bold text-marketing-text mb-4">
                    Config-driven tiered commission
                  </h3>
                  <p className="text-marketing-text-muted text-lg">
                    Realtor commission, guest service fees, and estimated payout are shown before booking confirmation.
                  </p>
                </div>
                <div className="space-y-4">
                  {pricingHighlights.map((item) => (
                    <div key={item} className="flex items-start">
                      <Check className="w-5 h-5 text-marketing-secondary mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-marketing-text-muted">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              className="marketing-card p-12 text-center bg-gradient-to-br from-marketing-primary to-marketing-secondary text-white"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={itemVariants}
            >
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>

              <h3 className="text-3xl font-bold mb-6">
                Ready to launch your branded booking site?
              </h3>

              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join 100+ property professionals building their booking business
                with Stayza Pro. Get priority access and onboarding support.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <CTAButton
                  variant="ghost"
                  href="/join-waitlist"
                  className="bg-white text-marketing-primary hover:bg-white/90"
                  label="Join Waitlist"
                />
                <CTAButton
                  variant="outline"
                  href="/en#faq"
                  className="border-white text-white hover:bg-white hover:text-marketing-primary"
                  label="View FAQ"
                />
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
