"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FAQSection } from "@/app/(marketing)/sections/FAQSection";
import { SectionTitle } from "@/app/(marketing)/components/SectionTitle";
import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { Navigation } from "@/app/(marketing)/sections/Navigation";
import { FooterSection } from "@/app/(marketing)/sections/FooterSection";
import { palette } from "@/app/(marketing)/content";
import { HelpCircle, MessageCircle, Phone, Mail } from "lucide-react";

export default function FAQPage() {
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
                Support & Answers
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
                Frequently Asked{" "}
                <span className="relative">
                  <span className="relative z-10">Questions</span>
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
                Find quick answers to common questions about Stayza Pro. Can't
                find what you're looking for? Our support team is here to help.
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
                <CTAButton label="Contact Support" href="/contact" />
                <CTAButton
                  label="Join Waitlist"
                  variant="accent"
                  href="/#waitlist"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <main className="bg-marketing-surface text-marketing-foreground">
        {/* Main FAQ Section */}
        <FAQSection />

        {/* Additional Support Section */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="still need help?"
              title="Get personalized support when you need it"
              description="Our team is ready to help you succeed with Stayza Pro. Choose the support option that works best for you."
            />
            <div className="mt-16 grid gap-8 lg:grid-cols-3">
              <div className="marketing-card p-8 text-center">
                <div
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl mb-6"
                  style={{ backgroundColor: "var(--marketing-primary-soft)" }}
                >
                  <MessageCircle
                    className="h-6 w-6"
                    style={{ color: palette.primary }}
                  />
                </div>
                <h3 className="text-xl font-semibold text-marketing-foreground mb-3">
                  Live Chat
                </h3>
                <p className="text-marketing-muted mb-6">
                  Get instant answers from our support team during business
                  hours.
                </p>
                <CTAButton
                  label="Start Chat"
                  variant="ghost"
                  href="/contact"
                  className="w-full"
                />
              </div>
              <div className="marketing-card p-8 text-center">
                <div
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl mb-6"
                  style={{ backgroundColor: "var(--marketing-secondary-soft)" }}
                >
                  <Mail
                    className="h-6 w-6"
                    style={{ color: palette.secondary }}
                  />
                </div>
                <h3 className="text-xl font-semibold text-marketing-foreground mb-3">
                  Email Support
                </h3>
                <p className="text-marketing-muted mb-6">
                  Send us detailed questions and get comprehensive responses
                  within 24 hours.
                </p>
                <CTAButton
                  label="Email Us"
                  variant="ghost"
                  href="mailto:support@stayza.com"
                  className="w-full"
                />
              </div>
              <div className="marketing-card p-8 text-center">
                <div
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl mb-6"
                  style={{ backgroundColor: "var(--marketing-accent-soft)" }}
                >
                  <Phone
                    className="h-6 w-6"
                    style={{ color: palette.accent }}
                  />
                </div>
                <h3 className="text-xl font-semibold text-marketing-foreground mb-3">
                  Phone Support
                </h3>
                <p className="text-marketing-muted mb-6">
                  Speak directly with our experts for complex setup and training
                  needs.
                </p>
                <CTAButton
                  label="Call Us"
                  variant="ghost"
                  href="tel:+2348009782992"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
