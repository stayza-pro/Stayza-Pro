"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Building2,
  MapPin,
  Menu,
  X,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";

// Brand colors matching the original design
const palette = {
  primary: "#1E3A8A",
  secondary: "#047857",
  accent: "#F97316",
};

// Countries list
const countries = [
  { value: "NG", label: "Nigeria" },
  { value: "GH", label: "Ghana" },
  { value: "KE", label: "Kenya" },
  { value: "ZA", label: "South Africa" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
];

// Validation schema
const realtorRegistrationSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    agencyName: z.string().min(2, "Agency name is required"),
    businessAddress: z.string().min(5, "Business address is required"),
    country: z.string().optional(),
    city: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RealtorRegistrationData = z.infer<typeof realtorRegistrationSchema>;

interface RegistrationResponse {
  success: boolean;
  message: string;
  data?: {
    user: any;
    accessToken: string;
    refreshToken: string;
  };
  errors?: string[];
}

function RealtorRegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "free";
  const shouldReduceMotion = useReducedMotion();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<RealtorRegistrationData>({
    resolver: zodResolver(realtorRegistrationSchema),
  });

  const onSubmit = async (data: RealtorRegistrationData) => {
    setIsLoading(true);

    try {
      const formData = new FormData();

      // Add form fields
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);
      formData.append("phone", data.phone || "");
      formData.append("role", "REALTOR");
      formData.append("agencyName", data.agencyName);
      formData.append("businessAddress", data.businessAddress);
      formData.append("plan", plan);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
      });

      const result: RegistrationResponse = await response.json();

      if (!response.ok) {
        if (result.errors) {
          result.errors.forEach((error) => {
            // Map errors to form fields
            if (error.toLowerCase().includes("email")) {
              setError("email", { message: error });
            } else {
              toast.error(error);
            }
          });
        } else {
          toast.error(result.message || "Registration failed");
        }
        return;
      }

      // Store auth tokens if provided
      if (result.data?.accessToken) {
        localStorage.setItem("accessToken", result.data.accessToken);
        localStorage.setItem("refreshToken", result.data.refreshToken);
      }

      toast.success(
        "Registration successful! Please check your email for verification."
      );

      // Redirect to verification page
      router.push(
        `/realtor/verify-email?email=${encodeURIComponent(data.email)}`
      );
    } catch (error) {
      console.error("Registration failed:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen relative overflow-hidden"
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
          <div className="flex items-center space-x-3">
            <div className="relative">
              <motion.div
                className="w-10 h-10 bg-gradient-to-r from-white/20 to-white/10 rounded-xl backdrop-blur-sm border border-white/20 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Building2 className="h-6 w-6 text-white" />
              </motion.div>
            </div>
            <span className="text-2xl font-bold text-white">Stayza Pro</span>
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
              href="/realtor/login"
              className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              Sign In
            </Link>
            <Link
              href="/contact"
              className="transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              Support
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
              href="/realtor/login"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2 transition-colors hover:bg-white/10"
            >
              Sign In
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2 transition-colors hover:bg-white/10"
            >
              Support
            </Link>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="relative">
        <div className="mx-auto max-w-4xl px-4 pb-24 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="flex justify-center">
            {/* Registration Form */}
            <motion.div
              className="w-full max-w-2xl"
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
              <div className="rounded-3xl bg-white/95 backdrop-blur-sm p-8 shadow-2xl border border-white/20">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Create Realtor Account
                  </h1>
                  <p className="text-gray-600">
                    Join Stayza Pro and start managing your property listings
                    today.
                  </p>
                  {plan && plan !== "free" && (
                    <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      Selected Plan:{" "}
                      {plan.charAt(0).toUpperCase() + plan.slice(1)}
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        First Name
                      </label>
                      <div className="relative">
                        <input
                          {...register("firstName")}
                          type="text"
                          className={`w-full px-4 py-3 pr-12 text-sm border-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                            errors.firstName
                              ? "border-red-500 ring-2 ring-red-500/20"
                              : "border-gray-200 hover:border-gray-300 focus:border-blue-500"
                          }`}
                          placeholder="John"
                        />
                        <User className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      </div>
                      {errors.firstName && (
                        <p className="mt-2 text-sm text-red-600">
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Last Name
                      </label>
                      <div className="relative">
                        <input
                          {...register("lastName")}
                          type="text"
                          className={`w-full px-4 py-3 pr-12 text-sm border-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                            errors.lastName
                              ? "border-red-500 ring-2 ring-red-500/20"
                              : "border-gray-200 hover:border-gray-300 focus:border-blue-500"
                          }`}
                          placeholder="Doe"
                        />
                        <User className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      </div>
                      {errors.lastName && (
                        <p className="mt-2 text-sm text-red-600">
                          {errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Business Information */}
                  <div>
                    <label
                      htmlFor="agencyName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Agency/Business Name
                    </label>
                    <div className="relative">
                      <input
                        {...register("agencyName")}
                        type="text"
                        className={`w-full px-4 py-3 pr-12 text-sm border-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                          errors.agencyName
                            ? "border-red-500 ring-2 ring-red-500/20"
                            : "border-gray-200 hover:border-gray-300 focus:border-blue-500"
                        }`}
                        placeholder="Your Real Estate Agency"
                      />
                      <Building2 className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                    {errors.agencyName && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.agencyName.message}
                      </p>
                    )}
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Business Email Address
                      </label>
                      <div className="relative">
                        <input
                          {...register("email")}
                          type="email"
                          autoComplete="email"
                          className={`w-full px-4 py-3 pr-12 text-sm border-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                            errors.email
                              ? "border-red-500 ring-2 ring-red-500/20"
                              : "border-gray-200 hover:border-gray-300 focus:border-blue-500"
                          }`}
                          placeholder="john@youragency.com"
                        />
                        <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      </div>
                      {errors.email && (
                        <p className="mt-2 text-sm text-red-600">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Phone Number (Optional)
                      </label>
                      <div className="relative">
                        <input
                          {...register("phone")}
                          type="tel"
                          className="w-full px-4 py-3 pr-12 text-sm border-2 border-gray-200 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-300 focus:border-blue-500"
                          placeholder="+1 (555) 123-4567"
                        />
                        <Phone className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Business Address */}
                  <div>
                    <label
                      htmlFor="businessAddress"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Business Address
                    </label>
                    <div className="relative">
                      <input
                        {...register("businessAddress")}
                        type="text"
                        className={`w-full px-4 py-3 pr-12 text-sm border-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                          errors.businessAddress
                            ? "border-red-500 ring-2 ring-red-500/20"
                            : "border-gray-200 hover:border-gray-300 focus:border-blue-500"
                        }`}
                        placeholder="123 Main St, City, State, Country"
                      />
                      <MapPin className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                    {errors.businessAddress && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.businessAddress.message}
                      </p>
                    )}
                  </div>

                  {/* Location (Optional) */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="country"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Country (Optional)
                      </label>
                      <select
                        {...register("country")}
                        className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-300 focus:border-blue-500"
                      >
                        <option value="">Select country</option>
                        {countries.map((country) => (
                          <option key={country.value} value={country.value}>
                            {country.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="city"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        City (Optional)
                      </label>
                      <input
                        {...register("city")}
                        type="text"
                        className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-300 focus:border-blue-500"
                        placeholder="New York"
                      />
                    </div>
                  </div>

                  {/* Password Fields */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                          className={`w-full px-4 py-3 pr-12 text-sm border-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                            errors.password
                              ? "border-red-500 ring-2 ring-red-500/20"
                              : "border-gray-200 hover:border-gray-300 focus:border-blue-500"
                          }`}
                          placeholder="Create a strong password"
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
                        <p className="mt-2 text-sm text-red-600">
                          {errors.password.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          {...register("confirmPassword")}
                          type={showConfirmPassword ? "text" : "password"}
                          className={`w-full px-4 py-3 pr-12 text-sm border-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                            errors.confirmPassword
                              ? "border-red-500 ring-2 ring-red-500/20"
                              : "border-gray-200 hover:border-gray-300 focus:border-blue-500"
                          }`}
                          placeholder="Confirm your password"
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
                        <p className="mt-2 text-sm text-red-600">
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      required
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                      disabled={isLoading}
                    />
                    <label className="ml-2 text-sm text-gray-600">
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Privacy Policy
                      </Link>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Account...
                      </div>
                    ) : (
                      "Create Realtor Account"
                    )}
                  </button>

                  {/* Login Link */}
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Already have an account?{" "}
                      <Link
                        href="/realtor/login"
                        className="font-medium text-blue-600 hover:text-blue-500"
                      >
                        Sign in here
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative text-center pb-8">
          <p className="text-sm text-white/80">
            Questions about registration?{" "}
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
