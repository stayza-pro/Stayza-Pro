"use client";

import React, { useState } from "react";
import { Button, Card } from "../ui";
import {
  RefreshCw,
  AlertTriangle,
  CreditCard,
  DollarSign,
  FileText,
} from "lucide-react";
import { Payment } from "../../types";

interface RefundFormProps {
  payment: Payment;
  maxRefundAmount?: number;
  onSubmit: (refundData: RefundFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

interface RefundFormData {
  amount: number;
  reason: string;
  refundType: "full" | "partial";
  notifyCustomer: boolean;
}

export const RefundForm: React.FC<RefundFormProps> = ({
  payment,
  maxRefundAmount,
  onSubmit,
  onCancel,
  isLoading = false,
  className = "",
}) => {
  const [refundData, setRefundData] = useState<RefundFormData>({
    amount: maxRefundAmount || payment.amount,
    reason: "",
    refundType: "full",
    notifyCustomer: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const maxAmount = maxRefundAmount || payment.amount;
  const alreadyRefunded = payment.refundAmount ?? 0;
  const availableForRefund = maxAmount - alreadyRefunded;

  const refundReasons = [
    { value: "cancellation", label: "Booking Cancellation" },
    { value: "no_show", label: "Guest No-Show" },
    { value: "property_issue", label: "Property Issue" },
    { value: "guest_request", label: "Guest Request" },
    { value: "host_request", label: "Host Request" },
    { value: "dispute", label: "Dispute Resolution" },
    { value: "technical_error", label: "Technical Error" },
    { value: "other", label: "Other" },
  ];

  const handleInputChange = <K extends keyof RefundFormData>(
    field: K,
    value: RefundFormData[K]
  ) => {
    setRefundData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "amount") {
        const amountValue = value as RefundFormData["amount"];
        updated.amount = amountValue;
        updated.refundType =
          amountValue >= availableForRefund ? "full" : "partial";
      }
      return updated;
    });

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

    if (!refundData.amount || refundData.amount <= 0) {
      newErrors.amount = "Refund amount must be greater than 0";
    } else if (refundData.amount > availableForRefund) {
      newErrors.amount = `Refund amount cannot exceed ${formatCurrency(
        availableForRefund
      )}`;
    }

    if (!refundData.reason.trim()) {
      newErrors.reason = "Refund reason is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setShowConfirmation(true);
  };

  const confirmRefund = async () => {
    setIsSubmitting(true);

    try {
      await onSubmit(refundData);
    } catch (error) {
      
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: payment.currency,
    }).format(amount);
  };

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getRefundTimeframe = (): string => {
    // All refunds take 3-7 business days (Flutterwave has been removed)
    return "3-7 business days";
  };

  return (
    <div className={`max-w-2xl mx-auto space-y-6 ${className}`}>
      {/* Payment Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Payment Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600 mb-1">Original Amount</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency(payment.amount)}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">Payment Date</div>
              <div className="font-medium text-gray-900">
                {formatDate(payment.createdAt)}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">Payment Method</div>
              <div className="font-medium text-gray-900">{payment.method}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600 mb-1">Already Refunded</div>
              <div className="text-lg font-semibold text-red-600">
                {formatCurrency(alreadyRefunded)}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">
                Available for Refund
              </div>
              <div className="text-lg font-semibold text-green-600">
                {formatCurrency(availableForRefund)}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">Transaction ID</div>
              <div className="font-mono text-sm text-gray-900">
                {payment.providerTransactionId ||
                  payment.providerId ||
                  payment.id ||
                  "N/A"}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Refund Form */}
      <form onSubmit={handleSubmit}>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <RefreshCw className="h-5 w-5 mr-2" />
            Refund Details
          </h3>

          <div className="space-y-6">
            {/* Refund Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Refund Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleInputChange("refundType", "full")}
                  disabled={isLoading || isSubmitting}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    refundData.refundType === "full"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="font-medium text-gray-900">Full Refund</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {formatCurrency(availableForRefund)}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleInputChange("refundType", "partial")}
                  disabled={isLoading || isSubmitting}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    refundData.refundType === "partial"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    Partial Refund
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Custom amount
                  </div>
                </button>
              </div>
            </div>

            {/* Refund Amount */}
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Refund Amount * ({payment.currency})
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="amount"
                  type="number"
                  min="0.01"
                  max={availableForRefund}
                  step="0.01"
                  value={refundData.amount}
                  onChange={(e) =>
                    handleInputChange("amount", parseFloat(e.target.value) ?? 0)
                  }
                  disabled={
                    isLoading ||
                    isSubmitting ||
                    refundData.refundType === "full"
                  }
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.amount ? "border-red-500" : "border-gray-300"
                  } ${refundData.refundType === "full" ? "bg-gray-50" : ""}`}
                />
              </div>
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
              )}
              <p className="text-sm text-gray-600 mt-1">
                Maximum refundable amount: {formatCurrency(availableForRefund)}
              </p>
            </div>

            {/* Refund Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Refund *
              </label>
              <select
                value={refundData.reason}
                onChange={(e) => handleInputChange("reason", e.target.value)}
                disabled={isLoading || isSubmitting}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.reason ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select a reason</option>
                {refundReasons.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
              {errors.reason && (
                <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
              )}
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Provide additional details about the refund..."
                disabled={isLoading || isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Notify Customer */}
            <div className="flex items-center">
              <input
                id="notifyCustomer"
                type="checkbox"
                checked={refundData.notifyCustomer}
                onChange={(e) =>
                  handleInputChange("notifyCustomer", e.target.checked)
                }
                disabled={isLoading || isSubmitting}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="notifyCustomer"
                className="ml-2 text-sm text-gray-700"
              >
                Send notification email to customer
              </label>
            </div>
          </div>
        </Card>

        {/* Refund Information */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Refund Information
          </h4>

          <div className="space-y-2 text-sm text-blue-800">
            <p>• Refunds will be processed to the original payment method</p>
            <p>• Processing time: {getRefundTimeframe()}</p>
            <p>
              • The customer will receive an email confirmation once processed
            </p>
            <p>• This action cannot be undone once confirmed</p>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading || isSubmitting}
            >
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || isSubmitting || availableForRefund <= 0}
            className="bg-red-600 hover:bg-red-700"
          >
            Process Refund
          </Button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Refund
              </h3>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to process this refund? This action cannot
                be undone.
              </p>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Refund Amount:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(refundData.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Refund Type:</span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {refundData.refundType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Processing Time:</span>
                  <span className="font-semibold text-gray-900">
                    {getRefundTimeframe()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmRefund}
                loading={isSubmitting}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? "Processing..." : "Confirm Refund"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
