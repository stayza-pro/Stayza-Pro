"use client";

import React from "react";
import { Button, Card } from "../ui";
import { Clock, CreditCard, ArrowLeft } from "lucide-react";

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

// MVP Version: Simple payment status placeholder component
// Full payment status tracking will be added in post-MVP releases
export const PaymentStatus: React.FC<PaymentStatusProps> = ({
  className = "",
  onGoBack,
}) => {
  return (
    <div className={`max-w-2xl mx-auto space-y-6 ${className}`}>
      {/* MVP Payment Status Notice */}
      <Card className="p-8 text-center bg-blue-50 border-blue-200">
        <div className="flex justify-center mb-6">
          <Clock className="h-16 w-16 text-blue-600" />
        </div>

        <h1 className="text-2xl font-bold text-blue-900 mb-4">
          Payment Processing Coming Soon
        </h1>

        <p className="text-lg text-blue-800 mb-6">
          Payment status tracking and receipt generation will be available once
          payment integration is complete in Q2 2024.
        </p>
      </Card>

      {/* Current MVP Features */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Current MVP Features
        </h2>

        <div className="space-y-3 text-sm text-gray-600">
          <p>✅ Create and manage bookings without payment processing</p>
          <p>✅ Track booking status and details</p>
          <p>✅ Contact property owners directly for payment arrangements</p>
          <p>🔄 Payment processing integration (Coming Q2 2024)</p>
          <p>🔄 Automated payment status tracking (Coming Q2 2024)</p>
          <p>🔄 Digital receipts and invoices (Coming Q2 2024)</p>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-center">
        {onGoBack && (
          <Button
            variant="outline"
            onClick={onGoBack}
            className="flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Booking
          </Button>
        )}
      </div>
    </div>
  );
};
