"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button, Input } from "@/components/ui";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { GuestAuthShell } from "@/components/auth/GuestAuthShell";

const getBackendApiUrl = () => {
  const configured =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";
  const trimmed = configured.replace(/\/+$/, "");
  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
};

function GuestLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    brandColor: primaryColor,
    secondaryColor,
    accentColor,
    realtorName,
    logoUrl,
    isLoading: brandingLoading,
  } = useRealtorBranding();
  const primaryDark = secondaryColor || "#10283f";

  const sanitizeReturnTo = (value: string | null) => {
    if (!value || !value.startsWith("/")) {
      return "/guest-landing";
    }

    const blockedPaths = [
      "/guest/login",
      "/auth/verify-otp",
      "/guest/register",
    ];
    if (blockedPaths.some((path) => value.startsWith(path))) {
      return "/guest-landing";
    }

    return value;
  };

  const safeReturnTo = sanitizeReturnTo(
    searchParams.get("returnTo") || searchParams.get("redirect"),
  );

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const backendUrl = getBackendApiUrl();
      const response = await fetch(`${backendUrl}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "login" }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to send verification code");
      }

      if (result?.data?.otp) {
        toast.success(`Dev Mode OTP: ${result.data.otp}`, { duration: 9000 });
      } else {
        toast.success(result?.message || "Verification code sent!");
      }

      const otpParams = new URLSearchParams({
        email,
        type: "login",
        returnTo: safeReturnTo,
      });

      // Persist returnTo in sessionStorage as a backup in case the URL param is lost
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("auth_return_to", safeReturnTo);
        } catch {
          /* ignore */
        }
      }

      router.push(`/auth/verify-otp?${otpParams.toString()}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to send verification code. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (brandingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-400" />
      </div>
    );
  }

  return (
    <GuestAuthShell
      primaryColor={primaryColor}
      primaryDark={primaryDark}
      leftPanel={
        <>
          <Link href="/guest-landing" className="flex items-center gap-3 mb-12">
            {logoUrl ? (
              <img src={logoUrl} alt={realtorName} className="h-12 w-auto" />
            ) : (
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-white/20">
                <span className="text-white text-xl font-bold">
                  {(realtorName || "S").charAt(0)}
                </span>
              </div>
            )}
            <span className="text-2xl font-semibold text-white">
              {realtorName || "Stayza Pro"}
            </span>
          </Link>

          <div className="space-y-6">
            <h1 className="font-semibold leading-tight text-[40px] text-white">
              Welcome Back
            </h1>
            <p className="text-lg leading-relaxed max-w-md text-white/90">
              Continue with a one-time verification code to manage your bookings
              and favorites
            </p>

            <div className="flex gap-2 pt-8">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="h-1 rounded-full"
                  style={{
                    width: index === 0 ? "48px" : "24px",
                    backgroundColor:
                      index === 0
                        ? secondaryColor || "rgba(255, 255, 255, 0.7)"
                        : "rgba(255, 255, 255, 0.3)",
                  }}
                />
              ))}
            </div>
          </div>
        </>
      }
      rightPanel={
        <>
          <div className="lg:hidden text-center space-y-4">
            <Link
              href="/guest-landing"
              className="inline-flex items-center gap-2 mb-4"
            >
              {logoUrl ? (
                <img src={logoUrl} alt={realtorName} className="h-10 w-auto" />
              ) : (
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span className="text-white font-semibold">
                    {(realtorName || "S").charAt(0)}
                  </span>
                </div>
              )}
              <span className="text-xl font-semibold text-gray-900">
                {realtorName || "Stayza Pro"}
              </span>
            </Link>
            <h1 className="font-semibold text-[32px] text-gray-900">Sign In</h1>
            <p className="text-gray-600">
              Enter your email and we&apos;ll send a verification code
            </p>
          </div>

          <div className="hidden lg:block space-y-2">
            <h2 className="font-semibold text-[32px] text-gray-900">Sign In</h2>
            <p className="text-gray-600">
              Enter your email to continue with secure OTP login
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-8 rounded-2xl border space-y-6 bg-white border-gray-200">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-900"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="pl-12 h-12 rounded-xl border text-base bg-gray-50 border-gray-200 text-gray-900"
                    required
                  />
                </div>
              </div>

              <p className="text-sm text-gray-600">
                We&apos;ll send a 6-digit verification code to this email.
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 rounded-xl font-semibold text-base shadow-sm hover:shadow-md transition-all text-white"
              style={{ backgroundColor: accentColor || primaryColor }}
              loading={isSubmitting}
            >
              Continue with OTP
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 rounded-full bg-slate-50 text-gray-500">
                New to {realtorName || "Stayza Pro"}?
              </span>
            </div>
          </div>

          <div className="text-center">
            <Link
              href={`/guest/register?returnTo=${encodeURIComponent(safeReturnTo)}`}
              className="inline-flex items-center gap-2 font-medium hover:underline"
              style={{ color: primaryColor }}
            >
              Create an account
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </>
      }
    />
  );
}

function AuthPageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-400" />
    </div>
  );
}

export default function GuestLoginPage() {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <GuestLoginContent />
    </Suspense>
  );
}
