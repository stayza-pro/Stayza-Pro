"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { WaitlistForm } from "@/app/(marketing)/components/WaitlistForm";
import { Navigation } from "@/app/(marketing)/sections/Navigation";
import { FooterSection } from "@/app/(marketing)/sections/FooterSection";
import { palette } from "@/app/(marketing)/content";
import {
  Rocket,
  Bell,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Zap,
  Shield,
  Clock,
  BarChart3,
} from "lucide-react";


export function JoinWaitlistClient() {
  const shouldReduceMotion = useReducedMotion();
  const [waitlistCount, setWaitlistCount] = useState(100);

  useEffect(() => {
    const fetchWaitlistCount = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/waitlist/count`,
        );
        const data = await response.json();
        if (data.success) {
          // Add 100 baseline to actual count
          setWaitlistCount(data.data.count + 100);
        }
      } catch (error) {
        // Keep default 100 if fetch fails
      }
    };

    fetchWaitlistCount();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const benefits = [
    {
      icon: Bell,
      title: "Priority Access",
      description:
        "Be among the first realtors to launch your branded booking site when we go live.",
    },
    {
      icon: Shield,
      title: "CAC Verification Ready",
      description:
        "Get your Corporate Affairs Commission certificate verified immediately to build trust with guests.",
    },
    {
      icon: Rocket,
      title: "Shape the Platform",
      description:
        "Your feedback will directly influence product development during the early launch phase.",
    },
    {
      icon: DollarSign,
      title: "10% Commission Only",
      description:
        "Free platform access with unlimited property listings. Earn 90% of every booking after checkout.",
    },
    {
      icon: TrendingUp,
      title: "Launch Support",
      description:
        "Get personalized onboarding and support to help you set up your branded subdomain.",
    },
    {
      icon: Zap,
      title: "Full Feature Access",
      description:
        "Unlimited properties, escrow payments, branded subdomain (yourbusiness.stayza.pro), and audit trail.",
    },
  ];

  const features = [
    {
      icon: Shield,
      title: "CAC Verification System",
      description:
        "Submit your Corporate Affairs Commission certificate for admin review and get verified trust badges.",
    },
    {
      icon: Clock,
      title: "Escrow-Protected Payouts",
      description:
        "Paystack escrow holds funds securely. You get 90% after checkout, platform takes 10%—all automatic.",
    },
    {
      icon: BarChart3,
      title: "Branded Subdomains",
      description:
        "Get your own booking site at yourbusiness.stayza.pro with your logo and brand colors.",
    },
    {
      icon: DollarSign,
      title: "Unlimited Properties",
      description:
        "List unlimited properties with up to 10 photos each. No subscription fees, just 10% commission.",
    },
  ];

  const testimonials = [
    {
      name: "100+ Realtors",
      role: "Already Waiting",
      content:
        "Join hundreds of Nigerian property professionals preparing to launch their branded booking sites.",
    },
    {
      name: "10% Commission",
      role: "No Hidden Fees",
      content:
        "Keep 90% of your room fees plus 100% of cleaning fees. Only pay when you earn.",
    },
    {
      name: "Escrow Protection",
      role: "Secure Payments",
      content:
        "Paystack escrow holds funds until checkout, then automatically splits: 90% to you, 10% platform fee.",
    },
  ];

  return (
    <div className="marketing-theme min-h-screen antialiased">
      {/* Hero Section */}
      <motion.section
        className="relative overflow-hidden"
        style={{ backgroundColor: palette.primary }}
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={
          shouldReduceMotion
            ? undefined
            : { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
        }
      >
        <div className="relative">
          <Navigation />

          <div className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
            <motion.div
              className="text-center text-white space-y-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white/90 text-sm font-medium"
                style={{ backgroundColor: `${palette.accent}40` }}
                variants={itemVariants}
              >
                <Rocket className="w-4 h-4" />
                Early Access Open
              </motion.div>

              <motion.h1
                className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight"
                variants={itemVariants}
              >
                Be First to Experience
                <br />
                <span style={{ color: palette.accent }}>
                  Property Booking, Reimagined
                </span>
              </motion.h1>

              <motion.p
                className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto"
                variants={itemVariants}
              >
                Join {waitlistCount}+ realtors on the exclusive waitlist for
                Stayza Pro. Get priority access to your branded booking site
                with escrow-protected payments and CAC verification.
              </motion.p>

              <motion.div
                className="flex flex-wrap justify-center gap-8 pt-8"
                variants={itemVariants}
              >
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold">
                    {waitlistCount}+
                  </div>
                  <div className="text-white/70 text-sm">On Waitlist</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold">10%</div>
                  <div className="text-white/70 text-sm">Commission Only</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold">90%</div>
                  <div className="text-white/70 text-sm">You Keep</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Benefits Section */}
      <section
        className="py-24"
        style={{ backgroundColor: palette.neutralLight }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-marketing-foreground">
              Why Join the Waitlist?
            </h2>
            <p className="text-xl text-marketing-muted max-w-2xl mx-auto">
              Get priority access when we launch
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={index}
                  className="marketing-card p-8 transition-transform motion-safe:hover:-translate-y-1"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                  whileInView={
                    shouldReduceMotion
                      ? undefined
                      : { opacity: 1, y: 0, transition: { delay: index * 0.1 } }
                  }
                  viewport={{ once: true }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{
                      backgroundColor: "var(--marketing-secondary-soft)",
                    }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{ color: palette.secondary }}
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-marketing-foreground">
                    {benefit.title}
                  </h3>
                  <p className="text-marketing-muted">{benefit.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section
        id="form"
        className="py-24 relative overflow-hidden"
        style={{ backgroundColor: palette.primary }}
      >
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Reserve Your Spot Now
            </h2>
            <p className="text-xl text-white/80">
              Join {waitlistCount}+ property professionals already on the
              waitlist
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
            <WaitlistForm />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-marketing-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-marketing-foreground">
              What You'll Get Access To
            </h2>
            <p className="text-xl text-marketing-muted max-w-2xl mx-auto">
              A complete platform built for modern property professionals
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="flex gap-4 marketing-card p-6 transition-transform motion-safe:hover:-translate-y-1"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "var(--marketing-primary-soft)" }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{ color: palette.primary }}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-marketing-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-marketing-muted">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        className="py-24"
        style={{ backgroundColor: palette.neutralLight }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-marketing-foreground">
              Why Stayza Pro?
            </h2>
            <p className="text-xl text-marketing-muted">
              Built for Nigerian property professionals
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="marketing-card p-6">
                <p className="text-marketing-muted mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-marketing-foreground">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-marketing-muted">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16" style={{ backgroundColor: palette.secondary }}>
        <div className="mx-auto max-w-4xl px-4 text-center text-white sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Get Priority Access to Your Branded Booking Site
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join 100+ realtors waiting to launch. Be notified when we go live.
          </p>
          <a
            href="#form"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all"
            style={{
              backgroundColor: palette.accent,
              color: "white",
            }}
          >
            <CheckCircle className="w-5 h-5" />
            Join the Waitlist Now
          </a>
        </div>
      </section>

      <FooterSection />
    </div>
  );
}
