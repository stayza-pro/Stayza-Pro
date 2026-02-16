"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, ArrowLeft, RefreshCw, Check } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { useAuthStore } from "@/store";

const getBackendApiUrl = () => {
  const configured =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";
  const trimmed = configured.replace(/\/+$/, "");
  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
};

// Force dynamic rendering
export const dynamic = "force-dynamic";

function OTPVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoLogin = useAuthStore((state) => state.autoLogin);

  const email = searchParams.get("email") || "";
  const type = searchParams.get("type") || "login"; // "login" or "register"
  const returnTo = searchParams.get("returnTo") || "/guest-landing";
  const realtorId = searchParams.get("realtorId");
  const referralSource = searchParams.get("referralSource");
  const firstName = searchParams.get("firstName");
  const lastName = searchParams.get("lastName");

  // Get realtor branding
  const { brandColor, realtorName, logoUrl } = useRealtorBranding();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const getErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }
    return fallback;
  };

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (index === 5 && value && newOtp.every((digit) => digit !== "")) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);

    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split("");
    setOtp([...newOtp, ...Array(6 - newOtp.length).fill("")]);

    // Focus the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();

    // Auto-submit if we have 6 digits
    if (pastedData.length === 6) {
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const code = otpCode || otp.join("");

    if (code.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    setIsLoading(true);

    try {
      const backendUrl = getBackendApiUrl();

      const endpoint =
        type === "register"
          ? "/auth/verify-registration"
          : "/auth/verify-login";

      const payload: {
        email: string;
        otp: string;
        realtorId?: string;
        referralSource?: string;
      } = {
        email,
        otp: code,
      };

      // Add realtor context for registration
      if (type === "register" && realtorId) {
        payload.realtorId = realtorId;
      }
      if (type === "register" && referralSource) {
        payload.referralSource = referralSource;
      }

      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific error status codes with user-friendly messages
        let errorMessage = result.message;

        if (response.status === 400) {
          if (result.message?.includes("expired")) {
            errorMessage =
              "Your verification code has expired. Please request a new one.";
          } else if (
            result.message?.includes("invalid") ||
            result.message?.includes("incorrect")
          ) {
            errorMessage =
              "Invalid verification code. Please check and try again.";
          } else {
            errorMessage =
              result.message || "Verification failed. Please check your code.";
          }
        } else if (response.status === 404) {
          errorMessage = "Account not found. Please register first.";
        } else if (response.status === 429) {
          errorMessage =
            "Too many attempts. Please wait a few minutes and try again.";
        }

        throw new Error(errorMessage);
      }

      if (result.data) {
        autoLogin(
          {
            accessToken: result.data.accessToken,
            refreshToken: result.data.refreshToken,
          },
          result.data.user,
        );

        const firstName = result.data.user.firstName || "there";

        if (type === "register") {
          toast.success(`Welcome to Stayza Pro, ${firstName}! 🎉`);
        } else {
          toast.success(`Welcome back, ${firstName}!`);
        }

        // Redirect to intended destination
        router.push(returnTo);
      }
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error, "Invalid verification code. Please try again."),
      );

      // Clear OTP inputs on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);

    try {
      const backendUrl = getBackendApiUrl();

      const endpoint =
        type === "register"
          ? "/auth/register-passwordless"
          : "/auth/request-otp";

      // Build payload based on type
      let payload: {
        email: string;
        type?: string;
        firstName?: string;
        lastName?: string;
        role?: "GUEST";
        realtorId?: string;
        referralSource?: string;
      } = { email };

      if (type === "register") {
        // For registration resend, include all required fields
        if (!firstName || !lastName) {
          toast.error(
            "Missing registration information. Please register again.",
          );
          router.push("/guest/register");
          return;
        }

        payload = {
          email,
          firstName,
          lastName,
          role: "GUEST",
          ...(realtorId && { realtorId }),
          ...(referralSource && { referralSource }),
        };
      } else {
        // For login, just send email and type
        payload.type = type;
      }

      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific error status codes with user-friendly messages
        let errorMessage = result.message;

        if (response.status === 404) {
          errorMessage =
            "Account not found. Please register first or check your email address.";
        } else if (response.status === 400) {
          if (result.message?.includes("guest accounts")) {
            errorMessage = "This feature is only available for guest accounts.";
          } else {
            errorMessage =
              result.message || "Invalid request. Please try again.";
          }
        } else if (response.status === 429) {
          errorMessage =
            "Too many requests. Please wait a moment before trying again.";
        }

        throw new Error(errorMessage);
      }

      toast.success("New verification code sent!");
      setCountdown(60);
      setCanResend(false);

      // Clear current OTP
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error, "Failed to resend code. Please try again."),
      );
    } finally {
      setIsResending(false);
    }
  };

  const primaryColor = brandColor;

  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex lg:w-[40%] relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, #10283f 100%)`,
        }}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] bg-[length:48px_48px]" />
        <div className="relative flex flex-col justify-center px-12 xl:px-16 py-16">
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
              Verify Your Email
            </h1>
            <p className="text-lg leading-relaxed max-w-md text-white/90">
              Enter the 6-digit code we sent to complete your secure
              {type === "register" ? " registration" : " sign in"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-3">
            <div
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Mail className="w-8 h-8" style={{ color: primaryColor }} />
            </div>
            <h1 className="font-semibold text-[32px] text-gray-900">
              Check Your Email
            </h1>
            <p className="text-gray-600">
              We sent a 6-digit verification code to
              <br />
              <span className="font-semibold text-gray-900 break-all">{email}</span>
            </p>
          </div>

          <div className="p-8 rounded-2xl border bg-white border-gray-200 space-y-6">
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputRefs.current[index] = element;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={isLoading}
                  className="w-12 h-14 text-center text-xl font-semibold rounded-xl border-2 outline-none transition-all"
                  style={{
                    borderColor: digit ? primaryColor : "#e5e7eb",
                    color: "#111827",
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => handleVerify()}
              disabled={isLoading || otp.some((digit) => !digit)}
              className="w-full h-12 rounded-xl font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Verify Code
                </>
              )}
            </button>

            <div className="text-center">
              {canResend ? (
                <button
                  onClick={handleResend}
                  disabled={isResending}
                  className="inline-flex items-center gap-2 text-sm font-semibold disabled:opacity-60"
                  style={{ color: primaryColor }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Resend Code
                </button>
              ) : (
                <p className="text-sm text-gray-600">
                  Resend code in{" "}
                  <span className="font-semibold" style={{ color: primaryColor }}>
                    {countdown}s
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link
              href={type === "register" ? "/guest/register" : "/guest/login"}
              className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <Link href="/guest-landing" style={{ color: primaryColor }}>
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              border: "3px solid #e5e7eb",
              borderTop: "3px solid #2563eb",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
        </div>
      }
    >
      <OTPVerificationContent />
    </Suspense>
  );
}
