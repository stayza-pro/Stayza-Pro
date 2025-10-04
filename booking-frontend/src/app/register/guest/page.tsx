"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// UI components replaced with marketing theme classes
import { User, Mail, Lock, ArrowLeft, Shield, CheckCircle } from "lucide-react";
import Link from "next/link";
import { palette } from "@/app/(marketing)/content";
import toast from "react-hot-toast";
import { validatePhoneNumber } from "../realtor/schema";
import PhoneNumberFormatter from "@/components/ui/PhoneNumberFormatter";

interface GuestRegistrationData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
}

function GuestRegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/dashboard";
  const propertyId = searchParams.get("propertyId");

  const [data, setData] = useState<GuestRegistrationData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    field: keyof GuestRegistrationData,
    value: string
  ) => {
    setData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Function to show individual field validation errors via toast
  const showFieldErrorToast = (fieldName: string, errorMessage: string) => {
    const displayName = fieldName
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();

    toast.error(`${displayName}: ${errorMessage}`, {
      duration: 3000,
      position: "top-right",
    });
  };

  // Enhanced individual field validation functions
  const validateField = (
    fieldName: keyof GuestRegistrationData,
    value: string
  ) => {
    let error = "";

    switch (fieldName) {
      case "fullName":
        if (!value.trim()) {
          error = "Full name is required";
        } else if (value.trim().length < 2) {
          error = "Full name must be at least 2 characters";
        }
        break;
      case "email":
        if (!value.trim()) {
          error = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Please enter a valid email address";
        }
        break;
      case "password":
        if (!value) {
          error = "Password is required";
        } else if (value.length < 6) {
          error = "Password must be at least 6 characters";
        } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(value)) {
          error = "Password must contain at least one letter and one number";
        }
        break;
      case "confirmPassword":
        if (!value) {
          error = "Please confirm your password";
        } else if (value !== data.password) {
          error = "Passwords don't match";
        }
        break;
      case "phoneNumber":
        // Optional field, but if provided should be valid
        if (value && value.trim()) {
          const phoneValidation = validatePhoneNumber(value, "NG");
          if (!phoneValidation.isValid) {
            error =
              phoneValidation.errorMessage ||
              "Please enter a valid phone number (e.g. +234 807 123 4567, +1 555 123 4567)";
          }
        }
        break;
    }

    if (error) {
      showFieldErrorToast(fieldName, error);
      return false;
    }
    return true;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Comprehensive validation with detailed error messages
    if (!data.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (data.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    if (!data.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!data.password) {
      newErrors.password = "Password is required";
    } else if (data.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(data.password)) {
      newErrors.password =
        "Password must contain at least one letter and one number";
    }

    if (!data.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    // Validate phone number if provided (optional field)
    if (data.phoneNumber && data.phoneNumber.trim()) {
      const phoneValidation = validatePhoneNumber(data.phoneNumber, "NG");
      if (!phoneValidation.isValid) {
        newErrors.phoneNumber =
          phoneValidation.errorMessage ||
          "Please enter a valid phone number (e.g. +234 807 123 4567, +1 555 123 4567)";
      }
    }

    // Show toast notifications for all validation errors
    if (Object.keys(newErrors).length > 0) {
      // Show a summary toast first
      toast.error(
        `Please fix ${Object.keys(newErrors).length} validation error${
          Object.keys(newErrors).length > 1 ? "s" : ""
        }`,
        {
          duration: 3000,
          position: "top-right",
        }
      );

      // Then show individual field errors
      Object.entries(newErrors).forEach(([field, message]) => {
        setTimeout(() => {
          showFieldErrorToast(field, message);
        }, 500);
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix all validation errors before submitting", {
        duration: 4000,
        position: "top-right",
      });
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
          email: data.email,
          password: data.password,
          firstName: data.fullName.split(" ")[0] || data.fullName,
          lastName: data.fullName.split(" ").slice(1).join(" ") || "",
          phone: data.phoneNumber || null,
          role: "GUEST",
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

      // Show success message
      console.log("Registration successful:", result.data.user);

      // Redirect back to booking flow or dashboard
      router.push(returnTo === "/dashboard" ? "/dashboard/guest" : returnTo);
    } catch (error) {
      console.error("Registration failed:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.";

      toast.error(errorMessage, {
        duration: 5000,
        position: "top-right",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueAsGuest = () => {
    // For one-time bookings, redirect with guest mode
    if (propertyId) {
      router.push(`/properties/${propertyId}/book?mode=guest`);
    } else {
      router.push(returnTo);
    }
  };

  return (
    <div
      className="marketing-theme min-h-screen py-12 px-4 sm:px-6 lg:px-8"
      style={{
        background: `linear-gradient(135deg, var(--marketing-primary) 0%, var(--marketing-secondary) 100%)`,
      }}
    >
      <div className="max-w-lg mx-auto">
        {/* Back Button */}
        <div className="mb-8">
          <Link
            href="/auth/login"
            className="inline-flex items-center text-sm font-medium text-white/80 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
            Back to Login
          </Link>
        </div>

        {/* Header Section */}
        <div className="text-center mb-8">
          <div
            className="mx-auto h-20 w-20 flex items-center justify-center rounded-3xl shadow-lg mb-6"
            style={{
              background: `linear-gradient(135deg, var(--marketing-accent), var(--marketing-secondary))`,
            }}
          >
            <User className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Join Stayza</h1>
          <p className="text-lg text-white/80 max-w-md mx-auto">
            {propertyId
              ? "Create your account to complete this booking securely"
              : "Discover and book amazing properties with personalized recommendations"}
          </p>
        </div>

        {/* Benefits Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="marketing-card flex items-center p-5 bg-white/80 backdrop-blur-sm border-white/30">
            <Shield className="w-6 h-6 text-green-600 mr-4" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                Secure Bookings
              </p>
              <p className="text-xs text-gray-700 mt-0.5">
                Protected payments & data
              </p>
            </div>
          </div>
          <div className="marketing-card flex items-center p-5 bg-white/80 backdrop-blur-sm border-white/30">
            <CheckCircle className="w-6 h-6 text-blue-600 mr-4" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                Quick Access
              </p>
              <p className="text-xs text-gray-700 mt-0.5">
                Instant booking confirmations
              </p>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <div className="marketing-card-elevated p-8 bg-white/95 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div>
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
                      onBlur={(e) => validateField("fullName", e.target.value)}
                      placeholder="Enter your full name"
                      className={`marketing-input ${
                        errors.fullName ? "!border-red-500 !ring-red-500" : ""
                      }`}
                      required
                    />
                    <User className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    onBlur={(e) => validateField("email", e.target.value)}
                    placeholder="Enter your email address"
                    className={`marketing-input ${
                      errors.email ? "!border-red-500 !ring-red-500" : ""
                    }`}
                    required
                  />
                  <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (Optional)
                </label>
                <PhoneNumberFormatter
                  value={data.phoneNumber}
                  onChange={(value: string) =>
                    handleInputChange("phoneNumber", value)
                  }
                  onBlur={(value: string) =>
                    validateField("phoneNumber", value)
                  }
                  placeholder="+234 801 234 5678"
                  className="marketing-input"
                  defaultCountry="NG"
                  showCountrySelector={true}
                />
                <p className="mt-1 text-xs text-gray-500">
                  For booking updates and support
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={data.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      onBlur={(e) => validateField("password", e.target.value)}
                      placeholder="Create password"
                      className={`marketing-input ${
                        errors.password ? "!border-red-500 !ring-red-500" : ""
                      }`}
                      required
                    />
                    <Lock className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Min. 6 characters
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={data.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      onBlur={(e) =>
                        validateField("confirmPassword", e.target.value)
                      }
                      placeholder="Repeat password"
                      className={`marketing-input ${
                        errors.confirmPassword
                          ? "!border-red-500 !ring-red-500"
                          : ""
                      }`}
                      required
                    />
                    <Lock className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="marketing-button-primary w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">
                    Quick Alternative
                  </span>
                </div>
              </div>

              <button
                onClick={handleContinueAsGuest}
                className="marketing-button-secondary w-full h-12 text-base font-semibold rounded-xl border-2 hover:shadow-md transition-all duration-200 group"
              >
                <span className="group-hover:translate-x-0.5 transition-transform">
                  Continue as Guest →
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-8 space-y-4">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`}
              className="font-semibold hover:underline transition-colors text-[var(--marketing-primary)] hover:text-[var(--marketing-secondary)]"
            >
              Sign in instead
            </Link>
          </p>
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our{" "}
            <Link
              href="/legal/terms"
              className="hover:underline text-[var(--marketing-primary)] hover:text-[var(--marketing-secondary)]"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/legal/privacy"
              className="hover:underline text-[var(--marketing-primary)] hover:text-[var(--marketing-secondary)]"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function GuestRegistrationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <GuestRegistrationContent />
    </Suspense>
  );
}
