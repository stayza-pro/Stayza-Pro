"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Card } from "@/components/ui";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { palette } from "@/app/(marketing)/content";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/dashboard";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email format";

    if (!formData.password) newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // TODO: Submit login data to backend
      console.log("Logging in:", formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Redirect to returnTo or dashboard
      router.push(returnTo);
    } catch (error) {
      console.error("Login failed:", error);
      setErrors({ general: "Invalid email or password. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: palette.neutralLight }}
    >
      <Card className="max-w-md w-full p-8 shadow-xl border-0">
        <div className="text-center mb-8">
          <h1
            className="text-2xl font-bold"
            style={{ color: palette.neutralDark }}
          >
            Welcome Back
          </h1>
          <p
            className="mt-2 text-sm"
            style={{ color: palette.neutralDark + "99" }}
          >
            Sign in to your account to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="Enter your email"
            error={errors.email}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            placeholder="Enter your password"
            error={errors.password}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
            required
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>

            <Link
              href="/auth/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Forgot password?
            </Link>
          </div>

          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          )}

          <Button type="submit" loading={isSubmitting} className="w-full">
            {isSubmitting ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                New to Stayza?
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <Link href="/register/realtor">
              <Button variant="outline" className="w-full">
                Create Booking Site (Realtor)
              </Button>
            </Link>

            <Link
              href={`/register/guest?returnTo=${encodeURIComponent(returnTo)}`}
            >
              <Button variant="outline" className="w-full">
                Create Guest Account
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Protected by industry-standard security.{" "}
            <Link
              href="/legal/privacy"
              className="text-blue-600 hover:text-blue-700"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
