"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast, Toaster } from "react-hot-toast";
import { Button, Input, Card } from "@/components/ui";
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
import { ErrorSummary } from "./ErrorSummary";
import { ColorPaletteGenerator } from "./ColorPaletteGenerator";
import { PhoneNumberFormatter } from "./PhoneNumberFormatter";
import { SocialMediaValidator } from "./SocialMediaValidator";

import { AccessibilityEnhancer } from "./AccessibilityEnhancer";
import { BusinessEmailValidator } from "./BusinessEmailValidator";
import { EnhancedErrorHandler } from "./EnhancedErrorHandler";
import ConditionalLogic from "./ConditionalLogic";
import SmartInput from "./SmartInput";
import CompletionCelebration from "./CompletionCelebration";
import { RealtorRegistrationApi, handleApiError, useApiState } from "./api";
import {
  AnimatedButton,
  AnimatedInput,
  AnimatedProgress,
  AnimatedCard,
  SuccessAnimation,
} from "./SimpleAnimations";
import "./accessibility.css";

const colorOptions = [
  palette.primary, // Marketing Primary
  palette.secondary, // Marketing Secondary
  palette.accent, // Marketing Accent
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#F59E0B", // Amber
];

function RealtorRegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "free";
  const formRef = useRef<HTMLFormElement>(null);

  // React Hook Form setup
  const methods = useForm<RealtorRegistrationFormData>({
    resolver: zodResolver(realtorRegistrationSchema),
    mode: "onChange",
    defaultValues: {
      // Account Info (Step 1)
      fullName: "",
      businessEmail: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",

      // Business Info (Step 2)
      agencyName: "",
      tagline: "",
      customSubdomain: "",
      corporateRegNumber: "",
      businessAddress: "",

      // Branding (Step 3)
      primaryColor: palette.primary,
      secondaryColor: palette.secondary,
      accentColor: palette.accent,
      customPrimaryColor: "",
      customSecondaryColor: "",
      customAccentColor: "",
      logo: null,

      // Social Media (Step 4)
      socials: {
        website: "",
        instagram: "",
        twitter: "",
        linkedin: "",
        facebook: "",
        youtube: "",
      },
      whatsappType: "personal",

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
  const [language, setLanguage] = useState<string>("en");
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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

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
      title: "Business Info",
      icon: Briefcase,
      description: "Tell us about your business",
      fields: [
        "agencyName",
        "tagline",
        "customSubdomain",
        "corporateRegNumber",
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
      id: "social",
      title: "Social & Contact",
      icon: Share2,
      description: "Add your social media profiles",
      fields: ["socials", "whatsappType"],
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

  // Step validation and navigation
  const isStepValid = async (stepIndex: number) => {
    const stepFields = formSteps[stepIndex]?.fields || [];
    const result = await trigger(stepFields as any);

    // Special validation for account setup step (includes email validation)
    if (stepIndex === 0) {
      return result && emailValidation.isValid;
    }

    // Special validation for social media step
    if (stepIndex === 3) {
      return result && socialValidation.isValid;
    }

    return result;
  };

  const nextStep = async () => {
    const valid = await isStepValid(currentStep);
    if (valid && currentStep < formSteps.length - 1) {
      // Mark current step as completed
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps((prev) => [...prev, currentStep]);
      }

      setCurrentStep(currentStep + 1);
      clearErrors();
    } else if (!valid) {
      toast.error("Please fix the errors before continuing");

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

  // Social media validation is now handled by SocialMediaValidator component

  // Enhanced form submission with API integration
  const onSubmit = async (formData: RealtorRegistrationFormData) => {
    setSubmitError(null);

    // Register realtor via API
    const registrationResult = await registrationApi.execute(
      () =>
        RealtorRegistrationApi.registerRealtor({
          ...formData,
          plan:
            new URLSearchParams(window.location.search).get("plan") || "free",
        }),
      async (data) => {
        // Show success animation
        setShowSuccessAnimation(true);

        // Registration successful
        toast.success("Registration completed successfully!");

        // Send verification email
        await RealtorRegistrationApi.sendVerificationEmail(data.email);

        // Store registration data and show completion celebration
        setRegistrationSuccess(data);

        // Wait for celebration animation to complete, then show completion screen
        setTimeout(() => {
          setShowSuccessAnimation(false);
          setShowCompletionCelebration(true);
        }, 3000); // Allow 3 seconds for celebration
      },
      (error) => {
        // Registration failed
        setSubmitError(error);

        // Use the enhanced error handler
        if (typeof window !== "undefined" && (window as any).addError) {
          const errorType =
            error.includes("network") || error.includes("connection")
              ? "network"
              : error.includes("server") || error.includes("unavailable")
              ? "server"
              : error.includes("validation") || error.includes("invalid")
              ? "validation"
              : "unknown";

          (window as any).addError(errorType, error, {
            severity: "high",
            context: { step: "registration-submission" },
          });
        }
      }
    );
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

    // TODO: Implement error reporting to analytics/logging service
    const errorReport = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      error: error,
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
              <BusinessEmailValidator
                value={watchedData.businessEmail || ""}
                onChange={(value) => {
                  setValue("businessEmail", value);
                  if (emailValidation.isValid) {
                    clearErrors("businessEmail");
                  }
                }}
                onValidationChange={(result) => {
                  setEmailValidation({
                    isValid: result.isValid,
                    type: result.type,
                    confidence: result.confidence,
                  });

                  // Set form errors based on validation
                  if (!result.isValid) {
                    // We need to trigger validation to set the error
                    trigger("businessEmail");
                  } else {
                    clearErrors("businessEmail");
                  }
                }}
                placeholder="your.email@domain.com"
                required={true}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter a valid email address for account verification.
              </p>
              {errors.businessEmail && (
                <p
                  id="businessEmail-error"
                  className="text-red-500 text-sm mt-1"
                  role="alert"
                  aria-live="polite"
                >
                  {errors.businessEmail.message}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: palette.neutralDark }}
              >
                Phone Number
              </label>
              <PhoneNumberFormatter
                value={watchedData.phoneNumber || ""}
                onChange={(raw, formatted, isValid) => {
                  setValue("phoneNumber", formatted);
                  if (isValid) {
                    clearErrors("phoneNumber");
                  }
                }}
                error={errors.phoneNumber?.message}
                placeholder="Enter your phone number"
              />
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
                  className={errors.password ? "border-red-500 pr-10" : "pr-10"}
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
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
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
                    errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"
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
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>
        );

      case 1: // Business Info
        return (
          <div className="space-y-6">
            <SmartInput
              label="Agency/Company Name"
              value={watchedData.agencyName || ""}
              onChange={(value, metadata) => {
                setValue("agencyName", value);

                // Business type can be inferred from agency name for UI purposes only
                if (metadata?.businessType) {
                  console.log(
                    `Detected business type: ${metadata.businessType}`
                  );
                }

                // Auto-suggest website domain if not set
                if (metadata?.websiteDomain && !watchedData.socials?.website) {
                  const currentSocials = watchedData.socials || {};
                  setValue("socials", {
                    ...currentSocials,
                    website: metadata.websiteDomain,
                  });
                }
              }}
              placeholder="Enter your company name (e.g., Premium Properties LLC)"
              suggestionType="business"
              required
              error={errors.agencyName?.message}
              disabled={isSubmitting || registrationApi.isLoading}
              onSuggestionSelect={(suggestion) => {
                console.log("Business type selected:", suggestion);
              }}
            />

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
                className={errors.tagline ? "border-red-500" : ""}
              />
              {errors.tagline && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.tagline.message}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: palette.neutralDark }}
              >
                Custom Subdomain
              </label>
              <div className="flex">
                <Input
                  {...register("customSubdomain")}
                  type="text"
                  placeholder="yourcompany"
                  className={
                    errors.customSubdomain
                      ? "border-red-500 rounded-r-none"
                      : subdomainStatus?.status === "available"
                      ? "border-green-500 rounded-r-none"
                      : subdomainStatus?.status === "unavailable"
                      ? "border-red-500 rounded-r-none"
                      : "rounded-r-none"
                  }
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

              {/* Subdomain validation status */}
              {subdomainStatus?.message && (
                <p
                  className={`text-sm mt-1 ${
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
              )}

              {/* Subdomain suggestions */}
              {subdomainStatus?.suggestions &&
                subdomainStatus.suggestions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-1">Suggestions:</p>
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
                            {suggestion}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

              {errors.customSubdomain && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.customSubdomain.message}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: palette.neutralDark }}
              >
                Corporate Registration Number (Optional)
              </label>
              <Input
                {...register("corporateRegNumber")}
                type="text"
                placeholder="RC 123456"
                className={errors.corporateRegNumber ? "border-red-500" : ""}
              />
              {errors.corporateRegNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.corporateRegNumber.message}
                </p>
              )}
            </div>

            <SmartInput
              label="Business Address"
              value={watchedData.businessAddress || ""}
              onChange={(value, metadata) => {
                setValue("businessAddress", value);

                // Auto-populate related fields if metadata is available
                if (metadata) {
                  // Location data can be used to enhance business address field
                  if (metadata.city && metadata.state && metadata.country) {
                    const currentAddress = watchedData.businessAddress || "";
                    if (!currentAddress.trim()) {
                      const fullAddress = `${metadata.city}, ${metadata.state}, ${metadata.country}`;
                      setValue("businessAddress", fullAddress);
                    }
                  }
                }
              }}
              placeholder="Enter your business address (e.g., Lagos, Nigeria)"
              suggestionType="location"
              required
              error={errors.businessAddress?.message}
              disabled={isSubmitting || registrationApi.isLoading}
              onSuggestionSelect={(suggestion) => {
                console.log("Location selected:", suggestion);
              }}
            />
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

            <div>
              <ColorPaletteGenerator
                businessType={watchedData.businessAddress || ""}
                businessName={watchedData.agencyName || ""}
                currentColors={{
                  primary: watchedData.primaryColor,
                  secondary: watchedData.secondaryColor,
                }}
                onColorsChange={(colors) => {
                  setValue("primaryColor", colors.primary);
                  setValue("secondaryColor", colors.secondary);
                  clearErrors("primaryColor");
                  clearErrors("secondaryColor");
                }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: palette.neutralDark }}
              >
                Tagline
              </label>
              <Input
                {...register("tagline")}
                type="text"
                placeholder="Your business tagline..."
                className={errors.tagline ? "border-red-500" : ""}
              />
              {errors.tagline && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.tagline.message}
                </p>
              )}
            </div>
          </div>
        );

      case 3: // Social Media
        return (
          <div className="space-y-6">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: palette.neutralDark }}
              >
                WhatsApp Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    {...register("whatsappType")}
                    value="personal"
                    className="text-blue-600"
                  />
                  <span>Personal</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    {...register("whatsappType")}
                    value="business"
                    className="text-blue-600"
                  />
                  <span>Business</span>
                </label>
              </div>
            </div>

            <SocialMediaValidator
              profiles={
                Object.fromEntries(
                  Object.entries(watchedData.socials || {}).filter(
                    ([_, value]) => value !== undefined
                  )
                ) as Record<string, string>
              }
              onChange={(updatedProfiles) => {
                setValue("socials", updatedProfiles);
                clearErrors("socials");
              }}
              onValidationChange={(isValid, errors) => {
                setSocialValidation({ isValid, errors });

                // Clear or set form errors based on validation
                if (isValid) {
                  clearErrors("socials");
                } else {
                  // Set errors for invalid social media URLs
                  Object.entries(errors).forEach(([platform, message]) => {
                    // We can't directly set nested errors, so we'll handle this in the validation
                    console.log(
                      `Social media validation error for ${platform}: ${message}`
                    );
                  });
                }
              }}
              maxProfiles={6}
              required={["website"]} // Make website required
              className="mt-4"
            />

            {/* Display social validation errors */}
            {!socialValidation.isValid &&
              Object.keys(socialValidation.errors).length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    Please fix the following social media URLs:
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {Object.entries(socialValidation.errors).map(
                      ([platform, message]) => (
                        <li key={platform} className="flex items-center">
                          <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                          <strong className="capitalize mr-1">
                            {platform}:
                          </strong>
                          {message}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
          </div>
        );

      case 4: // Review & Compliance
        return (
          <div className="space-y-6">
            <div>
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: palette.neutralDark }}
              >
                Review Your Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
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
              {errors.termsAccepted && (
                <p className="text-red-500 text-sm">
                  {errors.termsAccepted.message}
                </p>
              )}

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
              {errors.privacyAccepted && (
                <p className="text-red-500 text-sm">
                  {errors.privacyAccepted.message}
                </p>
              )}

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
              {errors.dataProcessingConsent && (
                <p className="text-red-500 text-sm">
                  {errors.dataProcessingConsent.message}
                </p>
              )}

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
        className="min-h-screen py-12 px-4"
        style={{ backgroundColor: palette.neutralLight }}
      >
        <Toaster position="top-right" />

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

        {/* Error Summary */}
        {Object.keys(errors).length > 0 && (
          <ErrorSummary
            errors={Object.entries(errors).reduce((acc, [key, error]) => {
              // Safely extract string message from any error type
              let message = "Invalid input";
              if (typeof error === "string") {
                message = error;
              } else if (
                error &&
                typeof error === "object" &&
                "message" in error
              ) {
                message = String(error.message) || "Invalid input";
              } else if (
                error &&
                typeof error === "object" &&
                "type" in error
              ) {
                message = `Validation error: ${error.type}`;
              }
              acc[key] = message;
              return acc;
            }, {} as Record<string, string>)}
            currentStep={currentStep}
            stepNames={formSteps.map((step) => step.title)}
            onFieldFocus={(fieldName, step) => {
              if (step !== undefined && step !== currentStep) {
                setCurrentStep(step);
              }
              // Focus field after step change
              setTimeout(() => {
                const element = document.querySelector(
                  `[name="${fieldName}"]`
                ) as HTMLElement;
                element?.focus?.();
              }, 300);
            }}
            onStepChange={setCurrentStep}
          />
        )}

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
          <header className="text-center mb-8" role="banner">
            <nav aria-label="Breadcrumb">
              <Link
                href="/get-started"
                className="inline-flex items-center hover:opacity-80 mb-4"
                style={{ color: palette.primary }}
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

            <div className="flex items-center justify-center gap-4 mb-4">
              <h1
                id="main-heading"
                className="text-4xl font-bold"
                style={{ color: palette.neutralDark }}
              >
                Create Your Stayza Account
              </h1>
            </div>

            <p
              className="text-xl"
              style={{ color: palette.neutralDark + "CC" }}
            >
              Set up your real estate booking platform in minutes
            </p>
            <div
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-4"
              style={{
                backgroundColor: palette.primary + "20",
                color: palette.primary,
              }}
            >
              Selected Plan:{" "}
              <span className="ml-1 capitalize font-bold">{plan}</span>
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
            className="grid lg:grid-cols-5 gap-8"
            role="main"
          >
            {/* Registration Form */}
            <section
              className="lg:col-span-2"
              aria-labelledby="form-heading"
              role="form"
            >
              <Card className="p-8 shadow-xl border-0">
                <div className="flex items-center justify-between mb-6">
                  <h2
                    id="form-heading"
                    className="text-2xl font-bold"
                    style={{ color: palette.neutralDark }}
                    aria-live="polite"
                  >
                    {formSteps[currentStep].title}
                  </h2>
                  <span
                    className="text-sm text-gray-500"
                    aria-label={`Step ${currentStep + 1} of ${
                      formSteps.length
                    }`}
                  >
                    {currentStep + 1} of {formSteps.length}
                  </span>
                </div>

                <p
                  className="text-gray-600 mb-6"
                  id="step-description"
                  aria-live="polite"
                >
                  {formSteps[currentStep].description}
                </p>

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

                  {/* Animated Navigation Buttons */}
                  <div className="flex justify-between mt-8">
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
              </Card>
            </section>

            {/* Preview Panel */}
            <aside
              className="lg:col-span-3"
              aria-labelledby="preview-heading"
              role="complementary"
            >
              <div className="sticky top-8">
                <AnimatedCard className="overflow-hidden" hover={true}>
                  <div id="preview-content" className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3
                        id="preview-heading"
                        className="text-xl font-bold"
                        style={{ color: palette.neutralDark }}
                      >
                        Live Preview
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setPreviewMode("guest")}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            previewMode === "guest"
                              ? "bg-blue-600 text-white shadow-md"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          <Eye className="w-4 h-4 mr-1.5 inline" />
                          Website
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewMode("dashboard")}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            previewMode === "dashboard"
                              ? "bg-blue-600 text-white shadow-md"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          <User className="w-4 h-4 mr-1.5 inline" />
                          Dashboard
                        </button>
                      </div>
                    </div>

                    <PreviewComponent
                      data={watchedData}
                      previewMode={previewMode}
                      logoPreview={logoPreview}
                      language={language}
                      currency={currency}
                      onLanguageChange={setLanguage}
                      onCurrencyChange={setCurrency}
                      highlightRegion={highlightRegion || undefined}
                      isLoading={isSubmitting}
                    />
                  </div>
                </AnimatedCard>
              </div>
            </aside>
          </main>
        </div>

        {/* Accessibility Enhancer */}
        <AccessibilityEnhancer
          primaryColor={watchedData.primaryColor || palette.primary}
          backgroundColor="#FFFFFF"
          textColor={palette.neutralDark}
          onSettingsChange={(settings) => {
            console.log("Accessibility settings changed:", settings);
          }}
        />

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
                router.push("/dashboard/realtor");
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
            (currentStep !== 0 || emailValidation.isValid) &&
            (currentStep !== 3 || socialValidation.isValid)
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
