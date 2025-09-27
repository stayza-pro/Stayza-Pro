"use client";

import React, { useState } from "react";
import { Button, Card, Loading } from "../ui";
import { CreditCard, Shield, Lock } from "lucide-react";
import { BookingFormData } from "../../types";

interface PaymentFormProps {
  bookingData: BookingFormData & {
    totalPrice: number;
    currency: string;
    propertyTitle: string;
  };
  onPaymentSuccess: (paymentResult: MockPaymentResult) => void;
  onPaymentError: (error: string) => void;
  isLoading?: boolean;
  className?: string;
}

interface MockPaymentResult {
  id: string;
  method: "stripe" | "paystack";
  status: "completed" | "failed" | "pending";
  amount: number;
  currency: string;
  cardLast4: string;
  transactionId: string;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  bookingData,
  onPaymentSuccess,
  onPaymentError,
  isLoading = false,
  className = "",
}) => {
  const [selectedMethod, setSelectedMethod] = useState<"stripe" | "paystack">(
    "stripe"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
    email: "",
    saveCard: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;

    // Format card number with spaces
    if (field === "cardNumber") {
      formattedValue = value
        .replace(/\s/g, "")
        .replace(/(.{4})/g, "$1 ")
        .trim();
      if (formattedValue.length > 19) return; // Max 16 digits + 3 spaces
    }

    // Format expiry date
    if (field === "expiryDate") {
      formattedValue = value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1/$2");
      if (formattedValue.length > 5) return; // MM/YY format
    }

    // Format CVV
    if (field === "cvv") {
      formattedValue = value.replace(/\D/g, "");
      if (formattedValue.length > 4) return; // Max 4 digits
    }

    setPaymentForm((prev) => ({
      ...prev,
      [field]: formattedValue,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!paymentForm.cardholderName.trim()) {
      newErrors.cardholderName = "Cardholder name is required";
    }

    const cardNumber = paymentForm.cardNumber.replace(/\s/g, "");
    if (!cardNumber) {
      newErrors.cardNumber = "Card number is required";
    } else if (cardNumber.length < 13 || cardNumber.length > 19) {
      newErrors.cardNumber = "Invalid card number";
    }

    if (!paymentForm.expiryDate) {
      newErrors.expiryDate = "Expiry date is required";
    } else if (!/^\d{2}\/\d{2}$/.test(paymentForm.expiryDate)) {
      newErrors.expiryDate = "Invalid expiry date format (MM/YY)";
    } else {
      const [month, year] = paymentForm.expiryDate.split("/");
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;

      if (parseInt(month) < 1 || parseInt(month) > 12) {
        newErrors.expiryDate = "Invalid month";
      } else if (
        parseInt(year) < currentYear ||
        (parseInt(year) === currentYear && parseInt(month) < currentMonth)
      ) {
        newErrors.expiryDate = "Card has expired";
      }
    }

    if (!paymentForm.cvv) {
      newErrors.cvv = "CVV is required";
    } else if (paymentForm.cvv.length < 3 || paymentForm.cvv.length > 4) {
      newErrors.cvv = "Invalid CVV";
    }

    if (!paymentForm.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentForm.email)) {
      newErrors.email = "Invalid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock payment result
      const paymentResult: MockPaymentResult = {
        id: `pay_${Date.now()}`,
        method: selectedMethod,
        status: "completed",
        amount: bookingData.totalPrice,
        currency: bookingData.currency,
        cardLast4: paymentForm.cardNumber.slice(-4).replace(/\s/g, ""),
        transactionId:
          selectedMethod === "stripe"
            ? `pi_${Math.random().toString(36).substr(2, 9)}`
            : `paystack_${Math.random().toString(36).substr(2, 9)}`,
      };

      onPaymentSuccess(paymentResult);
    } catch (error) {
      onPaymentError("Payment processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: bookingData.currency,
    }).format(amount);
  };

  const nights = Math.ceil(
    (bookingData.checkOutDate.getTime() - bookingData.checkInDate.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className={`max-w-2xl mx-auto space-y-6 ${className}`}>
      {/* Booking Summary */}
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
              {bookingData.checkInDate.toLocaleDateString()} -{" "}
              {bookingData.checkOutDate.toLocaleDateString()}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">
              {nights} nights • {bookingData.totalGuests} guests
            </span>
          </div>

          <hr className="my-4" />

          <div className="flex justify-between text-lg font-semibold text-gray-900">
            <span>Total</span>
            <span>{formatCurrency(bookingData.totalPrice)}</span>
          </div>
        </div>
      </Card>

      {/* Payment Method Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Choose Payment Method
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            type="button"
            onClick={() => setSelectedMethod("stripe")}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              selectedMethod === "stripe"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Stripe</div>
                <div className="text-sm text-gray-600">Credit/Debit Card</div>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                  VISA
                </div>
                <div className="w-8 h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">
                  MC
                </div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMethod("paystack")}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              selectedMethod === "paystack"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Paystack</div>
                <div className="text-sm text-gray-600">
                  Card & Bank Transfer
                </div>
              </div>
              <div className="text-green-600 font-semibold">PAY</div>
            </div>
          </button>
        </div>
      </Card>

      {/* Payment Form */}
      <form onSubmit={handleSubmit}>
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Payment Details
            </h3>
          </div>

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                value={paymentForm.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="your@email.com"
                disabled={isLoading || isProcessing}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Cardholder Name */}
            <div>
              <label
                htmlFor="cardholderName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Cardholder Name *
              </label>
              <input
                id="cardholderName"
                type="text"
                value={paymentForm.cardholderName}
                onChange={(e) =>
                  handleInputChange("cardholderName", e.target.value)
                }
                placeholder="John Doe"
                disabled={isLoading || isProcessing}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.cardholderName ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.cardholderName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.cardholderName}
                </p>
              )}
            </div>

            {/* Card Number */}
            <div>
              <label
                htmlFor="cardNumber"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Card Number *
              </label>
              <input
                id="cardNumber"
                type="text"
                value={paymentForm.cardNumber}
                onChange={(e) =>
                  handleInputChange("cardNumber", e.target.value)
                }
                placeholder="1234 5678 9012 3456"
                disabled={isLoading || isProcessing}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.cardNumber ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.cardNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
              )}
            </div>

            {/* Expiry and CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="expiryDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Expiry Date *
                </label>
                <input
                  id="expiryDate"
                  type="text"
                  value={paymentForm.expiryDate}
                  onChange={(e) =>
                    handleInputChange("expiryDate", e.target.value)
                  }
                  placeholder="MM/YY"
                  disabled={isLoading || isProcessing}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.expiryDate ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.expiryDate && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.expiryDate}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="cvv"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  CVV *
                </label>
                <input
                  id="cvv"
                  type="text"
                  value={paymentForm.cvv}
                  onChange={(e) => handleInputChange("cvv", e.target.value)}
                  placeholder="123"
                  disabled={isLoading || isProcessing}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.cvv ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.cvv && (
                  <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
                )}
              </div>
            </div>

            {/* Save Card */}
            <div className="flex items-center">
              <input
                id="saveCard"
                type="checkbox"
                checked={paymentForm.saveCard}
                onChange={(e) =>
                  handleInputChange(
                    "saveCard",
                    e.target.checked ? "true" : "false"
                  )
                }
                disabled={isLoading || isProcessing}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="saveCard" className="ml-2 text-sm text-gray-700">
                Save this card for future bookings
              </label>
            </div>
          </div>
        </Card>

        {/* Security Notice */}
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center space-x-3">
            <Shield className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="text-sm font-medium text-green-900">
                Secure Payment
              </h4>
              <p className="text-sm text-green-800">
                Your payment information is encrypted and secure. We use
                industry-standard SSL encryption.
              </p>
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          loading={isProcessing}
          disabled={isLoading || isProcessing}
          className="w-full py-4 text-lg font-medium"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <Loading size="sm" />
              <span className="ml-2">Processing Payment...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Lock className="h-5 w-5 mr-2" />
              Pay {formatCurrency(bookingData.totalPrice)}
            </div>
          )}
        </Button>

        {/* Terms */}
        <p className="text-xs text-gray-600 text-center mt-4">
          By completing this payment, you agree to our{" "}
          <a href="#" className="text-blue-600 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </form>
    </div>
  );
};
