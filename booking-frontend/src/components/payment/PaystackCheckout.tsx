"use client";

import React, { useMemo, useState } from "react";
import { Button, Card, Loading } from "../ui";
import {
  Lock,
  Shield,
  AlertCircle,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import { paymentService, serviceUtils } from "@/services";
import { Payment } from "@/types";

interface PaystackCheckoutProps {
  bookingId: string;
  amount: number;
  currency: string;
  email: string;
  description?: string;
  customerName?: string;
  customerPhone?: string;
  onInitialized?: (details: {
    paymentId: string;
    reference?: string;
    paymentStatus?: Payment["status"];
  }) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
  className?: string;
}

const paystackPublicKey =
  process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
  process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC ||
  "";

export const PaystackCheckout: React.FC<PaystackCheckoutProps> = ({
  bookingId,
  amount,
  currency,
  email,
  description,
  customerName,
  customerPhone,
  onInitialized,
  onError,
  onCancel,
  className = "",
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<Payment["status"] | null>(
    null
  );
  const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const formatCurrency = useMemo(() => {
    const paymentCurrency = (currency || "NGN").toUpperCase();
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: paymentCurrency,
    });
  }, [currency]);

  const handlePayment = async () => {
    setIsProcessing(true);
    setPaymentError(null);

    try {
      const response = await paymentService.initializePaystackPayment({
        bookingId,
      });

      if (response.paymentStatus && response.paymentStatus !== "PENDING") {
        setPaymentStatus(response.paymentStatus);
        if (onInitialized) {
          onInitialized({
            paymentId: response.paymentId,
            paymentStatus: response.paymentStatus,
            reference: response.reference,
          });
        }
        return;
      }

      if (!response.authorizationUrl || !response.reference) {
        throw new Error(
          "Unable to start Paystack payment. Please contact support."
        );
      }

      localStorage.setItem(
        "paystackPaymentMeta",
        JSON.stringify({
          reference: response.reference,
          paymentId: response.paymentId,
          bookingId,
        })
      );

      setAuthorizationUrl(response.authorizationUrl);
      setReference(response.reference);

      if (onInitialized) {
        onInitialized({
          paymentId: response.paymentId,
          reference: response.reference,
          paymentStatus: response.paymentStatus,
        });
      }

      window.location.href = response.authorizationUrl;
    } catch (error: unknown) {
      const message = serviceUtils.extractErrorMessage(error);
      setPaymentError(message);
      onError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResume = () => {
    if (authorizationUrl) {
      window.open(authorizationUrl, "_blank");
    }
  };

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <Card className="p-6 space-y-5">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <div className="text-green-600 font-bold text-lg">PAY</div>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Paystack Checkout
          </h2>
          {description && <p className="text-gray-600">{description}</p>}
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency.format(amount)}
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-1">
          <div className="font-medium text-gray-900">Payment details</div>
          <div>Email: {email}</div>
          {customerName && <div>Name: {customerName}</div>}
          {customerPhone && <div>Phone: {customerPhone}</div>}
        </div>

        {paymentError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5" />
            <p className="text-sm text-red-700">{paymentError}</p>
          </div>
        )}

        {paymentStatus && paymentStatus !== "PENDING" && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-start">
            <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
            <p className="text-sm text-green-700">
              This booking already has a {paymentStatus.toLowerCase()} payment.
            </p>
          </div>
        )}

        {!paystackPublicKey && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
            Add <code>NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY</code> to enable inline
            branding. Redirect payments will continue to work.
          </div>
        )}

        <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-start">
          <Shield className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
          <p className="text-sm text-green-700">
            You will be redirected to Paystack to complete your payment safely.
            You can pay with cards, bank transfer, USSD, or mobile money.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={handlePayment}
          loading={isProcessing}
          disabled={isProcessing}
          className="w-full py-3 text-lg font-medium bg-green-600 hover:bg-green-700"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <Loading size="sm" />
              <span className="ml-2">Connecting to Paystack...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Lock className="h-5 w-5 mr-2" />
              Pay with Paystack
            </div>
          )}
        </Button>

        {authorizationUrl && !isProcessing && (
          <Button
            type="button"
            variant="outline"
            onClick={handleResume}
            className="w-full flex items-center justify-center"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Re-open Paystack checkout
          </Button>
        )}

        {reference && (
          <div className="text-xs text-gray-500 text-center">
            Reference: <span className="font-mono">{reference}</span>
          </div>
        )}

        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="w-full"
          >
            Cancel
          </Button>
        )}

        <div className="text-center text-xs text-gray-500">
          Powered by{" "}
          <span className="font-semibold text-green-600">Paystack</span>
        </div>
      </Card>
    </div>
  );
};
