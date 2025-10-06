"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { Mail, CheckCircle, RefreshCw } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [isResending, setIsResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      // TODO: Call resend email API
      console.log("Resending verification email to:", email);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setResendCount((prev) => prev + 1);
      setCountdown(60); // 60 second cooldown
    } catch (error) {
      console.error("Failed to resend email:", error);
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    // TODO: Check if email is verified and redirect to onboarding
    router.push("/onboarding");
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Invalid Link
          </h1>
          <p className="text-gray-600 mb-6">
            This verification link is invalid or has expired.
          </p>
          <Button onClick={() => router.push("/register/realtor")}>
            Back to Registration
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Check Your Email
        </h1>

        <p className="text-gray-600 mb-6">
          We&apos;ve sent a verification link to{" "}
          <span className="font-medium text-gray-900">{email}</span>
        </p>

        <div className="space-y-4">
          <Button
            onClick={handleCheckVerification}
            className="w-full"
            leftIcon={<CheckCircle className="w-4 h-4" />}
          >
            I&apos;ve Verified - Continue Setup
          </Button>

          <div className="text-sm text-gray-500">
            Didn&apos;t receive the email?
          </div>

          <Button
            variant="outline"
            onClick={handleResendEmail}
            disabled={countdown > 0 || isResending}
            className="w-full"
            leftIcon={
              <RefreshCw
                className={`w-4 h-4 ${isResending ? "animate-spin" : ""}`}
              />
            }
          >
            {countdown > 0
              ? `Resend in ${countdown}s`
              : isResending
              ? "Sending..."
              : `Resend Email${resendCount > 0 ? ` (${resendCount})` : ""}`}
          </Button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            💡 While you wait...
          </h3>
          <ul className="text-sm text-blue-700 space-y-1 text-left">
            <li>• Check your spam/junk folder</li>
            <li>• Add no-reply@stayza.pro to contacts</li>
            <li>• The link expires in 24 hours</li>
          </ul>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          Wrong email?{" "}
          <button
            onClick={() => router.push("/register/realtor")}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Start over
          </button>
        </div>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
