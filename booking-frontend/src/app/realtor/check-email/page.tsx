"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, CheckCircle, RefreshCw, ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function CheckEmailPage() {
  const [isResending, setIsResending] = useState(false);
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your email";

  const handleResendEmail = async () => {
    if (!searchParams.get("email")) {
      toast.error("Email not found. Please register again.");
      return;
    }

    setIsResending(true);
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";
      const response = await fetch(
        `${API_BASE_URL}/api/auth/resend-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: searchParams.get("email") }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Verification email sent! Please check your inbox.");
      } else {
        toast.error(data.message || "Failed to resend verification email");
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-lg" padding="lg">
        <Card.Header className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Mail className="h-16 w-16 text-blue-600" />
              <CheckCircle className="h-6 w-6 text-green-500 absolute -bottom-1 -right-1 bg-white rounded-full" />
            </div>
          </div>
          <h3 className="text-2xl text-gray-900 font-semibold">
            Check Your Email
          </h3>
          <div className="space-y-2 mt-4">
            <p className="text-gray-600 text-lg">
              We've sent a verification link to:
            </p>
            <p className="text-blue-600 font-semibold text-lg">{email}</p>
          </div>
        </Card.Header>

        <Card.Content>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Next Steps:
                </p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>1. Open your email inbox</li>
                  <li>2. Look for an email from Stayza</li>
                  <li>3. Click the verification link</li>
                  <li>4. You'll be redirected to your dashboard</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <p className="text-sm text-gray-500">
              Didn't receive the email? Check your spam folder or resend it.
            </p>

            <Button
              onClick={handleResendEmail}
              disabled={isResending}
              variant="outline"
              className="w-full"
            >
              {isResending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend Verification Email
                </>
              )}
            </Button>

            <div className="pt-4 border-t border-gray-200">
              <Link
                href="/register"
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Registration
              </Link>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> After verification, you'll be redirected to
              your personalized subdomain dashboard. Your application will be
              reviewed by our admin team.
            </p>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
