"use client";

import { motion, useReducedMotion } from "framer-motion";
import { WaitlistForm } from "@/app/(marketing)/components/WaitlistForm";
import { Navigation } from "@/app/(marketing)/sections/Navigation";
import { FooterSection } from "@/app/(marketing)/sections/FooterSection";
import { palette } from "@/app/(marketing)/content";
import {
  Rocket,
  Bell,
  Users,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Zap,
  Shield,
  Clock,
  BarChart3,
} from "lucide-react";

export default function JoinWaitlistPage() {
  const shouldReduceMotion = useReducedMotion();

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
      title: "Early Access",
      description:
        "Be among the first to use Stayza Pro before public launch. Get immediate access to all premium features.",
    },
    {
      icon: Users,
      title: "Founding Member Perks",
      description:
        "Special lifetime discounts, priority support, and exclusive features reserved only for early adopters.",
    },
    {
      icon: Rocket,
      title: "Shape the Future",
      description:
        "Your feedback will directly influence product development. Help us build the perfect platform.",
    },
    {
      icon: DollarSign,
      title: "Special Pricing",
      description:
        "Lock in founding member pricing for life. Save up to 40% on monthly subscription costs.",
    },
    {
      icon: TrendingUp,
      title: "Growth Support",
      description:
        "Get personalized onboarding and dedicated support to help you succeed from day one.",
    },
    {
      icon: Zap,
      title: "Premium Features",
      description:
        "Full access to analytics, unlimited listings, custom branding, and advanced automation.",
    },
  ];

  const features = [
    {
      icon: Shield,
      title: "Verified Realtors",
      description:
        "Full CAC verification system with trust badges to build credibility with clients.",
    },
    {
      icon: Clock,
      title: "24/7 Automation",
      description:
        "Bookings, payments, and receipts happen automatically—even while you sleep.",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description:
        "Track revenue, bookings, and performance with real-time insights.",
    },
    {
      icon: DollarSign,
      title: "Automated Payouts",
      description:
        "Secure escrow system with automatic commission splits and instant payouts.",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Property Manager, Lagos",
      content:
        "Can't wait to automate my booking process. The demo looks incredible!",
    },
    {
      name: "Michael Chen",
      role: "Real Estate Agent",
      content:
        "Finally, a platform that understands what realtors actually need.",
    },
    {
      name: "Aisha Bello",
      role: "Realtor, Abuja",
      content:
        "The automated payment system alone is worth the wait. Excited to join!",
    },
  ];

  return (
    <div className="min-h-screen">
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
        {/* Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute right-[-18%] top-[-35%] h-[460px] w-[460px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)",
            }}
            animate={
              shouldReduceMotion
                ? undefined
                : { x: [0, 45, 0], y: [0, -35, 0], rotate: [0, 8, 0] }
            }
            transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-[-30%] left-[-8%] h-[380px] w-[380px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(4,120,87,0.25) 0%, transparent 70%)",
            }}
            animate={
              shouldReduceMotion
                ? undefined
                : { x: [0, -35, 0], y: [0, 28, 0], rotate: [0, -6, 0] }
            }
            transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

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
                Coming Soon
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
                Join the exclusive waitlist for Stayza Pro. Get early access,
                founding member benefits, and special lifetime pricing when we
                launch.
              </motion.p>

              <motion.div
                className="flex flex-wrap justify-center gap-8 pt-8"
                variants={itemVariants}
              >
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold">500+</div>
                  <div className="text-white/70 text-sm">On Waitlist</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold">40%</div>
                  <div className="text-white/70 text-sm">Founding Discount</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold">24/7</div>
                  <div className="text-white/70 text-sm">Automation</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Benefits Section */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: palette.primary }}
            >
              Why Join the Waitlist?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Early members get exclusive perks and lifetime benefits
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={index}
                  className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                  whileInView={
                    shouldReduceMotion
                      ? undefined
                      : { opacity: 1, y: 0, transition: { delay: index * 0.1 } }
                  }
                  viewport={{ once: true }}
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${palette.secondary}30` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: palette.accent }} />
                  </div>
                  <h3
                    className="text-xl font-semibold mb-3"
                    style={{ color: palette.primary }}
                  >
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600">{benefit.description}</p>
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
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/5 to-black/10" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Reserve Your Spot Now
            </h2>
            <p className="text-xl text-white/80">
              Join 500+ property professionals already on the waitlist
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
            <WaitlistForm />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: palette.primary }}
            >
              What You'll Get Access To
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A complete platform built for modern property professionals
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="flex gap-4 p-6 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${palette.primary}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: palette.primary }} />
                  </div>
                  <div>
                    <h3
                      className="text-lg font-semibold mb-2"
                      style={{ color: palette.primary }}
                    >
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: palette.primary }}
            >
              What People Are Saying
            </h2>
            <p className="text-xl text-gray-600">
              Early interest from property professionals
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
              >
                <p className="text-gray-700 mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <div
                    className="font-semibold"
                    style={{ color: palette.primary }}
                  >
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        className="py-16"
        style={{ backgroundColor: palette.secondary }}
      >
        <div className="mx-auto max-w-4xl px-4 text-center text-white sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Don't Miss Out on Founding Member Benefits
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Limited spots available. Join now to secure your exclusive perks.
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
