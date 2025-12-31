"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
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
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import { palette } from "@/app/(marketing)/content";

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

  // Use Stayza Pro marketing palette values with CSS var fallbacks for easier theming tweaks
  const brandColor = "var(--marketing-primary, #1E3A8A)";
  const secondaryColor = "var(--marketing-accent, #047857)";
  const accentColor = "var(--marketing-accent, #F97316)";
  const surfaceColor = "var(--marketing-surface, " + palette.neutralLight + ")";
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";

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
  const [passwordStrength, setPasswordStrength] = useState({
    label: "",
    score: 0,
    percent: 0,
    color: "#94A3B8",
  });
  const [subdomainStatus, setSubdomainStatus] = useState<{
    state: "idle" | "checking" | "available" | "unavailable" | "error";
    message: string;
  }>({ state: "idle", message: "" });
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);

  const evaluatePasswordStrength = useCallback((password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const percent = Math.min(100, (score / 5) * 100);

    if (score <= 1) return { label: "Weak", score, percent, color: "#EF4444" };
    if (score <= 3) return { label: "Fair", score, percent, color: "#F59E0B" };
    if (score === 4)
      return { label: "Strong", score, percent, color: "#047857" }; // Actual hex value
    return { label: "Excellent", score, percent, color: "#1E3A8A" }; // Actual hex value
  }, []);

  const checkSubdomainAvailability = useCallback(
    async (value: string) => {
      if (!value) {
        setSubdomainStatus({ state: "idle", message: "" });
        return;
      }

      setIsCheckingSubdomain(true);
      setSubdomainStatus({
        state: "checking",
        message: "Checking availability...",
      });

      try {
        const response = await fetch(
          `${API_URL}/realtors/check-subdomain?subdomain=${value}`
        );

        if (response.ok) {
          const data = await response.json();
          const available =
            data?.data?.available ?? data?.available ?? data?.isAvailable;

          setSubdomainStatus({
            state: available ? "available" : "unavailable",
            message: available ? "Subdomain is available" : "Already taken",
          });
        } else {
          setSubdomainStatus({
            state: "error",
            message: "Unable to verify right now",
          });
        }
      } catch (error) {
        console.error("Subdomain check failed", error);
        setSubdomainStatus({
          state: "error",
          message: "Check your connection and try again",
        });
      } finally {
        setIsCheckingSubdomain(false);
      }
    },
    [API_URL]
  );

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
    setPasswordStrength(evaluatePasswordStrength(accountData.password));
  }, [accountData.password, evaluatePasswordStrength]);

  useEffect(() => {
    if (!accountData.subdomain) {
      setSubdomainStatus({ state: "idle", message: "" });
      return;
    }

    const handler = setTimeout(() => {
      checkSubdomainAvailability(accountData.subdomain);
    }, 500);

    return () => clearTimeout(handler);
  }, [accountData.subdomain, checkSubdomainAvailability]);

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
      !accountData.businessName ||
      !accountData.phoneNumber
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

    if (subdomainStatus.state === "unavailable") {
      toast.error("Subdomain is already taken");
      return;
    }

    if (subdomainStatus.state === "checking") {
      toast.error("Please wait while we verify your subdomain");
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
      const response = await fetch(`${API_URL}/realtors/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: accountData.businessName, // Using businessName as fullName for now
          businessEmail: accountData.email,
          password: accountData.password,
          phoneNumber: accountData.phoneNumber,
          agencyName: accountData.businessName,
          customSubdomain: accountData.subdomain,
          tagline: `${accountData.businessName} - Property Management`,
          businessAddress: "Nigeria", // Default for MVP
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
    <div className="relative min-h-screen overflow-hidden marketing-theme">
      <div className="absolute inset-0 opacity-25">
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 rounded-full"
          animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--marketing-primary, #1E3A8A) 35%, #ffffff)",
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-80 h-80 rounded-full"
          animate={{ x: [0, -40, 0], y: [0, 40, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--marketing-accent, #F97316) 25%, #ffffff)",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full"
          animate={{
            x: [-30, 30, -30],
            y: [-20, 20, -20],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--marketing-primary, #1E3A8A) 18%, #38BDF8 20%)",
          }}
        />
      </div>

      {canSkip && currentStep < steps.length - 1 && (
        <button
          onClick={handleSkip}
          className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-full border border-marketing-subtle bg-white/70 px-4 py-2 text-sm font-medium text-marketing-muted shadow-sm backdrop-blur transition hover:text-marketing-foreground"
        >
          <X className="h-4 w-4" />
          <span>Skip for now</span>
        </button>
      )}

      <div className="fixed top-0 left-0 right-0 z-40 h-1 bg-marketing-subtle">
        <motion.div
          className="h-full"
          style={{ backgroundColor: brandColor }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.35 }}
        />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen">
        <motion.div
          className="relative lg:w-5/12 p-8 lg:p-12 flex flex-col justify-between overflow-hidden"
          style={{ background: "var(--marketing-primary)" }}
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
        >
          <div className="absolute inset-0 opacity-30">
            <motion.div
              className="absolute top-0 right-0 w-72 h-72 rounded-full"
              animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--marketing-primary, #1E3A8A) 30%, #FFFFFF)",
              }}
            />
            <motion.div
              className="absolute bottom-10 left-0 w-64 h-64 rounded-full"
              animate={{ x: [0, -30, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--marketing-accent, #F97316) 22%, #FFFFFF)",
              }}
            />
          </div>

          <div className="relative z-10">
            <Link
              href="/realtor/login"
              className="inline-flex items-center space-x-2 text-white/80 hover:text-white transition-colors group mb-8"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Login</span>
            </Link>

            <div className="max-w-xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 mb-6">
                  <Sparkles className="w-4 h-4 text-orange-300" />
                  <span className="text-sm text-white font-medium">
                    Stayza Pro Onboarding
                  </span>
                </div>

                <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  Launch Your
                  <br />
                  <span className="text-blue-100">Branded Hosting Hub</span>
                </h1>

                <p className="text-lg text-white/85 font-normal leading-relaxed">
                  Guided setup that mirrors the Realtor portal aesthetic—keep
                  guests impressed from day one.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="grid grid-cols-2 gap-4"
              >
                <StatPill
                  label="Avg. time to launch"
                  value="12 min"
                  color="#F59E0B"
                />
                <StatPill
                  label="Realtors live today"
                  value="340+"
                  color="#22C55E"
                />
                <StatPill
                  label="Guest trust boost"
                  value="+38%"
                  color="#38BDF8"
                />
                <StatPill
                  label="Retention uplift"
                  value="+21%"
                  color="#C084FC"
                />
              </motion.div>
            </div>
          </div>

          <div className="relative z-10 mt-10 text-white/70 text-sm space-y-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Verification-ready flows</span>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>Subdomain setup baked in</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="lg:w-7/12 flex items-stretch justify-center p-6 lg:p-12"
          style={{
            background:
              "linear-gradient(to bottom right, var(--marketing-surface), var(--marketing-background))",
          }}
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
        >
          <div className="w-full max-w-5xl">
            <div className="mb-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-marketing-muted">
                Stayza Pro Onboarding
              </p>
              <h1 className="mt-3 text-3xl font-bold text-marketing-foreground md:text-4xl">
                Launch your branded short-let business in minutes
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-base text-marketing-muted md:text-lg">
                Polished flows that match the Realtor login experience—account
                creation, property setup, and payouts in one guided lane.
              </p>
            </div>

            <div className="grid gap-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="marketing-card-elevated rounded-[28px] p-6 md:p-10"
                >
                  <div className="mb-8 flex flex-col gap-4 text-marketing-foreground md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.5em] text-marketing-subtle">
                        Step {currentStep + 1} of {steps.length}
                      </p>
                      <h2 className="mt-2 text-2xl font-bold">
                        {steps[currentStep]?.title}
                      </h2>
                      <p className="mt-1 text-sm text-marketing-muted">
                        {steps[currentStep]?.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-marketing-subtle px-4 py-2 text-sm font-medium text-marketing-muted">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: brandColor }}
                      />
                      Guided Mode Active
                    </div>
                  </div>

                  <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
                    {steps.map((step, index) => {
                      const Icon = step.icon;
                      const isActive = index === currentStep;
                      const isCompleted = index < currentStep;
                      return (
                        <div key={step.id} className="flex items-center gap-3">
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all ${
                              isActive || isCompleted
                                ? "text-white"
                                : "border-marketing-subtle bg-marketing-elevated text-marketing-muted"
                            }`}
                            style={
                              isActive || isCompleted
                                ? {
                                    borderColor: "transparent",
                                    backgroundColor: isCompleted
                                      ? secondaryColor
                                      : brandColor,
                                  }
                                : undefined
                            }
                          >
                            {isCompleted ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : Icon ? (
                              <Icon className="h-4 w-4" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          {index < steps.length - 1 && (
                            <div
                              className={`hidden h-px w-10 bg-marketing-subtle md:block ${
                                index < currentStep
                                  ? "opacity-100"
                                  : "opacity-40"
                              }`}
                              style={{
                                backgroundColor:
                                  index < currentStep ? brandColor : undefined,
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {currentStep === 0 && (
                    <AccountCreationStep
                      accountData={accountData}
                      setAccountData={setAccountData}
                      showPassword={showPassword}
                      setShowPassword={setShowPassword}
                      showConfirmPassword={showConfirmPassword}
                      setShowConfirmPassword={setShowConfirmPassword}
                      brandColor={brandColor}
                      passwordStrength={passwordStrength}
                      subdomainStatus={subdomainStatus}
                      isCheckingSubdomain={isCheckingSubdomain}
                    />
                  )}

                  {currentStep === 1 && (
                    <WelcomeStep
                      brandColor={brandColor}
                      accentColor={accentColor}
                    />
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

                  {currentStep < steps.length - 1 && (
                    <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      {currentStep === 0 ? (
                        <Link
                          href="/realtor/login"
                          className="flex items-center gap-2 text-sm font-semibold text-marketing-muted transition-colors hover:text-marketing-foreground"
                        >
                          <ArrowLeft className="h-5 w-5" />
                          <span>Back to Login</span>
                        </Link>
                      ) : (
                        <button
                          onClick={handleBack}
                          disabled={currentStep === 1 && user}
                          className="flex items-center gap-2 text-sm font-semibold text-marketing-muted transition-colors hover:text-marketing-foreground disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ArrowLeft className="h-5 w-5" />
                          <span>Back</span>
                        </button>
                      )}

                      <button
                        onClick={handleNext}
                        disabled={isCreatingAccount}
                        className="marketing-button-primary flex items-center gap-2 rounded-full px-8 py-3 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isCreatingAccount ? (
                          <>
                            <span className="font-semibold">
                              Creating Account...
                            </span>
                            <Loader2 className="h-5 w-5 animate-spin" />
                          </>
                        ) : (
                          <>
                            <span className="font-semibold">
                              {currentStep === 0
                                ? "Create Account"
                                : "Continue"}
                            </span>
                            <ArrowRight className="h-5 w-5" />
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {currentStep === steps.length - 1 && !isCompleting && (
                    <div className="mt-10 flex justify-center">
                      <button
                        onClick={completeOnboarding}
                        className="marketing-button-primary rounded-full px-10 py-3 text-lg font-semibold text-white shadow-xl transition-all hover:shadow-2xl"
                      >
                        Go to Dashboard
                      </button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4 shadow-sm">
      <p className="text-xs text-white/80 font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
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
  passwordStrength,
  subdomainStatus,
  isCheckingSubdomain,
}: {
  accountData: any;
  setAccountData: any;
  showPassword: boolean;
  setShowPassword: any;
  showConfirmPassword: boolean;
  setShowConfirmPassword: any;
  brandColor: string;
  passwordStrength: {
    label: string;
    score: number;
    percent: number;
    color: string;
  };
  subdomainStatus: { state: string; message: string };
  isCheckingSubdomain: boolean;
}) {
  const formatSubdomain = (value: string) => {
    return value.toLowerCase().replace(/[^a-z0-9-]/g, "");
  };

  const inputClass =
    "w-full pl-10 pr-4 py-3 border-2 rounded-lg bg-marketing-elevated border-marketing-subtle text-marketing-foreground placeholder:text-marketing-muted focus:border-marketing-accent focus:ring-2 ring-marketing-focus focus:outline-none transition-all";
  const iconClass =
    "absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-marketing-muted";

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
        <h2 className="text-3xl font-bold text-gray-100 mb-2">
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
            <Building className={iconClass} />
            <input
              type="text"
              value={accountData.businessName}
              onChange={(e) =>
                setAccountData({ ...accountData, businessName: e.target.value })
              }
              placeholder="Your Property Management Company"
              className={inputClass}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className={iconClass} />
            <input
              type="email"
              value={accountData.email}
              onChange={(e) =>
                setAccountData({ ...accountData, email: e.target.value })
              }
              placeholder="your@email.com"
              className={inputClass}
            />
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className={iconClass} />
            <PhoneInput
              international
              defaultCountry="NG"
              value={accountData.phoneNumber}
              onChange={(value) =>
                setAccountData({ ...accountData, phoneNumber: value || "" })
              }
              placeholder="+234 800 000 0000"
              className="phone-input-custom"
              style={{
                paddingLeft: "2.5rem",
              }}
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
              <Globe className={iconClass} />
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
                className={inputClass}
              />
            </div>
            <span className="text-gray-500 font-medium">.stayza.pro</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Lowercase letters, numbers, and hyphens only
          </p>
          <div className="mt-2 flex items-center gap-2 text-sm">
            {isCheckingSubdomain && (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <span className="text-gray-600">Checking availability...</span>
              </>
            )}
            {!isCheckingSubdomain && subdomainStatus.state === "available" && (
              <>
                <CheckCircle
                  className="h-4 w-4"
                  style={{ color: brandColor }}
                />
                <span className="text-green-600">
                  {subdomainStatus.message}
                </span>
              </>
            )}
            {!isCheckingSubdomain &&
              subdomainStatus.state === "unavailable" && (
                <>
                  <X className="h-4 w-4 text-red-500" />
                  <span className="text-red-600">
                    {subdomainStatus.message}
                  </span>
                </>
              )}
            {!isCheckingSubdomain && subdomainStatus.state === "error" && (
              <>
                <X className="h-4 w-4 text-orange-500" />
                <span className="text-orange-600">
                  {subdomainStatus.message}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className={iconClass} />
            <input
              type={showPassword ? "text" : "password"}
              value={accountData.password}
              onChange={(e) =>
                setAccountData({ ...accountData, password: e.target.value })
              }
              placeholder="Create a strong password"
              className={inputClass + " pr-12"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-marketing-muted hover:text-marketing-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Password strength</span>
              <span style={{ color: passwordStrength.color }}>
                {passwordStrength.label || ""}
              </span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${passwordStrength.percent}%`,
                  backgroundColor: passwordStrength.color,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Use 12+ characters with numbers & symbols for best strength.
            </p>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className={iconClass} />
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
              className={inputClass + " pr-12"}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-marketing-muted hover:text-marketing-foreground"
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

      {/* Custom PhoneInput Styles */}
      <style jsx global>{`
        .phone-input-custom .PhoneInputInput {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border: 2px solid rgb(229 231 235);
          border-radius: 0.5rem;
          background-color: rgb(249 250 251);
          color: rgb(17 24 39);
          outline: none;
          transition: all 0.2s;
        }

        .phone-input-custom .PhoneInputInput:focus {
          border-color: #f97316;
          ring: 2px;
          ring-color: rgba(249, 115, 22, 0.1);
        }

        .phone-input-custom .PhoneInputInput::placeholder {
          color: rgb(156 163 175);
        }

        .phone-input-custom .PhoneInputCountry {
          position: absolute;
          left: 2.5rem;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
        }

        .phone-input-custom .PhoneInputCountryIcon {
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 0.125rem;
        }

        .phone-input-custom .PhoneInputCountrySelect {
          font-size: 0.875rem;
          padding: 0.25rem;
          border: none;
          background: transparent;
          cursor: pointer;
        }

        .phone-input-custom .PhoneInputCountrySelectArrow {
          width: 0.5rem;
          height: 0.5rem;
          color: rgb(107 114 128);
        }
      `}</style>
    </div>
  );
}
