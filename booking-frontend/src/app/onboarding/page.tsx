"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { BusinessInfoStep } from "@/components/onboarding/BusinessInfoStep";
import { BrandingStep } from "@/components/onboarding/BrandingStep";
import { StripeOnboardingStep } from "@/components/onboarding/StripeOnboardingStep";
import { CompletionStep } from "@/components/onboarding/CompletionStep";
import { Card } from "@/components/ui";

export interface OnboardingData {
  // Business Info
  businessName: string;
  businessType: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessCountry: string;
  businessDescription: string;

  // Branding
  primaryColor: string;
  customDomain: string;
  customMessage: string;
  logo?: File;

  // Stripe
  stripeAccountId?: string;
}

const STEPS = [
  {
    id: 1,
    title: "Business Information",
    description: "Tell us about your business",
  },
  { id: 2, title: "Branding", description: "Customize your booking site" },
  { id: 3, title: "Payment Setup", description: "Connect your Stripe account" },
  { id: 4, title: "Complete", description: "You're all set!" },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    businessName: "",
    businessType: "",
    businessPhone: "",
    businessEmail: "",
    businessAddress: "",
    businessCity: "",
    businessState: "",
    businessCountry: "",
    businessDescription: "",
    primaryColor: "#3b82f6",
    customDomain: "",
    customMessage: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();
  const router = useRouter();

  // Redirect if user is not authenticated or not a realtor
  if (!user || user.role !== "REALTOR") {
    router.push("/dashboard");
    return null;
  }

  const updateData = (stepData: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...stepData }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Here we would submit the onboarding data to the backend
      // For now, redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Onboarding failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BusinessInfoStep
            data={data}
            onUpdate={updateData}
            onNext={nextStep}
            isSubmitting={isSubmitting}
          />
        );
      case 2:
        return (
          <BrandingStep
            data={data}
            onUpdate={updateData}
            onNext={nextStep}
            onBack={prevStep}
            isSubmitting={isSubmitting}
          />
        );
      case 3:
        return (
          <StripeOnboardingStep
            data={data}
            onUpdate={updateData}
            onNext={nextStep}
            onBack={prevStep}
            isSubmitting={isSubmitting}
          />
        );
      case 4:
        return (
          <CompletionStep
            data={data}
            onFinish={handleComplete}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to Stayz Pro!
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Let&apos;s set up your branded booking site in just a few steps
          </p>
        </div>

        <OnboardingProgress steps={STEPS} currentStep={currentStep} />

        <Card className="mt-8 p-8">{renderStep()}</Card>
      </div>
    </div>
  );
}
