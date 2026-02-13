"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Home } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button, Input } from "@/components/ui";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { getRealtorSubdomain } from "@/utils/subdomain";

export default function GuestLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subdomain, setSubdomain] = useState<string | null>(null);

  const { brandColor: primaryColor, realtorName, tagline } = useRealtorBranding();

  useEffect(() => {
    setSubdomain(getRealtorSubdomain());
  }, []);

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";
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

      const search = new URLSearchParams(window.location.search);
      const returnTo = search.get("returnTo") || "/guest-landing";
      const otpParams = new URLSearchParams({
        email,
        type: "login",
        returnTo,
      });

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50" style={{ colorScheme: "light" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white" style={{ backgroundColor: primaryColor }}>
            <Home className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Welcome Back</h1>
          <p className="text-gray-600">
            {subdomain ? `Sign in to ${realtorName}` : "Sign in to your guest account"}
          </p>
          {tagline ? <p className="text-sm text-gray-500 mt-1">{tagline}</p> : null}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">We’ll send a one-time login code to your email.</p>
            </div>

            <Button
              type="submit"
              className="w-full text-white"
              style={{ backgroundColor: primaryColor }}
              size="lg"
              loading={isSubmitting}
            >
              Continue with OTP
            </Button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">Don&apos;t have an account? </span>
            <Link href="/guest/register" className="text-sm font-medium hover:underline" style={{ color: primaryColor }}>
              Sign up
            </Link>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/guest-landing" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
