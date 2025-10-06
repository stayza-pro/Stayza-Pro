"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-hot-toast";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Ban,
  FileText,
  Calendar,
  MessageSquare,
  ExternalLink,
  RefreshCw,
  Building2,
  Shield,
  Info,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

import { Card, Button, Loading } from "@/components/ui";
import { Realtor, CacStatus } from "@/types";
import { realtorService } from "@/services";

interface CacStatusCardProps {
  realtor: Realtor;
  className?: string;
}

export const CacStatusCard: React.FC<CacStatusCardProps> = ({
  realtor,
  className = "",
}) => {
  const queryClient = useQueryClient();
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealMessage, setAppealMessage] = useState("");

  // Appeal CAC rejection mutation
  const appealMutation = useMutation(
    (message: string) => realtorService.appealCacRejection(message),
    {
      onSuccess: () => {
        toast.success("Appeal submitted successfully!");
        queryClient.invalidateQueries("current-user");
        setShowAppealModal(false);
        setAppealMessage("");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to submit appeal");
      },
    }
  );

  const handleAppeal = () => {
    if (!appealMessage.trim()) {
      toast.error("Please provide your appeal message");
      return;
    }
    appealMutation.mutate(appealMessage);
  };

  const getStatusConfig = (status: CacStatus) => {
    switch (status) {
      case "PENDING":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          title: "CAC Verification Pending",
          description: "Your CAC number is being reviewed by our team.",
          actionColor: "text-yellow-800",
        };
      case "APPROVED":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bg: "bg-green-50",
          border: "border-green-200",
          title: "CAC Verified",
          description:
            "Your CAC number has been approved. You can now upload properties.",
          actionColor: "text-green-800",
        };
      case "REJECTED":
        return {
          icon: XCircle,
          color: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-200",
          title: "CAC Verification Failed",
          description:
            "Your CAC number was rejected. Your account has been suspended.",
          actionColor: "text-red-800",
        };
      case "SUSPENDED":
        return {
          icon: Ban,
          color: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-200",
          title: "Account Suspended",
          description:
            "Your account is currently suspended due to CAC rejection.",
          actionColor: "text-red-800",
        };
      default:
        return {
          icon: AlertTriangle,
          color: "text-gray-600",
          bg: "bg-gray-50",
          border: "border-gray-200",
          title: "Status Unknown",
          description: "Contact support for assistance.",
          actionColor: "text-gray-800",
        };
    }
  };

  const statusConfig = getStatusConfig(realtor.cacStatus);
  const StatusIcon = statusConfig.icon;

  const daysUntilExpiry = realtor.suspensionExpiresAt
    ? differenceInDays(new Date(realtor.suspensionExpiresAt), new Date())
    : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Status Card */}
      <Card
        className={`p-6 ${statusConfig.bg} ${statusConfig.border} border-2`}
      >
        <div className="flex items-start space-x-4">
          <div
            className={`p-3 rounded-full ${statusConfig.bg} ${statusConfig.border} border`}
          >
            <StatusIcon className={`h-6 w-6 ${statusConfig.color}`} />
          </div>

          <div className="flex-1">
            <h3
              className={`text-lg font-semibold ${statusConfig.actionColor} mb-2`}
            >
              {statusConfig.title}
            </h3>
            <p
              className={`text-sm ${statusConfig.actionColor} mb-4 opacity-80`}
            >
              {statusConfig.description}
            </p>

            {/* CAC Information */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <Building2 className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium text-gray-700">CAC Number:</span>
                <span className="ml-2 text-gray-900">
                  {realtor.corporateRegNumber || "Not provided"}
                </span>
              </div>

              {realtor.cacVerifiedAt && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium text-gray-700">Verified:</span>
                  <span className="ml-2 text-gray-900">
                    {format(new Date(realtor.cacVerifiedAt), "MMM dd, yyyy")}
                  </span>
                </div>
              )}
            </div>

            {/* Rejection Reason */}
            {realtor.cacRejectionReason && (
              <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <MessageSquare className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800 mb-1">
                      Rejection Reason:
                    </p>
                    <p className="text-sm text-red-700">
                      {realtor.cacRejectionReason}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Suspension Information */}
            {realtor.suspendedAt && realtor.suspensionExpiresAt && (
              <div className="mt-4 p-3 bg-orange-100 border border-orange-200 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-800 mb-1">
                      Account Suspended Until:
                    </p>
                    <p className="text-sm text-orange-700 mb-2">
                      {format(
                        new Date(realtor.suspensionExpiresAt),
                        "MMM dd, yyyy HH:mm"
                      )}
                    </p>

                    {daysUntilExpiry > 0 ? (
                      <p className="text-xs text-orange-600">
                        <strong>{daysUntilExpiry} days remaining</strong> to
                        submit an appeal. Your account will be deleted if no
                        appeal is submitted.
                      </p>
                    ) : (
                      <p className="text-xs text-red-600 font-medium">
                        Suspension period has expired. Contact support
                        immediately.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-4 flex flex-wrap gap-3">
              {realtor.cacStatus === "REJECTED" &&
                realtor.canAppeal &&
                daysUntilExpiry > 0 && (
                  <Button
                    onClick={() => setShowAppealModal(true)}
                    disabled={appealMutation.isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Submit Appeal
                  </Button>
                )}

              {realtor.cacStatus === "PENDING" && (
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Status
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() =>
                  window.open("https://search.cac.gov.ng/", "_blank")
                }
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Verify CAC Online
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Additional Information Cards */}
      {realtor.cacStatus === "PENDING" && (
        <Card className="p-6 bg-blue-50 border-blue-200 border">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                What happens during verification?
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • We verify your CAC number with the Corporate Affairs
                  Commission
                </li>
                <li>• Verification typically takes 1-3 business days</li>
                <li>• You'll receive an email notification once completed</li>
                <li>
                  • You can access your dashboard but cannot upload properties
                  until approved
                </li>
              </ul>
            </div>
          </div>
        </Card>
      )}

      {realtor.cacStatus === "APPROVED" && (
        <Card className="p-6 bg-green-50 border-green-200 border">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-green-900 mb-2">
                Your account is fully verified!
              </h4>
              <p className="text-sm text-green-800">
                You can now upload properties, manage bookings, and access all
                realtor features. Your verified status builds trust with
                potential clients.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Appeal Modal */}
      {showAppealModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Submit CAC Appeal
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please explain why you believe your CAC rejection was incorrect.
              Our team will review your appeal within 24 hours.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appeal Message *
              </label>
              <textarea
                value={appealMessage}
                onChange={(e) => setAppealMessage(e.target.value)}
                placeholder="Please provide a detailed explanation for your appeal..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Include any additional documentation or clarification that
                supports your case.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAppealModal(false);
                  setAppealMessage("");
                }}
                disabled={appealMutation.isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAppeal}
                disabled={appealMutation.isLoading || !appealMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {appealMutation.isLoading ? (
                  <>
                    <Loading size="sm" className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Submit Appeal
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
