"use client";

import React from "react";
import Link from "next/link";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/guest/sections/Footer";
import {
  Search,
  Calendar,
  CreditCard,
  Key,
  Star,
  Shield,
  HeadphonesIcon,
  CheckCircle,
} from "lucide-react";

export default function HowItWorksPage() {
  const { brandColor: primaryColor, realtorName } = useRealtorBranding();

  const guestSteps = [
    {
      icon: Search,
      title: "Browse Properties",
      description:
        "Explore our curated selection of premium short-let properties. Use filters to find your perfect match.",
    },
    {
      icon: Calendar,
      title: "Select Your Dates",
      description:
        "Check availability and choose your check-in and check-out dates. See instant pricing with no hidden fees.",
    },
    {
      icon: CreditCard,
      title: "Secure Booking",
      description:
        "Complete your booking with our secure payment system. Get instant confirmation via email.",
    },
    {
      icon: Key,
      title: "Check In & Enjoy",
      description:
        "Receive check-in details and enjoy your stay. Contact your host anytime through our messaging system.",
    },
  ];

  const realtorSteps = [
    {
      icon: Key,
      title: "Create Your Account",
      description:
        "Sign up and complete your business verification. Add your properties with detailed descriptions and photos.",
    },
    {
      icon: Calendar,
      title: "Manage Bookings",
      description:
        "Receive booking requests and manage your calendar. Set your own pricing and availability.",
    },
    {
      icon: CreditCard,
      title: "Get Paid",
      description:
        "Receive secure payments directly to your account. Track your revenue with detailed analytics.",
    },
    {
      icon: Star,
      title: "Build Your Brand",
      description:
        "Get reviews from guests and build your reputation. Customize your branded booking site.",
    },
  ];

  const features = [
    {
      icon: Shield,
      title: "Secure & Safe",
      description:
        "All payments are secured with industry-standard encryption. Your data is protected.",
    },
    {
      icon: HeadphonesIcon,
      title: "24/7 Support",
      description:
        "Our support team is always available to help with any questions or concerns.",
    },
    {
      icon: CheckCircle,
      title: "Verified Properties",
      description:
        "All properties and hosts are verified to ensure quality and authenticity.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How {realtorName} Works
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover how easy it is to book your perfect stay or list your
            property on our platform
          </p>
        </div>
      </div>

      {/* For Guests Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">For Guests</h2>
          <p className="text-lg text-gray-600">
            Book your perfect stay in 4 simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {guestSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 h-full hover:shadow-md transition-shadow">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: primaryColor }} />
                  </div>
                  <div
                    className="absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Link
            href="/browse"
            className="inline-flex items-center px-8 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            Start Browsing Properties
          </Link>
        </div>
      </div>

      {/* For Realtors Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              For Property Owners
            </h2>
            <p className="text-lg text-gray-600">
              Start earning with your property in 4 easy steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {realtorSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  <div className="bg-gray-50 rounded-2xl p-6 shadow-sm border border-gray-200 h-full hover:shadow-md transition-shadow">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <Icon
                        className="h-6 w-6"
                        style={{ color: primaryColor }}
                      />
                    </div>
                    <div
                      className="absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {index + 1}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Link
              href="/realtor/register"
              className="inline-flex items-center px-8 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              Become a Host
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Why Choose Us?
          </h2>
          <p className="text-lg text-gray-600">
            We provide the best experience for both guests and hosts
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 text-center hover:shadow-md transition-shadow"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <Icon className="h-8 w-8" style={{ color: primaryColor }} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of guests and hosts who trust our platform for their
            short-let needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/browse"
              className="inline-flex items-center justify-center px-8 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              Browse Properties
            </Link>
            <Link
              href="/realtor/register"
              className="inline-flex items-center justify-center px-8 py-3 rounded-xl font-semibold border-2 hover:bg-gray-50 transition-colors"
              style={{
                borderColor: primaryColor,
                color: primaryColor,
              }}
            >
              List Your Property
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
