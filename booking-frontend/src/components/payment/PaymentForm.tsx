"use client";

import React from "react";
import { Card } from "../ui";
import { CreditCard, Clock } from "lucide-react";
import { BookingFormData } from "../../types";

interface PaymentFormProps {
  bookingData: BookingFormData & {
    totalPrice: number;
    currency: string;
    propertyTitle: string;
  };
  onPaymentSuccess?: (paymentResult: any) => void;
  onPaymentError?: (error: string) => void;
  isLoading?: boolean;
  className?: string;
}

// MVP Version: Simple payment placeholder component
// Full payment integration with Flutterwave/Paystack will be added in post-MVP releases
export const PaymentForm: React.FC<PaymentFormProps> = ({
  bookingData,
  className = "",
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: bookingData.currency || "USD",
    }).format(amount);
  };

  const nights = 1; // MVP placeholder for nights calculation

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
              Booking dates to be determined
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">MVP booking details</span>
          </div>

          <hr className="my-4" />

          <div className="flex justify-between text-lg font-semibold text-gray-900">
            <span>Total</span>
            <span>{formatCurrency(bookingData.totalPrice)}</span>
          </div>
        </div>
      </Card>

      {/* MVP Payment Notice */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-center space-x-3 mb-4">
          <CreditCard className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">
            Payment Processing Coming Soon
          </h3>
        </div>

        <div className="space-y-4">
          <p className="text-blue-800">
            We're working on integrating secure payment processing for seamless
            transactions. For now, bookings can be created and payment
            arrangements can be made directly with property owners.
          </p>

          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">
                Expected Timeline
              </span>
            </div>
            <p className="text-sm text-blue-800">
              Full payment integration with Flutterwave and Paystack will be
              available in Q2 2024.
            </p>
          </div>

          <div className="text-sm text-blue-700">
            <strong>Current MVP Features Available:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Create and manage bookings</li>
              <li>Browse and search properties</li>
              <li>Contact property owners directly</li>
              <li>Track booking status and details</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
