"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, ArrowRight, CheckCircle2, Phone } from "lucide-react";
import toast from "react-hot-toast";
import { Button, Input } from "@/components/ui";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { getRealtorSubdomain } from "@/utils/subdomain";
import { GuestAuthShell } from "@/components/auth/GuestAuthShell";

const getBackendApiUrl = () => {
  const configured =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";
  const trimmed = configured.replace(/\/+$/, "");
  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
};

interface GuestRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  agreedToTerms: boolean;
}

function GuestRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<GuestRegistrationData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    agreedToTerms: false,
  });

  const {
    realtorId,
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

  useEffect(() => {
    setSubdomain(getRealtorSubdomain());
  }, []);

  const validateForm = () => {
    if (!data.firstName.trim() || data.firstName.trim().length < 2) {
      toast.error("Please enter your first name");
      return false;
    }

    if (!data.lastName.trim() || data.lastName.trim().length < 2) {
      toast.error("Please enter your last name");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      toast.error("Please enter a valid email");
      return false;
    }

    if (!data.phone.trim()) {
      toast.error("Please enter your phone number");
      return false;
    }

    if (!/^[+]?[\d\s\-()]{7,15}$/.test(data.phone.trim())) {
      toast.error("Please enter a valid phone number");
      return false;
    }

    if (!data.agreedToTerms) {
      toast.error("Please agree to the Terms and Privacy Policy");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const backendUrl = getBackendApiUrl();
      const response = await fetch(`${backendUrl}/auth/register-passwordless`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email,
          phone: data.phone.trim(),
          role: "GUEST",
          realtorId: realtorId || undefined,
          referralSource: subdomain ? `subdomain:${subdomain}` : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Registration failed");
      }

      toast.success(result?.message || "Verification code sent!");

      const otpParams = new URLSearchParams({
        email: data.email,
        type: "register",
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone.trim(),
      });

      if (realtorId) {
        otpParams.append("realtorId", realtorId);
      }
      if (subdomain) {
        otpParams.append("referralSource", `subdomain:${subdomain}`);
      }

      otpParams.append("returnTo", safeReturnTo);

      router.push(`/auth/verify-otp?${otpParams.toString()}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    "Save favorite properties and create wishlists",
    "Book property viewings instantly",
    "Receive personalized property recommendations",
    "Track your booking history and preferences",
    "Priority access to new listings",
    "Direct messaging with property agents",
  ];

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
              <div className="h-14 w-14 rounded-2xl bg-white/15 border border-white/25 shadow-lg p-2.5 flex items-center justify-center">
                <img
                  src={logoUrl}
                  alt={realtorName}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-white/20 border border-white/25 shadow-lg">
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
              Join Our Exclusive Community
            </h1>
            <p className="text-lg leading-relaxed text-white/90">
              Create your account and verify with a one-time code to access
              premium property experiences
            </p>

            <div className="space-y-4 pt-8">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      backgroundColor:
                        secondaryColor || "rgba(255,255,255,0.35)",
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-base leading-relaxed text-white/95">
                    {benefit}
                  </span>
                </div>
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
                <div className="h-12 w-12 rounded-xl bg-white border border-gray-200 shadow-sm p-2 flex items-center justify-center">
                  <img
                    src={logoUrl}
                    alt={realtorName}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center shadow-sm"
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
            <h1 className="font-semibold text-[32px] text-gray-900">
              Create Account
            </h1>
            <p className="text-gray-600">
              Start your journey to finding the perfect property
            </p>
          </div>

          <div className="hidden lg:block space-y-2">
            <h2 className="font-semibold text-[32px] text-gray-900">
              Create Account
            </h2>
            <p className="text-gray-600">
              Fill in your details and continue with secure OTP verification
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-8 rounded-2xl border space-y-6 bg-white border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="firstName"
                    className="text-sm font-medium text-gray-900"
                  >
                    First Name
                  </label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={data.firstName}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    className="h-12 rounded-xl border text-base bg-gray-50 border-gray-200 text-gray-900"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="lastName"
                    className="text-sm font-medium text-gray-900"
                  >
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={data.lastName}
                    onChange={(e) =>
                      setData((prev) => ({ ...prev, lastName: e.target.value }))
                    }
                    className="h-12 rounded-xl border text-base bg-gray-50 border-gray-200 text-gray-900"
                    required
                  />
                </div>
              </div>

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
                    value={data.email}
                    onChange={(e) =>
                      setData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="pl-12 h-12 rounded-xl border text-base bg-gray-50 border-gray-200 text-gray-900"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="phone"
                  className="text-sm font-medium text-gray-900"
                >
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={data.phone}
                    onChange={(e) =>
                      setData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="pl-12 h-12 rounded-xl border text-base bg-gray-50 border-gray-200 text-gray-900"
                    required
                  />
                </div>
              </div>

              <p className="text-sm text-gray-600">
                We&apos;ll send a 6-digit verification code to your email to
                complete registration.
              </p>

              <div className="flex items-start gap-3 pt-2">
                <input
                  id="terms"
                  type="checkbox"
                  checked={data.agreedToTerms}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      agreedToTerms: e.target.checked,
                    }))
                  }
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <label
                  htmlFor="terms"
                  className="text-sm leading-relaxed text-gray-600 cursor-pointer"
                >
                  I agree to the{" "}
                  <Link
                    href="/legal/terms"
                    className="font-medium hover:underline"
                    style={{ color: primaryColor }}
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/legal/privacy"
                    className="font-medium hover:underline"
                    style={{ color: primaryColor }}
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={!data.agreedToTerms}
              className="w-full h-12 rounded-xl font-semibold text-base shadow-sm hover:shadow-md transition-all text-white disabled:opacity-50"
              style={{ backgroundColor: accentColor || primaryColor }}
              loading={isSubmitting}
            >
              Create Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 rounded-full bg-slate-50 text-gray-500">
                Already have an account?
              </span>
            </div>
          </div>

          <div className="text-center">
            <Link
              href={`/guest/login?returnTo=${encodeURIComponent(safeReturnTo)}`}
              className="inline-flex items-center gap-2 font-medium hover:underline"
              style={{ color: primaryColor }}
            >
              Sign in instead
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

export default function GuestRegisterPage() {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <GuestRegisterContent />
    </Suspense>
  );
}
