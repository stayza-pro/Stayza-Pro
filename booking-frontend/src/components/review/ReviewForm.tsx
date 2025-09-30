"use client";

import React from "react";
import { Button, Card } from "../ui";
import { Star, Clock } from "lucide-react";

interface ReviewFormProps {
  booking?: any;
  onSubmit?: (data: any) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

// MVP Version: Simple review form placeholder component
// Full review functionality will be added in post-MVP releases
export const ReviewForm: React.FC<ReviewFormProps> = ({ className = "" }) => {
  return (
    <div className={`max-w-2xl mx-auto space-y-6 ${className}`}>
      {/* MVP Review Notice */}
      <Card className="p-8 text-center bg-yellow-50 border-yellow-200">
        <div className="flex justify-center mb-6">
          <Star className="h-16 w-16 text-yellow-600" />
        </div>

        <h1 className="text-2xl font-bold text-yellow-900 mb-4">
          Reviews Coming Soon
        </h1>

        <p className="text-lg text-yellow-800 mb-6">
          The review and rating system is being developed as a post-MVP feature.
          This will be available after the core booking functionality is
          complete.
        </p>

        <div className="bg-white rounded-lg p-4 border border-yellow-200 mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="font-medium text-yellow-900">
              Expected Timeline
            </span>
          </div>
          <p className="text-sm text-yellow-800">
            Review functionality will be available in Q3 2024, after user
            engagement data and booking patterns are established.
          </p>
        </div>
      </Card>

      {/* Current MVP Features */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Why Reviews Are Post-MVP
        </h2>

        <div className="space-y-3 text-sm text-gray-600">
          <p>📊 Reviews require sufficient booking volume to be meaningful</p>
          <p>🔍 Need to establish user patterns and preferences first</p>
          <p>⚡ Focusing on core booking functionality for initial launch</p>
          <p>
            💬 Direct communication with property owners is currently available
          </p>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-center space-x-4">
        <Button variant="outline" onClick={() => window.history.back()}>
          Back to Booking
        </Button>

        <Button
          variant="primary"
          onClick={() => (window.location.href = "/dashboard")}
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};
