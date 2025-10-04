"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CTAButton } from "@/app/(marketing)/components/CTAButton";
import { SectionTitle } from "@/app/(marketing)/components/SectionTitle";
import { Navigation } from "@/app/(marketing)/sections/Navigation";
import { FooterSection } from "@/app/(marketing)/sections/FooterSection";
import {
  MessageCircle,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Clock,
} from "lucide-react";

export default function ContactPage() {
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

  const contactChannels = [
    {
      icon: Mail,
      title: "General Inquiries",
      description: "Have questions about Stayza or need general information?",
      contact: "hello@stayza.com",
      action: "Send Email",
    },
    {
      icon: Phone,
      title: "Support",
      description: "Need help with your account or technical assistance?",
      contact: "support@stayza.com",
      action: "Get Support",
    },
    {
      icon: Calendar,
      title: "Sales & Partnerships",
      description: "Interested in partnerships or enterprise solutions?",
      contact: "sales@stayza.com",
      action: "Schedule Call",
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
              <MessageCircle className="w-4 h-4 mr-2" />
              Let's Connect
            </motion.div>

            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight text-white mb-6"
              variants={itemVariants}
            >
              Contact <span className="text-marketing-accent">Stayza</span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-white/80 leading-relaxed mb-12 max-w-3xl mx-auto"
              variants={itemVariants}
            >
              We're here to help. Reach out to our team for questions, support,
              or to learn more about how Stayza can transform your business.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center"
              variants={itemVariants}
            >
              <CTAButton
                variant="solid"
                href="/register"
                label="Get Started Today"
              />
              <CTAButton variant="ghost" href="/demo" label="Schedule Demo" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Contact Information Section */}
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
                  title="Get In Touch"
                  description="Multiple ways to reach our team"
                />
              </motion.div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              {/* Contact Methods */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={containerVariants}
                className="space-y-8"
              >
                {contactChannels.map((channel, index) => {
                  const Icon = channel.icon;
                  return (
                    <motion.div
                      key={channel.title}
                      className="marketing-card p-8 hover:shadow-xl transition-all duration-300"
                      variants={itemVariants}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-start">
                        <div className="w-12 h-12 bg-marketing-primary rounded-xl flex items-center justify-center mr-6 flex-shrink-0">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-marketing-text mb-3">
                            {channel.title}
                          </h3>
                          <p className="text-marketing-text-muted mb-4 leading-relaxed">
                            {channel.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-marketing-primary font-medium">
                              {channel.contact}
                            </p>
                            <CTAButton
                              variant="outline"
                              label={channel.action}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Contact Form */}
              <motion.div
                className="marketing-card p-12"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={itemVariants}
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-marketing-text mb-3">
                    Send us a message
                  </h3>
                  <p className="text-marketing-text-muted">
                    Fill out the form below and we'll get back to you within 24
                    hours
                  </p>
                </div>

                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-marketing-text mb-3">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-6 py-4 marketing-input"
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-marketing-text mb-3">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-6 py-4 marketing-input"
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-marketing-text mb-3">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full px-6 py-4 marketing-input"
                      placeholder="Enter your email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-marketing-text mb-3">
                      Subject *
                    </label>
                    <select
                      className="w-full px-6 py-4 marketing-input"
                      required
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="sales">Sales Question</option>
                      <option value="partnership">
                        Partnership Opportunity
                      </option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-marketing-text mb-3">
                      Message *
                    </label>
                    <textarea
                      rows={5}
                      required
                      className="w-full px-6 py-4 marketing-input resize-vertical"
                      placeholder="Tell us how we can help you..."
                    />
                  </div>
                  <CTAButton
                    variant="solid"
                    className="w-full"
                    label="Send Message"
                  />
                </form>
              </motion.div>
            </div>

            {/* Additional Contact Info */}
            <motion.div
              className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
            >
              <motion.div
                className="marketing-card p-8 text-center"
                variants={itemVariants}
              >
                <div className="w-16 h-16 bg-marketing-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-marketing-text mb-3">
                  Business Hours
                </h4>
                <div className="space-y-2 text-marketing-text-muted">
                  <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                  <p>Saturday: 10:00 AM - 4:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
              </motion.div>

              <motion.div
                className="marketing-card p-8 text-center"
                variants={itemVariants}
              >
                <div className="w-16 h-16 bg-marketing-accent rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-marketing-text mb-3">
                  Global Presence
                </h4>
                <div className="space-y-2 text-marketing-text-muted">
                  <p>Headquarters: San Francisco, CA</p>
                  <p>Available in 50+ countries</p>
                  <p>24/7 support worldwide</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
