"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Check, XCircle } from "lucide-react";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { Footer } from "@/components/guest/sections";
import { Button } from "@/components/ui";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";

const mapFailureReason = (reason?: string | null) => {
  if (!reason) return "Your payment could not be completed. Please try again.";
  switch (reason) {
    case "cancelled":
      return "Payment was cancelled before completion.";
    case "missing_reference":
      return "Payment reference was missing during callback verification.";
    case "verification_failed":
      return "Payment verification failed. Please retry payment.";
    default:
      return "Your payment could not be completed. Please try again.";
  }
};

export default function PaymentFailedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const reference = searchParams.get("reference");
  const reason = searchParams.get("reason");

  const {
    brandColor,
    secondaryColor,
    realtorName,
    logoUrl,
    tagline,
    description,
  } = useRealtorBranding();

  const primary = brandColor || "#2563eb";

  const reasonText = useMemo(() => mapFailureReason(reason), [reason]);

  const isCancelled = reason === "cancelled";
  const isVerificationFailed = reason === "verification_failed";

  const steps = ["Guest Details", "Payment", "Confirmation"];

  const footerProps = {
    realtorName,
    tagline,
    logo: logoUrl,
    description,
    primaryColor: primary,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <GuestHeader
        currentPage="bookings"
        searchPlaceholder="Search location..."
      />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">
        {/* ── Progress stepper ── */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            {steps.map((label, i) => {
              const isFailStep = i === 2;
              return (
                <div key={label} className="flex items-center gap-2">
                  {i > 0 && (
                    <div
                      className="hidden sm:block h-1 w-14 rounded-full"
                      style={{
                        backgroundColor: isFailStep ? "#ef4444" : primary,
                      }}
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm"
                      style={{
                        backgroundColor: isFailStep ? "#ef4444" : primary,
                      }}
                    >
                      {isFailStep ? (
                        <XCircle
                          className="h-5 w-5 text-white"
                          strokeWidth={2.5}
                        />
                      ) : (
                        <Check
                          className="h-5 w-5 text-white"
                          strokeWidth={2.5}
                        />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-800 hidden sm:inline">
                      {label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Main card ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          {/* Icon + heading */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 border-2 border-red-400 mb-4">
              <XCircle className="h-11 w-11 text-red-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              {isCancelled ? "Payment Cancelled" : "Payment Failed"}
            </h1>
            <p className="text-gray-500">{reasonText}</p>
          </div>

          {/* Contextual info box */}
          {isVerificationFailed ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-5">
              <div className="flex items-start gap-3 text-amber-800">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold mb-0.5">
                    Your payment may have gone through
                  </p>
                  <p className="text-amber-700">
                    If your card was charged, please contact support and provide
                    your reference number below. Do not retry payment until you
                    have confirmed.
                  </p>
                </div>
              </div>
            </div>
          ) : isCancelled ? (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 mb-5">
              <div className="flex items-start gap-3 text-yellow-800">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold mb-0.5">No charge was made</p>
                  <p className="text-yellow-700">
                    You closed the payment window before completing the
                    transaction. Your booking is still held — you can retry
                    payment from your booking details.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-5">
              <div className="flex items-start gap-3 text-gray-700">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-gray-500" />
                <div className="text-sm">
                  <p className="font-semibold mb-0.5">
                    No booking changes were made
                  </p>
                  <p className="text-gray-500">
                    Your original booking remains unchanged. You can retry
                    payment from your booking details page.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reference pill */}
          {reference && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-5 text-sm">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                Payment Reference
              </p>
              <p className="font-mono text-gray-800 break-all">{reference}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid gap-3 sm:grid-cols-2 mt-6">
            {bookingId ? (
              <Button
                onClick={() => router.push(`/guest/bookings/${bookingId}`)}
                className="h-11 rounded-xl font-semibold text-white"
                style={{ backgroundColor: primary }}
              >
                View Booking Details
              </Button>
            ) : (
              <Button
                onClick={() => router.push("/guest/bookings")}
                className="h-11 rounded-xl font-semibold text-white"
                style={{ backgroundColor: primary }}
              >
                My Bookings
              </Button>
            )}

            <Button
              onClick={() => router.push("/guest/browse")}
              variant="outline"
              className="h-11 rounded-xl font-semibold"
            >
              Browse Properties
            </Button>
          </div>

          {/* Back link */}
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-5 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </button>
        </div>
      </main>

      <Footer {...footerProps} />
    </div>
  );
}
