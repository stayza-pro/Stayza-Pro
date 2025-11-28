import React from "react";
import { Card, Button } from "@/components/ui";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Mail,
  Phone,
  FileText,
  User,
  Shield,
} from "lucide-react";

interface ApprovalStatusProps {
  approvalStage: string;
  isFullyApproved: boolean;
  message: string;
  nextSteps: string[];
  estimatedTimeframe: string;
  details: {
    businessName: string;
    businessStatus: string;
    cacStatus: string;
    cacRejectionReason?: string;
    canAppeal: boolean;
    accountCreated: string;
    cacVerifiedAt?: string;
  };
  supportInfo: {
    email: string;
    phone: string;
    businessHours: string;
  };
}

const getStageIcon = (stage: string) => {
  switch (stage) {
    case "approved":
      return <CheckCircle className="h-12 w-12 text-green-500" />;
    case "business_review":
    case "cac_review":
      return <Clock className="h-12 w-12 text-yellow-500" />;
    case "cac_rejected":
    case "rejected":
      return <XCircle className="h-12 w-12 text-red-500" />;
    case "suspended":
      return <AlertTriangle className="h-12 w-12 text-red-500" />;
    default:
      return <Clock className="h-12 w-12 text-blue-500" />;
  }
};

const getStageColor = (stage: string) => {
  switch (stage) {
    case "approved":
      return "border-green-200 bg-green-50";
    case "business_review":
    case "cac_review":
      return "border-yellow-200 bg-yellow-50";
    case "cac_rejected":
    case "rejected":
    case "suspended":
      return "border-red-200 bg-red-50";
    default:
      return "border-blue-200 bg-blue-50";
  }
};

export function ApprovalStatusPage({
  approvalStage,
  message,
  nextSteps,
  estimatedTimeframe,
  details,
  supportInfo,
}: ApprovalStatusProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Account Verification Status
          </h1>
          <p className="text-lg text-gray-600">{details.businessName}</p>
        </div>

        {/* Main Status Card */}
        <Card className={`p-8 mb-8 border-2 ${getStageColor(approvalStage)}`}>
          <div className="text-center mb-6">
            {getStageIcon(approvalStage)}
            <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
              {message}
            </h2>
            <p className="text-gray-600">
              Estimated timeframe:{" "}
              <span className="font-semibold">{estimatedTimeframe}</span>
            </p>
          </div>

          {/* Progress Steps */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Business Registration */}
            <div className="flex items-start space-x-3">
              <div
                className={`p-2 rounded-full ${
                  details.businessStatus === "APPROVED"
                    ? "bg-green-100 text-green-600"
                    : details.businessStatus === "REJECTED"
                    ? "bg-red-100 text-red-600"
                    : "bg-yellow-100 text-yellow-600"
                }`}
              >
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Business Registration
                </h3>
                <p
                  className={`text-sm ${
                    details.businessStatus === "APPROVED"
                      ? "text-green-600"
                      : details.businessStatus === "REJECTED"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  Status: {details.businessStatus}
                </p>
              </div>
            </div>

            {/* CAC Verification */}
            <div className="flex items-start space-x-3">
              <div
                className={`p-2 rounded-full ${
                  details.cacStatus === "APPROVED"
                    ? "bg-green-100 text-green-600"
                    : details.cacStatus === "REJECTED"
                    ? "bg-red-100 text-red-600"
                    : "bg-yellow-100 text-yellow-600"
                }`}
              >
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  CAC Verification
                </h3>
                <p
                  className={`text-sm ${
                    details.cacStatus === "APPROVED"
                      ? "text-green-600"
                      : details.cacStatus === "REJECTED"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  Status: {details.cacStatus}
                </p>
                {details.cacRejectionReason && (
                  <p className="text-xs text-red-600 mt-1">
                    Reason: {details.cacRejectionReason}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Next Steps */}
          {nextSteps.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Next Steps:</h3>
              <ul className="space-y-2">
                {nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {details.canAppeal && details.cacStatus === "REJECTED" && (
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <FileText className="h-4 w-4 mr-2" />
                Submit Appeal
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Refresh Status
            </Button>
          </div>
        </Card>

        {/* Support Information */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Need Help?
          </h3>
          <p className="text-gray-600 mb-4">
            Our support team is here to assist you with any questions about the
            approval process.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Email Support</p>
                <a
                  href={`mailto:${supportInfo.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {supportInfo.email}
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Phone Support</p>
                <a
                  href={`tel:${supportInfo.phone}`}
                  className="text-blue-600 hover:underline"
                >
                  {supportInfo.phone}
                </a>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            <strong>Business Hours:</strong> {supportInfo.businessHours}
          </p>
        </Card>
      </div>
    </div>
  );
}

export default ApprovalStatusPage;
