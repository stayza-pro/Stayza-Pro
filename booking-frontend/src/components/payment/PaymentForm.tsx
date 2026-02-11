"use client";

import React, { useMemo, useState } from "react";
import { Button, Card } from "../ui";
import { AlertCircle, CreditCard, Lock, Shield } from "lucide-react";
import { BookingFormData } from "../../types";
import { paymentService, serviceUtils } from "@/services";
import { logError } from "@/utils/errorLogger";

interface PaymentFormProps {
  bookingData: BookingFormData & {
    totalPrice: number;
    currency: string;
    propertyTitle: string;
    bookingId?: string;
  };
  onPaymentSuccess?: (paymentResult: {
    paymentId: string;
    reference?: string;
  }) => void;
  onPaymentError?: (error: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  bookingData,
  onPaymentSuccess,
  onPaymentError,
  isLoading = false,
  className = "",
}) => {
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCurrency = useMemo(() => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: bookingData.currency || "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }, [bookingData.currency]);

  const formatDate = (value: Date): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const nights = useMemo(() => {
    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
      return 0;
    }

    const diff = checkOut.getTime() - checkIn.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [bookingData.checkIn, bookingData.checkOut]);

  const startPayment = async () => {
    if (!bookingData.bookingId) {
      const message = "Booking ID is required before payment can start.";
      setPaymentError(message);
      onPaymentError?.(message);
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const response = await paymentService.initializePaystackPayment({
        bookingId: bookingData.bookingId,
      });

      if (!response.authorizationUrl) {
        throw new Error("Unable to initialize payment with Paystack.");
      }

      onPaymentSuccess?.({
        paymentId: response.paymentId,
        reference: response.reference,
      });

      if (typeof window !== "undefined") {
        localStorage.setItem(
          "paystackPaymentMeta",
          JSON.stringify({
            paymentId: response.paymentId,
            bookingId: bookingData.bookingId,
            reference: response.reference,
          })
        );

        window.location.href = response.authorizationUrl;
      }
    } catch (error) {
      const message = serviceUtils.extractErrorMessage(error);
      setPaymentError(message);
      onPaymentError?.(message);
      logError(error, {
        component: "PaymentForm",
        action: "initialize_paystack_payment",
        metadata: { bookingId: bookingData.bookingId },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`max-w-2xl mx-auto space-y-6 ${className}`}>
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Booking Summary
        </h2>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">{bookingData.propertyTitle}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">
              {formatDate(bookingData.checkIn)} - {formatDate(bookingData.checkOut)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">
              {nights} {nights === 1 ? "night" : "nights"} • {bookingData.guests}{" "}
              {bookingData.guests === 1 ? "guest" : "guests"}
            </span>
          </div>

          <hr className="my-4" />

          <div className="flex justify-between text-lg font-semibold text-gray-900">
            <span>Total</span>
            <span>{formatCurrency.format(bookingData.totalPrice)}</span>
          </div>
        </div>
      </Card>

      <Card className="p-6 border border-green-200 bg-green-50">
        <div className="flex items-center space-x-3 mb-4">
          <CreditCard className="h-6 w-6 text-green-700" />
          <h3 className="text-lg font-semibold text-green-900">
            Secure Paystack Checkout
          </h3>
        </div>

        <p className="text-green-800 text-sm mb-4">
          You will be redirected to Paystack to complete your booking payment
          securely.
        </p>

        <div className="rounded-lg border border-green-200 bg-white p-4 mb-4">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-green-700 mt-0.5" />
            <p className="text-sm text-green-800">
              Card, transfer, USSD, and mobile money payments are supported.
            </p>
          </div>
        </div>

        {paymentError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <p className="text-sm text-red-700">{paymentError}</p>
            </div>
          </div>
        )}

        <Button
          type="button"
          fullWidth
          onClick={startPayment}
          disabled={isLoading || isProcessing || !bookingData.bookingId}
          loading={isLoading || isProcessing}
          leftIcon={<Lock className="h-4 w-4" />}
          className="bg-green-600 hover:bg-green-700"
        >
          {isProcessing ? "Connecting to Paystack..." : "Proceed to Payment"}
        </Button>
      </Card>
    </div>
  );
};
