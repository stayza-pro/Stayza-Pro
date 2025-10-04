"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, LogIn, AlertCircle } from "lucide-react";

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginData = z.infer<typeof loginSchema>;

interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: "GUEST" | "REALTOR" | "ADMIN";
      realtor?: {
        status: "PENDING" | "APPROVED" | "REJECTED";
        businessName: string;
        slug: string;
      };
    };
    accessToken: string;
    refreshToken: string;
  };
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/dashboard";

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result: LoginResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Login failed");
      }

      // Store auth tokens
      if (result.data?.accessToken) {
        localStorage.setItem("accessToken", result.data.accessToken);
        localStorage.setItem("refreshToken", result.data.refreshToken);
      }

      const user = result.data!.user;

      // Handle role-based redirects
      if (user.role === "ADMIN") {
        toast.success("Welcome back, Admin!");
        router.push("/dashboard/admin");
      } else if (user.role === "REALTOR") {
        // Check Realtor status
        const realtorStatus = user.realtor?.status;

        if (realtorStatus === "PENDING") {
          toast(
            "Your account is still under review. Please wait for admin approval.",
            {
              icon: "⏳",
            }
          );
          router.push("/auth/pending-approval");
        } else if (realtorStatus === "REJECTED") {
          toast.error(
            "Your realtor application was rejected. Please contact support."
          );
          router.push("/auth/application-rejected");
        } else if (realtorStatus === "APPROVED") {
          toast.success(
            `Welcome back, ${user.realtor?.businessName || user.firstName}!`
          );
          router.push("/dashboard/realtor");
        } else {
          // Fallback if no realtor profile found
          toast.error("Realtor profile not found. Please contact support.");
          router.push("/contact");
        }
      } else if (user.role === "GUEST") {
        toast.success(`Welcome back, ${user.firstName}!`);
        router.push(returnTo === "/dashboard" ? "/dashboard/guest" : returnTo);
      }
    } catch (error) {
      console.error("Login failed:", error);
      const message = error instanceof Error ? error.message : "Login failed";

      if (message.includes("Invalid email or password")) {
        setError("email", { message: "Invalid email or password" });
        setError("password", { message: "Invalid email or password" });
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="marketing-theme min-h-screen py-12 px-4 sm:px-6 lg:px-8"
      style={{
        background: `linear-gradient(135deg, var(--marketing-primary) 0%, var(--marketing-secondary) 100%)`,
      }}
    >
      <div className="max-w-md w-full mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div
            className="mx-auto h-16 w-16 flex items-center justify-center rounded-3xl shadow-lg mb-6"
            style={{
              background: `linear-gradient(135deg, var(--marketing-accent), var(--marketing-secondary))`,
            }}
          >
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Welcome Back</h1>
          <p className="text-lg text-white/80 max-w-sm mx-auto">
            Sign in to access your personalized dashboard and manage your
            bookings
          </p>
        </div>

        {/* Form Card */}
        <div className="marketing-card-elevated p-8 bg-white/95 backdrop-blur-md">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    {...register("email")}
                    type="email"
                    autoComplete="email"
                    className={`marketing-input ${
                      errors.email ? "!border-red-500 !ring-red-500" : ""
                    }`}
                    placeholder="Enter your email address"
                  />
                  <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className={`marketing-input pr-12 ${
                      errors.password ? "!border-red-500 !ring-red-500" : ""
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-600"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/auth/forgot-password"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="marketing-button-primary w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                {isSubmitting || isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign In to Your Account
                  </>
                )}
              </button>
            </div>

            {/* Register Links */}
            <div className="text-center space-y-4 pt-4">
              <p className="text-sm text-gray-600">New to Stayza?</p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Link
                  href="/register/guest"
                  className="marketing-button-secondary py-2 px-6 text-center"
                >
                  Sign up as Guest
                </Link>
                <Link
                  href="/register/realtor"
                  className="marketing-button-ghost py-2 px-6 text-center"
                >
                  Register as Realtor
                </Link>
              </div>
            </div>
          </form>
        </div>

        {/* Info Section */}
        <div className="marketing-card p-6 bg-white/80 backdrop-blur-sm">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Account Types
              </h3>
              <div className="text-sm text-gray-700 space-y-2">
                <div className="flex items-start space-x-2">
                  <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <div>
                    <strong className="text-gray-900">Guests:</strong> Book
                    amazing properties and manage your travel reservations
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  <div>
                    <strong className="text-gray-900">Realtors:</strong> List
                    your properties and manage bookings (requires admin
                    approval)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-white/80">
            Questions about your account?{" "}
            <Link
              href="/contact"
              className="font-medium text-white hover:text-white/90 underline transition-colors"
            >
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-marketing-primary"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
