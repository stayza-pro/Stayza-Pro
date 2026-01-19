"use client";

import { motion, useReducedMotion } from "framer-motion";
import { heroHighlights, palette } from "@/app/(marketing)/content";
import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { Navigation } from "@/app/(marketing)/sections/Navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const propertyImages = [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&q=75&fm=webp&fit=crop",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&q=75&fm=webp&fit=crop",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % propertyImages.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [propertyImages.length]);

  return (
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
          <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div
              className="space-y-8 text-white"
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
                        transition: { duration: 0.6, delay: 0.25 },
                      }
                }
              >
                Booking made personal
              </motion.span>
              <motion.h1
                className="text-4xl font-bold leading-tight md:text-6xl"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 28 }}
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: 0.75,
                          delay: 0.3,
                          ease: [0.22, 1, 0.36, 1],
                        },
                      }
                }
              >
                Your booking site. Branded. Live in minutes.
              </motion.h1>
              <motion.p
                className="max-w-xl text-lg text-white-medium-contrast md:text-xl"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.6, delay: 0.38 },
                      }
                }
              >
                Every realtor gets a branded booking website where clients book,
                pay, and receive receipts instantly. You own your listings, your
                payments, and your customers—no middlemen, no manual work.
              </motion.p>
              <motion.div
                className="flex flex-wrap items-center gap-4"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.6, delay: 0.45 },
                      }
                }
              >
                <CTAButton label="Join Waitlist" href="/join-waitlist" />
              </motion.div>
              <motion.div
                className="grid gap-4 pt-6 sm:grid-cols-3"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 28 }}
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.6, delay: 0.55 },
                      }
                }
              >
                {heroHighlights.map(({ title, description, Icon }) => (
                  <motion.article
                    key={title}
                    className="rounded-2xl border border-white/15 bg-white/5 px-4 py-5 backdrop-blur transition-transform motion-safe:hover:-translate-y-1"
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
                    whileInView={
                      shouldReduceMotion
                        ? undefined
                        : {
                            opacity: 1,
                            y: 0,
                            transition: {
                              duration: 0.55,
                              ease: [0.25, 0.8, 0.25, 1],
                            },
                          }
                    }
                    viewport={{ once: true, margin: "0px 0px -120px" }}
                  >
                    <div className="flex items-center gap-3 text-white/85">
                      <Icon className="h-5 w-5" />
                      <span className="text-xs uppercase tracking-[0.14em] text-white-medium-contrast">
                        {title}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-white-medium-contrast">
                      {description}
                    </p>
                  </motion.article>
                ))}
              </motion.div>
            </motion.div>

            <div className="relative">
              <motion.div
                className="rounded-[32px] border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 40 }}
                whileInView={
                  shouldReduceMotion
                    ? undefined
                    : {
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: 0.7,
                          ease: [0.25, 0.8, 0.25, 1],
                        },
                      }
                }
                viewport={{ once: true, margin: "0px 0px -120px" }}
              >
                <div className="space-y-6 rounded-[24px] border border-marketing-subtle bg-marketing-elevated p-6 shadow-xl">
                  <div
                    className="flex items-center justify-between"
                    role="group"
                    aria-label="Booking summary header"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full overflow-hidden bg-white flex items-center justify-center p-1.5">
                        <svg
                          viewBox="0 0 100 100"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-full h-full"
                        >
                          <rect
                            width="100"
                            height="100"
                            rx="100"
                            fill={palette.primary}
                          />
                          <text
                            x="50"
                            y="65"
                            fontSize="48"
                            fontWeight="bold"
                            fill="white"
                            textAnchor="middle"
                            fontFamily="Arial, sans-serif"
                          >
                            I^E
                          </text>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-marketing-foreground">
                          Indigo Estates
                        </p>
                        <p className="text-xs text-marketing-muted">
                          indigo-estate.stayza.pro
                        </p>
                      </div>
                    </div>
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        backgroundColor: "var(--marketing-primary-mist)",
                        color: palette.neutralDark,
                      }}
                    >
                      Instant Booking
                    </span>
                  </div>
                  <div className="space-y-4 rounded-2xl border border-marketing-subtle bg-marketing-surface p-5">
                    <div className="h-44 rounded-xl overflow-hidden relative">
                      {propertyImages.map((image, index) => (
                        <motion.div
                          key={image}
                          className="absolute inset-0 w-full h-full"
                          initial={{ opacity: 0 }}
                          animate={{
                            opacity: currentImageIndex === index ? 1 : 0,
                            transition: { duration: 1.8 },
                          }}
                        >
                          <Image
                            src={image}
                            alt={`Property ${index + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, 400px"
                            className="object-cover"
                            priority={index === 0}
                            quality={75}
                          />
                        </motion.div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-marketing-muted">
                          Upcoming check-in
                        </p>
                        <p className="font-semibold text-marketing-foreground">
                          30 Jan • 4 nights
                        </p>
                      </div>
                      <div>
                        <p className="text-marketing-muted">Next payout</p>
                        <p className="font-semibold text-green-600">
                          ₦280,000 total • ₦28,000 commission
                        </p>
                      </div>
                    </div>
                    <div
                      className="flex items-center justify-between rounded-xl px-4 py-3"
                      style={{
                        backgroundColor: "var(--marketing-secondary-mist)",
                      }}
                    >
                      <div>
                        <p className="text-xs uppercase tracking-[0.12em] text-marketing-muted">
                          Paystack
                        </p>
                        <p className="text-sm font-semibold text-marketing-foreground">
                          Funds cleared • Just now
                        </p>
                      </div>
                      <svg
                        aria-hidden="true"
                        className="h-5 w-5 text-emerald-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M9 12l2 2 4-4" />
                        <path d="M21 12a9 9 0 1 1-9-9" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 rounded-xl bg-[var(--marketing-secondary)] py-2.5 text-sm font-semibold text-white transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--marketing-secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--marketing-ring-offset)] motion-safe:hover:-translate-y-0.5">
                      View booking
                    </button>
                    <button className="flex-1 rounded-xl border border-marketing-subtle bg-transparent py-2.5 text-sm font-semibold text-marketing-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--marketing-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--marketing-ring-offset)] hover:bg-marketing-surface/80">
                      Email receipt
                    </button>
                  </div>
                </div>
              </motion.div>
              <aside className="absolute -bottom-12 -right-10 hidden lg:block">
                <motion.div
                  className="rounded-3xl border border-white/20 bg-white/15 px-6 py-4 text-white shadow-xl backdrop-blur"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                  whileInView={
                    shouldReduceMotion
                      ? undefined
                      : {
                          opacity: 1,
                          y: 0,
                          transition: {
                            duration: 0.6,
                            delay: 0.2,
                            ease: [0.25, 0.8, 0.25, 1],
                          },
                        }
                  }
                  viewport={{ once: true, margin: "0px 0px -80px" }}
                >
                  <p className="text-xs uppercase tracking-[0.14em] text-white/70">
                    Live updates
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    6 guests saved this
                  </p>
                  <p className="text-xs text-white/60">within the last hour</p>
                </motion.div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
