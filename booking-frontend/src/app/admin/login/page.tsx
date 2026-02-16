"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Shield,
  ArrowLeft,
  LogIn,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { palette } from "@/app/(marketing)/content";
import { LogoLockup } from "@/app/(marketing)/components/LogoLockup";
import { authService } from "@/services/auth";
import { serviceUtils } from "@/services";
import { TestCredentials } from "@/components/dev/TestCredentials";

// Force dynamic rendering since this page uses search params
export const dynamic = "force-dynamic";

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/admin";

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      const result = await authService.login({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (result.user) {
        // Check if user is an admin
        if (result.user.role !== "ADMIN") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          toast.error(
            "This login is for administrators only. Please use the correct login page for your account type.",
          );
          return;
        }

        toast.success(`Welcome back, ${result.user.firstName}!`);
        router.push(returnTo);
      }
    } catch (err: any) {
      const errorMessage = serviceUtils.extractErrorMessage(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
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
              "radial-gradient(circle, rgba(249, 115, 22, 0.25) 0%, transparent 70%)",
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
                <Shield className="w-12 h-12 text-white" />
              </motion.div>
              <motion.span
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/90 mb-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Admin Access
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
                Access your admin dashboard and manage your platform
              </motion.p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl"
              >
                <p className="text-sm text-red-100 text-center font-medium flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 mr-1.5" />
                  {error}
                </p>
              </motion.div>
            )}

            <form className="space-y-6" onSubmit={handleLogin}>
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
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-white/50" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="block w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 backdrop-blur transition-all duration-200"
                      placeholder="admin@stayza.com"
                      disabled={isLoading}
                    />
                  </div>
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
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="block w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 backdrop-blur transition-all duration-200"
                      placeholder="Enter your password"
                      disabled={isLoading}
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
                    backgroundColor: palette.accent,
                    boxShadow: "0 10px 25px rgba(249, 115, 22, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 15px 35px rgba(249, 115, 22, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0px)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 25px rgba(249, 115, 22, 0.3)";
                  }}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="h-5 w-5 mr-2" />
                      Sign In
                    </>
                  )}
                </button>
              </motion.div>

              {/* Role Switch */}
              <motion.div
                className="text-center pt-6 border-t border-white/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.0 }}
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
                    href="/realtor/login"
                    className="text-sm font-medium text-white/80 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
                  >
                    Realtor Login
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

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminLoginContent />
    </Suspense>
  );
}
