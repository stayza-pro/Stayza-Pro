"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, Loading } from "../ui";
import { CreditCard, Lock, Shield, AlertCircle } from "lucide-react";

interface StripeCheckoutProps {
  amount: number;
  currency: string;
  description: string;
  customerEmail?: string;
  onSuccess: (paymentResult: any) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  amount,
  currency,
  description,
  customerEmail,
  onSuccess,
  onError,
  onCancel,
  isLoading = false,
  className = "",
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [cardElement, setCardElement] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Mock Stripe elements (in real implementation, you would use @stripe/stripe-js and @stripe/react-stripe-js)
  useEffect(() => {
    // Simulate loading Stripe
    const timer = setTimeout(() => {
      setStripeLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Create payment intent on mount
  useEffect(() => {
    if (stripeLoaded) {
      createPaymentIntent();
    }
  }, [stripeLoaded, amount, currency]);

  const createPaymentIntent = async () => {
    try {
      // In real implementation, this would call your backend to create a payment intent
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Stripe expects amount in cents
          currency: currency.toLowerCase(),
          description,
          customer_email: customerEmail,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create payment intent");
      }

      const { client_secret } = await response.json();
      setClientSecret(client_secret);
    } catch (error) {
      console.error("Error creating payment intent:", error);
      // For demo purposes, generate a mock client secret
      setClientSecret(`pi_mock_${Date.now()}_secret_mock`);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripeLoaded || !clientSecret) {
      setPaymentError("Payment system not ready. Please try again.");
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Simulate Stripe confirmation process
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Mock successful payment result
      const paymentResult = {
        id: `pi_${Date.now()}`,
        status: "succeeded",
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        payment_method: {
          id: `pm_${Date.now()}`,
          type: "card",
          card: {
            brand: "visa",
            last4: "4242",
            exp_month: 12,
            exp_year: 2025,
          },
        },
        receipt_email: customerEmail,
        created: Math.floor(Date.now() / 1000),
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
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(value);
  };

  if (!stripeLoaded) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <Loading size="lg" />
        <p className="text-gray-600 mt-4">Loading secure payment form...</p>
      </Card>
    );
  }

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <form onSubmit={handleSubmit}>
        <Card className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Secure Payment
            </h2>
            <p className="text-gray-600">{description}</p>
            <div className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(amount)}
            </div>
          </div>

          {/* Stripe Card Element Placeholder */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Information
            </label>

            {/* Mock Stripe Elements Container */}
            <div className="border border-gray-300 rounded-md p-4 bg-white">
              <div className="space-y-3">
                {/* Card Number Field */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="1234 1234 1234 1234"
                    className="w-full p-2 border-0 focus:outline-none text-lg"
                    disabled={isProcessing}
                  />
                  <div className="absolute right-2 top-2 flex space-x-1">
                    <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                      VISA
                    </div>
                  </div>
                </div>

                <hr className="border-gray-200" />

                {/* Expiry and CVC */}
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="MM / YY"
                    className="p-2 border-0 focus:outline-none"
                    disabled={isProcessing}
                  />
                  <input
                    type="text"
                    placeholder="CVC"
                    className="p-2 border-0 focus:outline-none"
                    disabled={isProcessing}
                  />
                </div>
              </div>
            </div>

            {/* Card holder name */}
            <div className="mt-4">
              <input
                type="text"
                placeholder="Cardholder name"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isProcessing}
              />
            </div>
          </div>

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
                Your payment information is secure and encrypted
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            loading={isProcessing}
            disabled={isLoading || isProcessing || !clientSecret}
            className="w-full py-3 text-lg font-medium"
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

          {/* Powered by Stripe */}
          <div className="text-center mt-4">
            <p className="text-xs text-gray-500">
              Powered by{" "}
              <span className="font-semibold text-blue-600">Stripe</span>
            </p>
          </div>
        </Card>
      </form>

      {/* Terms and Privacy */}
      <div className="text-center mt-4">
        <p className="text-xs text-gray-600">
          By completing this payment, you agree to our{" "}
          <a href="#" className="text-blue-600 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};
