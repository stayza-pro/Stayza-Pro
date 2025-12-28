"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Mail, Loader2 } from "lucide-react";
import Link from "next/link";
import { palette } from "@/app/(marketing)/content";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";

interface VerificationResult {
  success: boolean;
  message: string;
  redirectUrl?: string;
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { autoLogin } = useAuthStore();
  const { brandColor, secondaryColor, accentColor, realtorName, logoUrl } =
    useRealtorBranding();
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token || !email) {
        setResult({
          success: false,
          message: "Invalid verification link. Missing token or email.",
        });
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5050/api/auth/verify-email?token=${token}&email=${encodeURIComponent(
            email
          )}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (data.success) {
          setResult({
            success: true,
            message: data.message || "Email verified successfully!",
            redirectUrl: data.redirectUrl,
          });
          toast.success("Email verified successfully!");

          // Auto-login: Use auth store for proper authentication
          if (data.authTokens && data.user) {
            console.log("🔐 Auto-login: Processing authentication tokens");
            autoLogin(data.authTokens, data.user);
            toast.success("You have been automatically logged in!");
          }

          // Auto-redirect after successful verification
          if (data.redirectUrl) {
            setTimeout(() => {
              console.log("🔄 Auto-redirecting to:", data.redirectUrl);

              // Check if it's a cross-domain redirect
              const currentHost = window.location.host;
              const redirectHost = new URL(
                data.redirectUrl,
                window.location.origin
              ).host;

              if (currentHost !== redirectHost) {
                // Cross-domain redirect
                console.log("🌐 Cross-domain redirect detected");
                window.location.href = data.redirectUrl;
              } else {
                // Same-domain redirect
                console.log("🔗 Same-domain redirect");
                router.push(data.redirectUrl);
              }
            }, 3000); // Wait 3 seconds to show success message
          }
        } else {
          setResult({
            success: false,
            message: data.message || "Email verification failed.",
          });
          toast.error(data.message || "Email verification failed.");
        }
      } catch (error) {
        console.error("Email verification error:", error);
        setResult({
          success: false,
          message: "Something went wrong during email verification.",
        });
        toast.error("Something went wrong during email verification.");
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [token, email]);

  const handleResendVerification = async () => {
    if (!email) return;

    try {
      const response = await fetch(
        "http://localhost:5050/api/auth/resend-verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Verification email sent! Please check your inbox.");
      } else {
        toast.error(data.message || "Failed to resend verification email.");
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={realtorName}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: brandColor }}
              >
                <span className="text-white font-bold text-2xl">
                  {realtorName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <>
              <div className="flex justify-center mb-6">
                <Loader2
                  className="h-16 w-16 animate-spin"
                  style={{ color: brandColor }}
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Verifying Your Email
              </h1>
              <p className="text-gray-600">
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {/* Success State */}
          {!isLoading && result?.success && (
            <>
              <div className="flex justify-center mb-6">
                <CheckCircle
                  className="h-16 w-16"
                  style={{ color: secondaryColor }}
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Email Verified Successfully!
              </h1>
              <p className="text-gray-600 mb-8">{result.message}</p>
              <div className="space-y-4">
                {result.redirectUrl ? (
                  <>
                    <button
                      onClick={() => {
                        const currentHost = window.location.host;
                        const redirectHost = new URL(
                          result.redirectUrl!,
                          window.location.origin
                        ).host;

                        if (currentHost !== redirectHost) {
                          window.location.href = result.redirectUrl!;
                        } else {
                          router.push(result.redirectUrl!);
                        }
                      }}
                      className="block w-full text-white font-semibold py-3 px-6 rounded-lg transition-colors hover:opacity-90"
                      style={{ backgroundColor: brandColor }}
                    >
                      Go to Dashboard
                    </button>
                    <p className="text-sm text-gray-500">
                      Redirecting automatically in a few seconds...
                    </p>
                  </>
                  <>
                    <Link
                      href="/"
                      className="block w-full text-white font-semibold py-3 px-6 rounded-lg transition-colors hover:opacity-90"
                      style={{ backgroundColor: brandColor }}
                    >
                      Go to Home
                    </Link>
                    <Link
                      href="/guest/login"
                      className="block w-full border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </>
          )}

          {/* Error State */}
          {!isLoading && result && !result.success && (
            <>
              <div className="flex justify-center mb-6">
                <XCircle className="h-16 w-16 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Verification Failed
              </h1>
              <p className="text-gray-600 mb-8">{result.message}</p>
              <div className="space-y-4">
                {email && (
                  <button
                    onClick={handleResendVerification}
                    className="w-full text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 hover:opacity-90"
                    style={{ backgroundColor: brandColor }}
                  >
                    <Mail className="h-5 w-5" />
                    Resend Verification Email
                  </button>
                )}
                <Link
                  href="/register"
                  className="block w-full border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Create New Account
                </Link>
              </div>
            </>
          )}

          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help?{" "}
              <Link
                href="/contact"
                className="hover:underline"
                style={{ color: brandColor }}
              >
                Contact Support
              </Link>
            </p>
            <p className="text-xs text-gray-400 mt-2">Powered by Stayza Pro</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="flex justify-center mb-6">
                <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Loading...
              </h1>
              <p className="text-gray-600">
                Please wait while we load the page...
              </p>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
