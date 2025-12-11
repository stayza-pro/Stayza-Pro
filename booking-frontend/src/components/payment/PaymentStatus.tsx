"use client";

import React from "react";
import { Button, Card } from "../ui";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  ArrowLeft,
  CreditCard,
  Calendar,
  Home,
} from "lucide-react";

interface PaymentStatusProps {
  payment?: any;
  status?: "processing" | "success" | "failed" | "pending" | "refunded";
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  transactionId?: string;
  errorMessage?: string;
  onRetry?: () => void;
  onDownloadReceipt?: () => void;
  onGoBack?: () => void;
  onContinue?: () => void;
  className?: string;
}

export const PaymentStatus: React.FC<PaymentStatusProps> = ({
  payment,
  status = "processing",
  amount,
  currency = "NGN",
  paymentMethod,
  transactionId,
  errorMessage,
  onRetry,
  onDownloadReceipt,
  onGoBack,
  onContinue,
  className = "",
}) => {
  const statusConfig = {
    success: {
      icon: CheckCircle,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      title: "Payment Successful!",
      message:
        "Your booking has been confirmed. Redirecting to confirmation page...",
    },
    failed: {
      icon: XCircle,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      title: "Payment Failed",
      message:
        errorMessage ||
        "Unfortunately, your payment could not be processed. Please try again.",
    },
    processing: {
      icon: Clock,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      title: "Processing Payment",
      message: "Please wait while we verify your payment...",
    },
    pending: {
      icon: AlertCircle,
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      title: "Payment Pending",
      message: "Your payment is being processed. This may take a few minutes.",
    },
    refunded: {
      icon: AlertCircle,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      title: "Payment Refunded",
      message:
        "Your payment has been refunded to your original payment method.",
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const formatAmount = (amt?: number, curr?: string) => {
    if (!amt) return "N/A";
    const formatted = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: curr || "NGN",
    }).format(amt);
    return formatted;
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  };

  return (
    <div className={`max-w-2xl mx-auto space-y-6 ${className}`}>
      {/* Status Header */}
      <Card
        className={`p-8 text-center ${config.bgColor} ${config.borderColor}`}
      >
        <div className="flex justify-center mb-4">
          <StatusIcon className={`h-16 w-16 ${config.iconColor}`} />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {config.title}
        </h1>

        <p className="text-gray-700">{config.message}</p>
      </Card>

      {/* Payment Details */}
      {(amount || payment) && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Payment Details
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Amount</span>
              <span className="font-semibold text-gray-900">
                {formatAmount(
                  amount || payment?.amount,
                  currency || payment?.currency
                )}
              </span>
            </div>

            {(paymentMethod || payment?.method) && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium text-gray-900 capitalize">
                  {paymentMethod || payment?.method}
                </span>
              </div>
            )}

            {(transactionId || payment?.providerTransactionId) && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Transaction ID</span>
                <span className="font-mono text-sm text-gray-900">
                  {transactionId || payment?.providerTransactionId}
                </span>
              </div>
            )}

            {payment?.createdAt && (
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Payment Date</span>
                <span className="font-medium text-gray-900">
                  {formatDate(payment.createdAt)}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Booking Details */}
      {payment?.booking && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Home className="h-5 w-5 mr-2" />
            Booking Details
          </h2>

          <div className="space-y-3">
            {payment.booking.property?.title && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Property</span>
                <span className="font-medium text-gray-900">
                  {payment.booking.property.title}
                </span>
              </div>
            )}

            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Check-in</span>
              <span className="font-medium text-gray-900 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {formatDate(payment.booking.checkInDate)}
              </span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-gray-600">Check-out</span>
              <span className="font-medium text-gray-900 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {formatDate(payment.booking.checkOutDate)}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {status === "success" && onDownloadReceipt && (
          <Button
            variant="outline"
            onClick={onDownloadReceipt}
            className="flex items-center justify-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
        )}

        {status === "success" && onContinue && (
          <Button
            variant="primary"
            onClick={onContinue}
            className="flex items-center justify-center"
          >
            View My Bookings
          </Button>
        )}

        {status === "failed" && onRetry && (
          <Button
            variant="primary"
            onClick={onRetry}
            className="flex items-center justify-center"
          >
            Try Again
          </Button>
        )}

        {status === "failed" && onGoBack && (
          <Button
            variant="outline"
            onClick={onGoBack}
            className="flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Browse Properties
          </Button>
        )}
      </div>
    </div>
  );
};
