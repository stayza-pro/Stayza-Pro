"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface VerificationResult {
  success: boolean;
  message: string;
  redirectUrl?: string;
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const type = searchParams.get("type") || "realtor"; // Default to realtor

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
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";
        const response = await fetch(
          `${API_URL}/auth/verify-email?token=${token}&email=${encodeURIComponent(
            email
          )}&type=${type}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (data.success) {
          // Determine redirect URL based on type
          const redirectUrl = type === "realtor" ? "/realtor/login" : "/login";

          setResult({
            success: true,
            message: data.message || "Email verified successfully!",
            redirectUrl: redirectUrl,
          });
          toast.success("Email verified successfully! Redirecting to login...");

          // Auto-redirect to login page after successful verification
          setTimeout(() => {
            console.log(`🔄 Redirecting to ${redirectUrl}`);
            router.push(redirectUrl);
          }, 3000); // Wait 3 seconds to show success message
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
  }, [token, email, type, router]);

  const handleResendVerification = async () => {
    if (!email) return;

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, type }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Verification email sent! Please check your inbox.");
      } else {
        const errorMessage =
          data.error?.message ||
          data.message ||
          "Failed to resend verification email.";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      toast.error("Failed to resend verification email. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50 p-4">
        <div className="w-full max-w-md text-center">
          <Loader2 className="h-16 w-16 animate-spin text-orange-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verifying Your Email...
          </h1>
          <p className="text-gray-600">
            Please wait while we verify your email address.
          </p>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          {result.success ? (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Email Verified! 🎉
              </h1>
              <p className="text-gray-600 mb-6">{result.message}</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800">
                  Your email has been successfully verified. You can now log in
                  to your account.
                </p>
              </div>
              <Link
                href={result.redirectUrl || "/realtor/login"}
                className="inline-block w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl"
              >
                Go to Login
              </Link>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Verification Failed
              </h1>
              <p className="text-gray-600 mb-6">{result.message}</p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800 mb-3">
                  This verification link may have expired or is invalid.
                </p>
                {email && (
                  <button
                    onClick={handleResendVerification}
                    className="text-sm font-semibold text-red-600 hover:text-red-700 underline"
                  >
                    Resend Verification Email
                  </button>
                )}
              </div>
              <Link
                href={type === "realtor" ? "/realtor/login" : "/login"}
                className="inline-block w-full bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition-all"
              >
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
