"use client";

import { useMemo, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { StripeElementsOptions, loadStripe } from "@stripe/stripe-js";
import { Button, Card } from "../ui";
import { CreditCard, Lock, Shield, AlertCircle } from "lucide-react";

const publishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY ||
  "";

const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

interface StripeCheckoutProps {
  clientSecret: string;
  amount: number;
  currency: string;
  description: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
  className?: string;
}

const StripePaymentForm: React.FC<
  Omit<StripeCheckoutProps, "clientSecret">
> = ({
  amount,
  currency,
  description,
  onSuccess,
  onError,
  onCancel,
  className = "",
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setPaymentError("Payment system not ready. Please try again.");
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      const message = error.message || "Payment failed. Please try again.";
      setPaymentError(message);
      onError(message);
      setIsProcessing(false);
      return;
    }

    if (!paymentIntent) {
      const message = "Payment failed. Please try again.";
      setPaymentError(message);
      onError(message);
      setIsProcessing(false);
      return;
    }

    onSuccess(paymentIntent.id);
    setIsProcessing(false);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(value);

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          <div className="text-center">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Information
            </label>
            <div className="border border-gray-200 rounded-md p-4 bg-white">
              <PaymentElement options={{ layout: "tabs" }} />
            </div>
          </div>

          {paymentError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5" />
              <p className="text-sm text-red-700">{paymentError}</p>
            </div>
          )}

          <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-start">
            <Shield className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
            <p className="text-sm text-green-700">
              Your payment details are encrypted and processed securely by
              Stripe.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              type="submit"
              variant="primary"
              loading={isProcessing}
              disabled={isProcessing || !stripe || !elements}
              className="w-full py-3 text-lg"
            >
              <div className="flex items-center justify-center">
                <Lock className="h-5 w-5 mr-2" />
                Pay {formatCurrency(amount)}
              </div>
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isProcessing}
                className="w-full"
              >
                Cancel
              </Button>
            )}
          </div>

          <p className="text-center text-xs text-gray-500">
            Powered by{" "}
            <span className="font-semibold text-blue-600">Stripe</span>
          </p>
        </Card>
      </form>
    </div>
  );
};

export const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  clientSecret,
  amount,
  currency,
  description,
  onSuccess,
  onError,
  onCancel,
  className,
}) => {
  const options: StripeElementsOptions = useMemo(
    () => ({
      clientSecret,
      appearance: {
        theme: "stripe",
        labels: "floating",
      },
    }),
    [clientSecret]
  );

  if (!stripePromise) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Stripe is not configured
        </h3>
        <p className="text-sm text-gray-600">
          Add{" "}
          <code className="font-mono">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>{" "}
          to your environment to enable card payments.
        </p>
      </Card>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripePaymentForm
        amount={amount}
        currency={currency}
        description={description}
        onSuccess={onSuccess}
        onError={onError}
        onCancel={onCancel}
        className={className}
      />
    </Elements>
  );
};
