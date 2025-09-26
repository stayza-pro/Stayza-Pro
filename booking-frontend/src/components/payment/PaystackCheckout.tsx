"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, Loading } from "../ui";
import {
  CreditCard,
  Lock,
  Shield,
  AlertCircle,
  Smartphone,
  Building,
} from "lucide-react";

interface PaystackCheckoutProps {
  amount: number;
  currency: string;
  email: string;
  description?: string;
  customerName?: string;
  customerPhone?: string;
  onSuccess: (paymentResult: any) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const PaystackCheckout: React.FC<PaystackCheckoutProps> = ({
  amount,
  currency,
  email,
  description,
  customerName,
  customerPhone,
  onSuccess,
  onError,
  onCancel,
  isLoading = false,
  className = "",
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paystackLoaded, setPaystackLoaded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "card" | "bank" | "ussd" | "qr"
  >("card");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Mock Paystack loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setPaystackLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handlePayment = async () => {
    if (!paystackLoaded) {
      setPaymentError("Payment system not ready. Please try again.");
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // In real implementation, this would initialize Paystack popup or inline payment
      // For demo purposes, we'll simulate the payment process

      // Generate reference
      const reference = `paystack_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Simulate payment processing time
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Mock successful payment result
      const paymentResult = {
        reference,
        status: "success",
        trans: Math.floor(Math.random() * 1000000),
        transaction: Math.floor(Math.random() * 1000000),
        message: "Approved",
        amount: amount * 100, // Paystack works in kobo (for NGN) or cents
        currency: currency.toUpperCase(),
        channel: paymentMethod,
        customer: {
          email,
          first_name: customerName?.split(" ")[0] || "",
          last_name: customerName?.split(" ").slice(1).join(" ") || "",
          phone: customerPhone || "",
        },
        created_at: new Date().toISOString(),
      };

      onSuccess(paymentResult);
    } catch (error: any) {
      const errorMessage =
        error.message ||
        "An unexpected error occurred during payment processing.";
      setPaymentError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency === "NGN" ? "NGN" : "USD",
    }).format(value);
  };

  const paymentMethods = [
    {
      id: "card" as const,
      name: "Debit/Credit Card",
      icon: <CreditCard className="h-5 w-5" />,
      description: "Visa, Mastercard, Verve",
    },
    {
      id: "bank" as const,
      name: "Bank Transfer",
      icon: <Building className="h-5 w-5" />,
      description: "Direct bank transfer",
    },
    {
      id: "ussd" as const,
      name: "USSD",
      icon: <Smartphone className="h-5 w-5" />,
      description: "Pay with your phone",
    },
    {
      id: "qr" as const,
      name: "QR Code",
      icon: <CreditCard className="h-5 w-5" />,
      description: "Scan to pay",
    },
  ];

  if (!paystackLoaded) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <Loading size="lg" />
        <p className="text-gray-600 mt-4">Loading Paystack payment...</p>
      </Card>
    );
  }

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <Card className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <div className="text-green-600 font-bold text-lg">PAY</div>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Paystack Payment
          </h2>
          {description && <p className="text-gray-600 mb-2">{description}</p>}
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(amount)}
          </div>
        </div>

        {/* Customer Information */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Payment Details
          </h3>
          <div className="space-y-1 text-sm text-gray-600">
            <div>Email: {email}</div>
            {customerName && <div>Name: {customerName}</div>}
            {customerPhone && <div>Phone: {customerPhone}</div>}
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Choose Payment Method
          </label>
          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id)}
                disabled={isProcessing}
                className={`w-full p-3 border-2 rounded-lg text-left transition-colors ${
                  paymentMethod === method.id
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 hover:border-gray-400"
                } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center">
                  <div className="text-gray-600 mr-3">{method.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {method.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {method.description}
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      paymentMethod === method.id
                        ? "border-green-500 bg-green-500"
                        : "border-gray-300"
                    }`}
                  >
                    {paymentMethod === method.id && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method Info */}
        {paymentMethod === "bank" && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-700 text-sm">
              You will be redirected to complete the bank transfer after
              clicking pay.
            </p>
          </div>
        )}

        {paymentMethod === "ussd" && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-700 text-sm">
              You will receive a USSD code to dial on your phone to complete the
              payment.
            </p>
          </div>
        )}

        {paymentMethod === "qr" && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-700 text-sm">
              A QR code will be generated for you to scan with your banking app.
            </p>
          </div>
        )}

        {/* Error Message */}
        {paymentError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
              <p className="text-red-700 text-sm">{paymentError}</p>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <Shield className="h-4 w-4 text-green-600 mr-2" />
            <p className="text-green-700 text-sm">
              Secured by Paystack. Your payment information is safe and
              encrypted.
            </p>
          </div>
        </div>

        {/* Pay Button */}
        <Button
          type="button"
          variant="primary"
          onClick={handlePayment}
          loading={isProcessing}
          disabled={isLoading || isProcessing}
          className="w-full py-3 text-lg font-medium bg-green-600 hover:bg-green-700"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <Loading size="sm" />
              <span className="ml-2">Processing...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Lock className="h-5 w-5 mr-2" />
              Pay {formatCurrency(amount)}
            </div>
          )}
        </Button>

        {/* Cancel Button */}
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
            className="w-full mt-3"
          >
            Cancel
          </Button>
        )}

        {/* Powered by Paystack */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            Powered by{" "}
            <span className="font-semibold text-green-600">Paystack</span>
          </p>
        </div>
      </Card>

      {/* Supported Banks/Cards (for NGN) */}
      {currency === "NGN" && (
        <Card className="mt-4 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Supported Banks & Cards
          </h4>
          <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
            <div>• GTBank</div>
            <div>• Access Bank</div>
            <div>• Zenith Bank</div>
            <div>• First Bank</div>
            <div>• UBA</div>
            <div>• Stanbic</div>
            <div>• Verve</div>
            <div>• Mastercard</div>
          </div>
        </Card>
      )}

      {/* Terms and Privacy */}
      <div className="text-center mt-4">
        <p className="text-xs text-gray-600">
          By completing this payment, you agree to our{" "}
          <a href="#" className="text-green-600 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-green-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};
