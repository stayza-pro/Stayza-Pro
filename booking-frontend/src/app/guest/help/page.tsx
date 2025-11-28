"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  HelpCircle,
  ExternalLink,
  MessageCircle,
  Book,
  FileText,
  Shield,
  CreditCard,
  Users,
  Mail,
  Phone,
  AlertCircle,
} from "lucide-react";
import { Card, Button } from "@/components/ui";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { Footer } from "@/components/guest/sections/Footer";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";

export default function HelpPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const {
    brandColor: primaryColor, // Lighter touch - primary for CTAs
    secondaryColor, // Lighter touch - secondary for accents
    accentColor, // Lighter touch - accent for highlights
    realtorName,
    logoUrl,
    tagline,
    description,
  } = useRealtorBranding();

  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState("");

  const helpCategories = [
    {
      icon: Book,
      title: "Getting Started",
      description: "Learn how to book your first property",
      topics: [
        "How to search for properties",
        "Understanding property listings",
        "Creating an account",
        "Managing your profile",
      ],
    },
    {
      icon: CreditCard,
      title: "Payments & Billing",
      description: "Payment methods and billing information",
      topics: [
        "Accepted payment methods",
        "Understanding pricing",
        "Refund policy",
        "Payment security",
      ],
    },
    {
      icon: FileText,
      title: "Bookings",
      description: "Managing your reservations",
      topics: [
        "How to book a property",
        "Modifying bookings",
        "Cancellation policy",
        "Check-in/Check-out process",
      ],
    },
    {
      icon: Shield,
      title: "Safety & Security",
      description: "Your safety is our priority",
      topics: [
        "Guest safety guidelines",
        "Property verification",
        "Secure payments",
        "Privacy policy",
      ],
    },
    {
      icon: Users,
      title: "Account Management",
      description: "Manage your account settings",
      topics: [
        "Update profile information",
        "Change password",
        "Notification preferences",
        "Account deletion",
      ],
    },
    {
      icon: MessageCircle,
      title: "Communication",
      description: "Connect with hosts and support",
      topics: [
        "Messaging hosts",
        "Contact support",
        "Language preferences",
        "Response time expectations",
      ],
    },
  ];

  const handleExternalRedirect = (url: string) => {
    setRedirectUrl(url);
    setShowRedirectModal(true);
  };

  const confirmRedirect = () => {
    if (redirectUrl) {
      window.open(redirectUrl, "_blank", "noopener,noreferrer");
      setShowRedirectModal(false);
      setRedirectUrl("");
    }
  };

  const cancelRedirect = () => {
    setShowRedirectModal(false);
    setRedirectUrl("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <GuestHeader
        currentPage="help"
        searchPlaceholder="Search help topics..."
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header Section */}
        <div className="mb-16 text-center">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-lg mb-8"
            style={{ backgroundColor: `${accentColor}15` }}
          >
            <HelpCircle className="h-8 w-8" style={{ color: accentColor }} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How can we help you?
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions or contact our support team
          </p>
        </div>

        {/* Quick Contact */}
        <Card className="p-8 mb-12 border-2 border-gray-200">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Need immediate assistance?
            </h2>
            <p className="text-gray-600 mb-6">
              Our support team is here to help you with any questions or
              concerns
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push("/guest/messages")}
                className="flex items-center justify-center"
                style={{ backgroundColor: primaryColor }} // Lighter touch - primary for CTA
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Message Support
              </Button>
              <Button
                onClick={() =>
                  handleExternalRedirect("https://stayzapro.com/contact")
                }
                variant="outline"
                className="flex items-center justify-center"
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                Visit Stayza Pro Support
              </Button>
            </div>
          </div>
        </Card>

        {/* Help Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Browse by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <Card
                  key={index}
                  className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={() =>
                    handleExternalRedirect(
                      `https://stayzapro.com/help/${category.title
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`
                    )
                  }
                >
                  <div
                    className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4"
                    style={{ backgroundColor: `${accentColor}15` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: accentColor }} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:opacity-80 transition-opacity">
                    {category.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {category.description}
                  </p>
                  <ul className="space-y-2">
                    {category.topics.map((topic, topicIndex) => (
                      <li
                        key={topicIndex}
                        className="text-sm text-gray-500 flex items-start"
                      >
                        <span
                          className="mr-2 mt-1.5 w-1 h-1 rounded-full flex-shrink-0"
                          style={{ backgroundColor: accentColor }}
                        />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Additional Resources */}
        <Card className="p-8 bg-white">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Additional Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() =>
                handleExternalRedirect("https://stayzapro.com/faq")
              }
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors text-left group"
            >
              <FileText
                className="h-8 w-8 mb-3"
                style={{ color: accentColor }}
              />
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:opacity-80">
                Frequently Asked Questions
              </h3>
              <p className="text-sm text-gray-600">
                Quick answers to common questions
              </p>
            </button>

            <button
              onClick={() =>
                handleExternalRedirect("https://stayzapro.com/terms")
              }
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors text-left group"
            >
              <Shield className="h-8 w-8 mb-3" style={{ color: accentColor }} />
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:opacity-80">
                Terms & Policies
              </h3>
              <p className="text-sm text-gray-600">
                Terms of service and privacy policy
              </p>
            </button>
          </div>
        </Card>

        {/* Powered by Stayza Pro */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Powered by Stayza Pro - Professional Property Management
          </p>
        </div>
      </main>

      {/* Redirect Confirmation Modal */}
      {showRedirectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-8 animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                style={{ backgroundColor: `${accentColor}15` }}
              >
                <AlertCircle
                  className="h-8 w-8"
                  style={{ color: accentColor }}
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Leaving {realtorName}
              </h3>
              <p className="text-gray-600">
                You're about to visit the Stayza Pro main website for additional
                support and resources.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 mb-2">
                <strong>You'll be redirected to:</strong>
              </p>
              <p className="text-sm text-gray-600 break-all">{redirectUrl}</p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={cancelRedirect}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmRedirect}
                className="flex-1"
                style={{ backgroundColor: primaryColor }} // Lighter touch - primary for CTA
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Continue
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Footer
        realtorName={realtorName}
        tagline={tagline}
        logo={logoUrl}
        description={description}
        primaryColor={primaryColor}
      />
    </div>
  );
}
