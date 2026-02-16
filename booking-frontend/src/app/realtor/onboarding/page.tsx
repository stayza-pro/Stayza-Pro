"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  parsePhoneNumber,
  CountryCode,
  getCountries,
  getCountryCallingCode,
} from "libphonenumber-js";
import {
  Rocket,
  Home,
  Wallet,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Calendar,
  DollarSign,
  Upload,
  ShieldCheck,
  Mail,
  Lock,
  Building,
  Globe,
  Eye,
  EyeOff,
  Phone,
  Loader2,
  PlayCircle,
  Palette,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";

type AccountData = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  businessName: string;
  phoneNumber: string;
  subdomain: string;
  cacNumber: string;
};

type BrandingData = {
  logoFile: File | null;
  tagline: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

type PayoutData = {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
};

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

type SubdomainStatus = {
  state: "idle" | "checking" | "available" | "unavailable" | "error";
  message: string;
};

type RealtorUserContext = {
  role?: string;
  realtor?: {
    slug?: string;
  };
} | null;

type PasswordStrength = {
  label: string;
  score: number;
  percent: number;
  color: string;
};

interface AccountCreationStepProps {
  accountData: AccountData;
  setAccountData: SetState<AccountData>;
  showPassword: boolean;
  setShowPassword: SetState<boolean>;
  showConfirmPassword: boolean;
  setShowConfirmPassword: SetState<boolean>;
  brandColor: string;
  passwordStrength: PasswordStrength;
  subdomainStatus: SubdomainStatus;
  isCheckingSubdomain: boolean;
  detectedCountry: CountryCode | undefined;
  setDetectedCountry: SetState<CountryCode | undefined>;
  cacFile: File | null;
  cacFilePreview: string;
  handleCacFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeCacFile: () => void;
}

interface BrandingStepProps {
  brandingData: BrandingData;
  setBrandingData: SetState<BrandingData>;
  logoPreview: string;
  setLogoPreview: SetState<string>;
  brandColor: string;
}

interface PayoutStepProps {
  payoutData: PayoutData;
  setPayoutData: SetState<PayoutData>;
  isVerifyingAccount: boolean;
  setIsVerifyingAccount: SetState<boolean>;
  brandColor: string;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Helper function to redirect to realtor subdomain dashboard
  const redirectToRealtorDashboard = () => {
    const currentUser = (user ||
      useAuthStore.getState().user) as RealtorUserContext;

    if (currentUser?.role === "REALTOR" && currentUser.realtor?.slug) {
      // Construct realtor subdomain URL
      const realtorSlug = currentUser.realtor.slug;
      const redirectUrl = `http://${realtorSlug}.${window.location.host}/dashboard`;

      // Check if cross-domain redirect
      const currentHost = window.location.host;
      try {
        const redirectHost = new URL(redirectUrl, window.location.origin).host;

        if (currentHost !== redirectHost) {
          // Cross-domain redirect - add tokens to URL
          const { accessToken, refreshToken } = useAuthStore.getState();
          if (accessToken && refreshToken) {
            const redirectUrlObj = new URL(redirectUrl);
            redirectUrlObj.searchParams.set("token", accessToken);
            redirectUrlObj.searchParams.set("refresh", refreshToken);

            window.location.href = redirectUrlObj.toString();
            return;
          }
        }
      } catch (urlError) {}

      // Fallback to direct navigation
      window.location.href = redirectUrl;
    } else {
      // Fallback to default dashboard
      router.push("/dashboard");
    }
  };

  // Use Stayza Pro marketing palette values with CSS var fallbacks for easier theming tweaks
  const brandColor = "var(--marketing-primary, #1E3A8A)";
  const secondaryColor = "var(--marketing-accent, #047857)";
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";

  const [currentStep, setCurrentStep] = useState(0);
  const [canSkip, setCanSkip] = useState(false); // Can't skip account creation
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // Account creation state
  const [accountData, setAccountData] = useState<AccountData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    phoneNumber: "",
    subdomain: "",
    cacNumber: "",
  });
  const [cacFile, setCacFile] = useState<File | null>(null);
  const [cacFilePreview, setCacFilePreview] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState<
    CountryCode | undefined
  >("NG");

  // Branding customization state
  const [brandingData, setBrandingData] = useState<BrandingData>({
    logoFile: null,
    tagline: "",
    description: "",
    primaryColor: "#1E3A8A",
    secondaryColor: "#047857",
    accentColor: "#F97316",
  });
  const [logoPreview, setLogoPreview] = useState<string>("");

  // Payout form state
  const [payoutData, setPayoutData] = useState<PayoutData>({
    bankCode: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    label: "",
    score: 0,
    percent: 0,
    color: "#94A3B8",
  });
  const [subdomainStatus, setSubdomainStatus] = useState<SubdomainStatus>({
    state: "idle",
    message: "",
  });
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
          `${API_URL}/realtors/check-subdomain?subdomain=${value}`,
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
        setSubdomainStatus({
          state: "error",
          message: "Check your connection and try again",
        });
      } finally {
        setIsCheckingSubdomain(false);
      }
    },
    [API_URL],
  );

  const steps: OnboardingStep[] = [
    {
      id: "account",
      title: "Create Your Account",
      description: "Start your journey as a Stayza Pro host",
      icon: Rocket,
    },
    {
      id: "branding",
      title: "Customize Your Brand",
      description: "Make your booking site uniquely yours",
      icon: Palette,
    },
    {
      id: "tutorial",
      title: "How to Add Your Properties",
      description: "Watch this quick video tutorial",
      icon: PlayCircle,
    },
    {
      id: "payout",
      title: "Setup Payouts (Optional)",
      description: "You can skip this and setup payments later in settings",
      icon: Wallet,
    },
    {
      id: "complete",
      title: "You're All Set! ðŸš€",
      description: "Your account is ready for bookings",
      icon: CheckCircle,
    },
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
        `onboarding_completed_${user.id}`,
      );
      if (hasCompletedOnboarding === "true") {
        router.push("/realtor/dashboard");
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
        "Are you sure you want to skip onboarding? You can always add properties and setup payouts later.",
      )
    ) {
      localStorage.setItem(`onboarding_completed_${user?.id}`, "true");
      redirectToRealtorDashboard();
    }
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      // Create account
      await createAccount();
    } else if (currentStep === 1) {
      // Branding step - save branding data
      await submitBrandingData();
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 3) {
      // Payout step - optional, skip if form is empty
      if (
        payoutData.bankCode &&
        payoutData.accountNumber &&
        payoutData.accountName
      ) {
        // Only submit if user filled in the form
        await submitPayoutInfo();
      }
      // Move to final step and complete onboarding
      setCurrentStep(currentStep + 1);
      // Clear tokens on final step - user must verify email
      setTimeout(() => {
        completeOnboarding();
      }, 100);
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
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
      !accountData.fullName ||
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

    if (!accountData.cacNumber || !accountData.cacNumber.trim()) {
      toast.error("CAC registration number is required");
      return;
    }

    if (!cacFile) {
      toast.error("CAC certificate upload is required");
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
        "Subdomain can only contain lowercase letters, numbers, and hyphens",
      );
      return;
    }

    setIsCreatingAccount(true);

    try {
      // Upload CAC document (REQUIRED)
      if (!cacFile) {
        toast.error("CAC certificate is required");
        setIsCreatingAccount(false);
        return;
      }

      toast("Uploading CAC document...");
      const cacDocumentUrl = await uploadCacDocument(cacFile);
      if (!cacDocumentUrl) {
        toast.error("Failed to upload CAC document. Please try again.");
        setIsCreatingAccount(false);
        return;
      }

      // Format phone number to E.164 format
      let formattedPhone = accountData.phoneNumber;

      // If phone doesn't start with +, add country code
      if (!formattedPhone.startsWith("+")) {
        const digitsOnly = formattedPhone.replace(/\D/g, "");

        // If it's a Nigerian local number starting with 0, convert it
        if (digitsOnly.startsWith("0") && detectedCountry === "NG") {
          formattedPhone = `+234${digitsOnly.substring(1)}`;
        }
        // Otherwise, add the detected country code
        else if (detectedCountry) {
          const countryCode = getCountryCallingCode(detectedCountry);
          formattedPhone = `+${countryCode}${digitsOnly}`;
        }
        // Fallback: if no country detected, add + prefix
        else {
          formattedPhone = `+${digitsOnly}`;
        }
      }

      const response = await fetch(`${API_URL}/realtors/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: accountData.fullName,
          businessEmail: accountData.email,
          password: accountData.password,
          phoneNumber: formattedPhone,
          agencyName: accountData.businessName,
          customSubdomain: accountData.subdomain,
          corporateRegNumber: accountData.cacNumber,
          cacDocumentUrl: cacDocumentUrl,
          tagline: `${accountData.businessName} - Property Management`,
          businessAddress: "Nigeria",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          "Account created successfully! Continue to complete your profile.",
          { duration: 4000 },
        );

        // Store user email for the final verification step
        if (accountData.email) {
          localStorage.setItem("pendingVerificationEmail", accountData.email);
        }

        // Store temporary access token for onboarding flow (if provided)
        // This allows completing payout setup before email verification
        if (data.data?.accessToken || data.accessToken) {
          const token = data.data?.accessToken || data.accessToken;
          localStorage.setItem("accessToken", token);

          // Also store user data if provided
          if (data.data?.user || data.user) {
            const userData = data.data?.user || data.user;
            localStorage.setItem("user", JSON.stringify(userData));
          }
        }

        // Move to next step (branding)
        setCurrentStep(currentStep + 1);
      } else {
        // Backend returns error in data.error.message format
        const errorMessage =
          data.error?.message || data.message || "Failed to create account";
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error("Failed to create account. Please try again.");
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const submitBrandingData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Authentication required. Please log in again.");
        return;
      }

      let logoUrl = "";

      // Upload logo if provided
      if (brandingData.logoFile) {
        toast("Uploading logo...");
        const formData = new FormData();
        formData.append("logo", brandingData.logoFile);

        const logoResponse = await fetch(
          `${API_URL}/realtors/upload?type=logo`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          },
        );

        if (logoResponse.ok) {
          const logoResult = await logoResponse.json();
          logoUrl = logoResult.data.url;
        } else {
          toast.error("Failed to upload logo. Continuing without it.");
        }
      }

      // Save branding data (colors, tagline, description)
      const brandingPayload: {
        tagline: string;
        description: string;
        primaryColor: string;
        secondaryColor: string;
        accentColor: string;
        logoUrl?: string;
      } = {
        tagline: brandingData.tagline || "",
        description: brandingData.description || "",
        primaryColor: brandingData.primaryColor,
        secondaryColor: brandingData.secondaryColor,
        accentColor: brandingData.accentColor,
      };

      // Add logo URL if uploaded
      if (logoUrl) {
        brandingPayload.logoUrl = logoUrl;
      }

      const response = await fetch(`${API_URL}/realtors/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(brandingPayload),
      });

      if (response.ok) {
        toast.success("Branding saved successfully!");
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to save branding");
      }
    } catch (error) {
      toast.error(
        "Failed to save branding. You can update it later from settings.",
      );
    }
  };

  const submitPayoutInfo = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`${API_URL}/realtors/payout/account`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bankCode: payoutData.bankCode,
          bankName: payoutData.bankName,
          accountNumber: payoutData.accountNumber,
          accountName: payoutData.accountName,
        }),
      });

      if (response.ok) {
        toast.success("Payout information saved!");
      } else if (response.status === 403) {
        // CAC not approved - this is expected during onboarding, skip silently
        const errorData = await response.json();
        // Check for CAC verification error in both old and new error formats
        const errorMessage =
          errorData.error?.message || errorData.message || "";
        if (
          errorMessage.includes("CAC verification") ||
          errorMessage.includes("CAC")
        ) {
          // Don't throw error, just inform user they can set this up later
          // This is not an error during onboarding, so we just log it
        } else {
          throw new Error(errorMessage || "Access denied");
        }
      } else {
        const errorData = await response.json();
        const errorMessage =
          errorData.error?.message ||
          errorData.message ||
          "Failed to save payout info";
        throw new Error(errorMessage);
      }
    } catch (error) {
      toast.error(
        "Failed to save payout info. You can update it later in settings.",
      );
    }
  };

  const completeOnboarding = () => {
    // Clear temporary tokens - user must verify email and login
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    // Don't redirect - just mark as completing to show the verification message
    setIsCompleting(true);
  };

  const handleCacFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PDF, images)
      const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload a PDF or image file (JPEG, PNG)");
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error("File size must be less than 5MB");
        return;
      }

      setCacFile(file);
      setCacFilePreview(file.name);
    }
  };

  const removeCacFile = () => {
    setCacFile(null);
    setCacFilePreview("");
  };

  const uploadCacDocument = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("cacCertificate", file);

    try {
      const response = await fetch(`${API_URL}/realtors/upload-temp-cac`, {
        method: "POST",
        headers: {
          // No Content-Type header - let browser set it with boundary for FormData
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        return result.data.url;
      }

      await response.json();
      return null;
    } catch (error) {
      return null;
    }
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
                  Guided setup that mirrors the Realtor portal aesthetic - keep
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
                      detectedCountry={detectedCountry}
                      setDetectedCountry={setDetectedCountry}
                      cacFile={cacFile}
                      cacFilePreview={cacFilePreview}
                      handleCacFileUpload={handleCacFileUpload}
                      removeCacFile={removeCacFile}
                    />
                  )}

                  {currentStep === 1 && (
                    <BrandingStep
                      brandingData={brandingData}
                      setBrandingData={setBrandingData}
                      logoPreview={logoPreview}
                      setLogoPreview={setLogoPreview}
                      brandColor={brandColor}
                    />
                  )}

                  {currentStep === 2 && (
                    <VideoTutorialStep brandColor={brandColor} />
                  )}

                  {currentStep === 3 && (
                    <PayoutStep
                      payoutData={payoutData}
                      setPayoutData={setPayoutData}
                      isVerifyingAccount={isVerifyingAccount}
                      setIsVerifyingAccount={setIsVerifyingAccount}
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

                  {/* No button needed on final step - user should check email */}
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
  detectedCountry,
  setDetectedCountry,
  cacFile,
  cacFilePreview,
  handleCacFileUpload,
  removeCacFile,
}: AccountCreationStepProps) {
  // Helper function to get flag emoji from country code
  const getFlagEmoji = (countryCode: string) => {
    if (!countryCode) return "ðŸŒ";
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  // Helper function to detect country from phone number
  const detectCountry = (phoneInput: string): CountryCode | undefined => {
    const digitsOnly = phoneInput.replace(/\D/g, "");

    if (!digitsOnly) return "NG";

    // Try parsing with libphonenumber first (most accurate)
    try {
      const withPlus = phoneInput.startsWith("+")
        ? phoneInput
        : `+${digitsOnly}`;
      const phoneNumber = parsePhoneNumber(withPlus);
      if (phoneNumber && phoneNumber.country) {
        return phoneNumber.country;
      }
    } catch (error) {
      // Continue to manual detection
    }

    // Try matching against all country codes
    const allCountries = getCountries();
    for (const country of allCountries) {
      try {
        const callingCode = getCountryCallingCode(country);
        if (digitsOnly.startsWith(callingCode)) {
          return country;
        }
      } catch (e) {
        continue;
      }
    }

    // Special cases for common patterns
    // US/CA (10 digits without code, or starts with 1)
    if (
      digitsOnly.length === 10 ||
      (digitsOnly.length === 11 && digitsOnly.startsWith("1"))
    ) {
      return "US";
    }

    // Nigeria local format (starts with 0)
    if (digitsOnly.startsWith("0") && digitsOnly.length <= 11) {
      return "NG";
    }

    return undefined;
  };

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
          Start your journey as a Stayza Pro property host
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className={iconClass} />
            <input
              type="text"
              value={accountData.fullName}
              onChange={(e) =>
                setAccountData({ ...accountData, fullName: e.target.value })
              }
              placeholder="John Smith"
              className={inputClass}
            />
          </div>
        </div>

        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business/Agency Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building className={iconClass} />
            <input
              type="text"
              value={accountData.businessName}
              onChange={(e) =>
                setAccountData({ ...accountData, businessName: e.target.value })
              }
              placeholder="Smith Property Management"
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
          <div className="relative flex items-center">
            <Phone className={iconClass} />

            {/* Country Flag Display */}
            <div className="absolute left-10 top-1/2 transform -translate-y-1/2 flex items-center">
              <span className="text-2xl mr-2">
                {detectedCountry ? getFlagEmoji(detectedCountry) : "ðŸŒ"}
              </span>
              <span className="text-sm text-gray-600 font-medium">
                {detectedCountry &&
                  `+${getCountryCallingCode(detectedCountry)}`}
              </span>
            </div>

            <input
              type="tel"
              value={accountData.phoneNumber}
              onChange={(e) => {
                const value = e.target.value;
                setAccountData({ ...accountData, phoneNumber: value });

                // Detect country from input
                const country = detectCountry(value);
                if (country) {
                  setDetectedCountry(country);
                }
              }}
              placeholder="0800 000 0000"
              className={inputClass + " pl-28"}
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

        {/* CAC Registration Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CAC Registration Number
          </label>
          <div className="relative">
            <Building className={iconClass} />
            <input
              type="text"
              value={accountData.cacNumber}
              onChange={(e) =>
                setAccountData({ ...accountData, cacNumber: e.target.value })
              }
              placeholder="1234567"
              className={inputClass}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Corporate Affairs Commission registration number
          </p>
        </div>

        {/* CAC Document Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CAC Certificate
          </label>
          {!cacFilePreview ? (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors bg-gray-50">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 font-medium">
                  Click to upload CAC certificate
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, JPG, or PNG (Max 5MB)
                </p>
              </div>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleCacFileUpload}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-300 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded">
                  <Upload className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-100">
                    {cacFilePreview}
                  </p>
                  <p className="text-xs text-gray-500">
                    {cacFile ? `${(cacFile.size / 1024).toFixed(1)} KB` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeCacFile}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            CAC certificate is required for account approval
          </p>
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
            href="/legal/terms"
            className="font-medium hover:underline"
            style={{ color: brandColor }}
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/legal/privacy"
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

// Branding Customization Step Component
function BrandingStep({
  brandingData,
  setBrandingData,
  logoPreview,
  setLogoPreview,
  brandColor,
}: BrandingStepProps) {
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Logo file size must be less than 5MB");
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      setBrandingData((prev) => ({ ...prev, logoFile: file }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setBrandingData((prev) => ({ ...prev, logoFile: null }));
    setLogoPreview("");
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
          style={{ backgroundColor: `${brandColor}20` }}
        >
          <Palette className="h-10 w-10" style={{ color: brandColor }} />
        </motion.div>
        <h2 className="text-3xl font-bold text-marketing-foreground mb-3">
          Make It Yours
        </h2>
        <p className="text-marketing-muted max-w-2xl mx-auto">
          Customize your booking site with your brand colors, logo, and
          messaging
        </p>
      </div>

      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-semibold text-marketing-foreground mb-3">
          Business Logo (Optional)
        </label>
        <div className="flex items-start gap-4">
          {logoPreview ? (
            <div className="relative">
              <div className="w-32 h-32 rounded-xl border-2 border-marketing-subtle bg-marketing-elevated overflow-hidden">
                <Image
                  src={logoPreview}
                  alt="Logo preview"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={removeLogo}
                className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="w-32 h-32 rounded-xl border-2 border-dashed border-marketing-subtle bg-marketing-elevated hover:border-marketing-accent hover:bg-marketing-surface cursor-pointer transition-all flex flex-col items-center justify-center gap-2">
              <Upload className="w-6 h-6 text-marketing-muted" />
              <span className="text-xs text-marketing-muted font-medium">
                Upload Logo
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
          )}
          <div className="flex-1">
            <p className="text-sm text-marketing-muted mb-2">
              Upload your business logo to appear on your booking site
            </p>
            <ul className="text-xs text-marketing-muted space-y-1">
              <li>- Recommended: Square image (500x500px)</li>
              <li>- Max file size: 5MB</li>
              <li>- Format: JPG, PNG, or SVG</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tagline */}
      <div>
        <label className="block text-sm font-semibold text-marketing-foreground mb-3">
          Tagline{" "}
          <span className="text-marketing-muted font-normal">(Optional)</span>
        </label>
        <input
          type="text"
          value={brandingData.tagline}
          onChange={(e) =>
            setBrandingData((prev) => ({
              ...prev,
              tagline: e.target.value,
            }))
          }
          placeholder="e.g., Your trusted property partner"
          maxLength={100}
          className="w-full px-4 py-3 border-2 rounded-lg bg-marketing-elevated border-marketing-subtle text-marketing-foreground placeholder:text-marketing-muted focus:border-marketing-accent focus:ring-2 ring-marketing-focus focus:outline-none transition-all"
        />
        <p className="text-xs text-marketing-muted mt-2">
          {brandingData.tagline.length}/100 characters
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-marketing-foreground mb-3">
          About Your Business{" "}
          <span className="text-marketing-muted font-normal">(Optional)</span>
        </label>
        <textarea
          value={brandingData.description}
          onChange={(e) =>
            setBrandingData((prev) => ({
              ...prev,
              description: e.target.value,
            }))
          }
          placeholder="Tell guests about your business, your properties, and what makes you special..."
          rows={4}
          maxLength={500}
          className="w-full px-4 py-3 border-2 rounded-lg bg-marketing-elevated border-marketing-subtle text-marketing-foreground placeholder:text-marketing-muted focus:border-marketing-accent focus:ring-2 ring-marketing-focus focus:outline-none transition-all resize-none"
        />
        <p className="text-xs text-marketing-muted mt-2">
          {brandingData.description.length}/500 characters
        </p>
      </div>

      {/* Brand Colors */}
      <div>
        <label className="block text-sm font-semibold text-marketing-foreground mb-4">
          Brand Colors
        </label>
        <div className="grid grid-cols-1 gap-4">
          {/* Primary Color */}
          <div>
            <label className="block text-xs font-medium text-marketing-muted mb-2">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandingData.primaryColor}
                onChange={(e) =>
                  setBrandingData((prev) => ({
                    ...prev,
                    primaryColor: e.target.value,
                  }))
                }
                className="w-12 h-12 rounded-lg border-2 border-marketing-subtle cursor-pointer"
              />
              <input
                type="text"
                value={brandingData.primaryColor}
                onChange={(e) =>
                  setBrandingData((prev) => ({
                    ...prev,
                    primaryColor: e.target.value,
                  }))
                }
                placeholder="#1E3A8A"
                className="flex-1 px-3 py-2 text-sm border-2 rounded-lg bg-marketing-elevated border-marketing-subtle text-marketing-foreground focus:border-marketing-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Secondary Color */}
          <div>
            <label className="block text-xs font-medium text-marketing-muted mb-2">
              Secondary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandingData.secondaryColor}
                onChange={(e) =>
                  setBrandingData((prev) => ({
                    ...prev,
                    secondaryColor: e.target.value,
                  }))
                }
                className="w-12 h-12 rounded-lg border-2 border-marketing-subtle cursor-pointer"
              />
              <input
                type="text"
                value={brandingData.secondaryColor}
                onChange={(e) =>
                  setBrandingData((prev) => ({
                    ...prev,
                    secondaryColor: e.target.value,
                  }))
                }
                placeholder="#047857"
                className="flex-1 px-3 py-2 text-sm border-2 rounded-lg bg-marketing-elevated border-marketing-subtle text-marketing-foreground focus:border-marketing-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <label className="block text-xs font-medium text-marketing-muted mb-2">
              Accent Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandingData.accentColor}
                onChange={(e) =>
                  setBrandingData((prev) => ({
                    ...prev,
                    accentColor: e.target.value,
                  }))
                }
                className="w-12 h-12 rounded-lg border-2 border-marketing-subtle cursor-pointer"
              />
              <input
                type="text"
                value={brandingData.accentColor}
                onChange={(e) =>
                  setBrandingData((prev) => ({
                    ...prev,
                    accentColor: e.target.value,
                  }))
                }
                placeholder="#F97316"
                className="flex-1 px-3 py-2 text-sm border-2 rounded-lg bg-marketing-elevated border-marketing-subtle text-marketing-foreground focus:border-marketing-accent focus:outline-none"
              />
            </div>
          </div>
        </div>
        <p className="text-xs text-marketing-muted mt-3">
          ðŸ’¡ These colors will be used across your booking site for buttons,
          headers, and accents
        </p>
      </div>

      {/* <div
        className="p-6 rounded-xl border-2 border-marketing-subtle"
        style={{
          background: `linear-gradient(135deg, ${brandingData.primaryColor}10 0%, ${brandingData.secondaryColor}10 100%)`,
        }}
      >
        <div className="flex items-center gap-4 mb-4">
          {logoPreview ? (
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-white">
              <Image
                src={logoPreview}
                alt="Logo"
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold text-white"
              style={{ backgroundColor: brandingData.primaryColor }}
            >
              {brandingData.tagline
                ? brandingData.tagline.charAt(0).toUpperCase()
                : "?"}
            </div>
          )}
          <div>
            <h3
              className="text-xl font-bold"
              style={{ color: brandingData.primaryColor }}
            >
              {brandingData.tagline || "Your Business Name"}
            </h3>
            <p className="text-sm text-marketing-muted">
              {brandingData.description
                ? brandingData.description.substring(0, 60) + "..."
                : "Your business description will appear here"}
            </p>
          </div>
        </div>
        <button
          className="px-6 py-2 rounded-lg font-semibold text-white transition-colors"
          style={{ backgroundColor: brandingData.accentColor }}
        >
          Preview Button
        </button>
      </div> */}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Do not worry.</strong> You can always change these settings
          later from your dashboard.
        </p>
      </div>
    </div>
  );
}

