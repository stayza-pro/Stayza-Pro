"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { SectionTitle } from "@/app/(marketing)/components/SectionTitle";
import { Navigation } from "@/app/(marketing)/sections/Navigation";
import { FooterSection } from "@/app/(marketing)/sections/FooterSection";
import {
  Rocket,
  Check,
  Star,
  Users,
  TrendingUp,
  Shield,
  Zap,
  Target,
} from "lucide-react";

export default function GetStartedPage() {
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

  const plans = [
    {
      id: "starter",
      name: "Starter Plan",
      price: "$0",
      period: "Free Forever",
      description:
        "Perfect for individual realtors getting started with digital bookings",
      features: [
        "Up to 5 property listings",
        "Basic booking calendar",
        "Email notifications",
        "Client contact management",
        "Mobile-responsive booking page",
      ],
      cta: "Start Free",
      href: "/register/realtor?plan=starter",
      popular: false,
    },
    {
      id: "professional",
      name: "Professional Plan",
      price: "$29",
      period: "per month",
      description: "Enhanced features for growing real estate professionals",
      features: [
        "Unlimited property listings",
        "Advanced calendar management",
        "Automated email campaigns",
        "Analytics and reporting",
        "Custom branding",
        "Payment processing integration",
        "Priority support",
      ],
      cta: "Start Trial",
      href: "/register/realtor?plan=professional",
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise Plan",
      price: "$99",
      period: "per month",
      description: "Complete solution for real estate agencies and teams",
      features: [
        "Everything in Professional",
        "Multi-agent dashboard",
        "Team collaboration tools",
        "Advanced analytics",
        "API access",
        "White-label solutions",
        "Dedicated account manager",
        "Custom integrations",
      ],
      cta: "Contact Sales",
      href: "/contact",
      popular: false,
    },
  ];

  const steps = [
    {
      icon: Target,
      title: "Choose Your Plan",
      description: "Select the plan that matches your business needs and goals",
    },
    {
      icon: Rocket,
      title: "Quick Setup",
      description:
        "Create your account and customize your booking experience in minutes",
    },
    {
      icon: Users,
      title: "Start Booking",
      description:
        "Share your personalized booking link and start receiving client appointments",
    },
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
              Start Your Journey
            </motion.div>

            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight text-white mb-6"
              variants={itemVariants}
            >
              Get Started with{" "}
              <span className="text-marketing-accent">Stayza</span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-white/80 leading-relaxed mb-12 max-w-3xl mx-auto"
              variants={itemVariants}
            >
              Transform your real estate business today. Choose the perfect plan
              and start accepting bookings in minutes, not weeks.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center"
              variants={itemVariants}
            >
              <CTAButton variant="solid" href="#pricing" label="View Pricing" />
              <CTAButton variant="ghost" href="/demo" label="Watch Demo" />
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
                  title="How It Works"
                  description="Three simple steps to transform your business"
                />
              </motion.div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

        {/* Pricing Section */}
        <section id="pricing" className="py-32">
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
                  title="Choose Your Plan"
                  description="Flexible pricing that grows with your business"
                />
              </motion.div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  className={`marketing-card p-8 hover:shadow-xl transition-all duration-300 ${
                    plan.popular ? "ring-2 ring-marketing-accent relative" : ""
                  }`}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={itemVariants}
                  transition={{ delay: index * 0.1 }}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-marketing-accent text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center">
                        <Star className="w-4 h-4 mr-2" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-marketing-text mb-3">
                      {plan.name}
                    </h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-marketing-primary">
                        {plan.price}
                      </span>
                      <span className="text-marketing-text-muted ml-2">
                        {plan.period}
                      </span>
                    </div>
                    <p className="text-marketing-text-muted">
                      {plan.description}
                    </p>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <Check className="w-5 h-5 text-marketing-secondary mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-marketing-text-muted">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <CTAButton
                    variant={plan.popular ? "solid" : "outline"}
                    href={plan.href}
                    className="w-full"
                    label={plan.cta}
                  />
                </motion.div>
              ))}
            </div>
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
                Ready to Transform Your Real Estate Business?
              </h3>

              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of successful realtors who've streamlined their
                booking process and increased their revenue with Stayza.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <CTAButton
                  variant="ghost"
                  href="/register"
                  className="bg-white text-marketing-primary hover:bg-white/90"
                  label="Start Free Today"
                />
                <CTAButton
                  variant="outline"
                  href="/contact"
                  className="border-white text-white hover:bg-white hover:text-marketing-primary"
                  label="Talk to Sales"
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
