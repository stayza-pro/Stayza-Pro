"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SignalsSection } from "@/app/(marketing)/sections/SignalsSection";
import { SectionTitle } from "@/app/(marketing)/components/SectionTitle";
import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { Navigation } from "@/app/(marketing)/sections/Navigation";
import { FooterSection } from "@/app/(marketing)/sections/FooterSection";
import { palette } from "@/app/(marketing)/content";
import {
  TrendingUp,
  BarChart3,
  Target,
  Eye,
  DollarSign,
  Calendar,
  MapPin,
  Users,
} from "lucide-react";

const signalTypes = [
  {
    title: "Market Demand",
    description:
      "Real-time booking trends and seasonal demand patterns in your area.",
    icon: TrendingUp,
    metric: "+23%",
    label: "Average demand increase",
  },
  {
    title: "Pricing Intelligence",
    description:
      "Competitive pricing analysis and revenue optimization recommendations.",
    icon: DollarSign,
    metric: "₦15K",
    label: "Additional monthly revenue",
  },
  {
    title: "Occupancy Insights",
    description:
      "Booking patterns, peak periods, and availability optimization strategies.",
    icon: Calendar,
    metric: "85%",
    label: "Average occupancy rate",
  },
  {
    title: "Guest Behavior",
    description:
      "Guest preferences, booking lead times, and satisfaction metrics.",
    icon: Users,
    metric: "4.8★",
    label: "Average guest rating",
  },
];

const analyticsFeatures = [
  {
    title: "Revenue Forecasting",
    description:
      "Predict future earnings based on market trends and booking patterns.",
    icon: BarChart3,
  },
  {
    title: "Performance Tracking",
    description:
      "Monitor key metrics across your entire property portfolio in real-time.",
    icon: Target,
  },
  {
    title: "Market Positioning",
    description:
      "Understand your competitive position and identify growth opportunities.",
    icon: MapPin,
  },
];

export default function SignalsPage() {
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
                Market Intelligence
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
                Market{" "}
                <span className="relative">
                  <span className="relative z-10">Signals</span>
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
                Make data-driven decisions with powerful analytics and market
                insights. Optimize your pricing, maximize occupancy, and stay
                ahead of the competition.
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
                <CTAButton label="Access Analytics" href="/get-started" />
                <CTAButton
                  label="View Sample Report"
                  variant="ghost"
                  href="/demo/realtor"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <main className="bg-marketing-surface text-marketing-foreground">
        {/* Main Signals Section */}
        <SignalsSection />

        {/* Signal Types Grid */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="market intelligence"
              title="Four key signals that drive your success"
              description="Get actionable insights from the data that matters most to your property business."
            />
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-2">
              {signalTypes.map(
                ({ title, description, icon: Icon, metric, label }) => (
                  <div key={title} className="marketing-card p-8">
                    <div className="flex items-start justify-between mb-6">
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
                      <div className="text-right">
                        <div
                          className="text-2xl font-bold"
                          style={{ color: palette.secondary }}
                        >
                          {metric}
                        </div>
                        <div className="text-xs text-marketing-muted">
                          {label}
                        </div>
                      </div>
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

        {/* Analytics Features */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="advanced analytics"
              title="Deep insights for smarter decisions"
              description="Go beyond basic reporting with sophisticated analytics tools designed for property professionals."
            />
            <div className="mt-16 grid gap-8 lg:grid-cols-3">
              {analyticsFeatures.map(({ title, description, icon: Icon }) => (
                <div
                  key={title}
                  className="marketing-card relative overflow-hidden p-8"
                >
                  <div
                    className="absolute right-[-18%] top-[-20%] h-28 w-28 rounded-full"
                    style={{ backgroundColor: "var(--marketing-primary-mist)" }}
                  />
                  <div className="relative">
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
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Data Visualization Preview */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="visualization"
              title="See your data come to life"
              description="Beautiful, interactive dashboards that make complex data easy to understand and act upon."
            />
            <div className="mt-12 marketing-card p-8">
              <div
                className="flex items-center justify-center h-64 rounded-lg"
                style={{ backgroundColor: palette.neutralLight }}
              >
                <div className="text-center">
                  <Eye
                    className="mx-auto h-16 w-16 mb-4"
                    style={{ color: palette.primary }}
                  />
                  <h3 className="text-xl font-semibold text-marketing-foreground mb-2">
                    Interactive Dashboard Preview
                  </h3>
                  <p className="text-marketing-muted">
                    Real-time charts, graphs, and insights at your fingertips
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
