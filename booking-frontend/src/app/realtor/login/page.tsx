"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  ArrowLeft,
  Building2,
} from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { palette } from "@/app/(marketing)/content";
import { LogoLockup } from "@/app/(marketing)/components/LogoLockup";
import { useAuthStore } from "@/store/authStore";
import { TestCredentials } from "@/components/dev/TestCredentials";

// Force dynamic rendering since this page uses search params
export const dynamic = "force-dynamic";

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
        status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
        businessName: string;
        slug: string;
      };
    };
    accessToken: string;
    refreshToken: string;
  };
  errors?: string[];
}

function RealtorLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/dashboard";

  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error: authError } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginData) => {
    try {
      await login(data.email, data.password);

      // Check if user is a realtor after successful login
      const { user } = useAuthStore.getState();
      if (user && user.role !== "REALTOR") {
        toast.error(
          "This login is for realtors only. Please use the correct login page for your account type."
        );
        return;
      }

      toast.success(`Welcome back, ${user?.firstName}!`);

      // Redirect to intended destination
      router.push(returnTo);
    } catch (error: any) {
      console.error("Login error:", error);

      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const message =
          error.response.data?.message ||
          "Login failed. Please check your credentials.";
        toast.error(message);

        // Handle specific validation errors
        if (error.response.data?.errors) {
          error.response.data.errors.forEach((err: string) => {
            if (err.toLowerCase().includes("email")) {
              setError("email", { message: err });
            } else if (err.toLowerCase().includes("password")) {
              setError("password", { message: err });
            }
          });
        }
      } else if (error.request) {
        // Network error - server not reachable
        toast.error(
          "Unable to connect to server. Please check your internet connection and try again."
        );
      } else {
        // Other error
        toast.error(error.message || "Login failed. Please try again.");
      }
    }
  };

  return (
    <div
      className="marketing-theme min-h-screen relative overflow-hidden"
      style={{ backgroundColor: palette.primary }}
    >
      {/* Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute right-[-18%] top-[-35%] h-[460px] w-[460px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)",
          }}
          animate={{ x: [0, 45, 0], y: [0, -35, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-30%] left-[-8%] h-[380px] w-[380px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(4,120,87,0.25) 0%, transparent 70%)",
          }}
          animate={{ x: [0, -35, 0], y: [0, 28, 0], rotate: [0, -6, 0] }}
          transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-white/10 px-4 py-6 sm:px-6 lg:px-8">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <Link
            href="/"
            className="flex items-center space-x-3 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <LogoLockup tone="light" />
        </nav>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            delay: 0.1,
            ease: [0.21, 0.61, 0.35, 1],
          }}
          className="max-w-md w-full space-y-8"
        >
          {/* Glassmorphism Login Card */}
          <div className="rounded-[32px] border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur">
            <div className="text-center mb-8">
              <motion.div
                className="mx-auto h-20 w-20 rounded-2xl flex items-center justify-center mb-6 border border-white/20 backdrop-blur-sm"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Image
                  src="/images/stayza.png"
                  alt="Stayza Pro Logo"
                  width={48}
                  height={48}
                  className="transition-transform duration-300 hover:scale-105"
                  style={{
                    filter: "brightness(0) invert(1)",
                  }}
                />
              </motion.div>
              <motion.span
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/90 mb-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Realtor Access
              </motion.span>
              <motion.h1
                className="text-3xl font-bold text-white leading-tight md:text-4xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Welcome Back
              </motion.h1>
              <motion.p
                className="mt-3 text-lg text-white/80"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                Access your branded booking hub and manage your properties
              </motion.p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-5">
                {/* Email */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-white/90 mb-2"
                  >
                    Business Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-white/50" />
                    </div>
                    <input
                      {...register("email")}
                      type="email"
                      className={`block w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 backdrop-blur transition-all duration-200 ${
                        errors.email ? "border-red-400/50 bg-red-500/10" : ""
                      }`}
                      placeholder="Enter your business email"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-200 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1.5" />
                      {errors.email.message}
                    </p>
                  )}
                </motion.div>

                {/* Password */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-white/90 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-white/50" />
                    </div>
                    <input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      className={`block w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 backdrop-blur transition-all duration-200 ${
                        errors.password ? "border-red-400/50 bg-red-500/10" : ""
                      }`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-white/50 hover:text-white/80 transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-white/50 hover:text-white/80 transition-colors" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-200 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1.5" />
                      {errors.password.message}
                    </p>
                  )}
                </motion.div>
              </div>

              {/* Forgot Password */}
              <motion.div
                className="flex items-center justify-end"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <Link
                  href="/forgot-password"
                  className="text-sm text-white/80 hover:text-white transition-colors font-medium"
                >
                  Forgot your password?
                </Link>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center items-center py-4 px-6 border border-transparent text-sm font-semibold rounded-xl text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: palette.secondary,
                    boxShadow: "0 10px 25px rgba(4, 120, 87, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 15px 35px rgba(4, 120, 87, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0px)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 25px rgba(4, 120, 87, 0.3)";
                  }}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="h-5 w-5 mr-2" />
                      Access Your Hub
                    </>
                  )}
                </button>
              </motion.div>

              {/* Register Link */}
              <motion.div
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.0 }}
              >
                <p className="text-sm text-white/80">
                  Don't have a realtor account?{" "}
                  <Link
                    href="/realtor/register"
                    className="font-semibold text-white hover:text-white/90 transition-colors underline underline-offset-2"
                  >
                    Apply to become a realtor
                  </Link>
                </p>
              </motion.div>

              {/* Role Switch */}
              <motion.div
                className="text-center pt-6 border-t border-white/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.1 }}
              >
                <p className="text-sm text-white/70 mb-3">
                  Looking for a different login?
                </p>
                <div className="flex items-center justify-center space-x-4">
                  <Link
                    href="/guest/login"
                    className="text-sm font-medium text-white/80 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
                  >
                    Guest Login
                  </Link>
                  <span className="text-white/30">|</span>
                  <Link
                    href="/admin/login"
                    className="text-sm font-medium text-white/80 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
                  >
                    Admin Login
                  </Link>
                </div>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Development Test Credentials */}
      <TestCredentials />
    </div>
  );
}

export default function RealtorLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RealtorLoginContent />
    </Suspense>
  );
}
