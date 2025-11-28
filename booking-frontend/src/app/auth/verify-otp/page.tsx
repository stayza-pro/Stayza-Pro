"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, ArrowLeft, RefreshCw, Check } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { getRealtorSubdomain } from "@/utils/subdomain";

// Force dynamic rendering
export const dynamic = "force-dynamic";

function OTPVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "";
  const type = searchParams.get("type") || "login"; // "login" or "register"
  const returnTo = searchParams.get("returnTo") || "/guest-landing";
  const realtorId = searchParams.get("realtorId");
  const referralSource = searchParams.get("referralSource");
  const firstName = searchParams.get("firstName");
  const lastName = searchParams.get("lastName");

  // Get realtor branding
  const {
    brandColor,
    realtorName,
    logoUrl,
    tagline,
    isLoading: brandingLoading,
  } = useRealtorBranding();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

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
    inputRefs[0].current?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (index === 5 && value && newOtp.every((digit) => digit !== "")) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
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
    inputRefs[nextIndex].current?.focus();

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
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

      const endpoint =
        type === "register"
          ? "/api/auth/verify-registration"
          : "/api/auth/verify-login";

      const payload: any = {
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
        throw new Error(result.message || "Verification failed");
      }

      if (result.data) {
        // Store tokens
        localStorage.setItem("accessToken", result.data.accessToken);
        localStorage.setItem("refreshToken", result.data.refreshToken);
        localStorage.setItem("user", JSON.stringify(result.data.user));

        const firstName = result.data.user.firstName || "there";

        if (type === "register") {
          toast.success(`Welcome to Stayza, ${firstName}! 🎉`);
        } else {
          toast.success(`Welcome back, ${firstName}!`);
        }

        // Redirect to intended destination
        router.push(returnTo);
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast.error(
        error.message || "Invalid verification code. Please try again."
      );

      // Clear OTP inputs on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs[0].current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

      const endpoint =
        type === "register"
          ? "/api/auth/register-passwordless"
          : "/api/auth/request-otp";

      // Build payload based on type
      let payload: any = { email };

      if (type === "register") {
        // For registration resend, include all required fields
        if (!firstName || !lastName) {
          toast.error(
            "Missing registration information. Please register again."
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
        throw new Error(result.message || "Failed to resend code");
      }

      toast.success("New verification code sent!");
      setCountdown(60);
      setCanResend(false);

      // Clear current OTP
      setOtp(["", "", "", "", "", ""]);
      inputRefs[0].current?.focus();
    } catch (error: any) {
      console.error("Resend error:", error);
      toast.error(error.message || "Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const primaryColor = brandColor;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          padding: "1.5rem 2rem",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href={type === "register" ? "/guest/register" : "/guest/login"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#6b7280",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={18} />
            Back
          </Link>
          <Link
            href="/guest-landing"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              textDecoration: "none",
            }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={realtorName}
                style={{
                  height: 40,
                  width: 40,
                  borderRadius: 8,
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: primaryColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "white",
                }}
              >
                {realtorName.charAt(0).toUpperCase()}
              </div>
            )}
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#1f2937",
                margin: 0,
              }}
            >
              {realtorName}
            </h1>
          </Link>
          <div style={{ width: 80 }}></div>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1.5rem",
        }}
      >
        <div style={{ width: "100%", maxWidth: "480px" }}>
          {/* Icon */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: `${primaryColor}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 2rem",
            }}
          >
            <Mail size={32} color={primaryColor} />
          </div>

          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "#1f2937",
                marginBottom: "0.75rem",
              }}
            >
              Check Your Email
            </h2>
            <p
              style={{
                color: "#6b7280",
                fontSize: "0.9375rem",
                lineHeight: 1.6,
              }}
            >
              We've sent a 6-digit verification code to
              <br />
              <strong style={{ color: "#1f2937" }}>{email}</strong>
            </p>
          </div>

          {/* OTP Form Card */}
          <div
            style={{
              background: "white",
              borderRadius: 20,
              padding: "2.5rem",
              boxShadow:
                "0 10px 40px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
              border: "1px solid rgba(0, 0, 0, 0.05)",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#374151",
                marginBottom: "1rem",
                textAlign: "center",
              }}
            >
              Enter Verification Code
            </label>

            {/* OTP Inputs */}
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "center",
                marginBottom: "2rem",
              }}
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={isLoading}
                  style={{
                    width: 56,
                    height: 64,
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    textAlign: "center",
                    border: `2px solid ${digit ? primaryColor : "#e5e7eb"}`,
                    borderRadius: 12,
                    outline: "none",
                    transition: "all 0.2s",
                    color: "#1f2937",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = primaryColor;
                    e.target.style.boxShadow = `0 0 0 3px ${primaryColor}15`;
                  }}
                  onBlur={(e) => {
                    if (!digit) {
                      e.target.style.borderColor = "#e5e7eb";
                    }
                    e.target.style.boxShadow = "none";
                  }}
                />
              ))}
            </div>

            {/* Verify Button */}
            <button
              onClick={() => handleVerify()}
              disabled={isLoading || otp.some((digit) => !digit)}
              style={{
                width: "100%",
                padding: "1rem",
                background: primaryColor,
                color: "white",
                border: "none",
                borderRadius: 12,
                fontSize: "1rem",
                fontWeight: 600,
                cursor:
                  isLoading || otp.some((digit) => !digit)
                    ? "not-allowed"
                    : "pointer",
                opacity: isLoading || otp.some((digit) => !digit) ? 0.5 : 1,
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                marginBottom: "1.5rem",
              }}
              onMouseEnter={(e) => {
                if (!isLoading && !otp.some((digit) => !digit)) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = `0 8px 20px ${primaryColor}40`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {isLoading ? (
                <div
                  style={{
                    display: "inline-block",
                    width: 20,
                    height: 20,
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                    borderTop: "2px solid white",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
              ) : (
                <>
                  <Check size={18} />
                  Verify Code
                </>
              )}
            </button>

            {/* Resend Code */}
            <div style={{ textAlign: "center" }}>
              {canResend ? (
                <button
                  onClick={handleResend}
                  disabled={isResending}
                  style={{
                    background: "none",
                    border: "none",
                    color: primaryColor,
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: isResending ? "not-allowed" : "pointer",
                    opacity: isResending ? 0.5 : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 1rem",
                    borderRadius: 8,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isResending) {
                      e.currentTarget.style.background = `${primaryColor}10`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "none";
                  }}
                >
                  <RefreshCw size={16} />
                  Resend Code
                </button>
              ) : (
                <p
                  style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}
                >
                  Resend code in{" "}
                  <strong style={{ color: primaryColor }}>{countdown}s</strong>
                </p>
              )}
            </div>
          </div>

          {/* Footer Note */}
          <p
            style={{
              textAlign: "center",
              color: "#6b7280",
              fontSize: "0.8125rem",
              marginTop: "1.5rem",
            }}
          >
            Didn't receive the email? Check your spam folder or try{" "}
            <Link
              href={type === "register" ? "/guest/register" : "/guest/login"}
              style={{ color: primaryColor, fontWeight: 600 }}
            >
              going back
            </Link>
          </p>
        </div>
      </div>

      {/* CSS Animation for spinner */}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
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
