"use client";

import React from "react";
import {
  refundService,
  type RefundRequest,
  type RefundStatus,
} from "@/services/refunds";
import { format } from "date-fns";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Wallet,
  AlertCircle,
} from "lucide-react";

interface RealtorRefundResponse {
  data?: RefundRequest[];
}

const formatNgnAmount = (value: unknown): string => {
  const amount = Number(value);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return safeAmount.toLocaleString("en-NG");
};

const STATUS_BADGE_CONFIG: Record<
  RefundStatus,
  { bg: string; text: string; label: string }
> = {
  PENDING_REALTOR_APPROVAL: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    label: "Pending",
  },
  REALTOR_APPROVED: {
    bg: "bg-green-100",
    text: "text-green-800",
    label: "Approved",
  },
  REALTOR_REJECTED: {
    bg: "bg-red-100",
    text: "text-red-800",
    label: "Rejected",
  },
  ADMIN_PROCESSING: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    label: "Processing",
  },
  COMPLETED: {
    bg: "bg-green-100",
    text: "text-green-800",
    label: "Completed",
  },
  CANCELLED: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    label: "Cancelled",
  },
};

export default function RefundRequestsContent() {
  const [refundsData, setRefundsData] =
    React.useState<RealtorRefundResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchRefunds = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await refundService.getRealtorRefundRequests();
      setRefundsData(data as RealtorRefundResponse);
    } catch (err) {
      setError(refundService.extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchRefunds();
  }, [fetchRefunds]);

  const refunds = React.useMemo(() => refundsData?.data ?? [], [refundsData]);

  const stats = React.useMemo(() => {
    const approved = refunds.filter(
      (refund) => refund.status === "REALTOR_APPROVED"
    ).length;
    const rejected = refunds.filter(
      (refund) => refund.status === "REALTOR_REJECTED"
    ).length;

    const totalRefunded = refunds
      .filter(
        (refund) =>
          refund.status === "COMPLETED" ||
          refund.status === "REALTOR_APPROVED" ||
          refund.status === "ADMIN_PROCESSING"
      )
      .reduce((sum, refund) => {
        const amount = Number(refund.actualRefundAmount || refund.requestedAmount || 0);
        return sum + amount;
      }, 0);

    return { approved, rejected, totalRefunded };
  }, [refunds]);

  const getStatusBadge = (status: RefundStatus) => {
    const config = STATUS_BADGE_CONFIG[status] ?? STATUS_BADGE_CONFIG.PENDING_REALTOR_APPROVAL;

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Refund Requests</h2>
            <p className="text-gray-600 mt-1">
              Manage guest refund requests and cancellations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.approved}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.rejected}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Refunded</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ₦{formatNgnAmount(stats.totalRefunded)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Wallet className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="flex justify-center items-center">
                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                <span className="ml-3 text-gray-600">Loading refund requests...</span>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Error Loading Refunds
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={() => void fetchRefunds()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : refunds.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                  <RefreshCw className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Refund Requests</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Guest refund requests and cancellation claims will appear here for your
                  review. You can approve or reject requests based on your cancellation policy.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Guest
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {refunds.map((refund) => (
                    <tr key={refund.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {refund.requester?.firstName} {refund.requester?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{refund.requester?.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {refund.booking?.property?.title || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₦{formatNgnAmount(refund.requestedAmount)}
                        </div>
                        {refund.actualRefundAmount !== undefined && (
                          <div className="text-xs text-gray-500">
                            Actual: ₦{formatNgnAmount(refund.actualRefundAmount)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {refund.reason.replace(/_/g, " ")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(refund.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(refund.createdAt), "MMM dd, yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
