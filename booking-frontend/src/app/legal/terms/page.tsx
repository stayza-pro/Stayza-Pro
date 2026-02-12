"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { SectionTitle } from "@/app/(marketing)/components/SectionTitle";
import { Navigation } from "@/app/(marketing)/sections/Navigation";
import { FooterSection } from "@/app/(marketing)/sections/FooterSection";
import {
  Scale,
  FileText,
  Users,
  Shield,
  HeartHandshake,
  AlertCircle,
} from "lucide-react";

export default function TermsPage() {
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

  const terms = [
    {
      icon: FileText,
      title: "Service Scope",
      description:
        "Branded booking platform (yourbusiness.stayza.pro) with escrow payments, CAC verification, and unlimited property listings",
    },
    {
      icon: Users,
      title: "Account Responsibility",
      description:
        "Realtors maintain accurate property information and comply with Nigerian laws while managing their booking site",
    },
    {
      icon: Shield,
      title: "Data Protection",
      description:
        "Your property and guest data remains secure with encryption and full audit trail for all transactions",
    },
    {
      icon: HeartHandshake,
      title: "Commission Structure",
      description:
        "Commission, guest service fees, and payout estimates are calculated per booking using the active finance configuration and shown before payment.",
    },
  ];

  const platformFeatures = [
    {
      title: "Paystack Escrow Integration",
      description:
        "Payments are held in escrow and released using each booking's stored financial snapshot, with full transparency for guest and realtor.",
    },
    {
      title: "CAC Verification System",
      description:
        "Submit Corporate Affairs Commission certificate for admin review. Get verified trust badges on your booking site.",
    },
    {
      title: "Branded Subdomains",
      description:
        "Your booking site at yourbusiness.stayza.pro with your logo, brand colors, and full control. No marketplace interference.",
    },
    {
      title: "Complete Audit Trail",
      description:
        "Every booking, payment, dispute, and admin action logged permanently for compliance and financial reconciliation.",
    },
  ];

  return (
    <div className="min-h-screen marketing-theme">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col bg-marketing-primary">
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
              <Scale className="w-4 h-4 mr-2" />
              Legal Agreement
            </motion.div>

            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight text-white mb-6"
              variants={itemVariants}
            >
              Terms of <span className="text-marketing-accent">Service</span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-white/80 leading-relaxed mb-12 max-w-3xl mx-auto"
              variants={itemVariants}
            >
              Clear, fair terms for realtors using Stayza Pro. Commission-based
              platform with escrow payments and transparent pricing.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Core Terms Section */}
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
                  title="Core Agreement Principles"
                  description="The foundation of our partnership with your agency"
                />
              </motion.div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {terms.map((term, index) => {
                const Icon = term.icon;
                return (
                  <motion.div
                    key={term.title}
                    className="marketing-card p-8 hover:shadow-xl transition-all duration-300"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={itemVariants}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="w-12 h-12 bg-marketing-primary rounded-xl flex items-center justify-center mb-6">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-marketing-text mb-4">
                      {term.title}
                    </h3>
                    <p className="text-marketing-text-muted leading-relaxed">
                      {term.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Enterprise Terms Section */}
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
                  title="Platform Features & Services"
                  description="Core capabilities included in Stayza Pro"
                />
              </motion.div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {platformFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="marketing-card p-8"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={itemVariants}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-marketing-secondary rounded-xl flex items-center justify-center mr-6 flex-shrink-0">
                      <HeartHandshake className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-marketing-text mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-marketing-text-muted leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Important Notice Section */}
        <section className="py-32">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              className="marketing-card p-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={itemVariants}
            >
              <div className="flex items-start mb-8">
                <div className="w-16 h-16 bg-marketing-accent rounded-2xl flex items-center justify-center mr-6 flex-shrink-0">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-marketing-text mb-3">
                    Important Updates
                  </h3>
                  <p className="text-marketing-text-muted">
                    Our terms are regularly updated to reflect new features and
                    regulatory changes. We'll notify you of material changes 10
                    days in advance.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-6 bg-marketing-primary/5 rounded-2xl">
                  <div className="text-2xl font-bold text-marketing-primary mb-2">
                    10
                  </div>
                  <div className="text-sm text-marketing-text-muted">
                    Days advance notice
                  </div>
                </div>
                <div className="text-center p-6 bg-marketing-secondary/5 rounded-2xl">
                  <div className="text-2xl font-bold text-marketing-secondary mb-2">
                    24/7
                  </div>
                  <div className="text-sm text-marketing-text-muted">
                    Legal support access
                  </div>
                </div>
                <div className="text-center p-6 bg-marketing-accent/5 rounded-2xl">
                  <div className="text-2xl font-bold text-marketing-accent mb-2">
                    100%
                  </div>
                  <div className="text-sm text-marketing-text-muted">
                    Compliance guarantee
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
