"use client";

import React, { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  CalendarDays,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";
import { bookingService, type VerifiedBookingArtifact } from "@/services/bookings";
import { Button, Card, Input } from "@/components/ui";

const toVerificationCode = (rawCode: string): string => {
  const trimmed = rawCode.trim();
  if (!trimmed) return "";

  if (trimmed.toUpperCase().startsWith("STZ-")) {
    return `STZ-${trimmed.slice(4)}`;
  }

  return `STZ-${trimmed}`;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

function VerifyBookingContent() {
  const searchParams = useSearchParams();
  const queryCode = searchParams.get("code") || "";
  const initialCode = useMemo(() => toVerificationCode(queryCode), [queryCode]);

  const [code, setCode] = useState(initialCode);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<VerifiedBookingArtifact | null>(null);

  const handleVerify = async () => {
    const normalizedCode = toVerificationCode(code);
    if (!normalizedCode) {
      toast.error("Enter a booking verification code.");
      return;
    }

    setIsChecking(true);
    setResult(null);

    try {
      const verification = await bookingService.verifyBookingArtifact(
        normalizedCode
      );
      setCode(normalizedCode);
      setResult(verification);
      toast.success(
        verification.verified
          ? "Booking artifact verified."
          : "Booking found, but payment is not verified yet."
      );
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response
          ?.data?.message === "string"
          ? (error as { response?: { data?: { message?: string } } }).response!
              .data!.message!
          : error instanceof Error
          ? error.message
          : "Unable to verify booking artifact.";
      toast.error(message);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verify Booking</h1>
        <p className="text-sm text-gray-600 mt-1">
          Confirm a guest artifact code before check-in.
        </p>
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex items-center text-gray-700">
          <QrCode className="h-5 w-5 mr-2" />
          <p className="font-medium">Artifact Code</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="STZ-xxxxxxxx"
            className="font-mono"
          />
          <Button
            onClick={() => void handleVerify()}
            disabled={isChecking}
            className="sm:w-auto"
          >
            {isChecking ? (
              "Checking..."
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Verify
              </>
            )}
          </Button>
        </div>
      </Card>

      {result && (
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                Verification Code
              </p>
              <p className="font-mono text-sm text-gray-900">{result.code}</p>
            </div>
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                result.verified
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {result.verified ? (
                <CheckCircle2 className="h-4 w-4 mr-1" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-1" />
              )}
              {result.verified ? "Verified" : "Payment Pending"}
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-900">
            {result.booking.property.title}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Guest: {result.booking.guestName || "Unknown guest"}
          </p>

          <div className="grid md:grid-cols-2 gap-4 mt-5">
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500 mb-2">Stay Window</p>
              <p className="text-sm text-gray-800 flex items-center">
                <CalendarDays className="h-4 w-4 mr-2 text-gray-500" />
                {formatDate(result.booking.checkInDate)} to{" "}
                {formatDate(result.booking.checkOutDate)}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500 mb-2">Property Location</p>
              <p className="text-sm text-gray-800 flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                {result.booking.property.city}, {result.booking.property.state}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function VerifyBookingPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl">Loading verification...</div>}>
      <VerifyBookingContent />
    </Suspense>
  );
}
