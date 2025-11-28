"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { Footer } from "@/components/guest/sections";
import { PaymentStatus } from "@/components/payment";
import { Card, Button, Loading } from "@/components/ui";
import { paymentService, serviceUtils } from "@/services";
import { Payment } from "@/types";
import { toast } from "react-hot-toast";

const mapPaymentStatus = (status?: Payment["status"]) => {
  switch (status) {
    case "COMPLETED":
      return "success" as const;
    case "FAILED":
      return "failed" as const;
    case "PARTIALLY_REFUNDED":
    case "REFUNDED":
      return "refunded" as const;
    case "PENDING":
      return "pending" as const;
    default:
      return "processing" as const;
  }
};

const PaymentSuccessContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference") || searchParams.get("trxref");

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
    if (!reference || hasAttemptedVerification) {
      return;
    }

    const verifyPayment = async () => {
      setHasAttemptedVerification(true);
      setStatus("processing");
      setErrorMessage(null);

      const storedMeta = localStorage.getItem("paystackPaymentMeta");
      let storedPaymentId: string | null = null;
      let storedBookingId: string | null = null;

      if (storedMeta) {
        try {
          const parsed = JSON.parse(storedMeta);
          storedPaymentId = parsed.paymentId || null;
          storedBookingId = parsed.bookingId || null;
        } catch (err) {
          console.warn("Unable to parse paystack payment meta", err);
        }
      }

      try {
        await paymentService.verifyPaystackPayment({ reference });
        toast.success("Payment verified successfully.");
        setStatus("success");

        if (storedPaymentId) {
          setPaymentId(storedPaymentId);
          const paymentRecord = await paymentService.getPayment(
            storedPaymentId
          );
          setPayment(paymentRecord);
          setBookingId(paymentRecord.booking?.id || storedBookingId);
        } else {
          setStatus("pending");
        }
      } catch (err) {
        const message = serviceUtils.extractErrorMessage(err);
        setStatus("failed");
        setErrorMessage(message);
        toast.error(message);
      } finally {
        if (storedMeta) {
          localStorage.removeItem("paystackPaymentMeta");
        }
      }
    };

    verifyPayment();
  }, [reference, hasAttemptedVerification]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <GuestHeader
        currentPage="profile"
        searchPlaceholder="Search location..."
      />
      <main className="flex-1 flex items-center">
        <div className="w-full max-w-3xl mx-auto px-4 py-10">
          {!reference ? (
            <Card className="p-8 text-center space-y-4">
              <h1 className="text-2xl font-semibold text-gray-900">
                Missing payment reference
              </h1>
              <p className="text-gray-600">
                We couldn&apos;t find a Paystack payment reference in the URL.
                If you just completed a payment, return to the checkout page and
                try again.
              </p>
              <div className="flex justify-center gap-3">
                <Button
                  variant="primary"
                  onClick={() => router.push("/dashboard")}
                >
                  Go to dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/properties")}
                >
                  Browse properties
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              {status === "processing" && !payment ? (
                <div className="flex flex-col items-center space-y-4">
                  <Loading size="lg" />
                  <p className="text-gray-600">
                    Verifying your payment. Please don&apos;t close this page.
                  </p>
                </div>
              ) : (
                <PaymentStatus
                  payment={payment || undefined}
                  status={effectiveStatus}
                  amount={payment?.amount}
                  currency={payment?.currency}
                  paymentMethod={payment?.method}
                  transactionId={payment?.providerTransactionId}
                  errorMessage={errorMessage || undefined}
                  onDownloadReceipt={
                    effectiveStatus === "success"
                      ? handleDownloadReceipt
                      : undefined
                  }
                  onContinue={() => router.push("/dashboard")}
                  onGoBack={
                    effectiveStatus === "failed"
                      ? () => router.push("/properties")
                      : undefined
                  }
                />
              )}

              {bookingId && (
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                  >
                    View my bookings
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

const PaymentSuccessPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-gray-50">
          <GuestHeader
            currentPage="profile"
            searchPlaceholder="Search location..."
          />
          <main className="flex-1 flex items-center justify-center">
            <Loading size="lg" />
          </main>
          <Footer />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
};

export default PaymentSuccessPage;
