"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { SectionTitle } from "@/app/(marketing)/components/SectionTitle";
import { Navigation } from "@/app/(marketing)/sections/Navigation";
import { FooterSection } from "@/app/(marketing)/sections/FooterSection";
import {
  Shield,
  Lock,
  Server,
  CreditCard,
  Key,
  Eye,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export default function SecurityPage() {
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

  const securityFeatures = [
    {
      icon: Server,
      title: "SOC 2 Compliant Infrastructure",
      description:
        "Hosted on enterprise-grade infrastructure with automated backups, redundancy, and 24/7 monitoring",
    },
    {
      icon: CreditCard,
      title: "PCI DSS Payment Security",
      description:
        "All payments processed through Paystack - we never store sensitive payment data",
    },
    {
      icon: Key,
      title: "Advanced Access Controls",
      description:
        "Role-based permissions with mandatory 2FA for administrative and financial operations",
    },
    {
      icon: Eye,
      title: "Complete Audit Trails",
      description:
        "Immutable logs of all transactions, user actions, and system events for compliance",
    },
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description:
        "Data encrypted in transit and at rest using industry-standard AES-256 encryption",
    },
    {
      icon: AlertTriangle,
      title: "Threat Detection",
      description:
        "Continuous vulnerability scanning with automated threat detection and response",
    },
  ];

  const certifications = [
    {
      title: "SOC 2 Type II",
      description:
        "Annual third-party audits validate our security controls and processes",
    },
    {
      title: "GDPR Compliant",
      description: "Full compliance with European data protection regulations",
    },
    {
      title: "PCI DSS Level 1",
      description:
        "Highest level of payment security certification through our partners",
    },
    {
      title: "ISO 27001 Aligned",
      description:
        "Security management practices aligned with international standards",
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
              Enterprise Security
            </motion.div>

            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight text-white mb-6"
              variants={itemVariants}
            >
              Security <span className="text-marketing-accent">Overview</span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-white/80 leading-relaxed mb-12 max-w-3xl mx-auto"
              variants={itemVariants}
            >
              Built with enterprise-grade security from the ground up. Your
              data, your clients, and your business are protected by
              industry-leading safeguards.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center"
              variants={itemVariants}
            >
              <CTAButton
                variant="solid"
                href="mailto:security@stayza.com"
                label="Request Security Pack"
              />
              <CTAButton
                variant="ghost"
                href="/legal/privacy"
                label="Privacy Policy"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Security Features Section */}
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
                  title="Enterprise Security Features"
                  description="Comprehensive protection for your business and client data"
                />
              </motion.div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {securityFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
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
                      {feature.title}
                    </h3>
                    <p className="text-marketing-text-muted leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Certifications Section */}
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
                  title="Certifications & Compliance"
                  description="Verified by third-party auditors and industry standards"
                />
              </motion.div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {certifications.map((cert, index) => (
                <motion.div
                  key={cert.title}
                  className="marketing-card p-8"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={itemVariants}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-marketing-secondary rounded-xl flex items-center justify-center mr-6 flex-shrink-0">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-marketing-text mb-3">
                        {cert.title}
                      </h3>
                      <p className="text-marketing-text-muted leading-relaxed">
                        {cert.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Contact Section */}
        <section className="py-32">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              className="marketing-card p-12 text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={itemVariants}
            >
              <div className="w-20 h-20 bg-marketing-accent rounded-2xl flex items-center justify-center mx-auto mb-8">
                <Shield className="w-10 h-10 text-white" />
              </div>

              <h3 className="text-3xl font-bold text-marketing-text mb-6">
                Need Security Documentation?
              </h3>

              <p className="text-xl text-marketing-text-muted mb-8 max-w-2xl mx-auto">
                We provide comprehensive security documentation including
                penetration test reports, SOC 2 reports, and compliance
                questionnaires.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-8">
                <div className="bg-marketing-primary/5 rounded-2xl p-6">
                  <h4 className="font-semibold text-marketing-text mb-3">
                    Available Documentation
                  </h4>
                  <ul className="space-y-2 text-marketing-text-muted text-sm">
                    <li>• SOC 2 Type II Reports</li>
                    <li>• Penetration Test Results</li>
                    <li>• Security Architecture Overview</li>
                    <li>• Incident Response Procedures</li>
                  </ul>
                </div>
                <div className="bg-marketing-secondary/5 rounded-2xl p-6">
                  <h4 className="font-semibold text-marketing-text mb-3">
                    Response Time
                  </h4>
                  <ul className="space-y-2 text-marketing-text-muted text-sm">
                    <li>• Security inquiries: 24 hours</li>
                    <li>• Documentation requests: 48 hours</li>
                    <li>• Incident reports: Immediate</li>
                    <li>• Compliance reviews: 1 week</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <CTAButton
                  variant="solid"
                  href="mailto:security@stayza.com"
                  label="Contact Security Team"
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
