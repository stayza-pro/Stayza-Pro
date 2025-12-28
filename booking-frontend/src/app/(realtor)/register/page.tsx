"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast, Toaster } from "react-hot-toast";
import { Button, Input } from "@/components/ui";
import {
  Eye,
  EyeOff,
  Upload,
  X,
  CheckCircle,
  Palette,
  Globe2,
  DollarSign,
  User,
  Briefcase,
  Share2,
  Check,
  AlertCircle,
  Wand2,
  Plus,
  Minus,
  Loader2,
  Phone,
  MapPin,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { palette } from "@/app/(marketing)/content";

// Import new components
import {
  realtorRegistrationSchema,
  type RealtorRegistrationFormData,
} from "./schema";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";
import { GuidedTipsCarousel } from "./GuidedTipsCarousel";
import PreviewComponent from "./PreviewComponent";

import { MobileStickyAction } from "./MobileStickyAction";

import { RadixColorSelector } from "./RadixColorSelector";
import { PhoneNumberFormatter } from "./PhoneNumberFormatter";
import { SocialMediaValidator } from "./SocialMediaValidator";

import { EnhancedErrorHandler } from "./EnhancedErrorHandler";
import ConditionalLogic from "./ConditionalLogic";
import { logError, trackAction } from "@/utils/errorLogger";
import CompletionCelebration from "./CompletionCelebration";
import { RealtorRegistrationApi, handleApiError, useApiState } from "./api";
import { useMultiDomainNavigation } from "@/hooks/useMultiDomainNavigation";
import {
  AnimatedButton,
  AnimatedInput,
  AnimatedProgress,
  SuccessAnimation,
} from "./SimpleAnimations";
import "./accessibility.css";

const colorOptions = [
  // Stayza Brand Colors
  { color: palette.primary, name: "Stayza Primary", category: "brand" },
  { color: palette.secondary, name: "Stayza Secondary", category: "brand" },
  { color: palette.accent, name: "Stayza Accent", category: "brand" },

  // Blues
  { color: "#1E40AF", name: "Royal Blue", category: "blue" },
  { color: "#3B82F6", name: "Bright Blue", category: "blue" },
  { color: "#0EA5E9", name: "Sky Blue", category: "blue" },
  { color: "#0284C7", name: "Light Blue", category: "blue" },
  { color: "#1E3A8A", name: "Dark Blue", category: "blue" },

  // Greens
  { color: "#10B981", name: "Emerald", category: "green" },
  { color: "#047857", name: "Dark Green", category: "green" },
  { color: "#059669", name: "Forest Green", category: "green" },
  { color: "#84CC16", name: "Lime", category: "green" },
  { color: "#22C55E", name: "Green", category: "green" },

  // Reds & Oranges
  { color: "#EF4444", name: "Red", category: "red" },
  { color: "#DC2626", name: "Dark Red", category: "red" },
  { color: "#F97316", name: "Orange", category: "orange" },
  { color: "#EA580C", name: "Dark Orange", category: "orange" },
  { color: "#FB923C", name: "Light Orange", category: "orange" },

  // Purples
  { color: "#8B5CF6", name: "Purple", category: "purple" },
  { color: "#7C3AED", name: "Violet", category: "purple" },
  { color: "#6366F1", name: "Indigo", category: "purple" },
  { color: "#A855F7", name: "Light Purple", category: "purple" },

  // Pinks
  { color: "#EC4899", name: "Pink", category: "pink" },
  { color: "#DB2777", name: "Dark Pink", category: "pink" },
  { color: "#F472B6", name: "Light Pink", category: "pink" },

  // Teals & Cyans
  { color: "#06B6D4", name: "Cyan", category: "teal" },
  { color: "#14B8A6", name: "Teal", category: "teal" },
  { color: "#0891B2", name: "Dark Cyan", category: "teal" },

  // Yellows & Ambers
  { color: "#F59E0B", name: "Amber", category: "yellow" },
  { color: "#EAB308", name: "Yellow", category: "yellow" },
  { color: "#D97706", name: "Dark Amber", category: "yellow" },

  // Grays
  { color: "#64748B", name: "Slate", category: "gray" },
  { color: "#6B7280", name: "Gray", category: "gray" },
  { color: "#374151", name: "Dark Gray", category: "gray" },
];

function RealtorRegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleRealtorRegistrationSuccess } = useMultiDomainNavigation();
  // Fixed to free plan only for now - paid plans will be added later
  const plan = "free"; // Always use free plan
  const formRef = useRef<HTMLFormElement>(null);

  // React Hook Form setup
  const methods = useForm<RealtorRegistrationFormData>({
    resolver: zodResolver(realtorRegistrationSchema),
    mode: "onChange",
    defaultValues: {
      // Account Info (Step 1)
      fullName: "",
      businessEmail: "",
      password: "",
      confirmPassword: "",

      // Business Info (Step 2)
      agencyName: "",
      tagline: "",
      customSubdomain: "",
      corporateRegNumber: "",
      cacCertificate: null,
      businessAddress: "",

      // Branding (Step 3)
      brandColor: palette.primary,
      primaryColor: palette.primary,
      secondaryColor: palette.secondary,
      accentColor: palette.accent,
      customPrimaryColor: "",
      customSecondaryColor: "",
      customAccentColor: "",
      logo: null,

      // Social media removed for MVP

      // Review & Compliance (Step 5)
      termsAccepted: false,
      privacyAccepted: false,
      marketingOptIn: false,
      dataProcessingConsent: false,
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid, dirtyFields },
    setValue,
    trigger,
    clearErrors,
    getValues,
  } = methods;

  // Watch all form values for preview
  const watchedData = watch();

  // UI State
  const [currentStep, setCurrentStep] = useState(0);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [subdomainStatus, setSubdomainStatus] = useState<{
    status: "idle" | "checking" | "available" | "unavailable" | "error";
    message: string;
    suggestions?: string[];
  }>({ status: "idle", message: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [previewMode, setPreviewMode] = useState<"guest" | "dashboard">(
    "guest"
  );
  // Language state removed - using English only
  const [currency, setCurrency] = useState<string>("USD");
  const [showGuidedTips, setShowGuidedTips] = useState(true);

  const [highlightRegion, setHighlightRegion] = useState<string | null>(null);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [showSocialFields, setShowSocialFields] = useState(false);
  const [socialValidation, setSocialValidation] = useState<{
    isValid: boolean;
    errors: Record<string, string>;
  }>({ isValid: true, errors: {} });
  const [emailValidation, setEmailValidation] = useState<{
    isValid: boolean;
    type: "business" | "personal" | "temporary" | "invalid";
    confidence: number;
  }>({ isValid: true, type: "business", confidence: 100 });

  // Error handling state
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<
    "online" | "offline" | "slow"
  >("online");

  // API states
  const registrationApi = useApiState();
  const subdomainApi = useApiState();
  const emailValidationApi = useApiState();
  const logoUploadApi = useApiState();
  const cacUploadApi = useApiState();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [cacDocumentUrl, setCacDocumentUrl] = useState<string | null>(null);

  // Animation states
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showCompletionCelebration, setShowCompletionCelebration] =
    useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<any>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);

  // Form step configuration
  const formSteps = [
    {
      id: "account",
      title: "Account Setup",
      icon: User,
      description: "Create your account credentials",
      fields: ["fullName", "businessEmail", "password", "confirmPassword"],
    },
    {
      id: "business",
      title: "Business Info",
      icon: Briefcase,
      description: "Tell us about your business",
      fields: [
        "agencyName",
        "tagline",
        "customSubdomain",
        "corporateRegNumber",
        "cacCertificate",
        "businessAddress",
      ],
    },
    {
      id: "branding",
      title: "Branding",
      icon: Palette,
      description: "Customize your brand appearance",
      fields: ["primaryColor", "secondaryColor", "accentColor"],
    },
    {
      id: "review",
      title: "Review & Submit",
      icon: Check,
      description: "Review and complete your registration",
      fields: [
        "termsAccepted",
        "privacyAccepted",
        "marketingOptIn",
        "dataProcessingConsent",
      ],
    },
  ];

  // Network monitoring
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus("online");
      toast.success("Connection restored");
    };

    const handleOffline = () => {
      setNetworkStatus("offline");
      toast.error("Connection lost. Your progress is saved locally.");
    };

    // Test network quality - simplified to avoid unnecessary requests
    const testNetworkQuality = () => {
      if (typeof navigator === "undefined" || !navigator.onLine) {
        setNetworkStatus("offline");
        return;
      }

      // Just check online status without making HTTP requests
      setNetworkStatus("online");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial network test
    testNetworkQuality();

    // Periodic network quality checks
    const qualityInterval = setInterval(testNetworkQuality, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(qualityInterval);
    };
  }, []);

  // Subdomain validation effect
  useEffect(() => {
    const subdomain = watchedData.customSubdomain;
    if (subdomain) {
      const timeoutId = setTimeout(() => {
        validateSubdomain(subdomain);
      }, 500); // Debounce for 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [watchedData.customSubdomain]);

  // Error notification handler with toast (only show on form submission attempts)
  const showErrorToasts = () => {
    const errorEntries = Object.entries(errors);

    if (errorEntries.length > 0) {
      if (errorEntries.length === 1) {
        // Single error - show specific message
        const [field, error] = errorEntries[0];
        let message = "Invalid input";
        if (typeof error === "string") {
          message = error;
        } else if (error && typeof error === "object" && "message" in error) {
          message = String(error.message) || "Invalid input";
        }

        const fieldName = field
          .replace(/([A-Z])/g, " $1")
          .replace(/\./g, " > ")
          .replace(/^./, (str) => str.toUpperCase())
          .trim();

        toast.error(`${fieldName}: ${message}`, {
          duration: 4000,
          position: "top-right",
        });
      } else {
        // Multiple errors - show summary
        toast.error(`Please fix ${errorEntries.length} validation errors`, {
          duration: 4000,
          position: "top-right",
        });
      }
    }
  };

  const showSocialValidationToasts = () => {
    if (
      !socialValidation.isValid &&
      Object.keys(socialValidation.errors).length > 0
    ) {
      Object.entries(socialValidation.errors).forEach(([platform, message]) => {
        const platformName =
          platform.charAt(0).toUpperCase() + platform.slice(1);
        toast.error(`${platformName}: ${message}`, {
          duration: 5000,
          position: "top-right",
        });
      });
    }
  };

  // Function to show individual field validation errors via toast
  const showFieldErrorToast = (fieldName: string, errorMessage: string) => {
    const displayName = fieldName
      .replace(/([A-Z])/g, " $1")
      .replace(/\./g, " > ")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();

    toast.error(`${displayName}: ${errorMessage}`, {
      duration: 3000,
      position: "top-right",
    });
  };

  // Enhanced step validation with comprehensive error checking
  const isStepValid = async (stepIndex: number) => {
    const stepFields = formSteps[stepIndex]?.fields || [];
    const result = await trigger(stepFields as any);

    // Get current form data and form errors
    const currentData = getValues();
    const formErrors = Object.keys(errors).length > 0;
    let isValid = result && !formErrors;
    let validationErrors: string[] = [];

    // Check for any existing form errors first and specifically check step fields
    const stepFieldErrors = stepFields.filter(
      (field) => errors[field as keyof typeof errors]
    );
    if (stepFieldErrors.length > 0) {
      isValid = false;
      stepFieldErrors.forEach((field) => {
        const error = errors[field as keyof typeof errors];
        if (error?.message) {
          validationErrors.push(`${field}: ${error.message}`);
        }
      });
    } // Step-specific validation
    switch (stepIndex) {
      case 0: // Account Setup
        if (!emailValidation.isValid) {
          validationErrors.push(
            "Please provide a valid business email address"
          );
          isValid = false;
        }

        // Check for required fields
        if (!currentData.fullName?.trim()) {
          validationErrors.push("Full name is required");
          isValid = false;
        }
        if (!currentData.businessEmail?.trim()) {
          validationErrors.push("Business email is required");
          isValid = false;
        }
        if (!currentData.password) {
          validationErrors.push("Password is required");
          isValid = false;
        }
        if (!currentData.confirmPassword) {
          validationErrors.push("Password confirmation is required");
          isValid = false;
        }
        if (currentData.password !== currentData.confirmPassword) {
          validationErrors.push("Passwords must match");
          isValid = false;
        }
        break;

      case 1: // Business Info
        if (!currentData.agencyName?.trim()) {
          validationErrors.push("Agency name is required");
          isValid = false;
        }
        if (!currentData.customSubdomain?.trim()) {
          validationErrors.push("Custom subdomain is required");
          isValid = false;
        }
        if (!currentData.businessAddress?.trim()) {
          validationErrors.push("Business address is required");
          isValid = false;
        }
        break;

      case 2: // Branding
        if (!currentData.primaryColor) {
          validationErrors.push("Primary color selection is required");
          isValid = false;
        }
        if (!currentData.secondaryColor) {
          validationErrors.push("Secondary color selection is required");
          isValid = false;
        }
        if (!currentData.accentColor) {
          validationErrors.push("Accent color selection is required");
          isValid = false;
        }
        break;
    }

    // Show validation error toasts
    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => {
        toast.error(error, {
          duration: 4000,
          position: "top-right",
        });
      });
      isValid = false;
    }

    return isValid && result;
  };

  const nextStep = async () => {
    const valid = await isStepValid(currentStep);
    console.log(`Step ${currentStep} validation result:`, valid);
    console.log("Current errors:", errors);
    console.log("Form data:", getValues());

    if (valid && currentStep < formSteps.length - 1) {
      // Mark current step as completed
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps((prev) => [...prev, currentStep]);
      }

      // Show success toast for completed step
      const stepName =
        formSteps[currentStep]?.title || `Step ${currentStep + 1}`;
      toast.success(`${stepName} completed successfully!`, {
        duration: 2000,
        position: "top-right",
      });

      setCurrentStep(currentStep + 1);
      clearErrors();
    } else if (!valid) {
      // Additional form-level error toast if needed
      toast.error(
        `Please complete all required fields in ${
          formSteps[currentStep]?.title || "this step"
        }`,
        {
          duration: 3000,
          position: "top-right",
        }
      );

      // Animate form to show errors
      const firstErrorField = document.querySelector(".border-red-500");
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      clearErrors();
    }
  };

  // Enhanced logo handling
  const handleLogoChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Logo file size must be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload a valid image file");
        return;
      }

      // Show preview immediately
      const reader = new FileReader();
      reader.onload = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);

      // Store the file temporarily for form submission
      setValue("logo", file);

      // Upload logo to server in background
      try {
        const uploadResult = await logoUploadApi.execute(
          () => RealtorRegistrationApi.uploadLogo(file),
          (data) => {
            setLogoUrl(data.url);
            toast.success("Logo uploaded successfully");
          },
          (error) => {
            toast.error(`Logo upload failed: ${error}`);
          }
        );
      } catch (error) {
        console.warn("Logo upload failed:", error);
      }
    }
  };

  const removeLogo = () => {
    setValue("logo", null);
    setLogoPreview(null);
    setLogoUrl(null);
    logoUploadApi.reset();
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  // CAC certificate upload handler
  const handleCacCertificateChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("CAC certificate file size must be less than 10MB");
        return;
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload a PDF or image file (JPG, PNG)");
        return;
      }

      // Store the file temporarily for form submission
      setValue("cacCertificate", file);

      // Upload CAC certificate to server in background
      try {
        await cacUploadApi.execute(
          () => RealtorRegistrationApi.uploadCacCertificate(file),
          (data) => {
            setCacDocumentUrl(data.url);
            toast.success("CAC certificate uploaded successfully");
          },
          (error) => {
            toast.error(`CAC certificate upload failed: ${error}`);
          }
        );
      } catch (error) {
        console.warn("CAC certificate upload failed:", error);
      }
    }
  };

  // Social media validation is now handled by SocialMediaValidator component

  // Enhanced form submission with API integration
  const onSubmit = async (formData: RealtorRegistrationFormData) => {
    setSubmitError(null);

    // Final validation check before submission
    const finalValid = await isStepValid(currentStep);
    if (!finalValid) {
      toast.error("Please complete all required fields before submitting", {
        duration: 4000,
        position: "top-right",
      });
      return;
    }

    // Register realtor via API with full response handling
    try {
      const response =
        await RealtorRegistrationApi.registerRealtorWithFullResponse({
          ...formData,
          // Include uploaded file URLs
          logoUrl: logoUrl,
          cacDocumentUrl: cacDocumentUrl,
          plan:
            new URLSearchParams(window.location.search).get("plan") || "free",
        });

      // Show success animation
      setShowSuccessAnimation(true);

      // Registration successful
      toast.success("Registration completed successfully!");

      // Debug: Log the complete response structure
      console.log("🔍 Complete API response:", response);
      console.log("🔍 Response data:", response.data);
      console.log("🔍 Response email:", response.data?.email);

      // Send verification email with null check
      if (response.data?.email) {
        await RealtorRegistrationApi.sendVerificationEmail(response.data.email);
      } else {
        console.error("❌ No email found in response data");
      }

      // Store registration data and show completion celebration
      if (response.data) {
        setRegistrationSuccess(response.data);
      }

      console.log("🎉 Realtor registration successful:", {
        subdomain: response.data?.subdomain,
        email: response.data?.email,
        status: response.data?.status,
        redirectUrls: response.redirectUrls,
      });

      // Wait for celebration animation to complete, then redirect
      setTimeout(() => {
        setShowSuccessAnimation(false);
        setShowCompletionCelebration(true);

        // After a brief celebration, redirect using backend-provided URLs
        setTimeout(() => {
          console.log("🔄 Redirecting after registration success");
          console.log("📍 Using backend redirect URLs:", {
            success: response.redirectUrls?.success,
            verification: response.redirectUrls?.verification,
            dashboard: response.redirectUrls?.dashboard,
          });

          // Use backend-provided redirect URL for consistent domain handling
          let redirectUrl =
            response.redirectUrls?.success || "/realtor/check-email";

          // Add email parameter to check-email URL if not already present
          if (
            redirectUrl.includes("/realtor/check-email") &&
            response.data?.email
          ) {
            const url = new URL(redirectUrl, window.location.origin);
            if (!url.searchParams.has("email")) {
              url.searchParams.set("email", response.data.email);
              redirectUrl = url.toString();
            }
          }

          console.log("🚀 Redirecting to:", redirectUrl);

          // Check if it's a cross-domain redirect
          const currentHost = window.location.host;
          const redirectHost = new URL(redirectUrl, window.location.origin)
            .host;

          if (currentHost !== redirectHost) {
            // Cross-domain redirect
            console.log("🌐 Cross-domain redirect detected");
            window.location.href = redirectUrl;
          } else {
            // Same-domain redirect, use Next.js router
            console.log("🔗 Same-domain redirect");
            window.location.href = redirectUrl; // Use window.location for simplicity
          }
        }, 2000); // Brief celebration time
      }, 3000); // Allow 3 seconds for celebration
    } catch (error: any) {
      // Registration failed
      const errorMessage = error.message || "Registration failed";
      setSubmitError(errorMessage);
      toast.error(errorMessage);

      // Use the enhanced error handler
      if (typeof window !== "undefined" && (window as any).addError) {
        const errorType =
          errorMessage.includes("network") ||
          errorMessage.includes("connection")
            ? "network"
            : errorMessage.includes("server") ||
              errorMessage.includes("unavailable")
            ? "server"
            : errorMessage.includes("validation") ||
              errorMessage.includes("invalid")
            ? "validation"
            : "unknown";

        (window as any).addError(errorType, errorMessage, {
          severity: "high",
          context: { step: "registration-submission" },
        });
      }
    }
  };

  // Enhanced error handling functions
  const handleRetry = async (errorId: string) => {
    console.log("Retrying operation for error:", errorId);

    // Determine what to retry based on the error context
    if (submitError) {
      // Retry form submission
      const currentData = methods.getValues();
      await onSubmit(currentData);
    } else {
      // Retry other operations (subdomain check, etc.)
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  const handleReportError = (error: any) => {
    console.log("Reporting error:", error);

    // Log error to error tracking service
    logError(error, {
      component: "RealtorRegistration",
      action: "registration_attempt",
      metadata: {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        currentStep: step,
      },
    });

    // Track error event for analytics
    trackAction("registration_error", "registration", {
      errorType: error?.message || "unknown",
      step: step,
    });
      formData: {
        step: currentStep,
        // Don't include sensitive data
        hasEmail: !!methods.getValues("businessEmail"),
        hasPassword: !!methods.getValues("password"),
      },
    };

    // Send to logging service
    fetch("/api/error-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorReport),
    }).catch(() => {
      // Silently fail if reporting fails
      console.warn("Failed to report error");
    });

    toast.success("Error report sent to our team");
  };

  const handleDismissError = (errorId: string) => {
    console.log("Dismissing error:", errorId);
    setSubmitError(null);
  };

  // Subdomain validation function
  const validateSubdomain = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainStatus({ status: "idle", message: "" });
      return;
    }

    setSubdomainStatus({
      status: "checking",
      message: "Checking availability...",
    });

    try {
      const result = await subdomainApi.execute(
        () => RealtorRegistrationApi.checkSubdomain(subdomain),
        (data) => {
          if (data.available) {
            setSubdomainStatus({
              status: "available",
              message: `${subdomain}.stayza.pro is available!`,
            });
          } else {
            setSubdomainStatus({
              status: "unavailable",
              message: data.message || "This subdomain is not available",
              suggestions: data.suggestions,
            });
          }
        },
        (error) => {
          setSubdomainStatus({
            status: "error",
            message: `Error checking subdomain: ${error}`,
          });
        }
      );
    } catch (error) {
      setSubdomainStatus({
        status: "error",
        message: "Unable to check subdomain availability",
      });
    }
  };

  // Step content rendering
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Account Setup
        return (
          <div className="space-y-6">
            <AnimatedInput
              placeholder="Enter your full name"
              value={watchedData.fullName || ""}
              onChange={(value) => setValue("fullName", value)}
              error={!!errors.fullName}
              success={!!watchedData.fullName && !errors.fullName}
              disabled={isSubmitting || registrationApi.isLoading}
            />

            <div>
              <label
                htmlFor="businessEmail"
                className="block text-sm font-medium mb-2"
                style={{ color: palette.neutralDark }}
              >
                Email Address
                <span className="text-red-500 ml-1" aria-label="required">
                  *
                </span>
              </label>
              <input
                type="email"
                id="businessEmail"
                value={watchedData.businessEmail || ""}
                onChange={(e) => setValue("businessEmail", e.target.value)}
                placeholder="youremail@example.com"
                className="w-full px-4 py-3 text-sm text-black border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your email address.
              </p>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: palette.neutralDark }}
              >
                Password
              </label>
              <div className="relative">
                <Input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  className={
                    errors.password
                      ? "border-red-500 pr-10 text-black"
                      : "pr-10 text-black"
                  }
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              <PasswordStrengthMeter password={watchedData.password || ""} />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: palette.neutralDark }}
              >
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  {...register("confirmPassword")}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  className={
                    errors.confirmPassword
                      ? "border-red-500 pr-10 text-black"
                      : "pr-10 text-black"
                  }
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        );

      case 1: // Business Info
        return (
          <div className="space-y-6">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: palette.neutralDark }}
              >
                Agency/Company Name
                <span className="text-red-500 ml-1">*</span>
              </label>
              <Input
                {...register("agencyName")}
                type="text"
                placeholder="Enter your company name (e.g., Premium Properties LLC)"
                className={
                  errors.agencyName ? "border-red-500 text-black" : "text-black"
                }
                disabled={isSubmitting || registrationApi.isLoading}
              />
              {errors.agencyName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.agencyName.message}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: palette.neutralDark }}
              >
                Tagline (Optional)
              </label>
              <Input
                {...register("tagline")}
                type="text"
                placeholder="Luxury stays, unforgettable experiences"
                className={
                  errors.tagline ? "border-red-500 text-black" : "text-black"
                }
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: palette.neutralDark }}
              >
                Your Booking Website Address
                <span className="text-red-500 ml-1">*</span>
              </label>
              <p className="text-xs text-gray-600 mb-2">
                We'll create your professional booking website at this address
              </p>
              <div className="flex">
                <Input
                  {...register("customSubdomain")}
                  type="text"
                  placeholder="yourcompany"
                  onChange={(e) => {
                    // Normalize to lowercase as user types
                    const normalized = e.target.value.toLowerCase();
                    setValue("customSubdomain", normalized);

                    // Trigger validation when subdomain changes
                    if (normalized && normalized.length >= 3) {
                      validateSubdomain(normalized);
                    }
                  }}
                  className={
                    errors.customSubdomain
                      ? "border-red-500 rounded-r-none text-black"
                      : subdomainStatus?.status === "available"
                      ? "border-green-500 rounded-r-none text-black"
                      : subdomainStatus?.status === "unavailable"
                      ? "border-red-500 rounded-r-none text-black"
                      : "rounded-r-none text-black"
                  }
                  disabled={isSubmitting || registrationApi.isLoading}
                />
                <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  .stayza.pro
                </span>
                {subdomainApi.isLoading && (
                  <div className="ml-2 flex items-center">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Subdomain validation status */}
            {subdomainStatus?.message && (
              <div className="mt-2">
                <p
                  className={`text-sm ${
                    subdomainStatus?.status === "available"
                      ? "text-green-600"
                      : subdomainStatus?.status === "unavailable"
                      ? "text-red-600"
                      : subdomainStatus?.status === "error"
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}
                >
                  {subdomainStatus.message}
                </p>

                {/* Additional subdomain suggestions if needed */}
                {subdomainStatus?.suggestions &&
                  subdomainStatus.suggestions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">
                        Try these alternatives:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {subdomainStatus.suggestions
                          .slice(0, 3)
                          .map((suggestion: string) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => {
                                setValue("customSubdomain", suggestion);
                                validateSubdomain(suggestion);
                              }}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            >
                              {suggestion}.stayza.pro
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            )}

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: palette.neutralDark }}
              >
                Corporate Registration Number
                <span className="text-red-500 ml-1">*</span>
              </label>
              <Input
                {...register("corporateRegNumber")}
                type="text"
                placeholder="RC 123456"
                className={
                  errors.corporateRegNumber
                    ? "border-red-500 text-black"
                    : "text-black"
                }
              />
              {errors.corporateRegNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.corporateRegNumber.message}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-4"
                style={{ color: palette.neutralDark }}
              >
                CAC Certificate Upload
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                {watchedData.cacCertificate ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black">
                          CAC Certificate uploaded
                        </p>
                        <p className="text-xs text-gray-500">Click to change</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setValue("cacCertificate", null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Upload CAC Certificate
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          PDF, JPG, PNG up to 10MB
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleCacCertificateChange}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: palette.neutralDark }}
              >
                Business Address
                <span className="text-red-500 ml-1">*</span>
              </label>
              <Input
                {...register("businessAddress")}
                type="text"
                placeholder="Enter your complete business address"
                className={
                  errors.businessAddress
                    ? "border-red-500 text-black"
                    : "text-black"
                }
                disabled={isSubmitting || registrationApi.isLoading}
              />
              {errors.businessAddress && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.businessAddress.message}
                </p>
              )}
            </div>
          </div>
        );

      case 2: // Branding
        return (
          <div className="space-y-6">
            <div>
              <label
                className="block text-sm font-medium mb-4"
                style={{ color: palette.neutralDark }}
              >
                Logo Upload
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                {logoPreview ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Image
                        src={logoPreview}
                        alt="Logo preview"
                        width={64}
                        height={64}
                        className="rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium">Logo uploaded</p>
                        <p className="text-xs text-gray-500">Click to change</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Upload your logo
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          PNG, JPG, GIF up to 5MB
                        </span>
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Choose Your Brand Colors */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Choose Your Brand Colors
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Select three colors for your brand palette: Primary (main
                    brand color), Secondary (supporting color), and Accent
                    (highlight color). These colors will create a cohesive and
                    professional look throughout your booking website.
                  </p>

                  <RadixColorSelector
                    selectedColors={{
                      primary: watchedData.primaryColor,
                      secondary: watchedData.secondaryColor,
                      accent: watchedData.accentColor,
                    }}
                    onColorSelect={(colorType, hex, name) => {
                      if (colorType === "primary") {
                        setValue("primaryColor", hex);
                        setValue("brandColor", hex); // Keep brandColor in sync
                      } else if (colorType === "secondary") {
                        setValue("secondaryColor", hex);
                      } else if (colorType === "accent") {
                        setValue("accentColor", hex);
                      }

                      clearErrors("brandColor");
                      clearErrors("primaryColor");
                      clearErrors("secondaryColor");
                      clearErrors("accentColor");
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: palette.neutralDark }}
              >
                Business Tagline (Optional)
              </label>
              <Input
                {...register("tagline")}
                type="text"
                placeholder="Your business tagline..."
                className={
                  errors.tagline ? "border-red-500 text-black" : "text-black"
                }
              />
            </div>
          </div>
        );

      case 3: // Review & Compliance (social media step removed)
        return (
          <div className="space-y-6">
            <div>
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: palette.neutralDark }}
              >
                Review Your Information
              </h3>
              <div className="rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Full Name:</span>
                    <div>{watchedData.fullName || "Not provided"}</div>
                  </div>
                  <div>
                    <span className="font-medium">Agency:</span>
                    <div>{watchedData.agencyName || "Not provided"}</div>
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>
                    <div>{watchedData.businessEmail || "Not provided"}</div>
                  </div>
                  <div>
                    <span className="font-medium">Subdomain:</span>
                    <div>
                      {watchedData.customSubdomain
                        ? `${watchedData.customSubdomain}.stayza.pro`
                        : "Not provided"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4
                className="text-md font-semibold"
                style={{ color: palette.neutralDark }}
              >
                Legal & Compliance
              </h4>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("termsAccepted")}
                  className="mt-1 text-blue-600"
                />
                <span className="text-sm">
                  I accept the{" "}
                  <a href="#" className="text-blue-600 hover:underline">
                    Terms of Service
                  </a>{" "}
                  and
                  <a href="#" className="text-blue-600 hover:underline ml-1">
                    Privacy Policy
                  </a>
                </span>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("privacyAccepted")}
                  className="mt-1 text-blue-600"
                />
                <span className="text-sm">
                  I acknowledge the processing of my personal data as described
                  in the Privacy Policy
                </span>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("dataProcessingConsent")}
                  className="mt-1 text-blue-600"
                />
                <span className="text-sm">
                  I consent to the processing of my data for account creation
                  and service provision
                </span>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("marketingOptIn")}
                  className="mt-1 text-blue-600"
                />
                <span className="text-sm">
                  I would like to receive marketing communications and updates
                  (Optional)
                </span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <div
        className="marketing-theme p-10"
        style={{ backgroundColor: palette.primary }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute right-[-18%] top-[-35%] h-[460px] w-[460px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-[-30%] left-[-8%] h-[380px] w-[380px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(4,120,87,0.25) 0%, transparent 70%)",
            }}
          />
        </div>

        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: "var(--marketing-elevated)",
              color: "var(--marketing-foreground)",
              borderRadius: "12px",
              boxShadow:
                "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              border: "1px solid var(--marketing-border)",
            },
          }}
        />

        {/* Enhanced Error Handler */}
        <EnhancedErrorHandler
          onRetry={handleRetry}
          onReport={handleReportError}
          onDismiss={handleDismissError}
          showNetworkStatus={true}
          retryConfig={{
            maxRetries: 3,
            retryOn: ["network", "server", "timeout"],
          }}
        />

        {/* Guided Tips Carousel for first-time users */}
        {isFirstVisit && showGuidedTips && (
          <GuidedTipsCarousel
            isOpen={showGuidedTips}
            onClose={() => {
              setShowGuidedTips(false);
            }}
          />
        )}

        <div className="max-w-7xl mx-auto">
          {/* Skip Links for Screen Readers */}
          <div className="sr-only">
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            <a href="#form-content" className="skip-link">
              Skip to form
            </a>
            <a href="#preview-content" className="skip-link">
              Skip to preview
            </a>
          </div>

          {/* Header */}
          <header className="text-center mb-12 pt-8 pb-16" role="banner">
            <nav aria-label="Breadcrumb" className="mb-8">
              <Link
                href="/get-started"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/10"
                aria-label="Go back to pricing plans"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to plans
              </Link>
            </nav>

            <div className="space-y-8 text-white">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]">
                Booking made personal
              </span>

              <h1
                id="main-heading"
                className="text-4xl font-bold leading-tight md:text-6xl text-white"
              >
                Create Your Stayza Account
              </h1>

              <p className="max-w-xl text-lg text-white/80 md:text-xl mx-auto leading-relaxed">
                Set up your real estate booking platform in minutes and start
                accepting bookings instantly
              </p>

              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white/90">
                <span className="w-2 h-2 bg-white/70 rounded-full"></span>
                Selected Plan: <span className="font-bold">Free Tier</span>
              </div>
            </div>
          </header>

          {/* Form Stepper */}
          <nav
            className="mb-8"
            aria-label="Registration progress steps"
            role="navigation"
          >
            <AnimatedProgress
              currentStep={currentStep}
              steps={formSteps.map((step) => step.title)}
              completedSteps={completedSteps}
            />
          </nav>

          <main
            id="main-content"
            className="grid lg:grid-cols-2 gap-12 px-6 pb-24"
            role="main"
          >
            {/* Registration Form */}
            <section
              className="w-full"
              aria-labelledby="form-heading"
              role="form"
            >
              <div className="rounded-[32px] border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur">
                <div className="space-y-6 rounded-[24px] border border-marketing-subtle bg-marketing-elevated p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h2
                      id="form-heading"
                      className="text-2xl font-bold text-marketing-foreground"
                      aria-live="polite"
                    >
                      {formSteps[currentStep].title}
                    </h2>
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        backgroundColor: "var(--marketing-primary-mist)",
                        color: palette.neutralDark,
                      }}
                    >
                      Step {currentStep + 1} of {formSteps.length}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-marketing-subtle bg-marketing-surface p-5">
                    <p
                      className="text-marketing-muted text-sm leading-relaxed"
                      id="step-description"
                      aria-live="polite"
                    >
                      {formSteps[currentStep].description}
                    </p>
                  </div>

                  <form
                    id="form-content"
                    onSubmit={handleSubmit(onSubmit as any)}
                    aria-describedby="step-description"
                    noValidate
                  >
                    {renderStepContent()}

                    {/* Conditional Logic & Smart Defaults */}
                    <ConditionalLogic
                      formMethods={methods}
                      currentStep={currentStep}
                      plan={plan || "free"}
                    />

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-marketing-subtle">
                      <AnimatedButton
                        type="button"
                        variant="secondary"
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className="flex items-center gap-2"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                      </AnimatedButton>

                      {currentStep < formSteps.length - 1 ? (
                        <AnimatedButton
                          type="button"
                          onClick={nextStep}
                          variant="primary"
                          className="flex items-center gap-2"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </AnimatedButton>
                      ) : (
                        <AnimatedButton
                          type="submit"
                          variant="primary"
                          disabled={isSubmitting || registrationApi.isLoading}
                          className="flex items-center justify-center gap-2"
                        >
                          {isSubmitting || registrationApi.isLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              {logoUploadApi.isLoading
                                ? "Uploading logo..."
                                : registrationApi.isLoading
                                ? "Creating account..."
                                : "Processing..."}
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Complete Registration
                            </>
                          )}
                        </AnimatedButton>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </section>

            {/* Preview Panel */}
            <aside
              className="w-full"
              aria-labelledby="preview-heading"
              role="complementary"
            >
              <div className="sticky top-8">
                <div className="rounded-[32px] border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur">
                  <div className="space-y-6 rounded-[24px] border border-marketing-subtle bg-marketing-elevated p-6 shadow-xl">
                    <div
                      className="flex items-center justify-between"
                      role="group"
                      aria-label="Preview header"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-12 w-12 rounded-full"
                          style={{ backgroundColor: palette.secondary }}
                        />
                        <div>
                          <p className="text-sm font-semibold text-marketing-foreground">
                            Live Preview
                          </p>
                          <p className="text-xs text-marketing-muted">
                            yourbrand.stayza.pro
                          </p>
                        </div>
                      </div>
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: "var(--marketing-primary-mist)",
                          color: palette.neutralDark,
                        }}
                      >
                        Live Preview
                      </span>
                    </div>

                    <PreviewComponent
                      data={watchedData}
                      previewMode={previewMode}
                      logoPreview={logoPreview}
                      currency={currency}
                      highlightRegion={highlightRegion || undefined}
                      isLoading={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </aside>
          </main>
        </div>

        {/* Success Animation Overlay */}
        {showSuccessAnimation && (
          <SuccessAnimation
            isVisible={showSuccessAnimation}
            onComplete={() => setShowSuccessAnimation(false)}
          />
        )}

        {/* Completion Celebration & Next Steps */}
        {showCompletionCelebration && registrationSuccess && (
          <CompletionCelebration
            realtorData={{
              fullName:
                registrationSuccess.fullName ||
                watchedData.fullName ||
                "New Realtor",
              businessEmail:
                registrationSuccess.email || watchedData.businessEmail || "",
              agencyName:
                registrationSuccess.agencyName ||
                watchedData.agencyName ||
                "Your Agency",
              subdomain: registrationSuccess.subdomain || "yoursubdomain",
              plan: plan || "free",
              logo: logoUrl || undefined,
              primaryColor: watchedData.primaryColor || palette.primary,
            }}
            onComplete={() => {
              setShowCompletionCelebration(false);
              // Redirect to email verification or dashboard
              if (registrationSuccess.email) {
                router.push(
                  `/auth/verify-email?email=${encodeURIComponent(
                    registrationSuccess.email
                  )}&type=realtor&subdomain=${encodeURIComponent(
                    registrationSuccess.subdomain || "yoursubdomain"
                  )}`
                );
              } else {
                router.push("/dashboard");
              }
            }}
          />
        )}

        {/* Mobile Sticky Action Bar */}
        <MobileStickyAction
          currentStep={currentStep}
          totalSteps={formSteps.length}
          stepLabels={formSteps.map((step) => step.title)}
          canContinue={
            isValid &&
            !Object.keys(errors).length &&
            (currentStep !== 0 || emailValidation.isValid)
          }
          isLastStep={currentStep === formSteps.length - 1}
          isSubmitting={isSubmitting || registrationApi.isLoading}
          onNext={() => {
            if (currentStep < formSteps.length - 1) {
              setCurrentStep(currentStep + 1);
            }
          }}
          onPrevious={() => {
            if (currentStep > 0) {
              setCurrentStep(currentStep - 1);
            }
          }}
          onSubmit={methods.handleSubmit(onSubmit as any)}
          errors={errors as Record<string, string>}
        />
      </div>
    </FormProvider>
  );
}

export default function RealtorRegistrationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <RealtorRegistrationContent />
    </Suspense>
  );
}
