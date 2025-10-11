"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Mail,
  Globe,
  Settings,
  Users,
  TrendingUp,
  ExternalLink,
  Copy,
  Star,
  ArrowRight,
  Sparkles,
  Crown,
  Zap,
} from "lucide-react";
import Link from "next/link";

interface CompletionCelebrationProps {
  realtorData: {
    fullName: string;
    businessEmail: string;
    agencyName: string;
    subdomain: string;
    plan: string;
    logo?: string;
    primaryColor?: string;
  };
  onComplete: () => void;
}

export function CompletionCelebration({
  realtorData,
  onComplete,
}: CompletionCelebrationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const websiteUrl = `https://${realtorData.subdomain}.stayza.pro`;
  const dashboardUrl = `/dashboard/realtor`;

  const celebrationSteps = [
    {
      id: "celebration",
      title: "Welcome to Stayza!",
      description: "Your realtor account has been created successfully",
      duration: 3000,
    },
    {
      id: "verification",
      title: "Check Your Email",
      description: "We've sent a verification link to your email address",
      duration: 4000,
    },
    {
      id: "next-steps",
      title: "Get Started",
      description: "Here's what you can do next to maximize your success",
      duration: 0, // Manual progression
    },
  ];

  // Auto-progress through celebration steps
  useEffect(() => {
    if (currentStep < celebrationSteps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, celebrationSteps[currentStep].duration);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Send onboarding email
  useEffect(() => {
    const sendOnboardingEmail = async () => {
      try {
        // Mock API call - in real app would send actual email
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setEmailSent(true);
      } catch (error) {
        console.error("Failed to send onboarding email:", error);
      }
    };

    sendOnboardingEmail();
  }, []);

  const copyWebsiteUrl = async () => {
    try {
      await navigator.clipboard.writeText(websiteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  const nextSteps = [
    {
      title: "Verify Your Email",
      description:
        "Click the verification link in your email to activate your account",
      icon: <Mail className="w-6 h-6" />,
      status: emailSent ? "completed" : "pending",
      action: "Check Email",
      urgent: true,
    },
    {
      title: "Complete Your Profile",
      description: "Add more details about your services and experience",
      icon: <Settings className="w-6 h-6" />,
      status: "todo",
      action: "Edit Profile",
      link: `${dashboardUrl}/profile`,
    },
    {
      title: "Add Your First Property",
      description: "List your first property to start attracting guests",
      icon: <TrendingUp className="w-6 h-6" />,
      status: "todo",
      action: "Add Property",
      link: `${dashboardUrl}/properties/new`,
    },
    {
      title: "Customize Your Website",
      description: "Personalize your booking site with photos and content",
      icon: <Globe className="w-6 h-6" />,
      status: "todo",
      action: "Visit Site",
      link: websiteUrl,
      external: true,
    },
    {
      title: "Invite Team Members",
      description: "Add staff members to help manage bookings and guests",
      icon: <Users className="w-6 h-6" />,
      status: "optional",
      action: "Manage Team",
      link: `${dashboardUrl}/team`,
    },
  ];

  const planFeatures = {
    free: {
      name: "Free Plan",
      color: "text-gray-600",
      features: ["Up to 3 properties", "Basic analytics", "Email support"],
    },
    professional: {
      name: "Professional Plan",
      color: "text-blue-600",
      features: [
        "Unlimited properties",
        "Advanced analytics",
        "Priority support",
        "Custom domain",
      ],
    },
    premium: {
      name: "Premium Plan",
      color: "text-purple-600",
      features: [
        "Everything in Pro",
        "White-label solution",
        "24/7 phone support",
        "API access",
      ],
    },
  };

  const currentPlan =
    planFeatures[realtorData.plan as keyof typeof planFeatures] ||
    planFeatures.free;

  const renderCelebrationStep = () => {
    switch (celebrationSteps[currentStep]?.id) {
      case "celebration":
        return (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="text-center"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className="mx-auto mb-6 w-24 h-24 bg-green-100 rounded-full flex items-center justify-center"
            >
              <CheckCircle className="w-12 h-12 text-green-600" />
            </motion.div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Stayza, {realtorData.fullName.split(" ")[0]}! 🎉
            </h1>

            <p className="text-xl text-gray-600 mb-8">
              Your realtor account for{" "}
              <span className="font-semibold text-gray-900">
                {realtorData.agencyName}
              </span>{" "}
              is ready!
            </p>

            {/* Confetti Animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: Math.random() * window.innerWidth,
                    y: -20,
                    rotate: 0,
                    scale: 0,
                  }}
                  animate={{
                    y: window.innerHeight + 20,
                    rotate: 360,
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    ease: "easeOut",
                    delay: Math.random() * 0.5,
                  }}
                  className={`absolute w-4 h-4 rounded ${
                    [
                      "bg-yellow-400",
                      "bg-pink-400",
                      "bg-blue-400",
                      "bg-green-400",
                      "bg-purple-400",
                    ][i % 5]
                  }`}
                />
              ))}
            </div>
          </motion.div>
        );

      case "verification":
        return (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
              className="mx-auto mb-6 w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center"
            >
              <Mail className="w-12 h-12 text-blue-600" />
            </motion.div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Check Your Email
            </h2>

            <p className="text-lg text-gray-600 mb-6">
              We've sent a verification link to
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="font-semibold text-gray-900">
                {realtorData.businessEmail}
              </p>
            </div>

            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              {emailSent ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">
                    Email sent successfully
                  </span>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
                  />
                  <span>Sending verification email...</span>
                </>
              )}
            </div>
          </motion.div>
        );

      case "next-steps":
        return (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                You're All Set! 🚀
              </h2>

              <p className="text-lg text-gray-600">
                Here's everything you need to know to get started and maximize
                your success
              </p>
            </div>

            {/* Plan Badge */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-8 text-center">
              <div className="flex items-center justify-center mb-2">
                {realtorData.plan === "premium" && (
                  <Crown className="w-5 h-5 text-purple-600 mr-2" />
                )}
                {realtorData.plan === "professional" && (
                  <Zap className="w-5 h-5 text-blue-600 mr-2" />
                )}
                <span className={`font-semibold ${currentPlan.color}`}>
                  {currentPlan.name} Active
                </span>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {currentPlan.features.map((feature, index) => (
                  <span
                    key={index}
                    className="text-xs bg-white rounded-full px-3 py-1 text-gray-600"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            {/* Website URL */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">
                Your Booking Website
              </h3>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-white rounded-md p-3 border">
                  <code className="text-sm text-blue-600">{websiteUrl}</code>
                </div>
                <button
                  onClick={copyWebsiteUrl}
                  className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Next Steps List */}
            <div className="space-y-4 mb-8">
              <h3 className="text-xl font-semibold text-gray-900">
                Next Steps
              </h3>

              {nextSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    p-4 rounded-lg border-2 transition-all duration-200
                    ${
                      step.urgent
                        ? "border-orange-200 bg-orange-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }
                    ${
                      step.status === "completed"
                        ? "border-green-200 bg-green-50"
                        : ""
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`
                        p-2 rounded-lg
                        ${
                          step.urgent
                            ? "bg-orange-100 text-orange-600"
                            : step.status === "completed"
                            ? "bg-green-100 text-green-600"
                            : step.status === "optional"
                            ? "bg-gray-100 text-gray-500"
                            : "bg-blue-100 text-blue-600"
                        }
                      `}
                      >
                        {step.status === "completed" ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          step.icon
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-900">
                            {step.title}
                          </h4>
                          {step.urgent && (
                            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                              Required
                            </span>
                          )}
                          {step.status === "optional" && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                              Optional
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {step.status !== "completed" &&
                      (step.link ? (
                        <Link
                          href={step.link}
                          target={step.external ? "_blank" : "_self"}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
                        >
                          <span>{step.action}</span>
                          {step.external ? (
                            <ExternalLink className="w-4 h-4" />
                          ) : (
                            <ArrowRight className="w-4 h-4" />
                          )}
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="px-4 py-2 bg-gray-200 text-gray-500 rounded-md text-sm cursor-not-allowed"
                        >
                          {step.action}
                        </button>
                      ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={dashboardUrl}
                className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-semibold text-center flex items-center justify-center space-x-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              <button
                onClick={onComplete}
                className="px-8 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-semibold"
              >
                Close
              </button>
            </div>

            {/* Help Text */}
            <div className="text-center mt-6 text-sm text-gray-500">
              Need help getting started?{" "}
              <Link
                href="/help/getting-started"
                className="text-blue-600 hover:underline"
              >
                View our Getting Started Guide
              </Link>{" "}
              or{" "}
              <Link href="/contact" className="text-blue-600 hover:underline">
                contact support
              </Link>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 relative"
        >
          {renderCelebrationStep()}

          {/* Progress Indicator */}
          {currentStep < celebrationSteps.length - 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-2">
                {celebrationSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index <= currentStep ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CompletionCelebration;
