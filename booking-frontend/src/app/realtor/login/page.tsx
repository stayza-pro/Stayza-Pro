"use client";

import React, { useState, Suspense, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowLeft,
  Building2,
  Home,
  Calendar,
  TrendingUp,
  Sparkles,
  MapPin,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { serviceUtils } from "@/services";
import { buildSubdomainUrl, getMainDomainUrl } from "@/utils/subdomain";

// Force dynamic rendering since this page uses search params
export const dynamic = "force-dynamic";

interface LoginRedirectResponse {
  redirectUrl?: string;
}

interface HttpLikeError {
  response?: { data?: { message?: string } };
  request?: unknown;
  message?: string;
}

function RealtorLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sanitizeReturnTo = (rawValue: string | null): string => {
    if (!rawValue) {
      return "/dashboard";
    }

    if (typeof window === "undefined") {
      return rawValue.startsWith("/") ? rawValue : "/dashboard";
    }

    if (rawValue.startsWith("/")) {
      return rawValue.startsWith("/realtor/login") ? "/dashboard" : rawValue;
    }

    try {
      const parsed = new URL(rawValue);
      const currentHost = window.location.hostname;
      const isDevHost = currentHost.includes("localhost");
      const isAllowedHost = isDevHost
        ? parsed.hostname.includes("localhost")
        : parsed.hostname.endsWith("stayza.pro");

      if (!isAllowedHost) {
        return "/dashboard";
      }

      const normalizedPath = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      if (!normalizedPath.startsWith("/")) {
        return "/dashboard";
      }

      return normalizedPath.startsWith("/realtor/login")
        ? "/dashboard"
        : normalizedPath;
    } catch {
      return "/dashboard";
    }
  };

  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));

  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, checkAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const handleExistingSession = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        return;
      }

      try {
        await checkAuth();
        if (!isMounted) {
          return;
        }

        const { isAuthenticated, user } = useAuthStore.getState();
        if (isAuthenticated && user?.role === "REALTOR") {
          if (user.realtor?.slug) {
            router.replace(buildSubdomainUrl(user.realtor.slug, "/dashboard"));
            return;
          }
          router.replace(returnTo);
        }
      } catch {
        // Silent fallback to normal login form.
      }
    };

    void handleExistingSession();

    return () => {
      isMounted = false;
    };
  }, [checkAuth, returnTo, router]);

  const normalizeBackendRedirectUrl = (rawUrl: string): string => {
    if (typeof window === "undefined" || !rawUrl) {
      return rawUrl;
    }

    // Keep localhost URLs untouched in local development.
    if (window.location.hostname.includes("localhost")) {
      return rawUrl;
    }

    try {
      const parsedUrl = new URL(rawUrl, window.location.origin);
      if (!parsedUrl.hostname.includes("localhost")) {
        return rawUrl;
      }

      const redirectPath = `${
        parsedUrl.pathname || "/"
      }${parsedUrl.search}${parsedUrl.hash}`;

      if (parsedUrl.hostname === "localhost") {
        return getMainDomainUrl(redirectPath);
      }

      const subdomain = parsedUrl.hostname.split(".")[0];
      if (subdomain && subdomain !== "localhost") {
        return buildSubdomainUrl(subdomain, redirectPath);
      }

      return getMainDomainUrl(redirectPath);
    } catch {
      return rawUrl;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await login(email, password);

      // Check if user is a realtor after successful login
      const { user } = useAuthStore.getState();
      if (user && user.role !== "REALTOR") {
        toast.error(
          "This login is for realtors only. Please use the correct login page for your account type.",
        );
        return;
      }

      toast.success(`Welcome back, ${user?.firstName}!`);

      // Enhanced multi-domain redirect handling
      const loginResponse = response as LoginRedirectResponse;
      let redirectUrl = returnTo;

      // Use backend-provided redirect URL if available
      if (loginResponse?.redirectUrl) {
        redirectUrl = loginResponse.redirectUrl;
        redirectUrl = normalizeBackendRedirectUrl(redirectUrl);
      } else if (
        user?.role === "REALTOR" &&
        user?.realtor?.slug &&
        user.isEmailVerified
      ) {
        // Fallback: Construct realtor subdomain URL
        redirectUrl = buildSubdomainUrl(user.realtor.slug, "/dashboard");
      }

      // Handle cross-domain navigation
      setTimeout(() => {
        const currentHost = window.location.host;
        try {
          const redirectHost = new URL(redirectUrl, window.location.origin)
            .host;

          if (currentHost !== redirectHost) {
            // Cross-domain redirect (realtor subdomain)

            // Add authentication tokens to URL for cross-domain transfer
            const { accessToken, refreshToken } = useAuthStore.getState();
            if (accessToken && refreshToken) {
              const redirectUrlObj = new URL(redirectUrl);
              redirectUrlObj.searchParams.set("token", accessToken);
              redirectUrlObj.searchParams.set("refresh", refreshToken);

              window.location.href = redirectUrlObj.toString();
            } else {
              window.location.href = redirectUrl;
            }
          } else {
            // Same-domain redirect

            router.push(redirectUrl);
          }
        } catch {
          // Fallback for relative URLs

          router.push(redirectUrl);
        }
      }, 1000); // Small delay to show success message
    } catch (error: unknown) {
      // Handle different types of errors
      const httpError = error as HttpLikeError;
      if (httpError.response) {
        // Server responded with error status
        const message = serviceUtils.extractErrorMessage(error);
        setError(message);
      } else if (httpError.request) {
        // Network error - server not reachable
        setError(
          "Unable to connect to server. Please check your internet connection and try again.",
        );
      } else {
        // Other error
        setError(serviceUtils.extractErrorMessage(error));
      }
    }
  };

  // Live stats animation
  const [stats, setStats] = useState({
    activeRealtors: 342,
    propertiesListed: 1847,
    bookingsToday: 156,
    avgResponse: 2.4,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        activeRealtors: prev.activeRealtors + Math.floor(Math.random() * 5 - 2),
        propertiesListed:
          prev.propertiesListed + Math.floor(Math.random() * 6 - 1),
        bookingsToday: prev.bookingsToday + Math.floor(Math.random() * 4),
        avgResponse: 2.4 + (Math.random() * 0.2 - 0.1),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden marketing-theme">
      {/* Split Screen Layout */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* LEFT SIDE - Animated Hero Section */}
        <motion.div
          className="relative lg:w-1/2 p-8 lg:p-12 flex flex-col justify-between overflow-hidden"
          style={{
            background: "var(--marketing-primary)",
          }}
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Animated Mesh Background */}
          <div className="absolute inset-0 opacity-20">
            <motion.div
              className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/30"
              animate={{
                x: [0, 50, 0],
                y: [0, -30, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-orange-400/20"
              animate={{
                x: [0, -40, 0],
                y: [0, 40, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-cyan-400/15"
              animate={{
                x: [-30, 30, -30],
                y: [-20, 20, -20],
                scale: [1, 1.15, 1],
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Back Button */}
            <Link
              href="/"
              className="inline-flex items-center space-x-2 text-white/80 hover:text-white transition-colors group mb-8"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Home</span>
            </Link>

            {/* Hero Content */}
            <div className="max-w-xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-6"
              >
                <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 mb-6">
                  <Sparkles className="w-4 h-4 text-orange-300" />
                  <span className="text-sm text-white font-medium">
                    Realtor Hub
                  </span>
                </div>

                <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  Your Branded
                  <br />
                  <span className="text-blue-100">Booking Platform</span>
                </h1>

                <p className="text-xl text-white/80 font-normal leading-relaxed">
                  Manage properties, track bookings, and grow your real estate
                  business with powerful tools.
                </p>
              </motion.div>

              {/* Live Stats Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 gap-4 mt-12"
              >
                <StatCard
                  icon={Building2}
                  label="Active Realtors"
                  value={stats.activeRealtors.toLocaleString()}
                  trend="+15%"
                  color="blue"
                />
                <StatCard
                  icon={Home}
                  label="Properties Listed"
                  value={stats.propertiesListed.toLocaleString()}
                  trend="+22%"
                  color="emerald"
                />
                <StatCard
                  icon={Calendar}
                  label="Bookings Today"
                  value={stats.bookingsToday}
                  trend="+18%"
                  color="orange"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Avg Response"
                  value={`${stats.avgResponse.toFixed(1)}h`}
                  trend="improved"
                  color="cyan"
                />
              </motion.div>
            </div>
          </div>

          {/* Bottom Decoration */}
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center space-x-6 text-white/60 text-sm"
            >
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4" />
                <span>White-Label Ready</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Multi-Location</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* RIGHT SIDE - Login Form with Glassmorphism */}
        <motion.div
          className="lg:w-1/2 flex items-center justify-center p-8 lg:p-12"
          style={{
            background:
              "linear-gradient(to bottom right, var(--marketing-surface), var(--marketing-background))",
          }}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Glassmorphism Login Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* Card with Glassmorphism */}
            <div className="relative marketing-card-elevated p-8 lg:p-10">
              {/* Decorative Border */}
              <div className="absolute inset-0 bg-blue-200/20 rounded-3xl -z-10 blur-xl" />

              {/* Logo Badge */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex justify-center mb-8"
              >
                <Image
                  src="/images/stayza.png"
                  alt="Stayza Pro Logo"
                  width={150}
                  height={150}
                  className="transition-transform duration-300"
                />
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center mb-8"
              >
                <h2 className="text-3xl font-bold mb-2 text-marketing-foreground">
                  Realtor Portal
                </h2>
                <p className="text-marketing-muted">
                  Access your branded booking hub
                </p>
              </motion.div>

              {/* Error Message */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl"
                  >
                    <p className="text-sm text-red-700 text-center font-medium">
                      {error}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-6">
                {/* Email Input */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold mb-2 text-marketing-foreground"
                  >
                    Business Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
                      <Mail className="h-5 w-5 text-marketing-muted transition-colors" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="realtor@yourcompany.com"
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 font-medium bg-marketing-elevated border-marketing-subtle text-marketing-foreground placeholder:text-marketing-muted focus:border-marketing-accent ring-marketing-focus"
                      disabled={isLoading}
                    />
                  </div>
                </motion.div>

                {/* Password Input */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold mb-2 text-marketing-foreground"
                  >
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
                      <Lock className="h-5 w-5 text-marketing-muted transition-colors" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-3.5 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 font-medium bg-marketing-elevated border-marketing-subtle text-marketing-foreground placeholder:text-marketing-muted focus:border-marketing-accent ring-marketing-focus"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-marketing-muted hover:text-marketing-accent transition-colors z-10"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </motion.div>

                {/* Forgot Password Link */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.95 }}
                  className="flex justify-end"
                >
                  <Link
                    href="/realtor/forgot-password"
                    className="text-sm font-medium text-marketing-accent hover:text-marketing-primary transition-colors"
                  >
                    Forgot password?
                  </Link>
                </motion.div>

                {/* Submit Button */}
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.0 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="marketing-button-primary relative w-full py-4 px-6 font-bold rounded-xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <div className="absolute inset-0 bg-orange-500 opacity-0 hover:opacity-20 transition-opacity" />
                  <span className="relative flex items-center justify-center space-x-2">
                    {isLoading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        >
                          <Building2 className="w-5 h-5" />
                        </motion.div>
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Access Your Hub</span>
                        <motion.div
                          animate={{ x: [0, 4, 0] }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <ArrowLeft className="w-5 h-5 rotate-180" />
                        </motion.div>
                      </>
                    )}
                  </span>
                </motion.button>
              </form>

              {/* Register Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-8 text-center"
              >
                <p className="text-sm text-marketing-muted">
                  Don&apos;t have a realtor account?{" "}
                  <Link
                    href="/realtor/onboarding"
                    className="font-semibold text-marketing-accent hover:text-marketing-primary transition-colors"
                  >
                    Apply to become a realtor
                  </Link>
                </p>
              </motion.div>

              {/* Footer - Role Switch */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 }}
                className="mt-8 pt-6 border-t border-marketing-subtle"
              >
                <p className="text-center text-xs text-marketing-subtle mb-3">
                  Looking for a different login?
                </p>
                <div className="flex items-center justify-center space-x-4 text-xs">
                  <Link
                    href="/guest/login"
                    className="font-medium text-marketing-muted hover:text-marketing-accent transition-colors"
                  >
                    Guest Login
                  </Link>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  trend: string;
  color: string;
}) {
  const colorClasses =
    {
      emerald: "from-emerald-400 to-emerald-600",
      blue: "from-blue-400 to-blue-600",
      orange: "from-orange-400 to-orange-600",
      cyan: "from-cyan-400 to-cyan-600",
    }[color] || "from-blue-400 to-blue-600"; // Default to blue if color not found

  const getBackgroundColor = () => {
    const colorKey = colorClasses
      .replace("from-", "")
      .replace(" to-*", "")
      .split("-")[0];

    switch (colorKey) {
      case "blue":
        return "#3B82F6";
      case "emerald":
        return "#10B981";
      case "orange":
        return "#F59E0B";
      case "cyan":
        return "#06B6D4";
      default:
        return "#3B82F6";
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20"
    >
      <motion.div
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-lg"
          style={{
            backgroundColor: getBackgroundColor(),
          }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p className="text-xs text-white/70 font-medium mb-1">{label}</p>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold text-white">{value}</p>
          <span className="text-xs text-emerald-300 font-semibold">
            {trend}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function RealtorLoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{
            background: "var(--marketing-primary)",
          }}
        >
          <div className="text-white text-xl">Loading...</div>
        </div>
      }
    >
      <RealtorLoginContent />
    </Suspense>
  );
}
