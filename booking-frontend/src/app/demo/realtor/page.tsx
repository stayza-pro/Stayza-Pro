"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { SectionTitle } from "@/app/(marketing)/components/SectionTitle";
import { Navigation } from "@/app/(marketing)/sections/Navigation";
import { FooterSection } from "@/app/(marketing)/sections/FooterSection";
import {
  Play,
  Monitor,
  Smartphone,
  Users,
  Calendar,
  DollarSign,
  BarChart,
  Settings,
} from "lucide-react";

export default function RealtorDemoPage() {
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

  const demoFeatures = [
    {
      icon: Monitor,
      title: "Branded Booking Interface",
      description:
        "See how realtors can customize their booking pages with personal branding",
    },
    {
      icon: Calendar,
      title: "Property Scheduling",
      description:
        "Experience the seamless property viewing appointment system",
    },
    {
      icon: DollarSign,
      title: "Revenue Controls",
      description:
        "Explore pricing management and commission tracking features",
    },
    {
      icon: BarChart,
      title: "Analytics Dashboard",
      description:
        "View comprehensive performance metrics and booking insights",
    },
    {
      icon: Smartphone,
      title: "Mobile Experience",
      description: "Test the fully responsive mobile booking experience",
    },
    {
      icon: Users,
      title: "Client Management",
      description:
        "See how realtors manage client relationships and preferences",
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
              <Play className="w-4 h-4 mr-2" />
              Interactive Experience
            </motion.div>

            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight text-white mb-6"
              variants={itemVariants}
            >
              Experience <span className="text-marketing-accent">Stayza</span>{" "}
              <br className="hidden md:block" />
              In Action
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-white/80 leading-relaxed mb-12 max-w-3xl mx-auto"
              variants={itemVariants}
            >
              Take a hands-on tour of our platform. See how realtors transform
              their business with branded booking experiences and automated
              workflows.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center"
              variants={itemVariants}
            >
              <CTAButton
                variant="solid"
                href="#demo"
                label="Start Interactive Demo"
              />
              <CTAButton
                variant="ghost"
                href="/contact"
                label="Schedule Live Demo"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Demo Features Section */}
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
                  title="What You'll Experience"
                  description="Explore every feature that powers modern real estate"
                />
              </motion.div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {demoFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    className="marketing-card p-8 text-center hover:shadow-xl transition-all duration-300"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={itemVariants}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="w-16 h-16 bg-marketing-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Icon className="w-8 h-8 text-white" />
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

        {/* Interactive Demo Section */}
        <section id="demo" className="py-32">
          <div className="container mx-auto px-6 max-w-7xl">
            <motion.div
              className="text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
            >
              <motion.div variants={itemVariants}>
                <SectionTitle
                  title="Interactive Demo"
                  description="Click through a real realtor's booking experience"
                />
              </motion.div>
            </motion.div>

            <motion.div
              className="marketing-card p-12 text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={itemVariants}
            >
              <div className="w-32 h-32 bg-marketing-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <Play className="w-16 h-16 text-marketing-primary" />
              </div>

              <h3 className="text-3xl font-bold text-marketing-text mb-6">
                Coming Soon: Interactive Demo
              </h3>

              <p className="text-xl text-marketing-text-muted mb-8 max-w-2xl mx-auto">
                We're building an immersive demo experience where you can
                explore every feature, from client booking to revenue tracking.
                Get notified when it launches.
              </p>

              <div className="bg-marketing-primary/5 rounded-2xl p-8 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  <div>
                    <h4 className="font-semibold text-marketing-text mb-3">
                      What's Included:
                    </h4>
                    <ul className="space-y-2 text-marketing-text-muted">
                      <li>• Sample property listings</li>
                      <li>• Booking flow walkthrough</li>
                      <li>• Dashboard analytics tour</li>
                      <li>• Mobile responsiveness test</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-marketing-text mb-3">
                      Demo Duration:
                    </h4>
                    <ul className="space-y-2 text-marketing-text-muted">
                      <li>• Self-guided: 10-15 minutes</li>
                      <li>• Live demo: 30 minutes</li>
                      <li>• Q&A included</li>
                      <li>• No registration required</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <CTAButton
                  variant="solid"
                  href="/contact"
                  label="Schedule Live Demo"
                />
                <CTAButton
                  variant="outline"
                  href="/why-stayza"
                  label="Learn More Features"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              className="marketing-card p-12 text-center bg-gradient-to-br from-marketing-primary to-marketing-secondary text-white"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={itemVariants}
            >
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <Settings className="w-10 h-10 text-white" />
              </div>

              <h3 className="text-3xl font-bold mb-6">
                Ready to Transform Your Real Estate Business?
              </h3>

              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of realtors who've already revolutionized their
                client experience with Stayza's booking platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <CTAButton
                  variant="ghost"
                  href="/register"
                  className="bg-white text-marketing-primary hover:bg-white/90"
                  label="Start Free Trial"
                />
                <CTAButton
                  variant="outline"
                  href="/contact"
                  className="border-white text-white hover:bg-white hover:text-marketing-primary"
                  label="Talk to Sales"
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
