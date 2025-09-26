"use client";

import React from "react";
import { Button, Card, Loading } from "../ui";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  CreditCard,
  RefreshCw,
  Download,
  ArrowLeft,
} from "lucide-react";
import { Payment } from "../../types";

interface PaymentStatusProps {
  payment?: Payment;
  status: "processing" | "success" | "failed" | "pending" | "refunded";
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
  status,
  amount,
  currency = "USD",
  paymentMethod,
  transactionId,
  errorMessage,
  onRetry,
  onDownloadReceipt,
  onGoBack,
  onContinue,
  className = "",
}) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusConfig = () => {
    switch (status) {
      case "processing":
        return {
          icon: <Loading size="lg" className="text-blue-600" />,
          title: "Processing Payment",
          message:
            "Please wait while we process your payment. This may take a few moments.",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          textColor: "text-blue-900",
        };
      case "success":
        return {
          icon: <CheckCircle className="h-16 w-16 text-green-600" />,
          title: "Payment Successful!",
          message:
            "Your payment has been processed successfully. You will receive a confirmation email shortly.",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          textColor: "text-green-900",
        };
      case "failed":
        return {
          icon: <XCircle className="h-16 w-16 text-red-600" />,
          title: "Payment Failed",
          message:
            errorMessage ||
            "We were unable to process your payment. Please try again or use a different payment method.",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-900",
        };
      case "pending":
        return {
          icon: <Clock className="h-16 w-16 text-yellow-600" />,
          title: "Payment Pending",
          message:
            "Your payment is being reviewed. We'll notify you once it's confirmed.",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          textColor: "text-yellow-900",
        };
      case "refunded":
        return {
          icon: <RefreshCw className="h-16 w-16 text-blue-600" />,
          title: "Payment Refunded",
          message:
            "Your payment has been refunded. The amount will appear in your account within 3-5 business days.",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          textColor: "text-blue-900",
        };
      default:
        return {
          icon: <AlertTriangle className="h-16 w-16 text-gray-600" />,
          title: "Unknown Status",
          message: "We're unable to determine the payment status at this time.",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          textColor: "text-gray-900",
        };
    }
  };

  const statusConfig = getStatusConfig();
  const paymentAmount = payment?.amount || amount || 0;
  const paymentCurrency = payment?.currency || currency;
  const method = payment?.method || paymentMethod;
  const txnId =
    payment?.stripePaymentIntentId ||
    payment?.paystackReference ||
    transactionId;

  return (
    <div className={`max-w-2xl mx-auto space-y-6 ${className}`}>
      {/* Main Status Card */}
      <Card
        className={`p-8 text-center ${statusConfig.bgColor} ${statusConfig.borderColor}`}
      >
        <div className="flex justify-center mb-6">{statusConfig.icon}</div>

        <h1 className={`text-2xl font-bold ${statusConfig.textColor} mb-4`}>
          {statusConfig.title}
        </h1>

        <p className={`text-lg ${statusConfig.textColor} mb-6`}>
          {statusConfig.message}
        </p>

        {/* Processing animation */}
        {status === "processing" && (
          <div className="flex justify-center items-center space-x-2 mb-4">
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        )}
      </Card>

      {/* Payment Details */}
      {(paymentAmount > 0 || payment) && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Payment Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600 mb-1">Amount</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(paymentAmount)}
                </div>
              </div>

              {method && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">
                    Payment Method
                  </div>
                  <div className="font-medium text-gray-900 capitalize">
                    {method.toLowerCase()}
                  </div>
                </div>
              )}

              <div>
                <div className="text-sm text-gray-600 mb-1">Status</div>
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    status === "success"
                      ? "bg-green-100 text-green-800"
                      : status === "failed"
                      ? "bg-red-100 text-red-800"
                      : status === "processing"
                      ? "bg-blue-100 text-blue-800"
                      : status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : status === "refunded"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {status === "success" && (
                    <CheckCircle className="h-4 w-4 mr-1" />
                  )}
                  {status === "failed" && <XCircle className="h-4 w-4 mr-1" />}
                  {status === "processing" && (
                    <Loading size="sm" className="mr-1" />
                  )}
                  {status === "pending" && <Clock className="h-4 w-4 mr-1" />}
                  {status === "refunded" && (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {txnId && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">
                    Transaction ID
                  </div>
                  <div className="font-mono text-sm text-gray-900 break-all">
                    {txnId}
                  </div>
                </div>
              )}

              {payment?.createdAt && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Date & Time</div>
                  <div className="font-medium text-gray-900">
                    {formatDate(payment.createdAt)}
                  </div>
                </div>
              )}

              {payment?.refundAmount && payment.refundAmount > 0 && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">
                    Refund Amount
                  </div>
                  <div className="font-medium text-green-600">
                    {formatCurrency(payment.refundAmount)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {payment?.refundReason && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Refund Reason</div>
              <div className="text-sm text-gray-900">
                {payment.refundReason}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Additional Information */}
      {(status === "success" || status === "refunded") && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            What happens next?
          </h3>

          <div className="space-y-2 text-sm text-blue-800">
            {status === "success" ? (
              <>
                <p>
                  • A confirmation email has been sent to your registered email
                  address
                </p>
                <p>• Your booking is now confirmed and active</p>
                <p>
                  • You can view your booking details in your account dashboard
                </p>
                <p>• The host will be notified of your booking</p>
              </>
            ) : (
              <>
                <p>
                  • The refund will appear in your original payment method
                  within 3-5 business days
                </p>
                <p>• You will receive an email confirmation of the refund</p>
                <p>• Your booking has been cancelled and is no longer active</p>
                <p>• If you have questions, please contact our support team</p>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Error Details */}
      {status === "failed" && errorMessage && (
        <Card className="p-6 bg-red-50 border-red-200">
          <h3 className="text-lg font-semibold text-red-900 mb-3">
            Error Details
          </h3>
          <p className="text-sm text-red-800">{errorMessage}</p>

          <div className="mt-4 space-y-2 text-sm text-red-800">
            <p className="font-medium">Common solutions:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Check that your card details are correct</li>
              <li>Ensure you have sufficient funds</li>
              <li>Try a different payment method</li>
              <li>Contact your bank if the issue persists</li>
            </ul>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {/* Retry Payment */}
        {status === "failed" && onRetry && (
          <Button
            variant="primary"
            onClick={onRetry}
            className="flex items-center justify-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}

        {/* Download Receipt */}
        {(status === "success" || status === "refunded") &&
          onDownloadReceipt && (
            <Button
              variant="outline"
              onClick={onDownloadReceipt}
              className="flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
          )}

        {/* Continue */}
        {status === "success" && onContinue && (
          <Button
            variant="primary"
            onClick={onContinue}
            className="flex items-center justify-center"
          >
            Continue to Booking
          </Button>
        )}

        {/* Go Back - for failed or other states */}
        {(status === "failed" || status === "pending") && onGoBack && (
          <Button
            variant="outline"
            onClick={onGoBack}
            className="flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        )}
      </div>

      {/* Processing note */}
      {status === "processing" && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Please do not close this window or refresh the page while we process
            your payment.
          </p>
        </div>
      )}

      {/* Support link */}
      <div className="text-center pt-4">
        <p className="text-sm text-gray-600">
          Need help?{" "}
          <a href="#" className="text-blue-600 hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
};
