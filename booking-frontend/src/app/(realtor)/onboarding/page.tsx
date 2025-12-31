"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Home,
  Wallet,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Upload,
  Image as ImageIcon,
  MapPin,
  Tag,
  Wifi,
  Tv,
  Car,
  Dumbbell,
  Wind,
  Coffee,
  ShieldCheck,
  Mail,
  Lock,
  Building,
  Globe,
  Eye,
  EyeOff,
  Phone,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAuthStore } from "@/store/authStore";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { autoLogin } = useAuthStore();
  const { brandColor, secondaryColor, accentColor } = useRealtorBranding();

  const [currentStep, setCurrentStep] = useState(0);
  const [canSkip, setCanSkip] = useState(false); // Can't skip account creation
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // Account creation state
  const [accountData, setAccountData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    phoneNumber: "",
    subdomain: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Property form state
  const [propertyData, setPropertyData] = useState({
    title: "",
    description: "",
    address: "",
    city: "",
    state: "",
    pricePerNight: "",
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    amenities: [] as string[],
    photos: [] as File[],
  });

  // Payout form state
  const [payoutData, setPayoutData] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
  });

  const [photoPreview, setPhotoPreview] = useState<string[]>([]);

  const steps: OnboardingStep[] = [
    {
      id: "account",
      title: "Create Your Account",
      description: "Start your journey as a Stayza host",
      icon: Rocket,
    },
    {
      id: "welcome",
      title: "Welcome to Stayza! 🎉",
      description: "Let's get you set up in just 3 simple steps",
      icon: Sparkles,
    },
    {
      id: "property",
      title: "Add Your First Property",
      description: "List a property to start receiving bookings",
      icon: Home,
    },
    {
      id: "payout",
      title: "Setup Payouts",
      description: "Connect your bank account to receive payments",
      icon: Wallet,
    },
    {
      id: "complete",
      title: "You're All Set! 🚀",
      description: "Your property is live and ready for bookings",
      icon: CheckCircle,
    },
  ];

  const commonAmenities = [
    { id: "wifi", label: "WiFi", icon: Wifi },
    { id: "tv", label: "TV", icon: Tv },
    { id: "parking", label: "Free Parking", icon: Car },
    { id: "gym", label: "Gym", icon: Dumbbell },
    { id: "ac", label: "Air Conditioning", icon: Wind },
    { id: "kitchen", label: "Kitchen", icon: Coffee },
  ];

  useEffect(() => {
    // If user is already logged in, skip account creation
    if (user) {
      const hasCompletedOnboarding = localStorage.getItem(
        `onboarding_completed_${user.id}`
      );
      if (hasCompletedOnboarding === "true") {
        router.push("/dashboard");
      } else {
        // Skip to welcome step if account already exists
        setCurrentStep(1);
        setCanSkip(true);
      }
    }
  }, [user, router]);

  const handleSkip = () => {
    if (
      confirm(
        "Are you sure you want to skip onboarding? You can always add properties and setup payouts later."
      )
    ) {
      localStorage.setItem(`onboarding_completed_${user?.id}`, "true");
      router.push("/dashboard");
    }
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      // Create account
      await createAccount();
    } else if (currentStep === 2) {
      // Validate property form
      if (!propertyData.title || !propertyData.pricePerNight) {
        toast.error("Please fill in required fields");
        return;
      }
      // Submit property (simplified for onboarding)
      await submitProperty();
    } else if (currentStep === 3) {
      // Validate payout form
      if (
        !payoutData.bankName ||
        !payoutData.accountNumber ||
        !payoutData.accountName
      ) {
        toast.error("Please fill in all payout details");
        return;
      }
      // Submit payout info
      await submitPayoutInfo();
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0 && currentStep > 1) {
      // Can't go back from welcome to account creation if logged in
      setCurrentStep(currentStep - 1);
    }
  };

  const createAccount = async () => {
    // Validate form
    if (
      !accountData.email ||
      !accountData.password ||
      !accountData.businessName
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (accountData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (accountData.password !== accountData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!accountData.subdomain) {
      toast.error("Please choose a subdomain");
      return;
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(accountData.subdomain)) {
      toast.error(
        "Subdomain can only contain lowercase letters, numbers, and hyphens"
      );
      return;
    }

    setIsCreatingAccount(true);

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";

      const response = await fetch(`${API_URL}/auth/register/realtor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: accountData.email,
          password: accountData.password,
          businessName: accountData.businessName,
          phoneNumber: accountData.phoneNumber,
          subdomain: accountData.subdomain,
          businessType: "Property Management",
          country: "Nigeria",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Account created successfully!");

        // Auto-login
        if (data.data?.accessToken) {
          localStorage.setItem("accessToken", data.data.accessToken);
          if (data.data.refreshToken) {
            localStorage.setItem("refreshToken", data.data.refreshToken);
          }

          // Auto-login the user
          if (data.data.user) {
            autoLogin(
              {
                accessToken: data.data.accessToken,
                refreshToken: data.data.refreshToken || "",
              },
              data.data.user
            );
          }

          // Move to next step
          setCanSkip(true);
          setCurrentStep(1);
        }
      } else {
        toast.error(data.message || "Failed to create account");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Failed to create account. Please try again.");
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const submitProperty = async () => {
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";
      const token = localStorage.getItem("accessToken");

      // Upload photos first
      const photoUrls: string[] = [];
      for (const photo of propertyData.photos) {
        const formData = new FormData();
        formData.append("file", photo);

        const uploadRes = await fetch(`${API_URL}/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          photoUrls.push(uploadData.data.url);
        }
      }

      // Create property
      const response = await fetch(`${API_URL}/properties`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: propertyData.title,
          description: propertyData.description || "Beautiful property",
          address: propertyData.address || "TBD",
          city: propertyData.city || "Lagos",
          state: propertyData.state || "Lagos",
          country: "Nigeria",
          pricePerNight: parseFloat(propertyData.pricePerNight),
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          maxGuests: propertyData.maxGuests,
          amenities: propertyData.amenities,
          photos: photoUrls.length > 0 ? photoUrls : undefined,
          status: "AVAILABLE",
        }),
      });

      if (response.ok) {
        toast.success("Property added successfully!");
      } else {
        throw new Error("Failed to add property");
      }
    } catch (error) {
      console.error("Error adding property:", error);
      toast.error(
        "Failed to add property. You can add it later from the dashboard."
      );
    }
  };

  const submitPayoutInfo = async () => {
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`${API_URL}/realtors/payout-settings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bankName: payoutData.bankName,
          accountNumber: payoutData.accountNumber,
          accountName: payoutData.accountName,
        }),
      });

      if (response.ok) {
        toast.success("Payout information saved!");
      } else {
        throw new Error("Failed to save payout info");
      }
    } catch (error) {
      console.error("Error saving payout info:", error);
      toast.error(
        "Failed to save payout info. You can update it later in settings."
      );
    }
  };

  const completeOnboarding = () => {
    setIsCompleting(true);
    localStorage.setItem(`onboarding_completed_${user?.id}`, "true");
    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + propertyData.photos.length > 10) {
      toast.error("Maximum 10 photos allowed");
      return;
    }

    setPropertyData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...files],
    }));

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPropertyData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
    setPhotoPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleAmenity = (amenityId: string) => {
    setPropertyData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter((a) => a !== amenityId)
        : [...prev.amenities, amenityId],
    }));
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Skip button */}
      {canSkip && currentStep < steps.length - 1 && (
        <button
          onClick={handleSkip}
          className="fixed top-4 right-4 z-50 flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 bg-white rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          <X className="h-4 w-4" />
          <span className="text-sm font-medium">Skip for now</span>
        </button>
      )}

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-40">
        <motion.div
          className="h-full"
          style={{ backgroundColor: brandColor }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Main content */}
      <div className="max-w-4xl w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl p-8 md:p-12"
          >
            {/* Step indicator */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-2">
                {steps.map((step, index) => (
                  <React.Fragment key={step.id}>
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                        index <= currentStep
                          ? "text-white"
                          : "bg-gray-200 text-gray-400"
                      }`}
                      style={
                        index <= currentStep
                          ? { backgroundColor: brandColor }
                          : undefined
                      }
                    >
                      {index < currentStep ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-semibold">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-12 h-0.5 transition-all ${
                          index < currentStep ? "" : "bg-gray-200"
                        }`}
                        style={
                          index < currentStep
                            ? { backgroundColor: brandColor }
                            : undefined
                        }
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Step content */}
            {currentStep === 0 && (
              <AccountCreationStep
                accountData={accountData}
                setAccountData={setAccountData}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                showConfirmPassword={showConfirmPassword}
                setShowConfirmPassword={setShowConfirmPassword}
                brandColor={brandColor}
              />
            )}

            {currentStep === 1 && (
              <WelcomeStep brandColor={brandColor} accentColor={accentColor} />
            )}

            {currentStep === 2 && (
              <PropertyStep
                propertyData={propertyData}
                setPropertyData={setPropertyData}
                photoPreview={photoPreview}
                handlePhotoUpload={handlePhotoUpload}
                removePhoto={removePhoto}
                commonAmenities={commonAmenities}
                toggleAmenity={toggleAmenity}
                brandColor={brandColor}
              />
            )}

            {currentStep === 3 && (
              <PayoutStep
                payoutData={payoutData}
                setPayoutData={setPayoutData}
                brandColor={brandColor}
              />
            )}

            {currentStep === 4 && (
              <CompleteStep
                brandColor={brandColor}
                isCompleting={isCompleting}
              />
            )}

            {/* Navigation buttons */}
            {currentStep < steps.length - 1 && (
              <div className="flex items-center justify-between mt-8">
                {currentStep === 0 ? (
                  <Link
                    href="/realtor/login"
                    className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span>Back to Login</span>
                  </Link>
                ) : (
                  <button
                    onClick={handleBack}
                    disabled={currentStep === 1 && user}
                    className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span>Back</span>
                  </button>
                )}

                <button
                  onClick={handleNext}
                  disabled={isCreatingAccount}
                  className="flex items-center space-x-2 px-8 py-3 text-white rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: brandColor }}
                >
                  {isCreatingAccount ? (
                    <>
                      <span className="font-semibold">Creating Account...</span>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">
                        {currentStep === 0 ? "Create Account" : "Continue"}
                      </span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            )}

            {currentStep === steps.length - 1 && !isCompleting && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={completeOnboarding}
                  className="px-8 py-3 text-white rounded-lg shadow-lg hover:shadow-xl transition-all text-lg font-semibold"
                  style={{ backgroundColor: brandColor }}
                >
                  Go to Dashboard
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Account Creation Step Component
function AccountCreationStep({
  accountData,
  setAccountData,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  brandColor,
}: {
  accountData: any;
  setAccountData: any;
  showPassword: boolean;
  setShowPassword: any;
  showConfirmPassword: boolean;
  setShowConfirmPassword: any;
  brandColor: string;
}) {
  const formatSubdomain = (value: string) => {
    return value.toLowerCase().replace(/[^a-z0-9-]/g, "");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
          style={{ backgroundColor: `${brandColor}20` }}
        >
          <Rocket className="h-8 w-8" style={{ color: brandColor }} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Create Your Host Account
        </h2>
        <p className="text-gray-600">
          Start your journey as a Stayza property host
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={accountData.businessName}
              onChange={(e) =>
                setAccountData({ ...accountData, businessName: e.target.value })
              }
              placeholder="Your Property Management Company"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 outline-none transition-all"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              value={accountData.email}
              onChange={(e) =>
                setAccountData({ ...accountData, email: e.target.value })
              }
              placeholder="your@email.com"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 outline-none transition-all"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="tel"
              value={accountData.phoneNumber}
              onChange={(e) =>
                setAccountData({ ...accountData, phoneNumber: e.target.value })
              }
              placeholder="+234 800 000 0000"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 outline-none transition-all"
            />
          </div>
        </div>

        {/* Subdomain */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose Your Subdomain <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={accountData.subdomain}
                onChange={(e) =>
                  setAccountData({
                    ...accountData,
                    subdomain: formatSubdomain(e.target.value),
                  })
                }
                placeholder="yourcompany"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 outline-none transition-all"
              />
            </div>
            <span className="text-gray-500 font-medium">.stayza.pro</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Lowercase letters, numbers, and hyphens only
          </p>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={accountData.password}
              onChange={(e) =>
                setAccountData({ ...accountData, password: e.target.value })
              }
              placeholder="Create a strong password"
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">At least 8 characters</p>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={accountData.confirmPassword}
              onChange={(e) =>
                setAccountData({
                  ...accountData,
                  confirmPassword: e.target.value,
                })
              }
              placeholder="Confirm your password"
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          By creating an account, you agree to our{" "}
          <Link
            href="/terms"
            className="font-medium hover:underline"
            style={{ color: brandColor }}
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="font-medium hover:underline"
            style={{ color: brandColor }}
          >
            Privacy Policy
          </Link>
        </p>
      </div>

      {/* Already have account */}
      <div className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link
          href="/realtor/login"
          className="font-medium hover:underline"
          style={{ color: brandColor }}
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

// Welcome Step Component
function WelcomeStep({
  brandColor,
  accentColor,
}: {
  brandColor: string;
  accentColor: string;
}) {
  const benefits = [
    {
      icon: TrendingUp,
      title: "Grow Your Business",
      description: "Reach more guests with your custom branded website",
    },
    {
      icon: Users,
      title: "Manage Bookings",
      description: "Track reservations and communicate with guests easily",
    },
    {
      icon: DollarSign,
      title: "Get Paid Fast",
      description: "Secure escrow payments released within 24-48 hours",
    },
    {
      icon: Calendar,
      title: "Smart Calendar",
      description: "Prevent double bookings with automatic availability sync",
    },
  ];

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
        style={{ backgroundColor: `${accentColor}20` }}
      >
        <Sparkles className="h-10 w-10" style={{ color: accentColor }} />
      </motion.div>

      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Welcome to Stayza Pro! 🎉
      </h1>
      <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
        You're just a few steps away from receiving your first booking. Let's
        set up your account together!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="p-6 bg-gray-50 rounded-xl text-left"
            >
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4"
                style={{ backgroundColor: `${brandColor}20` }}
              >
                <Icon className="h-6 w-6" style={{ color: brandColor }} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {benefit.title}
              </h3>
              <p className="text-gray-600">{benefit.description}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>⏱️ Takes only 5 minutes!</strong> You can skip and complete
          this later, but we recommend finishing now to start receiving bookings
          faster.
        </p>
      </div>
    </div>
  );
}

// Property Step Component
function PropertyStep({
  propertyData,
  setPropertyData,
  photoPreview,
  handlePhotoUpload,
  removePhoto,
  commonAmenities,
  toggleAmenity,
  brandColor,
}: any) {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
        Add Your First Property
      </h2>
      <p className="text-gray-600 mb-8 text-center">
        Don't worry about perfection - you can edit everything later
      </p>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={propertyData.title}
            onChange={(e) =>
              setPropertyData({ ...propertyData, title: e.target.value })
            }
            placeholder="e.g., Luxury 2BR Apartment in Lekki"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price per Night (₦) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={propertyData.pricePerNight}
            onChange={(e) =>
              setPropertyData({
                ...propertyData,
                pricePerNight: e.target.value,
              })
            }
            placeholder="50000"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
          />
        </div>

        {/* Bedrooms & Bathrooms */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bedrooms
            </label>
            <input
              type="number"
              min="1"
              value={propertyData.bedrooms}
              onChange={(e) =>
                setPropertyData({
                  ...propertyData,
                  bedrooms: parseInt(e.target.value) || 1,
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bathrooms
            </label>
            <input
              type="number"
              min="1"
              value={propertyData.bathrooms}
              onChange={(e) =>
                setPropertyData({
                  ...propertyData,
                  bathrooms: parseInt(e.target.value) || 1,
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Guests
            </label>
            <input
              type="number"
              min="1"
              value={propertyData.maxGuests}
              onChange={(e) =>
                setPropertyData({
                  ...propertyData,
                  maxGuests: parseInt(e.target.value) || 1,
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Amenities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amenities (Select all that apply)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {commonAmenities.map((amenity: any) => {
              const Icon = amenity.icon;
              const isSelected = propertyData.amenities.includes(amenity.id);
              return (
                <button
                  key={amenity.id}
                  type="button"
                  onClick={() => toggleAmenity(amenity.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-current text-white"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                  style={
                    isSelected ? { backgroundColor: brandColor } : undefined
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{amenity.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photos (Optional - up to 10)
          </label>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            {photoPreview.map((preview: string, index: number) => (
              <div key={index} className="relative group">
                <Image
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  width={200}
                  height={200}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {propertyData.photos.length < 10 && (
              <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                <Upload className="h-6 w-6 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Payout Step Component
function PayoutStep({ payoutData, setPayoutData, brandColor }: any) {
  const nigerianBanks = [
    "Access Bank",
    "GTBank",
    "First Bank",
    "UBA",
    "Zenith Bank",
    "Stanbic IBTC",
    "Sterling Bank",
    "Fidelity Bank",
    "Union Bank",
    "Wema Bank",
    "Polaris Bank",
    "Ecobank",
    "FCMB",
    "Keystone Bank",
    "Heritage Bank",
  ];

  return (
    <div>
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
          style={{ backgroundColor: `${brandColor}20` }}
        >
          <ShieldCheck className="h-8 w-8" style={{ color: brandColor }} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Setup Your Payouts
        </h2>
        <p className="text-gray-600">
          Connect your bank account to receive payments securely
        </p>
      </div>

      <div className="space-y-6 max-w-xl mx-auto">
        {/* Bank Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bank Name <span className="text-red-500">*</span>
          </label>
          <select
            value={payoutData.bankName}
            onChange={(e) =>
              setPayoutData({ ...payoutData, bankName: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
          >
            <option value="">Select your bank</option>
            {nigerianBanks.map((bank) => (
              <option key={bank} value={bank}>
                {bank}
              </option>
            ))}
          </select>
        </div>

        {/* Account Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={payoutData.accountNumber}
            onChange={(e) =>
              setPayoutData({ ...payoutData, accountNumber: e.target.value })
            }
            placeholder="0123456789"
            maxLength={10}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
          />
        </div>

        {/* Account Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={payoutData.accountName}
            onChange={(e) =>
              setPayoutData({ ...payoutData, accountName: e.target.value })
            }
            placeholder="John Doe"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
          />
        </div>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Your money is safe</p>
              <p>
                We use Paystack for secure payment processing. Funds are
                released 24-48 hours after guest check-in.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Complete Step Component
function CompleteStep({
  brandColor,
  isCompleting,
}: {
  brandColor: string;
  isCompleting: boolean;
}) {
  return (
    <div className="text-center py-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6"
        style={{ backgroundColor: `${brandColor}20` }}
      >
        <CheckCircle className="h-12 w-12" style={{ color: brandColor }} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-4xl font-bold text-gray-900 mb-4"
      >
        You're All Set! 🎉
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto"
      >
        Congratulations! Your property is now live and ready to receive
        bookings. Let's explore your dashboard and start growing your business.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8"
      >
        {[
          {
            icon: Home,
            title: "Property Listed",
            description: "Your property is live",
          },
          {
            icon: Wallet,
            title: "Payouts Ready",
            description: "Bank account connected",
          },
          {
            icon: Rocket,
            title: "Ready to Earn",
            description: "Start receiving bookings",
          },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="p-6 bg-gray-50 rounded-xl">
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-3"
                style={{ backgroundColor: `${brandColor}20` }}
              >
                <Icon className="h-6 w-6" style={{ color: brandColor }} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          );
        })}
      </motion.div>

      {isCompleting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center"
        >
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2 mb-3"
            style={{ borderColor: brandColor }}
          />
          <p className="text-gray-600">Taking you to your dashboard...</p>
        </motion.div>
      )}
    </div>
  );
}
