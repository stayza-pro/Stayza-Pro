"use client";

import { motion, useReducedMotion } from "framer-motion";
import { WhySection } from "@/app/(marketing)/sections/WhySection";
import { SectionTitle } from "@/app/(marketing)/components/SectionTitle";
import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { Navigation } from "@/app/(marketing)/sections/Navigation";
import { FooterSection } from "@/app/(marketing)/sections/FooterSection";
import { palette } from "@/app/(marketing)/content";
import { TrendingUp, Shield } from "lucide-react";

const benefits = [
  {
    title: "85% Higher Revenue",
    description:
      "Realtors using Stayza Pro report significantly higher revenue compared to traditional platforms.",
    icon: TrendingUp,
  },
  {
    title: "Complete Brand Control",
    description:
      "Your branding, your domain, your guest relationships - no more losing clients to marketplaces.",
    icon: Shield,
  },
];

export default function WhyStayzaPage() {
  const shouldReduceMotion = useReducedMotion();

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
              className="mx-auto max-w-4xl text-center space-y-8 text-white"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 40 }}
              animate={
                shouldReduceMotion
                  ? undefined
                  : {
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.7,
                        delay: 0.1,
                        ease: [0.21, 0.61, 0.35, 1],
                      },
                    }
              }
            >
              <motion.span
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: 0.6,
                          delay: 0.3,
                          ease: [0.21, 0.61, 0.35, 1],
                        },
                      }
                }
              >
                For Modern Realtors
              </motion.span>

              <motion.h1
                className="text-4xl font-bold leading-tight md:text-6xl lg:text-7xl"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: 0.8,
                          delay: 0.2,
                          ease: [0.21, 0.61, 0.35, 1],
                        },
                      }
                }
              >
                Why Realtors Choose{" "}
                <span className="relative">
                  <span className="relative z-10">Stayza Pro</span>
                  <span
                    className="absolute -bottom-1 left-0 h-3 w-full"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                  />
                </span>
              </motion.h1>

              <motion.p
                className="mx-auto max-w-xl text-lg leading-relaxed text-white/90 md:text-xl"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: 0.7,
                          delay: 0.4,
                          ease: [0.21, 0.61, 0.35, 1],
                        },
                      }
                }
              >
                Transform your property management with a platform built
                specifically for modern realtors. No more juggling multiple
                tools or losing commission to generic marketplaces.
              </motion.p>

              <motion.div
                className="flex flex-wrap items-center justify-center gap-4"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: 0.6,
                          delay: 0.6,
                          ease: [0.21, 0.61, 0.35, 1],
                        },
                      }
                }
              >
                <CTAButton label="Start Your Free Trial" href="/get-started" />
                <CTAButton
                  label="Watch Demo"
                  variant="ghost"
                  href="/demo/realtor"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <main className="bg-marketing-surface text-marketing-foreground">
        {/* Main Why Section */}
        <WhySection />

        {/* Additional Benefits Section */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="proven results"
              title="Join thousands of realtors already growing with Stayza"
              description="See why property professionals are making the switch to a platform that puts their brand first."
            />
            <div className="mt-16 grid gap-8 lg:grid-cols-2">
              {benefits.map(({ title, description, icon: Icon }) => (
                <div
                  key={title}
                  className="marketing-card p-6 transition-transform motion-safe:hover:-translate-y-1"
                >
                  <div className="flex items-center space-x-4">
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
                      <h3 className="text-xl font-semibold text-marketing-foreground mb-2">
                        {title}
                      </h3>
                      <p className="text-marketing-muted">{description}</p>
                    </div>
                  </div>
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
