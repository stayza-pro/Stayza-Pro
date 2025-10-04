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
          toast("Your account is still under review. Please wait for admin approval.", {
            icon: "⏳",
          });
          router.push("/auth/pending-approval");
        } else if (realtorStatus === "REJECTED") {
          toast.error("Your realtor application was rejected. Please contact support.");
          router.push("/auth/application-rejected");
        } else if (realtorStatus === "APPROVED") {
          toast.success(`Welcome back, ${user.realtor?.businessName || user.firstName}!`);
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
    <div className="min-h-screen bg-marketing-surface flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-marketing-primary text-white">
            <LogIn className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-marketing-foreground">
            Sign in to Stayza
          </h2>
          <p className="mt-2 text-sm text-marketing-muted">
            Access your account to manage bookings and properties
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <input
                  {...register("email")}
                  type="email"
                  autoComplete="email"
                  className={`marketing-input ${
                    errors.email ? "border-red-500" : ""
                  }`}
                  placeholder="Email address"
                />
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-marketing-muted" />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className={`marketing-input pr-20 ${
                    errors.password ? "border-red-500" : ""
                  }`}
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-marketing-muted" />
                  ) : (
                    <Eye className="h-5 w-5 text-marketing-muted" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
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
                className="h-4 w-4 text-marketing-primary focus:ring-marketing-focus border-marketing-border rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-marketing-muted">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                href="/auth/forgot-password"
                className="font-medium text-marketing-primary hover:opacity-80"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="marketing-button-primary w-full"
            >
              {isSubmitting || isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign in
                </>
              )}
            </button>
          </div>

          {/* Register Links */}
          <div className="text-center space-y-2">
            <p className="text-sm text-marketing-muted">
              Don't have an account?
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
              <Link
                href="/register/guest"
                className="text-sm font-medium text-marketing-primary hover:opacity-80 underline"
              >
                Sign up as Guest
              </Link>
              <Link
                href="/register/realtor"
                className="text-sm font-medium text-marketing-secondary hover:opacity-80 underline"
              >
                Register as Realtor
              </Link>
            </div>
          </div>
        </form>

        {/* Info Box */}
        <div className="rounded-md bg-marketing-primary-mist p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-marketing-primary" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-marketing-primary">
                Account Types
              </h3>
              <div className="mt-2 text-sm text-marketing-primary">
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Guests:</strong> Book properties and manage reservations</li>
                  <li><strong>Realtors:</strong> List properties and manage bookings (requires approval)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
