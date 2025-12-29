"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { getRealtorSubdomain } from "@/utils/subdomain";

// Force dynamic rendering since this page uses search params
export const dynamic = "force-dynamic";

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
  errors?: string[];
}

function GuestLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/guest-landing";

  // Use the reusable realtor branding hook
  const {
    realtorBranding,
    brandColor: primaryColor, // 60% - Primary brand color for backgrounds and dominant elements
    secondaryColor, // 30% - Secondary color for text and borders
    accentColor, // 10% - Accent color for CTAs and highlights
    realtorName,
    logoUrl,
    tagline,
    isLoading: brandingLoading,
  } = useRealtorBranding();

  // State for hydration-safe subdomain detection
  const [realtorSubdomain, setRealtorSubdomain] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Handle client-side hydration
  React.useEffect(() => {
    setIsClient(true);
    const subdomain = getRealtorSubdomain();
    setRealtorSubdomain(subdomain);
  }, []);

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("Email is required");
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    } else {
      setEmailError("");
      return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";
      const response = await fetch(`${backendUrl}/auth/request-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, type: "login" }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific error status codes with user-friendly messages
        let errorMessage = result.message;

        if (response.status === 404) {
          errorMessage =
            "No account found with this email address. Please sign up first or check your email.";
        } else if (response.status === 400) {
          if (result.message?.includes("guest accounts")) {
            errorMessage =
              "This login method is only for guest accounts. Please use the regular login page.";
          } else if (result.message?.includes("valid email")) {
            errorMessage = "Please enter a valid email address.";
          } else {
            errorMessage =
              result.message ||
              "Invalid request. Please check your email and try again.";
          }
        }

        throw new Error(errorMessage);
      }

      // Show OTP in toast if in development mode
      if (result.data?.otp) {
        toast.success(`Dev Mode: Your OTP is ${result.data.otp}`, {
          duration: 10000,
        });
      } else {
        toast.success(
          result.message || "Verification code sent! Check your email."
        );
      }

      // Redirect to OTP verification page with email
      const otpParams = new URLSearchParams({
        email: email,
        type: "login",
        ...(returnTo && { returnTo }),
      });

      router.push(`/auth/verify-otp?${otpParams.toString()}`);
    } catch (error: any) {
      console.error("OTP request error:", error);
      toast.error(
        error.message || "Failed to send verification code. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Use realtor branding colors or defaults
  const businessName = realtorName;
  const logo = logoUrl || "";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFF8F0", // Warm beige/off-white background
      }}
    >
      {/* Header - Minimal & Clean */}
      <div
        style={{
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "1.5rem 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo/Brand */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              textDecoration: "none",
            }}
          >
            {logo && logo.trim() !== "" ? (
              <img
                src={logo}
                alt={businessName}
                style={{
                  height: 48,
                  width: 48,
                  borderRadius: 12,
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: primaryColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "white",
                }}
              >
                {businessName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: secondaryColor, // 30% - Secondary for brand name
                  margin: 0,
                }}
              >
                {businessName}
              </h1>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: `${secondaryColor}99`, // 30% - Secondary with opacity
                  margin: 0,
                }}
              >
                {tagline}
              </p>
            </div>
          </Link>

          {/* Register Link */}
          <Link
            href="/guest/register"
            style={{
              color: accentColor, // 10% - Accent for CTA link
              fontSize: "0.875rem",
              fontWeight: 600,
              textDecoration: "none",
              padding: "0.5rem 1rem",
              borderRadius: 8,
              transition: "all 0.2s",
            }}
          >
            Don't have an account? Sign up
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          maxWidth: "480px",
          margin: "0 auto",
          padding: "3rem 1.5rem",
        }}
      >
        {/* Title Section */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
              marginBottom: "1rem",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: secondaryColor, // 30% - Secondary for heading
                  marginBottom: "0.75rem",
                }}
              >
                Welcome Back
              </h2>
              <p
                style={{ color: `${secondaryColor}80`, fontSize: "0.9375rem" }}
              >
                {" "}
                {/* 30% - Secondary with opacity */}
                {isClient && realtorSubdomain
                  ? `Sign in to continue booking with ${businessName}`
                  : "Sign in to your guest account"}
              </p>
            </div>
          </div>
          {isClient && realtorSubdomain && (
            <div
              style={{
                marginTop: "1rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                background: `${accentColor}15`, // 10% - Accent for badge
                borderRadius: 999,
                fontSize: "0.8125rem",
                color: accentColor, // 10% - Accent for text
                fontWeight: 500,
              }}
            >
              <Check size={14} />
              Signed in with {businessName}
            </div>
          )}
        </div>

        {/* Login Form Card */}
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
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: secondaryColor, // 30% - Secondary for labels
                  marginBottom: "0.5rem",
                }}
              >
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: `${secondaryColor}60`, // 30% - Secondary for icon
                  }}
                >
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem 0.875rem 2.75rem",
                    border: `1.5px solid ${emailError ? "#ef4444" : "#e5e7eb"}`,
                    borderRadius: 12,
                    fontSize: "0.9375rem",
                    outline: "none",
                    transition: "all 0.2s",
                    boxSizing: "border-box",
                  }}
                  placeholder="you@example.com"
                  onFocus={(e) => {
                    e.target.style.borderColor = emailError
                      ? "#ef4444"
                      : secondaryColor; // 30% - Secondary on focus
                    e.target.style.boxShadow = `0 0 0 3px ${secondaryColor}15`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = emailError
                      ? "#ef4444"
                      : "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
              {emailError && (
                <p
                  style={{
                    color: "#ef4444",
                    fontSize: "0.8125rem",
                    marginTop: "0.375rem",
                  }}
                >
                  {emailError}
                </p>
              )}
            </div>

            {/* Security Note */}
            <div
              style={{
                padding: "1rem",
                background: `${primaryColor}08`, // 60% - Primary for info box
                borderRadius: 8,
                border: `1px solid ${primaryColor}30`,
              }}
            >
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: secondaryColor,
                  margin: 0,
                }}
              >
                {" "}
                {/* 30% - Secondary for text */}
                🔐 We'll send a verification code to your email. No password
                needed!
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "1rem",
                background: accentColor, // 10% - Accent for primary CTA
                color: "white",
                border: "none",
                borderRadius: 12,
                fontSize: "1rem",
                fontWeight: 600,
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = `0 8px 20px ${accentColor}40`;
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
                  Continue
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Branding */}
        <p
          style={{
            textAlign: "center",
            color: `${secondaryColor}60`, // 30% - Secondary for footer text
            fontSize: "0.8125rem",
            marginTop: "1.5rem",
          }}
        >
          Powered by Stayza Pro
        </p>
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

export default function GuestLoginPage() {
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
              borderTop: "3px solid #3B82F6",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
        </div>
      }
    >
      <GuestLoginContent />
    </Suspense>
  );
}
