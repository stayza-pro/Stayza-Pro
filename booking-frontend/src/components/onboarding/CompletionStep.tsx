import React from "react";
import { Button } from "@/components/ui";
import {
  CheckCircle,
  ExternalLink,
  Settings,
  BarChart3,
  Building,
} from "lucide-react";
import { OnboardingData } from "@/app/onboarding/page";
import Link from "next/link";

interface CompletionStepProps {
  data: OnboardingData;
  onFinish: () => void;
  isSubmitting: boolean;
}

export const CompletionStep: React.FC<CompletionStepProps> = ({
  data,
  onFinish,
  isSubmitting,
}) => {
  const bookingSiteUrl = data.customDomain
    ? `https://${data.customDomain}.stayza.pro`
    : `https://${data.businessName
        .toLowerCase()
        .replace(/\s+/g, "-")}.stayza.pro`;

  const nextSteps = [
    {
      icon: Building,
      title: "Add Your Properties",
      description:
        "Start by adding your first property with photos, descriptions, and pricing",
      action: "Add Property",
      link: "/dashboard/properties/new",
    },
    {
      icon: Settings,
      title: "Configure Settings",
      description:
        "Set up booking rules, cancellation policies, and notification preferences",
      action: "Manage Settings",
      link: "/dashboard/settings",
    },
    {
      icon: BarChart3,
      title: "View Analytics",
      description:
        "Track your bookings, revenue, and customer metrics in your dashboard",
      action: "View Dashboard",
      link: "/dashboard/analytics",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          🎉 Congratulations!
        </h2>
        <p className="text-xl text-gray-600">
          Your booking site is ready to go!
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Your Booking Site Summary
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">
                Business Name
              </span>
              <span className="text-sm text-gray-900">{data.businessName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">
                Business Type
              </span>
              <span className="text-sm text-gray-900 capitalize">
                {data.businessType.replace(/_/g, " ")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">
                Location
              </span>
              <span className="text-sm text-gray-900">
                {data.businessCity}, {data.businessCountry}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">
                Booking Site
              </span>
              <a
                href={bookingSiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Visit Site <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">
                Primary Color
              </span>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: data.primaryColor }}
                />
                <span className="text-sm text-gray-900">
                  {data.primaryColor}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">
                Payments
              </span>
              <span className="text-sm text-green-600">✓ Stripe Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Site Preview */}
      <div className="bg-gray-50 border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Your Booking Site Preview
          </h3>
          <a
            href={bookingSiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Open in New Tab <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
          {/* Mock browser bar */}
          <div className="bg-gray-100 px-4 py-2 border-b flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
            <div className="bg-white rounded px-3 py-1 text-xs text-gray-600 flex-1 max-w-md">
              {bookingSiteUrl}
            </div>
          </div>

          {/* Site preview */}
          <div
            className="px-6 py-4 text-white"
            style={{ backgroundColor: data.primaryColor }}
          >
            <h4 className="font-semibold text-lg">{data.businessName}</h4>
          </div>
          <div className="p-6">
            <h5 className="text-lg font-semibold text-gray-900 mb-2">
              Book Your Perfect Stay
            </h5>
            <p className="text-gray-600 text-sm mb-4">
              {data.customMessage ||
                "Welcome to our booking platform! Find and book your perfect property."}
            </p>
            <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-lg">
              <Building className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Your properties will appear here once you add them
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Next Steps to Launch Your Business
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {nextSteps.map((step, index) => (
            <div
              key={index}
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    {step.title}
                  </h4>
                  <p className="text-xs text-gray-600 mb-3">
                    {step.description}
                  </p>
                  <Link
                    href={step.link}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {step.action} →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
        <Link href="/realtor">
          <Button variant="outline" className="px-8">
            Go to Dashboard
          </Button>
        </Link>
        <Button onClick={onFinish} loading={isSubmitting} className="px-8">
          Complete Setup
        </Button>
      </div>

      {/* Help section */}
      <div className="text-center py-6 border-t">
        <p className="text-sm text-gray-600 mb-2">Need help getting started?</p>
        <div className="flex justify-center gap-4 text-sm">
          <a href="/guest/help" className="text-blue-600 hover:text-blue-700">
            View Help Center
          </a>
          <span className="text-gray-300">•</span>
          <a href="/contact" className="text-blue-600 hover:text-blue-700">
            Contact Support
          </a>
          <span className="text-gray-300">•</span>
          <a href="/docs" className="text-blue-600 hover:text-blue-700">
            API Documentation
          </a>
        </div>
      </div>
    </div>
  );
};
