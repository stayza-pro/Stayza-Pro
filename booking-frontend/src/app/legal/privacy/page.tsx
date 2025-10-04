"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { SectionTitle } from "@/app/(marketing)/components/SectionTitle";
import { Navigation } from "@/app/(marketing)/sections/Navigation";
import { FooterSection } from "@/app/(marketing)/sections/FooterSection";
import {
  Shield,
  Lock,
  Eye,
  FileText,
  Users,
  Database,
  Settings,
} from "lucide-react";

export default function PrivacyPage() {
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

  const privacyPrinciples = [
    {
      icon: Lock,
      title: "Data Minimization",
      description:
        "We only collect information necessary to provide our booking platform services and improve your experience.",
    },
    {
      icon: Shield,
      title: "Secure Processing",
      description:
        "All personal data is encrypted in transit and at rest using industry-standard security protocols.",
    },
    {
      icon: Users,
      title: "Transparent Use",
      description:
        "We clearly communicate how we use your data and never sell or share it with third parties for marketing.",
    },
    {
      icon: Eye,
      title: "Your Control",
      description:
        "Access, update, or delete your personal information at any time through your account settings.",
    },
    {
      icon: Database,
      title: "Data Retention",
      description:
        "We retain your data only as long as necessary to provide services and comply with legal obligations.",
    },
    {
      icon: Settings,
      title: "Privacy by Design",
      description:
        "Privacy considerations are built into every feature and process from the ground up.",
    },
  ];

  const dataTypes = [
    {
      category: "Account Information",
      items: [
        "Name and contact details",
        "Professional credentials",
        "Agency information",
        "Profile preferences",
      ],
    },
    {
      category: "Booking Data",
      items: [
        "Property viewing schedules",
        "Client interaction logs",
        "Booking preferences",
        "Communication history",
      ],
    },
    {
      category: "Usage Analytics",
      items: [
        "Platform navigation patterns",
        "Feature usage statistics",
        "Performance metrics",
        "Error reports",
      ],
    },
    {
      category: "Payment Information",
      items: [
        "Billing address",
        "Payment method details",
        "Transaction history",
        "Commission records",
      ],
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
              <Shield className="w-4 h-4 mr-2" />
              Legal & Privacy
            </motion.div>

            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight text-white mb-6"
              variants={itemVariants}
            >
              Privacy <span className="text-marketing-accent">Policy</span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-white/80 leading-relaxed mb-12 max-w-3xl mx-auto"
              variants={itemVariants}
            >
              Transparency matters. Here's how Stayza handles and protects your
              personal information with industry-leading security standards.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center"
              variants={itemVariants}
            >
              <CTAButton
                variant="solid"
                href="mailto:privacy@stayza.com"
                label="Contact Privacy Team"
              />
              <CTAButton
                variant="ghost"
                href="/legal/security"
                label="Security Overview"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Privacy Principles Section */}
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
                  title="Our Privacy Principles"
                  description="Built on trust, transparency, and your control"
                />
              </motion.div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {privacyPrinciples.map((principle, index) => {
                const Icon = principle.icon;
                return (
                  <motion.div
                    key={principle.title}
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
                      {principle.title}
                    </h3>
                    <p className="text-marketing-text-muted leading-relaxed">
                      {principle.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Data Collection Section */}
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
                  title="Information We Collect"
                  description="Only what's necessary to provide excellent service"
                />
              </motion.div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {dataTypes.map((type, index) => (
                <motion.div
                  key={type.category}
                  className="marketing-card p-8"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={itemVariants}
                  transition={{ delay: index * 0.1 }}
                >
                  <h3 className="text-xl font-semibold text-marketing-text mb-6">
                    {type.category}
                  </h3>
                  <ul className="space-y-3">
                    {type.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center text-marketing-text-muted"
                      >
                        <div className="w-2 h-2 bg-marketing-primary rounded-full mr-3 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Your Rights Section */}
        <section className="py-32">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              className="marketing-card p-12 text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={itemVariants}
            >
              <div className="w-20 h-20 bg-marketing-secondary rounded-2xl flex items-center justify-center mx-auto mb-8">
                <FileText className="w-10 h-10 text-white" />
              </div>

              <h3 className="text-3xl font-bold text-marketing-text mb-6">
                Your Privacy Rights
              </h3>

              <p className="text-xl text-marketing-text-muted mb-8 max-w-2xl mx-auto">
                You have complete control over your personal information.
                Exercise your rights easily through your account or by
                contacting us directly.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-8">
                <div className="bg-marketing-primary/5 rounded-2xl p-6">
                  <h4 className="font-semibold text-marketing-text mb-3">
                    Access & Portability
                  </h4>
                  <ul className="space-y-2 text-marketing-text-muted text-sm">
                    <li>• Download all your personal data</li>
                    <li>• View what information we have</li>
                    <li>• Request data in machine-readable format</li>
                  </ul>
                </div>
                <div className="bg-marketing-secondary/5 rounded-2xl p-6">
                  <h4 className="font-semibold text-marketing-text mb-3">
                    Control & Deletion
                  </h4>
                  <ul className="space-y-2 text-marketing-text-muted text-sm">
                    <li>• Update information anytime</li>
                    <li>• Delete your account completely</li>
                    <li>• Opt out of non-essential communications</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <CTAButton
                  variant="solid"
                  href="mailto:privacy@stayza.com"
                  label="Exercise Your Rights"
                />
                <CTAButton
                  variant="outline"
                  href="/legal/terms"
                  label="View Terms of Service"
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