// Video Tutorial Step Component
function VideoTutorialStep({ brandColor }: { brandColor: string }) {
  const cloudinaryVideoUrl =
    "https://res.cloudinary.com/dpffxy2bo/video/upload/f_auto,q_auto:good,vc_auto/Stayza_1.mp4";

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
        style={{ backgroundColor: `${brandColor}20` }}
      >
        <PlayCircle className="h-10 w-10" style={{ color: brandColor }} />
      </motion.div>

      <h1 className="text-4xl font-bold text-gray-100 mb-4">
        How to Add Your Properties
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Watch this quick tutorial to learn how to add and manage your properties
        on Stayza Pro.
      </p>

      {/* Property tutorial video */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative aspect-video max-w-4xl mx-auto mb-8 rounded-xl overflow-hidden shadow-2xl bg-gray-900"
      >
        <video
          className="h-full w-full"
          controls
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          preload="metadata"
          onContextMenu={(event) => event.preventDefault()}
        >
          <source src={cloudinaryVideoUrl} type="video/mp4" />
          <source src="/Stayza_1.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </motion.div>

      {/* Quick Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {[
          {
            icon: Home,
            title: "Property Details",
            description: "Add photos, pricing, and amenities",
          },
          {
            icon: Calendar,
            title: "Availability",
            description: "Set your calendar and booking rules",
          },
          {
            icon: DollarSign,
            title: "Get Bookings",
            description: "Go live and start earning",
          },
        ].map((tip, index) => {
          const Icon = tip.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="p-6 bg-gray-50 rounded-xl"
            >
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4"
                style={{ backgroundColor: `${brandColor}20` }}
              >
                <Icon className="h-6 w-6" style={{ color: brandColor }} />
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">
                {tip.title}
              </h3>
              <p className="text-sm text-gray-600">{tip.description}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8 max-w-2xl mx-auto">
        <div className="flex items-start space-x-3">
          <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 text-left">
            <p className="font-medium mb-1">Add properties anytime</p>
            <p>
              You can add your properties from your dashboard after completing
              this onboarding. Watch this video first to understand the process!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Payout Step Component
function PayoutStep({
  payoutData,
  setPayoutData,
  isVerifyingAccount,
  setIsVerifyingAccount,
  brandColor,
}: PayoutStepProps) {
  const [banks, setBanks] = useState<Array<{ code: string; name: string }>>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(true);
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";

  useEffect(() => {
    // Fetch banks from backend
    const fetchBanks = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch(`${API_URL}/realtors/payout/banks`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setBanks(data.data || []);
        }
      } catch (error) {
        // Fallback to some common Nigerian banks
        setBanks([
          { code: "044", name: "Access Bank" },
          { code: "058", name: "GTBank" },
          { code: "011", name: "First Bank" },
          { code: "033", name: "UBA" },
          { code: "057", name: "Zenith Bank" },
        ]);
      } finally {
        setIsLoadingBanks(false);
      }
    };

    fetchBanks();
  }, [API_URL]);

  // Auto-verify account when number is complete
  useEffect(() => {
    const verifyAccount = async () => {
      if (!payoutData.accountNumber || !payoutData.bankCode) {
        return;
      }

      if (payoutData.accountNumber.length !== 10) {
        return;
      }

      // Don't re-verify if account name is already set for this number
      if (payoutData.accountName) {
        return;
      }

      try {
        setIsVerifyingAccount(true);
        const token = localStorage.getItem("accessToken");
        const response = await fetch(`${API_URL}/realtors/payout/verify`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accountNumber: payoutData.accountNumber,
            bankCode: payoutData.bankCode,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setPayoutData((prev) => ({
            ...prev,
            accountName: data.data.account_name,
          }));
        } else {
          const errorData = await response.json();
          const errorMessage =
            errorData.error?.message ||
            errorData.message ||
            "Unable to verify account";
          // Only show error if it's not a test mode limit error
          if (
            !errorMessage.includes("Test mode") &&
            !errorMessage.includes("daily limit")
          ) {
            toast.error(errorMessage);
          }
          setPayoutData((prev) => ({
            ...prev,
            accountName: "",
          }));
        }
      } catch (error: unknown) {
        // Silently fail for network errors during auto-verification
        setPayoutData((prev) => ({
          ...prev,
          accountName: "",
        }));
      } finally {
        setIsVerifyingAccount(false);
      }
    };

    // Debounce verification by 500ms
    const timer = setTimeout(() => {
      verifyAccount();
    }, 500);

    return () => clearTimeout(timer);
  }, [
    API_URL,
    payoutData.accountName,
    payoutData.accountNumber,
    payoutData.bankCode,
    setIsVerifyingAccount,
    setPayoutData,
  ]);

  const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedBank = banks.find((bank) => bank.code === e.target.value);
    if (selectedBank) {
      setPayoutData((prev) => ({
        ...prev,
        bankCode: selectedBank.code,
        bankName: selectedBank.name,
        accountName: "", // Reset account name when bank changes
      }));
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
          style={{ backgroundColor: `${brandColor}20` }}
        >
          <ShieldCheck className="h-8 w-8" style={{ color: brandColor }} />
        </div>
        <h2 className="text-3xl font-bold text-gray-100 mb-2">
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
            value={payoutData.bankCode}
            onChange={handleBankChange}
            disabled={isLoadingBanks}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">
              {isLoadingBanks ? "Loading banks..." : "Select your bank"}
            </option>
            {banks.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
        </div>

        {/* Account Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={payoutData.accountNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                setPayoutData({
                  ...payoutData,
                  accountNumber: value,
                  accountName: "", // Reset account name when number changes
                });
              }}
              placeholder="0123456789"
              maxLength={10}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
            />
            {isVerifyingAccount && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              </div>
            )}
            {!isVerifyingAccount &&
              payoutData.accountName &&
              payoutData.accountNumber.length === 10 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {isVerifyingAccount
              ? "Verifying account..."
              : "Enter a 10-digit account number"}
          </p>
        </div>

        {/* Account Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Name
          </label>
          <input
            type="text"
            value={payoutData.accountName}
            readOnly
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
            placeholder="Will be auto-filled after account verification"
          />
        </div>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Your money is safe</p>
              <p className="mb-2">
                We use Paystack for secure payment processing. Funds are
                released 24-48 hours after guest check-in.
              </p>
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> Payout account setup requires CAC
                verification approval. If you are just registering, you can
                complete this step later in Settings after your CAC documents
                are verified.
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
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const userEmail =
    typeof window !== "undefined"
      ? localStorage.getItem("pendingVerificationEmail")
      : null;

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";

  const extractErrorText = (error: unknown): string => {
    if (!error || typeof error !== "object") {
      return "";
    }

    const maybeError = error as { message?: string };
    return maybeError.message || "";
  };

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendVerification = async () => {
    if (!userEmail || isResending || resendCooldown > 0) return;

    setIsResending(true);

    try {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          type: "realtor",
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Verification email sent! Please check your inbox.");
        setResendCooldown(60); // 60 second cooldown
      } else {
        const errorMessage =
          data.error?.message ||
          data.message ||
          "Failed to resend verification email.";
        toast.error(errorMessage);
      }
    } catch (error: unknown) {
      const errorText = extractErrorText(error).toLowerCase();
      const errorCode =
        error && typeof error === "object" && "code" in error
          ? String((error as { code?: string }).code || "")
          : "";

      // Check if it is a timeout or network error.
      const isTimeoutError =
        errorText.includes("timeout") || errorCode === "ETIMEDOUT";

      if (isTimeoutError) {
        toast.error(
          "Email service is temporarily unavailable. Your verification link was already sent to your email. Please check your inbox and spam folder.",
          { duration: 8000 },
        );
      } else {
        toast.error(
          "Failed to resend verification email. Please try again later.",
        );
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="text-center py-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6"
        style={{ backgroundColor: `${brandColor}20` }}
      >
        <Mail className="h-12 w-12" style={{ color: brandColor }} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-4xl font-bold text-gray-100 mb-4"
      >
        {isCompleting ? "Finalizing setup..." : "One More Step!"}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto"
      >
        We have sent a verification email to{" "}
        <strong className="text-gray-900">{userEmail || "your email"}</strong>
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="max-w-md mx-auto mb-8"
      >
        <div className="bg-gradient-to-br from-orange-50 to-blue-50 border-2 border-orange-200 rounded-2xl p-8">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div className="text-left">
                <p className="text-gray-900 font-semibold">Check your inbox</p>
                <p className="text-sm text-gray-600">
                  Look for an email from Stayza Pro
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div className="text-left">
                <p className="text-gray-900 font-semibold">
                  Click the verification link
                </p>
                <p className="text-sm text-gray-600">
                  This confirms your email address
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div className="text-left">
                <p className="text-gray-900 font-semibold">
                  Login to your dashboard
                </p>
                <p className="text-sm text-gray-600">
                  Start managing your properties
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
          <p className="text-sm text-gray-600">Did not receive the email?</p>
          <button
            onClick={handleResendVerification}
            disabled={isResending || resendCooldown > 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor:
                resendCooldown > 0 ? "#E5E7EB" : `${brandColor}15`,
              color: resendCooldown > 0 ? "#6B7280" : brandColor,
            }}
          >
            {isResending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : resendCooldown > 0 ? (
              <>Resend in {resendCooldown}s</>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Resend Email
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Check your spam folder if you do not see it in your inbox
        </p>

        <Link
          href="/realtor/login"
          className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:underline"
          style={{ color: brandColor }}
        >
          Already verified? Login here
          <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </div>
  );
}
