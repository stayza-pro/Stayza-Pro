"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  ArrowLeft,
  Shield,
  CheckCircle,
  Eye,
  EyeOff,
  Building,
} from "lucide-react";
import Link from "next/link";
import { palette } from "@/app/(marketing)/content";
import toast from "react-hot-toast";
import PhoneNumberFormatter from "@/components/ui/PhoneNumberFormatter";

// Force dynamic rendering since this page uses search params
export const dynamic = "force-dynamic";

interface RealtorRegistrationData {
  fullName: string;
  businessEmail: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  agencyName: string;
  businessAddress: string;
  customSubdomain: string;
}

// Simple phone validation function
const validatePhoneNumber = (phone: string) => {
  if (!phone || !phone.trim()) {
    return { isValid: false, errorMessage: "Phone number is required" };
  }
  // Basic phone validation - accepts most common formats
  const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,15}$/;
  return {
    isValid: phoneRegex.test(phone.replace(/\s/g, "")),
    errorMessage: phoneRegex.test(phone.replace(/\s/g, ""))
      ? undefined
      : "Invalid phone number format",
  };
};

function RealtorRegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/dashboard";
  const plan = searchParams.get("plan") || "free";

  const [data, setData] = useState<RealtorRegistrationData>({
    fullName: "",
    businessEmail: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    agencyName: "",
    businessAddress: "",
    customSubdomain: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (
    field: keyof RealtorRegistrationData,
    value: string
  ) => {
    setData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Full name validation
    if (!data.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (data.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    // Business email validation
    if (!data.businessEmail) {
      newErrors.businessEmail = "Business email is required";
    } else if (!emailRegex.test(data.businessEmail)) {
      newErrors.businessEmail = "Please enter a valid email address";
    }

    // Phone validation
    const phoneValidation = validatePhoneNumber(data.phoneNumber);
    if (!phoneValidation.isValid) {
      newErrors.phoneNumber =
        phoneValidation.errorMessage || "Invalid phone number";
    }

    // Agency name validation
    if (!data.agencyName.trim()) {
      newErrors.agencyName = "Agency name is required";
    }

    // Business address validation
    if (!data.businessAddress.trim()) {
      newErrors.businessAddress = "Business address is required";
    }

    // Custom subdomain validation
    if (!data.customSubdomain.trim()) {
      newErrors.customSubdomain = "Custom subdomain is required";
    } else if (!/^[a-z0-9]+$/.test(data.customSubdomain)) {
      newErrors.customSubdomain =
        "Subdomain must contain only lowercase letters and numbers";
    }

    // Password validation
    if (!data.password) {
      newErrors.password = "Password is required";
    } else if (data.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    // Confirm password validation
    if (!data.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix all validation errors before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.businessEmail,
          password: data.password,
          firstName: data.fullName.split(" ")[0] || data.fullName,
          lastName: data.fullName.split(" ").slice(1).join(" ") || "",
          phone: data.phoneNumber || null,
          role: "REALTOR",
          agencyName: data.agencyName,
          businessAddress: data.businessAddress,
          customSubdomain: data.customSubdomain,
          plan: plan,
        }),
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

      toast.success(
        "Registration successful! Please check your email for verification."
      );

      // Redirect to verification page
      router.push(
        `/realtor/verify-email?email=${encodeURIComponent(data.businessEmail)}`
      );
    } catch (error) {
      console.error("Registration failed:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.";

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8"
      style={{
        background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.secondary} 100%)`,
      }}
    >
      <div className="max-w-lg mx-auto">
        {/* Back Button */}
        <div className="mb-8">
          <Link
            href="/get-started"
            className="inline-flex items-center text-sm font-medium text-white/80 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
            Back to Plans
          </Link>
        </div>

        {/* Header Section */}
        <div className="text-center mb-8">
          <div
            className="mx-auto h-20 w-20 flex items-center justify-center rounded-3xl shadow-lg mb-6"
            style={{
              background: `linear-gradient(135deg, ${palette.accent}, ${palette.secondary})`,
            }}
          >
            <Building className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Join as Realtor
          </h1>
          <p className="text-lg text-white/80 max-w-md mx-auto">
            Create your professional realtor account and start listing
            properties
          </p>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-4 bg-white/20 text-white">
            Selected Plan:{" "}
            <span className="ml-1 capitalize font-bold">{plan}</span>
          </div>
        </div>

        {/* Benefits Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="flex items-center p-5 bg-white/80 backdrop-blur-sm rounded-xl border border-white/30">
            <Shield className="w-6 h-6 text-green-600 mr-4" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                Professional Profile
              </p>
              <p className="text-xs text-gray-700 mt-0.5">
                Custom subdomain & branding
              </p>
            </div>
          </div>
          <div className="flex items-center p-5 bg-white/80 backdrop-blur-sm rounded-xl border border-white/30">
            <CheckCircle className="w-6 h-6 text-blue-600 mr-4" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                Property Management
              </p>
              <p className="text-xs text-gray-700 mt-0.5">
                List and manage properties
              </p>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={data.fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                    placeholder="Enter your full name"
                    className={`w-full px-4 py-3 pr-12 text-sm border-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      errors.fullName
                        ? "border-red-500 ring-2 ring-red-500/20"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    required
                  />
                  <User className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              {/* Business Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={data.businessEmail}
                    onChange={(e) =>
                      handleInputChange("businessEmail", e.target.value)
                    }
                    placeholder="business@company.com"
                    className={`w-full px-4 py-3 pr-12 text-sm border-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      errors.businessEmail
                        ? "border-red-500 ring-2 ring-red-500/20"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    required
                  />
                  <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {errors.businessEmail && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.businessEmail}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <PhoneNumberFormatter
                  value={data.phoneNumber}
                  onChange={(value) => handleInputChange("phoneNumber", value)}
                  placeholder="Enter your phone number"
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              {/* Agency Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agency/Company Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={data.agencyName}
                    onChange={(e) =>
                      handleInputChange("agencyName", e.target.value)
                    }
                    placeholder="Your Real Estate Agency"
                    className={`w-full px-4 py-3 pr-12 text-sm border-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      errors.agencyName
                        ? "border-red-500 ring-2 ring-red-500/20"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    required
                  />
                  <Building className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {errors.agencyName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.agencyName}
                  </p>
                )}
              </div>

              {/* Business Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Address
                </label>
                <input
                  type="text"
                  value={data.businessAddress}
                  onChange={(e) =>
                    handleInputChange("businessAddress", e.target.value)
                  }
                  placeholder="123 Main St, City, Country"
                  className={`w-full px-4 py-3 text-sm border-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    errors.businessAddress
                      ? "border-red-500 ring-2 ring-red-500/20"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  required
                />
                {errors.businessAddress && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.businessAddress}
                  </p>
                )}
              </div>

              {/* Custom Subdomain */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Subdomain
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={data.customSubdomain}
                    onChange={(e) =>
                      handleInputChange(
                        "customSubdomain",
                        e.target.value.toLowerCase()
                      )
                    }
                    placeholder="yourcompany"
                    className={`flex-1 px-4 py-3 text-sm border-2 rounded-l-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      errors.customSubdomain
                        ? "border-red-500 ring-2 ring-red-500/20"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    required
                  />
                  <span className="inline-flex items-center px-3 rounded-r-xl border-2 border-l-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
                    .stayza.pro
                  </span>
                </div>
                {errors.customSubdomain && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.customSubdomain}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  This will be your unique website URL
                </p>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={data.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      placeholder="Create password"
                      className={`w-full px-4 py-3 pr-12 text-sm border-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                        errors.password
                          ? "border-red-500 ring-2 ring-red-500/20"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={data.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      placeholder="Confirm password"
                      className={`w-full px-4 py-3 pr-12 text-sm border-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                        errors.confirmPassword
                          ? "border-red-500 ring-2 ring-red-500/20"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-base font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Create Realtor Account
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-8 space-y-4">
          <p className="text-sm text-white/80">
            Already have an account?{" "}
            <Link
              href="/realtor/login"
              className="font-semibold hover:underline transition-colors text-white hover:text-white/90"
            >
              Sign in instead
            </Link>
          </p>
          <p className="text-xs text-white/60">
            By creating an account, you agree to our{" "}
            <Link
              href="/legal/terms"
              className="hover:underline text-white/80 hover:text-white"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/legal/privacy"
              className="hover:underline text-white/80 hover:text-white"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RealtorRegistrationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <RealtorRegistrationContent />
    </Suspense>
  );
}
