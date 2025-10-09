"use client";

import React, {
  useState,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  ArrowLeft,
  ArrowRight,
  Shield,
  CheckCircle,
  Eye,
  EyeOff,
  Building,
  Building2,
  Phone,
  Globe,
  Palette,
  Camera,
  MapPin,
  CreditCard,
  Sparkles,
  Menu,
  X,
  AlertCircle,
  Check,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
// Removed palette import - using direct colors

// Password strength checker
const checkPasswordStrength = (password: string) => {
  if (!password) return { score: 0, feedback: [] };

  let score = 0;
  const feedback = [];

  // Length check
  if (password.length >= 8) score += 1;
  else feedback.push("At least 8 characters");

  // Uppercase check
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push("One uppercase letter");

  // Lowercase check
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push("One lowercase letter");

  // Number check
  if (/\d/.test(password)) score += 1;
  else feedback.push("One number");

  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  else feedback.push("One special character");

  return { score, feedback };
};

// Email domain validation
const validateBusinessEmail = (email: string) => {
  if (!email) return { isValid: false, message: "" };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: "Invalid email format" };
  }

  // Check for common personal email domains
  const personalDomains = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "icloud.com",
  ];
  const domain = email.split("@")[1]?.toLowerCase();

  if (personalDomains.includes(domain)) {
    return {
      isValid: true,
      message: "Consider using a business email for better credibility",
      warning: true,
    };
  }

  return { isValid: true, message: "Business email looks good!" };
};

// Phone number formatter
const formatPhoneNumber = (value: string) => {
  // Remove all non-numeric characters
  const cleaned = value.replace(/\D/g, "");

  // Format based on length
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  if (cleaned.length <= 10)
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;

  // International format
  return `+${cleaned.slice(0, cleaned.length - 10)} ${cleaned.slice(
    -10,
    -7
  )}-${cleaned.slice(-7, -4)}-${cleaned.slice(-4)}`;
};

// Force dynamic rendering since this page uses search params
export const dynamic = "force-dynamic";

