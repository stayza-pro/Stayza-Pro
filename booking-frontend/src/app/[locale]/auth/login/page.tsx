"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  X,
  Menu,
} from "lucide-react";
import { motion } from "framer-motion";
import { LogoLockup } from "@/app/(marketing)/components/LogoLockup";
import { palette } from "@/app/(marketing)/content";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

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
  const shouldReduceMotion = useReducedMotion();
  const t = useTranslations("auth.login");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("navigation");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <motion.div
      className="marketing-theme min-h-screen relative overflow-hidden"
      style={{ backgroundColor: palette.primary }}
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={
        shouldReduceMotion
          ? undefined
          : { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
      }
    >
      {/* Background Animations */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute right-[-18%] top-[-35%] h-[460px] w-[460px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)",
          }}
          animate={
            shouldReduceMotion
              ? undefined
              : { x: [0, 45, 0], y: [0, -35, 0], rotate: [0, 8, 0] }
          }
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-30%] left-[-8%] h-[380px] w-[380px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(4,120,87,0.25) 0%, transparent 70%)",
          }}
          animate={
            shouldReduceMotion
              ? undefined
              : { x: [0, -35, 0], y: [0, 28, 0], rotate: [0, -6, 0] }
          }
          transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Navigation */}
      <header className="relative z-20 border-b border-white/10 px-4 py-6 sm:px-6 lg:px-8">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <LogoLockup tone="light" />

          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher variant="compact" className="text-white" />
          </div>

          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="rounded-full border border-white/20 p-2 text-white/80 transition hover:border-white/40 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent md:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          <div className="hidden items-center gap-8 text-sm font-medium text-white/80 md:flex">
            <Link
              href="/"
              className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              Home
            </Link>
            <Link
              href="/register/guest"
              className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              Sign Up
            </Link>
            <Link
              href="/contact"
              className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              Support
            </Link>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/get-started"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-slate-900 transition-all hover:bg-white/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              Start for free
            </Link>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-medium text-white backdrop-blur md:hidden">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2 transition-colors hover:bg-white/10"
            >
              Home
            </Link>
            <Link
              href="/register/guest"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2 transition-colors hover:bg-white/10"
            >
              Sign Up
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2 transition-colors hover:bg-white/10"
            >
              Support
            </Link>
            <Link
              href="/get-started"
              className="w-full justify-center inline-flex items-center rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-slate-900 transition-all hover:bg-white/90"
            >
              Start for free
            </Link>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="relative">
        <div className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left Side - Hero Content */}
            <motion.div
              className="space-y-8 text-white"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 40 }}
              animate={
                shouldReduceMotion
                  ? undefined
                  : {
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.7,
                        delay: 0.1,
                        ease: [0.21, 0.61, 0.35, 1],
                      },
                    }
              }
            >
              <motion.span
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.6, delay: 0.25 },
                      }
                }
              >
                <LogIn className="h-3 w-3" />
                {t("title")}
              </motion.span>

              <motion.h1
                className="text-4xl font-bold leading-tight md:text-6xl"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 28 }}
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: 0.75,
                          delay: 0.3,
                          ease: [0.22, 1, 0.36, 1],
                        },
                      }
                }
              >
                {t("subtitle")}
                <br />
                <span className="text-white/90">personalized dashboard</span>
              </motion.h1>

              <motion.p
                className="text-lg leading-relaxed text-white/80 md:text-xl"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.65, delay: 0.4 },
                      }
                }
              >
                Access your bookings, manage properties, and connect with guests
                in your centralized workspace.
              </motion.p>

              <motion.div
                className="flex flex-col gap-4 pt-4"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.65, delay: 0.5 },
                      }
                }
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-white/90">
                    Secure authentication with role-based access
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                    <Lock className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-white/90">
                    Protected dashboard for your business data
                  </span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Side - Login Form */}
            <motion.div
              className="w-full max-w-lg mx-auto lg:mx-0"
              initial={shouldReduceMotion ? false : { opacity: 0, x: 40 }}
              animate={
                shouldReduceMotion
                  ? undefined
                  : {
                      opacity: 1,
                      x: 0,
                      transition: {
                        duration: 0.7,
                        delay: 0.2,
                        ease: [0.21, 0.61, 0.35, 1],
                      },
                    }
              }
            >
              <div className="rounded-3xl bg-white/95 p-8 shadow-2xl backdrop-blur-md lg:p-10">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {t("title")}
                  </h2>
                  <p className="text-gray-600">{t("subtitle")}</p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-5">
                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        {t("email")}
                      </label>
                      <div className="relative">
                        <input
                          {...register("email")}
                          type="email"
                          autoComplete="email"
                          className={`w-full rounded-xl border-2 px-4 py-3 pr-12 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                            errors.email
                              ? "border-red-500 ring-2 ring-red-500/20"
                              : "border-gray-200 hover:border-gray-300"
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
                        {t("password")}
                      </label>
                      <div className="relative">
                        <input
                          {...register("password")}
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          className={`w-full rounded-xl border-2 px-4 py-3 pr-12 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                            errors.password
                              ? "border-red-500 ring-2 ring-red-500/20"
                              : "border-gray-200 hover:border-gray-300"
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
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
                      />
                      <label
                        htmlFor="remember-me"
                        className="ml-2 block text-sm text-gray-600"
                      >
                        {t("remember_me")}
                      </label>
                    </div>

                    <div className="text-sm">
                      <Link
                        href="/auth/forgot-password"
                        className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                      >
                        {t("forgot_password")}
                      </Link>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || isLoading}
                      className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-base font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                    >
                      {isSubmitting || isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          {tCommon("loading")}...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <LogIn className="h-5 w-5 mr-2" />
                          {t("login_button")}
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Register Links */}
                  <div className="text-center space-y-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">{t("no_account")}</p>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                      <Link
                        href="/register/guest"
                        className="inline-flex items-center justify-center rounded-xl border-2 border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
                      >
                        Sign up as Guest
                      </Link>
                      <Link
                        href="/register/realtor"
                        className="inline-flex items-center justify-center rounded-xl border-2 border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 transition-all hover:border-blue-300 hover:bg-blue-50"
                      >
                        Register as Realtor
                      </Link>
                    </div>
                  </div>
                </form>
              </div>

              {/* Info Section */}
              <div className="mt-8 rounded-2xl bg-white/80 p-6 backdrop-blur-sm">
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
                          <strong className="text-gray-900">Guests:</strong>{" "}
                          Book amazing properties and manage your travel
                          reservations
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                        <div>
                          <strong className="text-gray-900">Realtors:</strong>{" "}
                          List your properties and manage bookings (requires
                          admin approval)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative text-center pb-8">
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
    </motion.div>
  );
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReduced(mediaQuery.matches);

      const handler = (event: MediaQueryListEvent) => setReduced(event.matches);
      mediaQuery.addEventListener("change", handler);

      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, []);

  return reduced;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
