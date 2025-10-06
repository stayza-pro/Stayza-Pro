"use client";

import React from "react";
import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui";
import { CreditCard, DollarSign, TrendingUp, CheckCircle } from "lucide-react";

export default function PayoutsPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Payment Integration
        </h1>
        <p className="text-gray-600 mt-2">
          Your Flutterwave integration is ready to process payments from
          Nigerian customers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Payment Processing
              </h3>
              <p className="text-sm text-gray-600">
                Flutterwave integration active
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Payment Methods</h3>
              <p className="text-sm text-gray-600">
                Cards, Bank Transfer, USSD
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Currency</h3>
              <p className="text-sm text-gray-600">Nigerian Naira (NGN)</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Payment Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Instant payment verification</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Automated booking confirmation</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Email receipts and notifications</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Refund processing</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Transaction metadata tracking</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Webhook integration</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex items-start space-x-3">
          <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900">
              Ready to Accept Payments
            </h3>
            <p className="text-green-700 mt-1">
              Your Flutterwave integration is fully configured and ready to
              process payments from your property bookings. All transactions
              will be automatically verified and guests will receive instant
              confirmation.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
