"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  // Validate token and email on mount
  useEffect(() => {
    if (!token || !email) {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [token, email]);

  // Password strength indicator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: "", color: "" };
    if (pwd.length < 6)
      return { strength: 1, label: "Too short", color: "text-red-600" };
    if (pwd.length < 8)
      return { strength: 2, label: "Weak", color: "text-orange-600" };

    let strength = 0;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;

    if (strength === 1)
      return { strength: 2, label: "Weak", color: "text-orange-600" };
    if (strength === 2)
      return { strength: 3, label: "Good", color: "text-yellow-600" };
    if (strength === 3)
      return { strength: 4, label: "Strong", color: "text-green-600" };
    return { strength: 5, label: "Very Strong", color: "text-green-700" };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !email) {
      toast.error("Invalid reset link");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        setIsSuccess(true);
        toast.success("Password reset successfully!");
        setTimeout(() => {
          router.push("/realtor/login");
        }, 2000);
      } else {
        const errorMessage =
          data.error?.message ||
          data.message ||
          "We couldn't reset your password. The reset link may be invalid or expired.";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      setError(
        "We couldn't reach the server. Please check your internet connection and try again.",
      );
      toast.error(
        "We couldn't reach the server. Please check your internet connection and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>

            {/* Success Message */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Password Reset Successful!
            </h1>
            <p className="text-gray-600 mb-8">
              Your password has been updated. Redirecting you to login...
            </p>

            {/* Manual Login Link */}
            <Link
              href="/realtor/login"
              className="inline-block w-full bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error && (!token || !email)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Invalid Reset Link
            </h1>
            <p className="text-gray-600 mb-8">{error}</p>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href="/realtor/forgot-password"
                className="block w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Request New Reset Link
              </Link>
              <Link
                href="/realtor/login"
                className="block w-full text-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Create New Password
            </h1>
            <p className="text-gray-600">
              Enter a strong password for your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter new password"
                  required
                  disabled={isLoading}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Password Strength:</span>
                    <span className={`font-medium ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        passwordStrength.strength === 1
                          ? "bg-red-500 w-1/5"
                          : passwordStrength.strength === 2
                            ? "bg-orange-500 w-2/5"
                            : passwordStrength.strength === 3
                              ? "bg-yellow-500 w-3/5"
                              : passwordStrength.strength === 4
                                ? "bg-green-500 w-4/5"
                                : "bg-green-600 w-full"
                      }`}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Confirm new password"
                  required
                  disabled={isLoading}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Password Match Indicator */}
              {confirmPassword && (
                <div className="mt-2">
                  {password === confirmPassword ? (
                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Passwords match
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-red-600">
                      <XCircle className="h-4 w-4 mr-1" />
                      Passwords do not match
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Password Requirements:
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center">
                  <span
                    className={
                      password.length >= 8 ? "text-green-600" : "text-gray-400"
                    }
                  >
                    {password.length >= 8 ? "✓" : "○"}
                  </span>
                  <span className="ml-2">At least 8 characters</span>
                </li>
                <li className="flex items-center">
                  <span
                    className={
                      /[A-Z]/.test(password)
                        ? "text-green-600"
                        : "text-gray-400"
                    }
                  >
                    {/[A-Z]/.test(password) ? "✓" : "○"}
                  </span>
                  <span className="ml-2">One uppercase letter</span>
                </li>
                <li className="flex items-center">
                  <span
                    className={
                      /[a-z]/.test(password)
                        ? "text-green-600"
                        : "text-gray-400"
                    }
                  >
                    {/[a-z]/.test(password) ? "✓" : "○"}
                  </span>
                  <span className="ml-2">One lowercase letter</span>
                </li>
                <li className="flex items-center">
                  <span
                    className={
                      /[0-9]/.test(password)
                        ? "text-green-600"
                        : "text-gray-400"
                    }
                  >
                    {/[0-9]/.test(password) ? "✓" : "○"}
                  </span>
                  <span className="ml-2">One number</span>
                </li>
              </ul>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <XCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                isLoading || password !== confirmPassword || password.length < 8
              }
              className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5 mr-2" />
                  Reset Password
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <Link
              href="/realtor/login"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Remember your password? Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