// Registration form schema
const realtorRegistrationSchema = z
  .object({
    // Personal Information
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name is too long"),
    businessEmail: z.string().email("Please enter a valid email address"),
    phoneNumber: z.string().min(7, "Phone number is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and number"
      ),
    confirmPassword: z.string(),

    // Business Information
    agencyName: z
      .string()
      .min(2, "Agency name is required")
      .max(100, "Agency name is too long"),
    businessAddress: z.string().min(5, "Business address is required"),
    customSubdomain: z
      .string()
      .min(3, "Subdomain must be at least 3 characters")
      .max(30, "Subdomain is too long")
      .regex(
        /^[a-z0-9]+$/,
        "Subdomain must contain only lowercase letters and numbers"
      ),

    // Optional branding
    primaryColor: z.string().optional(),
    logo: z.any().optional(),
    tagline: z.string().max(100, "Tagline is too long").optional(),

    // Terms and conditions
    termsAccepted: z
      .boolean()
      .refine(
        (val) => val === true,
        "You must accept the terms and conditions"
      ),
    privacyAccepted: z
      .boolean()
      .refine((val) => val === true, "You must accept the privacy policy"),
    marketingOptIn: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RealtorRegistrationFormData = z.infer<typeof realtorRegistrationSchema>;

// Registration steps configuration
const registrationSteps = [
  {
    id: "personal",
    title: "Personal Information",
    description: "Let's start with your basic details",
    icon: User,
    fields: [
      "fullName",
      "businessEmail",
      "phoneNumber",
      "password",
      "confirmPassword",
    ],
  },
  {
    id: "business",
    title: "Business Details",
    description: "Tell us about your real estate business",
    icon: Building2,
    fields: ["agencyName", "businessAddress", "customSubdomain"],
  },
  {
    id: "branding",
    title: "Branding (Optional)",
    description: "Customize your professional appearance",
    icon: Palette,
    fields: ["primaryColor", "logo", "tagline"],
  },
  {
    id: "terms",
    title: "Terms & Agreements",
    description: "Review and accept our terms",
    icon: Shield,
    fields: ["termsAccepted", "privacyAccepted", "marketingOptIn"],
  },
];

// Color options for branding
const colorOptions = [
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#F97316", // Orange
];

function RealtorRegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/dashboard";
  const plan = searchParams.get("plan") || "free";

  // React Hook Form setup
  const methods = useForm<RealtorRegistrationFormData>({
    resolver: zodResolver(realtorRegistrationSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      businessEmail: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      agencyName: "",
      businessAddress: "",
      customSubdomain: "",
      primaryColor: "#8B5CF6",
      tagline: "",
      termsAccepted: false,
      privacyAccepted: false,
      marketingOptIn: false,
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
    setValue,
    trigger,
    clearErrors,
    getValues,
  } = methods;

  // Watch form values for real-time validation and preview
  const watchedData = watch();

  // UI State
  const [currentStep, setCurrentStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Enhanced validation states
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const [subdomainStatus, setSubdomainStatus] = useState<{
    available: boolean | null;
    message: string;
    suggestions?: string[];
  }>({ available: null, message: "" });

  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string[];
  }>({ score: 0, feedback: [] });
  const [emailValidation, setEmailValidation] = useState<{
    isValid: boolean;
    message: string;
    warning?: boolean;
  }>({ isValid: false, message: "" });

  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [phoneFormatted, setPhoneFormatted] = useState("");
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">(
    "desktop"
  );
  const [isCompleted, setIsCompleted] = useState(false);

  // Step navigation functions
  const nextStep = useCallback(async () => {
    const currentStepFields = registrationSteps[currentStep].fields;
    const isStepValid = await trigger(currentStepFields as any);

    if (isStepValid) {
      setCurrentStep((prev) =>
        Math.min(prev + 1, registrationSteps.length - 1)
      );
    } else {
      toast.error("Please fix the errors before continuing");
    }
  }, [currentStep, trigger]);

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // Enhanced subdomain availability check with suggestions
  const checkSubdomainAvailability = useCallback(async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainStatus({ available: null, message: "" });
      return;
    }

    setIsCheckingSubdomain(true);
    try {
      // Simulate API call - replace with actual endpoint
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock check - in real app, this would be an API call
      const unavailableSubdomains = [
        "test",
        "admin",
        "api",
        "www",
        "app",
        "staging",
        "dev",
      ];
      const isAvailable = !unavailableSubdomains.includes(
        subdomain.toLowerCase()
      );

      if (isAvailable) {
        setSubdomainStatus({
          available: true,
          message: `${subdomain}.stayza.pro is available!`,
        });
      } else {
        // Generate suggestions
        const suggestions = [
          `${subdomain}realty`,
          `${subdomain}properties`,
          `${subdomain}homes`,
          `${subdomain}2024`,
          `my${subdomain}`,
        ].slice(0, 3);

        setSubdomainStatus({
          available: false,
          message: `${subdomain}.stayza.pro is not available`,
          suggestions,
        });
      }
    } catch (error) {
      setSubdomainStatus({
        available: false,
        message: "Error checking availability",
      });
    } finally {
      setIsCheckingSubdomain(false);
    }
  }, []);

  // Enhanced email validation with business domain checking
  const validateEmailInput = useCallback(async (email: string) => {
    if (!email) {
      setEmailValidation({ isValid: false, message: "" });
      return;
    }

    setIsValidatingEmail(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const validation = validateBusinessEmail(email);
      setEmailValidation(validation);
    } catch (error) {
      setEmailValidation({ isValid: false, message: "Error validating email" });
    } finally {
      setIsValidatingEmail(false);
    }
  }, []);

  // Phone number formatting handler
  const handlePhoneChange = useCallback(
    (value: string) => {
      const formatted = formatPhoneNumber(value);
      setPhoneFormatted(formatted);
      setValue("phoneNumber", value.replace(/\D/g, "")); // Store clean number
    },
    [setValue]
  );

  // Watch subdomain changes for availability check
  useEffect(() => {
    const subdomain = watchedData.customSubdomain;
    if (subdomain && subdomain.length >= 3) {
      const timeoutId = setTimeout(
        () => checkSubdomainAvailability(subdomain),
        500
      );
      return () => clearTimeout(timeoutId);
    }
  }, [watchedData.customSubdomain, checkSubdomainAvailability]);

  // Watch email changes for validation
  useEffect(() => {
    const email = watchedData.businessEmail;
    if (email && email.includes("@")) {
      const timeoutId = setTimeout(() => validateEmailInput(email), 500);
      return () => clearTimeout(timeoutId);
    }
  }, [watchedData.businessEmail, validateEmailInput]);

  // Watch password changes for strength checking
  useEffect(() => {
    const password = watchedData.password;
    const strength = checkPasswordStrength(password);
    setPasswordStrength(strength);
  }, [watchedData.password]);

  // Watch phone changes for formatting
  useEffect(() => {
    const phone = watchedData.phoneNumber;
    if (phone !== phoneFormatted.replace(/\D/g, "")) {
      setPhoneFormatted(formatPhoneNumber(phone || ""));
    }
  }, [watchedData.phoneNumber, phoneFormatted]);

  // Logo upload handler
  const handleLogoUpload = useCallback(
    (file: File) => {
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setLogoPreview(result);
          setValue("logo", file);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error("Please select a valid image file");
      }
    },
    [setValue]
  );

  // Form submission handler
  const onSubmit = async (data: RealtorRegistrationFormData) => {
    try {
      const formData = new FormData();

      // Add form fields
      formData.append("email", data.businessEmail);
      formData.append("password", data.password);
      formData.append(
        "firstName",
        data.fullName.split(" ")[0] || data.fullName
      );
      formData.append(
        "lastName",
        data.fullName.split(" ").slice(1).join(" ") || ""
      );
      formData.append("phone", data.phoneNumber || "");
      formData.append("role", "REALTOR");
      formData.append("agencyName", data.agencyName);
      formData.append("businessAddress", data.businessAddress);
      formData.append("customSubdomain", data.customSubdomain);
      formData.append("plan", plan);
      formData.append("primaryColor", data.primaryColor || "#8B5CF6");
      formData.append("tagline", data.tagline || "");

      // Add logo if uploaded
      if (data.logo) {
        formData.append("logo", data.logo);
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Registration failed");
      }

      // Store auth tokens
      if (result.data?.accessToken) {
        localStorage.setItem("accessToken", result.data.accessToken);
        localStorage.setItem("refreshToken", result.data.refreshToken);
      }

      // Show completion celebration
      setIsCompleted(true);

      // Redirect after celebration
      setTimeout(() => {
        router.push(
          `/realtor/verify-email?email=${encodeURIComponent(
            data.businessEmail
          )}`
        );
      }, 3000);
    } catch (error) {
      console.error("Registration failed:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.";

      toast.error(errorMessage);
    }
  };

  // Simple implementation - ready for enhancement
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Simple animated background - ready for enhancement */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800" />
      </div>

      {/* Simple navigation - ready for enhancement */}
      <nav className="relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Stayza</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Simple form - ready for enhancement */}
      <div className="relative z-10 max-w-lg mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            Join as Realtor
          </h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Simple form fields */}
            <input
              {...register("fullName")}
              placeholder="Full Name"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50"
            />
            <input
              {...register("businessEmail")}
              type="email"
              placeholder="Business Email"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50"
            />
            <input
              {...register("phoneNumber")}
              placeholder="Phone Number"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50"
            />
            <input
              {...register("password")}
              type="password"
              placeholder="Password"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50"
            />
            <input
              {...register("confirmPassword")}
              type="password"
              placeholder="Confirm Password"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50"
            />
            <input
              {...register("agencyName")}
              placeholder="Agency Name"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50"
            />
            <input
              {...register("businessAddress")}
              placeholder="Business Address"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50"
            />
            <input
              {...register("customSubdomain")}
              placeholder="Custom Subdomain"
              className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50"
            />

            <div className="flex items-center space-x-3">
              <input {...register("termsAccepted")} type="checkbox" />
              <label className="text-white text-sm">Accept Terms</label>
            </div>

            <div className="flex items-center space-x-3">
              <input {...register("privacyAccepted")} type="checkbox" />
              <label className="text-white text-sm">
                Accept Privacy Policy
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium"
            >
              {isSubmitting ? "Creating..." : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RealtorRegistrationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RealtorRegistrationContent />
    </Suspense>
  );
}
