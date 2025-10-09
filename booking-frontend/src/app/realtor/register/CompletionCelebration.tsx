"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Mail,
  Settings,
  TrendingUp,
  Globe,
  Users,
  Copy,
  ExternalLink,
  Sparkles,
  Gift,
  Star,
  ArrowRight,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

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
      duration: 0, // Stay until user continues
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
        // Simulate sending onboarding email
        await new Promise((resolve) => setTimeout(resolve, 1500));
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
      toast.success("Website URL copied to clipboard!");
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast.error("Failed to copy URL");
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
              initial={{
                x: "50%",
                y: "50%",
                scale: 0,
                opacity: 1,
              }}
              animate={{
                x: `${50 + (Math.random() - 0.5) * 100}%`,
                y: `${50 + (Math.random() - 0.5) * 100}%`,
                scale: [0, 1, 0],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 3,
                delay: Math.random() * 2,
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        <div className="overflow-y-auto max-h-[90vh]">
          <AnimatePresence mode="wait">
            {/* Step 1: Celebration */}
            {currentStep === 0 && (
              <motion.div
                key="celebration"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center p-8"
              >
                {/* Success Animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2,
                  }}
                  className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="w-12 h-12 text-white" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    🎉 Welcome to Stayza!
                  </h1>
                  <p className="text-lg text-gray-600 mb-6">
                    Congratulations, {realtorData.fullName.split(" ")[0]}! Your
                    realtor account has been created successfully.
                  </p>

                  {/* Account Details */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 text-left">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Account Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Agency:</span>
                        <span className="font-medium">
                          {realtorData.agencyName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Plan:</span>
                        <span className="font-medium capitalize">
                          {realtorData.plan}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Website:</span>
                        <span className="font-medium text-blue-600">
                          {realtorData.subdomain}.stayza.pro
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Step 2: Email Verification */}
            {currentStep === 1 && (
              <motion.div
                key="verification"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center p-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                  }}
                  className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center"
                >
                  <Mail className="w-12 h-12 text-white" />
                </motion.div>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Check Your Email
                </h2>
                <p className="text-gray-600 mb-6">
                  We've sent a verification link to{" "}
                  <span className="font-medium text-blue-600">
                    {realtorData.businessEmail}
                  </span>
                </p>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-yellow-800">
                        Important: Verify your email to activate your account
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Click the verification link in the email to complete
                        your registration and access all features.
                      </p>
                    </div>
                  </div>
                </div>

                {emailSent && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center space-x-2 text-green-600"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      Verification email sent successfully!
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 3: Next Steps */}
            {currentStep === 2 && (
              <motion.div
                key="next-steps"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-8"
              >
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                    }}
                    className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center"
                  >
                    <Sparkles className="w-10 h-10 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    You're All Set!
                  </h2>
                  <p className="text-gray-600">
                    Here's what you can do next to get the most out of Stayza
                  </p>
                </div>

                {/* Website URL Copy */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Your Booking Website
                      </p>
                      <p className="text-blue-600 font-mono text-sm">
                        {websiteUrl}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={copyWebsiteUrl}
                        className="flex items-center space-x-1 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {copied ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600" />
                        )}
                        <span className="text-sm">
                          {copied ? "Copied!" : "Copy"}
                        </span>
                      </button>
                      <a
                        href={websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-sm">Visit</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Next Steps List */}
                <div className="space-y-4 mb-8">
                  {nextSteps.map((step, index) => (
                    <motion.div
                      key={step.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition-all ${
                        step.urgent
                          ? "border-yellow-200 bg-yellow-50"
                          : step.status === "completed"
                          ? "border-green-200 bg-green-50"
                          : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div
                        className={`p-3 rounded-lg ${
                          step.urgent
                            ? "bg-yellow-100 text-yellow-600"
                            : step.status === "completed"
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {step.icon}
                      </div>

                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {step.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {step.description}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {step.status === "completed" && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        {step.status === "optional" && (
                          <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full">
                            Optional
                          </span>
                        )}
                        {step.urgent && (
                          <span className="text-xs px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full">
                            Urgent
                          </span>
                        )}
                        {step.link && (
                          <a
                            href={step.link}
                            target={step.external ? "_blank" : "_self"}
                            rel={step.external ? "noopener noreferrer" : ""}
                            className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              step.urgent
                                ? "bg-yellow-600 text-white hover:bg-yellow-700"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                          >
                            <span>{step.action}</span>
                            {step.external && (
                              <ExternalLink className="w-3 h-3" />
                            )}
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Continue Button */}
                <div className="flex justify-center">
                  <button
                    onClick={onComplete}
                    className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                  >
                    <span>Continue to Dashboard</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default CompletionCelebration;
