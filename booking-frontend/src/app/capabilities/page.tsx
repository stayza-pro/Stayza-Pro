"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CapabilitiesSection } from "@/app/(marketing)/sections/CapabilitiesSection";
import { SectionTitle } from "@/app/(marketing)/components/SectionTitle";
import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { Navigation } from "@/app/(marketing)/sections/Navigation";
import { FooterSection } from "@/app/(marketing)/sections/FooterSection";
import { palette } from "@/app/(marketing)/content";
import { BarChart3, Settings, Users, Zap, Globe } from "lucide-react";

const advancedCapabilities = [
  {
    title: "Smart Pricing",
    description:
      "Dynamic pricing based on market demand, seasonality, and competitor analysis.",
    icon: BarChart3,
  },
  {
    title: "Multi-Property Management",
    description:
      "Manage unlimited properties from a single dashboard with bulk operations.",
    icon: Settings,
  },
  {
    title: "Guest Communication Hub",
    description:
      "Automated messaging, check-in instructions, and 24/7 guest support integration.",
    icon: Users,
  },
  {
    title: "Advanced Analytics",
    description:
      "Revenue forecasting, occupancy trends, and performance insights across your portfolio.",
    icon: Zap,
  },
];

export default function CapabilitiesPage() {
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
                Advanced Features
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
                Advanced{" "}
                <span className="relative">
                  <span className="relative z-10">Capabilities</span>
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
                Discover the powerful features that set Stayza apart. From
                automated workflows to advanced analytics, we've built
                everything you need to scale your property business.
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
                <CTAButton label="Explore Features" href="/get-started" />
                <CTAButton
                  label="Schedule Demo"
                  variant="ghost"
                  href="/contact"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <main className="bg-marketing-surface text-marketing-foreground">
        {/* Main Capabilities Section */}
        <CapabilitiesSection />

        {/* Advanced Features Section */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="advanced features"
              title="Enterprise-grade capabilities for growing businesses"
              description="Scale your operations with powerful tools designed for professional property managers."
            />
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-2">
              {advancedCapabilities.map(
                ({ title, description, icon: Icon }) => (
                  <div
                    key={title}
                    className="marketing-card p-6 transition-transform motion-safe:hover:-translate-y-1"
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl mb-6"
                      style={{
                        backgroundColor: "var(--marketing-primary-soft)",
                      }}
                    >
                      <Icon
                        className="h-6 w-6"
                        style={{ color: palette.primary }}
                      />
                    </div>
                    <h3 className="text-xl font-semibold text-marketing-foreground mb-3">
                      {title}
                    </h3>
                    <p className="text-marketing-muted">{description}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* Integration Section */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="integrations"
              title="Works with tools you already use"
              description="Seamlessly connect with your existing property management tools, accounting software, and marketing platforms."
            />
            <div className="mt-12 grid grid-cols-3 gap-8 md:grid-cols-6">
              {[
                "Accounting Software",
                "PMS Systems",
                "Channel Managers",
                "Payment Gateways",
                "Smart Locks",
                "Cleaning Services",
              ].map((integration) => (
                <div key={integration} className="marketing-card p-4">
                  <Globe
                    className="mx-auto h-8 w-8 mb-2"
                    style={{ color: palette.primary }}
                  />
                  <p className="text-xs font-medium text-marketing-muted">
                    {integration}
                  </p>
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
