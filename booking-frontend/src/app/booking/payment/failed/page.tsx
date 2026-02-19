"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, XCircle } from "lucide-react";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { Button, Card } from "@/components/ui";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";

const mapFailureReason = (reason?: string | null) => {
  if (!reason) {
    return "Your payment could not be completed. Please try again.";
  }

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

function PaymentFailedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const reference = searchParams.get("reference");
  const reason = searchParams.get("reason");

  const { brandColor } = useRealtorBranding();

  const reasonText = useMemo(() => mapFailureReason(reason), [reason]);

  return (
    <div className="min-h-screen bg-gray-50">
      <GuestHeader currentPage="bookings" searchPlaceholder="Search location..." />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card className="p-8 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 border-2 border-red-500">
              <XCircle className="h-11 w-11 text-red-500" />
            </div>
            <h1 className="text-3xl font-semibold text-gray-900">Payment Failed</h1>
            <p className="text-gray-600">{reasonText}</p>
          </div>

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2 text-amber-800">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">No booking replacement was made.</p>
                <p>Your original booking remains unchanged.</p>
              </div>
            </div>
          </div>

          {reference ? (
            <div className="mt-4 text-xs text-gray-500 break-all">
              Reference: {reference}
            </div>
          ) : null}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {bookingId ? (
              <Button
                onClick={() => router.push(`/guest/bookings/${bookingId}`)}
                className="h-11 rounded-xl text-white"
                style={{ backgroundColor: brandColor }}
              >
                Go to Booking Details
              </Button>
            ) : (
              <Button
                onClick={() => router.push("/guest/bookings")}
                className="h-11 rounded-xl text-white"
                style={{ backgroundColor: brandColor }}
              >
                Go to My Bookings
              </Button>
            )}

            <Button
              onClick={() => router.push("/guest/browse")}
              variant="outline"
              className="h-11 rounded-xl"
            >
              Browse Properties
            </Button>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="mt-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </Card>
      </main>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          Loading payment status...
        </div>
      }
    >
      <PaymentFailedContent />
    </Suspense>
  );
}

