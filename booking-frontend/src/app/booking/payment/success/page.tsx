"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Clock, AlertCircle, Check } from "lucide-react";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { Footer } from "@/components/guest/sections";
import { Card, Button, Loading } from "@/components/ui";
import { paymentService, serviceUtils } from "@/services";
import { Payment } from "@/types";
import { toast } from "react-hot-toast";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { TransferStatusBadge } from "@/components/payments/TransferStatus";
import { useTransferStatus } from "@/hooks/useEscrow";
import { canDownloadReceipt, formatPaymentStatus } from "@/utils/bookingEnums";

const mapPaymentStatus = (status?: Payment["status"]) => {
  switch (status) {
    case "SETTLED":
      return "success" as const;
    case "FAILED":
      return "failed" as const;
    case "REFUNDED":
      return "refunded" as const;
    case "INITIATED":
      return "pending" as const;
    case "HELD":
    case "PARTIALLY_RELEASED":
      return "processing" as const;
    default:
      return "processing" as const;
  }
};

const PaymentSuccessContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const provider = (searchParams.get("provider") || "").toLowerCase();
  const flutterwaveTransactionId = searchParams.get("transaction_id");

  // Get realtor branding
  const {
    brandColor,
    secondaryColor,
    accentColor,
    realtorName,
    logoUrl,
    tagline,
    description,
  } = useRealtorBranding();

  const [status, setStatus] = useState<
    "processing" | "success" | "failed" | "pending" | "refunded"
  >(reference ? "processing" : "failed");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [hasAttemptedVerification, setHasAttemptedVerification] =
    useState(false);

  const effectiveStatus = useMemo(() => {
    if (payment) {
      return mapPaymentStatus(payment.status);
    }
    return status;
  }, [payment, status]);

  const handleDownloadReceipt = async () => {
    if (!paymentId) {
      toast.error("No receipt available yet.");
      return;
    }

    if (!canDownloadReceipt(payment?.status)) {
      const paymentStatusLabel = payment?.status
        ? formatPaymentStatus(payment.status)
        : "Unknown";
      toast.error(
        `Receipt available once payment is released. Current status: ${paymentStatusLabel}.`
      );
      return;
    }

    try {
      const blob = await paymentService.downloadReceipt(paymentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(serviceUtils.extractErrorMessage(err));
    }
  };

  useEffect(() => {
    if (hasAttemptedVerification) {
      return;
    }

    const verifyPayment = async () => {
      setHasAttemptedVerification(true);
      setStatus("processing");
      setErrorMessage(null);

      const storedMeta = localStorage.getItem("paystackPaymentMeta");
      const storedFlutterwaveMeta = localStorage.getItem(
        "flutterwavePaymentMeta"
      );
      let storedPaymentId: string | null = null;
      let storedBookingId: string | null = null;

      // Try to get stored metadata from either payment provider
      if (storedMeta) {
        try {
          const parsed = JSON.parse(storedMeta);
          storedPaymentId = parsed.paymentId || null;
          storedBookingId = parsed.bookingId || null;
        } catch (err) {
          
        }
      } else if (storedFlutterwaveMeta) {
        try {
          const parsed = JSON.parse(storedFlutterwaveMeta);
          storedPaymentId = parsed.paymentId || null;
          storedBookingId = parsed.bookingId || null;
        } catch (err) {
          
        }
      }

      try {
        // If no reference but we have bookingId, use verify-by-booking endpoint
        if (!reference && storedBookingId) {
          
          const result = await paymentService.verifyPaymentByBooking({
            bookingId: storedBookingId,
          });
          toast.success("Payment verified successfully.");
          setStatus("success");

          const resolvedPaymentId =
            result.payment?.id || storedPaymentId || null;
          const resolvedBookingId =
            result.booking?.id || storedBookingId || null;

          if (resolvedPaymentId) setPaymentId(resolvedPaymentId);
          if (resolvedBookingId) setBookingId(resolvedBookingId);

          if (result.payment) {
            setPayment(result.payment);
          }

          if (resolvedBookingId) {
            setTimeout(() => {
              router.push(`/booking/confirmation/${resolvedBookingId}`);
            }, 2000);
          }
          return;
        }

        // If we have a reference, use the standard verification flow
        if (reference) {
          // Use Paystack verification (Flutterwave has been removed)
          const result = await paymentService.verifyPaystackPayment({
            reference,
          });
          toast.success("Payment verified successfully.");
          setStatus("success");

          const resolvedPaymentId =
            storedPaymentId || result.payment?.id || null;
          const resolvedBookingId =
            result.booking?.id ||
            result.payment?.booking?.id ||
            storedBookingId ||
            null;

          if (resolvedPaymentId) setPaymentId(resolvedPaymentId);
          if (resolvedBookingId) setBookingId(resolvedBookingId);

          if (resolvedPaymentId && !payment) {
            try {
              const paymentRecord = await paymentService.getPayment(
                resolvedPaymentId
              );
              setPayment(paymentRecord);
            } catch {}
          }

          if (resolvedBookingId) {
            setTimeout(() => {
              router.push(`/booking/confirmation/${resolvedBookingId}`);
            }, 2000);
          }
        } else {
          // No reference and no bookingId - can't verify
          throw new Error(
            "Unable to verify payment: Missing payment reference and booking ID"
          );
        }
      } catch (err) {
        const message = serviceUtils.extractErrorMessage(err);
        

        // If verification by reference failed but we have bookingId, try verify-by-booking as fallback
        if (reference && storedBookingId) {
          
          try {
            const result = await paymentService.verifyPaymentByBooking({
              bookingId: storedBookingId,
            });
            toast.success("Payment verified successfully.");
            setStatus("success");

            if (result.payment) setPayment(result.payment);
            if (result.payment?.id) setPaymentId(result.payment.id);
            if (result.booking?.id || storedBookingId) {
              const bookingIdToUse = result.booking?.id || storedBookingId;
              setBookingId(bookingIdToUse);
              setTimeout(() => {
                router.push(`/booking/confirmation/${bookingIdToUse}`);
              }, 2000);
            }
            return;
          } catch (fallbackErr) {
            
            // Fall through to error handling below
          }
        }

        setStatus("failed");
        setErrorMessage(message);
        toast.error(message);
      } finally {
        if (storedMeta) {
          localStorage.removeItem("paystackPaymentMeta");
        }
        if (storedFlutterwaveMeta) {
          localStorage.removeItem("flutterwavePaymentMeta");
        }
      }
    };

    verifyPayment();
  }, [hasAttemptedVerification]);

  const getStatusIcon = () => {
    switch (effectiveStatus) {
      case "success":
        return (
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 shadow-lg"
            style={{
              backgroundColor: `${secondaryColor}15`,
              border: `2px solid ${secondaryColor}`,
            }}
          >
            <CheckCircle
              className="h-12 w-12"
              style={{ color: secondaryColor }}
            />
          </div>
        );
      case "failed":
        return (
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 bg-red-50 border-2 border-red-500">
            <XCircle className="h-12 w-12 text-red-500" />
          </div>
        );
      case "processing":
        return (
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 bg-blue-50 border-2 border-blue-500">
            <Clock className="h-12 w-12 text-blue-500 animate-pulse" />
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 bg-yellow-50 border-2 border-yellow-500">
            <AlertCircle className="h-12 w-12 text-yellow-500" />
          </div>
        );
    }
  };

  const getStatusMessage = () => {
    switch (effectiveStatus) {
      case "success":
        return {
          title: "Payment Successful!",
          description:
            "Your payment has been processed successfully. Redirecting to your booking confirmation...",
        };
      case "failed":
        return {
          title: "Payment Failed",
          description:
            errorMessage ||
            "We couldn't process your payment. Please try again.",
        };
      case "processing":
        return {
          title: "Processing Payment",
          description: "Please wait while we verify your payment...",
        };
      default:
        return {
          title: "Payment Status Unknown",
          description: "Please contact support if you need assistance.",
        };
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="min-h-screen bg-gray-50">
      <GuestHeader
        currentPage="profile"
        searchPlaceholder="Search location..."
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white"
                style={{ backgroundColor: brandColor }}
              >
                <Check className="h-6 w-6" />
              </div>
              <span className="ml-2 font-medium text-gray-900">
                Guest Details
              </span>
            </div>
            <div
              className="w-16 h-1"
              style={{ backgroundColor: brandColor }}
            ></div>
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  effectiveStatus === "success"
                    ? "text-white"
                    : "text-gray-600 bg-gray-200"
                }`}
                style={
                  effectiveStatus === "success"
                    ? { backgroundColor: brandColor }
                    : {}
                }
              >
                {effectiveStatus === "success" ? (
                  <Check className="h-6 w-6" />
                ) : (
                  "2"
                )}
              </div>
              <span
                className={`ml-2 font-medium ${
                  effectiveStatus === "success"
                    ? "text-gray-900"
                    : "text-gray-500"
                }`}
              >
                Payment
              </span>
            </div>
            <div
              className={`w-16 h-1 ${
                effectiveStatus === "success" ? "" : "bg-gray-300"
              }`}
              style={
                effectiveStatus === "success"
                  ? { backgroundColor: brandColor }
                  : {}
              }
            ></div>
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  effectiveStatus === "success"
                    ? "text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
                style={
                  effectiveStatus === "success"
                    ? { backgroundColor: brandColor }
                    : {}
                }
              >
                {effectiveStatus === "success" ? (
                  <Check className="h-6 w-6" />
                ) : (
                  "3"
                )}
              </div>
              <span
                className={`ml-2 font-medium ${
                  effectiveStatus === "success"
                    ? "text-gray-900"
                    : "text-gray-500"
                }`}
              >
                Confirmation
              </span>
            </div>
          </div>
        </div>

        {!reference ? (
          <Card
            className="p-6 border border-gray-200 !bg-white shadow-sm max-w-2xl mx-auto text-center"
            style={{ backgroundColor: "#ffffff", color: "#111827" }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1
              className="text-2xl sm:text-3xl font-bold mb-2"
              style={{ color: secondaryColor }}
            >
              Missing payment reference
            </h1>
            <p className="text-gray-600 mb-6">
              Unable to verify your payment. Please check your email for
              confirmation or contact support.
            </p>
            <Button onClick={() => router.push("/guest/bookings")}>
              Go to My Bookings
            </Button>
          </Card>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              {getStatusIcon()}
              <h1
                className="text-2xl sm:text-3xl font-bold mb-2"
                style={{ color: secondaryColor }}
              >
                {statusMessage.title}
              </h1>
              <p className="text-gray-600">{statusMessage.description}</p>
            </div>

            {effectiveStatus === "success" && bookingId && (
              <Card
                className="p-6 border border-gray-200 !bg-white shadow-sm"
                style={{ backgroundColor: "#ffffff", color: "#111827" }}
              >
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center space-x-2 text-gray-600">
                    <Clock className="h-5 w-5" />
                    <span>Redirecting to your booking confirmation...</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-2000 ease-linear"
                      style={{
                        backgroundColor: brandColor,
                        width: "100%",
                        animation: "progress 2s linear",
                      }}
                    ></div>
                  </div>
                  <Button
                    onClick={() =>
                      router.push(`/booking/confirmation/${bookingId}`)
                    }
                    className="w-full mt-4"
                    style={{ backgroundColor: brandColor }}
                  >
                    Go to Confirmation Now
                  </Button>
                </div>
              </Card>
            )}

            {effectiveStatus === "failed" && (
              <Card
                className="p-6 border border-gray-200 !bg-white shadow-sm"
                style={{ backgroundColor: "#ffffff", color: "#111827" }}
              >
                <div className="space-y-4">
                  <Button
                    onClick={() => router.push("/guest/bookings")}
                    className="w-full"
                    style={{ backgroundColor: brandColor }}
                  >
                    Return to My Bookings
                  </Button>
                  <Button
                    onClick={() => router.push("/browse")}
                    variant="outline"
                    className="w-full border-2 border-gray-300"
                  >
                    Browse Properties
                  </Button>
                </div>
              </Card>
            )}

            {effectiveStatus === "processing" && (
              <Card
                className="p-6 border border-gray-200 !bg-white shadow-sm"
                style={{ backgroundColor: "#ffffff", color: "#111827" }}
              >
                <div className="flex items-center justify-center space-y-4">
                  <Loading size="lg" />
                </div>
              </Card>
            )}
          </div>
        )}
      </main>

      <Footer
        realtorName={realtorName}
        tagline={tagline}
        logo={logoUrl}
        description={description}
        primaryColor={brandColor}
      />

      <style jsx>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loading size="lg" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}

