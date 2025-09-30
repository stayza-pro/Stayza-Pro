"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Card } from "@/components/ui";
import { User, Mail, Lock, ArrowLeft, Shield, CheckCircle } from "lucide-react";
import Link from "next/link";
import { palette } from "@/app/(marketing)/content";

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!data.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!data.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(data.email))
      newErrors.email = "Invalid email format";

    if (!data.password) newErrors.password = "Password is required";
    else if (data.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    if (data.password !== data.confirmPassword)
      newErrors.confirmPassword = "Passwords don't match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // TODO: Submit registration data to backend
      console.log("Registering guest:", data);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Redirect back to booking flow or dashboard
      router.push(returnTo);
    } catch (error) {
      console.error("Registration failed:", error);
      setErrors({ general: "Registration failed. Please try again." });
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
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8"
      style={{
        background: `linear-gradient(135deg, ${palette.primary}08 0%, ${palette.secondary}05 100%)`,
      }}
    >
      <div className="max-w-lg mx-auto">
        {/* Back Button */}
        <div className="mb-8">
          <Link
            href="/auth/login"
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors group"
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
              backgroundColor: palette.primary,
              background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`,
            }}
          >
            <User className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Join Stayza</h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            {propertyId
              ? "Create your account to complete this booking securely"
              : "Discover and book amazing properties with personalized recommendations"}
          </p>
        </div>

        {/* Benefits Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="flex items-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20">
            <Shield className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900 text-sm">
                Secure Bookings
              </p>
              <p className="text-xs text-gray-600">Protected payments & data</p>
            </div>
          </div>
          <div className="flex items-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/20">
            <CheckCircle className="w-5 h-5 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900 text-sm">Quick Access</p>
              <p className="text-xs text-gray-600">
                Instant booking confirmations
              </p>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <Card className="p-8 shadow-2xl border-0 bg-white/70 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div>
                <Input
                  label="Full Name"
                  type="text"
                  value={data.fullName}
                  onChange={(e) =>
                    handleInputChange("fullName", e.target.value)
                  }
                  placeholder="Enter your full name"
                  error={errors.fullName}
                  leftIcon={
                    <User
                      className="w-5 h-5"
                      style={{ color: palette.primary }}
                    />
                  }
                  required
                  className="h-12 text-base transition-all duration-200 focus:ring-2 rounded-xl"
                  style={
                    { "--focus-ring-color": palette.primary + "20" } as any
                  }
                />
              </div>

              <div>
                <Input
                  label="Email Address"
                  type="email"
                  value={data.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email address"
                  error={errors.email}
                  leftIcon={
                    <Mail
                      className="w-5 h-5"
                      style={{ color: palette.primary }}
                    />
                  }
                  required
                  className="h-12 text-base transition-all duration-200 focus:ring-2 rounded-xl"
                  style={
                    { "--focus-ring-color": palette.primary + "20" } as any
                  }
                />
              </div>

              <div>
                <Input
                  label="Phone Number (Optional)"
                  type="tel"
                  value={data.phoneNumber}
                  onChange={(e) =>
                    handleInputChange("phoneNumber", e.target.value)
                  }
                  placeholder="+234 801 234 5678"
                  helperText="For booking updates and support"
                  className="h-12 text-base transition-all duration-200 focus:ring-2 rounded-xl"
                  style={
                    { "--focus-ring-color": palette.primary + "20" } as any
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Password"
                    type="password"
                    value={data.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    placeholder="Create password"
                    error={errors.password}
                    leftIcon={
                      <Lock
                        className="w-5 h-5"
                        style={{ color: palette.primary }}
                      />
                    }
                    helperText="Min. 6 characters"
                    required
                    className="h-12 text-base transition-all duration-200 focus:ring-2 rounded-xl"
                    style={
                      { "--focus-ring-color": palette.primary + "20" } as any
                    }
                  />
                </div>
                <div>
                  <Input
                    label="Confirm Password"
                    type="password"
                    value={data.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    placeholder="Repeat password"
                    error={errors.confirmPassword}
                    leftIcon={
                      <Lock
                        className="w-5 h-5"
                        style={{ color: palette.primary }}
                      />
                    }
                    required
                    className="h-12 text-base transition-all duration-200 focus:ring-2 rounded-xl"
                    style={
                      { "--focus-ring-color": palette.primary + "20" } as any
                    }
                  />
                </div>
              </div>
            </div>

            {errors.general && (
              <div
                className="p-4 rounded-xl border-l-4"
                style={{
                  backgroundColor: "#FEF2F2",
                  borderColor: "#F87171",
                  color: "#DC2626",
                }}
              >
                <p className="text-sm font-medium">{errors.general}</p>
              </div>
            )}

            <div className="space-y-4 pt-2">
              <Button
                type="submit"
                loading={isSubmitting}
                className="w-full h-14 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                style={{
                  backgroundColor: palette.primary,
                  borderColor: palette.primary,
                }}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>

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

              <Button
                variant="outline"
                onClick={handleContinueAsGuest}
                className="w-full h-12 text-base font-semibold rounded-xl border-2 hover:shadow-md transition-all duration-200 group"
                style={{
                  borderColor: palette.secondary,
                  color: palette.secondary,
                  backgroundColor: "white",
                }}
              >
                <span className="group-hover:translate-x-0.5 transition-transform">
                  Continue as Guest →
                </span>
              </Button>
            </div>
          </form>
        </Card>

        {/* Footer Links */}
        <div className="text-center mt-8 space-y-4">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`}
              className="font-semibold hover:underline transition-colors"
              style={{ color: palette.primary }}
            >
              Sign in instead
            </Link>
          </p>
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our{" "}
            <Link
              href="/legal/terms"
              className="hover:underline"
              style={{ color: palette.primary }}
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/legal/privacy"
              className="hover:underline"
              style={{ color: palette.primary }}
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
