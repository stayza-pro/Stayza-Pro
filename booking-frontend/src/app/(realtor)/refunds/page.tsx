"use client";

import React, { useState } from "react";
import { useRefundRequests } from "@/hooks/realtor/useRefundRequests";
import { useBranding } from "@/hooks/useBranding";
import {
  DollarSign,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Home,
} from "lucide-react";
import { format } from "date-fns";

type RefundStatus = "PENDING" | "APPROVED" | "REJECTED" | "all";

export default function RealtorRefundsPage() {
  const { branding } = useBranding();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<RefundStatus>("all");

  const { refunds, stats, total, totalPages, isLoading, error, refetch } =
    useRefundRequests({
      page: currentPage,
      limit: 10,
      status: statusFilter !== "all" ? statusFilter : undefined,
    });

  const brandColor = branding?.colors?.primary || "#3B82F6";

  const statusConfig = {
    PENDING: {
      label: "Pending",
      color: "bg-amber-50 text-amber-700 border-amber-200",
      icon: Clock,
    },
    APPROVED: {
      label: "Approved",
      color: "bg-green-50 text-green-700 border-green-200",
      icon: CheckCircle,
    },
    REJECTED: {
      label: "Rejected",
      color: "bg-red-50 text-red-700 border-red-200",
      icon: XCircle,
    },
  };

  if (isLoading && refunds.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-spin" />
          <p className="text-gray-600 font-medium">
            Loading refund requests...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Error Loading Refunds
          </h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h1 className="text-2xl font-bold mb-1" style={{ color: brandColor }}>
          Refund Requests
        </h1>
        <p className="text-gray-600">
          Manage booking refund requests and track status
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Requests",
            value: total || 0,
            icon: DollarSign,
          },
          {
            label: "Pending",
            value: stats?.pending || 0,
            icon: Clock,
          },
          {
            label: "Approved",
            value: stats?.approved || 0,
            icon: CheckCircle,
          },
          {
            label: "Rejected",
            value: stats?.rejected || 0,
            icon: XCircle,
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-6 border border-gray-200"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Icon className="w-5 h-5" style={{ color: brandColor }} />
                </div>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-gray-700">
            Filter by Status:
          </span>
          <div className="flex gap-2">
            {(["all", "PENDING", "APPROVED", "REJECTED"] as RefundStatus[]).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-xl font-bold transition-all ${
                    statusFilter === status
                      ? "text-white"
                      : "border border-gray-300 hover:bg-gray-50 text-gray-700"
                  }`}
                  style={
                    statusFilter === status
                      ? { backgroundColor: brandColor }
                      : {}
                  }
                >
                  {status === "all"
                    ? "All"
                    : statusConfig[status as keyof typeof statusConfig].label}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Refunds List */}
      {refunds.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-200">
          <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No Refund Requests
          </h3>
          <p className="text-gray-600">
            {statusFilter !== "all"
              ? `No ${statusConfig[
                  statusFilter as keyof typeof statusConfig
                ].label.toLowerCase()} refund requests`
              : "No refund requests at this time"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {refunds.map((refund) => {
              const status =
                statusConfig[refund.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;

              return (
                <div
                  key={refund.id}
                  className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Status Badge */}
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`px-3 py-1 rounded-lg text-xs font-bold border ${status.color}`}
                        >
                          <div className="flex items-center gap-1.5">
                            <StatusIcon className="w-3.5 h-3.5" />
                            {status.label}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          Request #{refund.id.slice(0, 8)}
                        </span>
                      </div>

                      {/* Guest Info */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            {refund.guestName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {refund.guestEmail}
                          </p>
                        </div>
                      </div>

                      {/* Property Info */}
                      {refund.propertyTitle && (
                        <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                          <Home className="w-4 h-4" />
                          <span className="font-medium">
                            {refund.propertyTitle}
                          </span>
                        </div>
                      )}

                      {/* Reason */}
                      {refund.reason && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm font-bold text-gray-700 mb-1">
                            Reason:
                          </p>
                          <p className="text-sm text-gray-600">
                            {refund.reason}
                          </p>
                        </div>
                      )}

                      {/* Admin Notes (if rejected) */}
                      {refund.status === "REJECTED" && refund.adminNotes && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm font-bold text-red-700 mb-1">
                            Rejection Note:
                          </p>
                          <p className="text-sm text-red-600">
                            {refund.adminNotes}
                          </p>
                        </div>
                      )}

                      {/* Dates */}
                      <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                        <div>
                          <span className="font-medium">Requested:</span>{" "}
                          {format(
                            new Date(refund.requestedAt),
                            "MMM dd, yyyy 'at' h:mm a"
                          )}
                        </div>
                        {refund.processedAt && (
                          <div>
                            <span className="font-medium">Processed:</span>{" "}
                            {format(
                              new Date(refund.processedAt),
                              "MMM dd, yyyy 'at' h:mm a"
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">
                        Refund Amount
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        ${refund.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages && totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-xl font-bold transition-all ${
                          currentPage === page
                            ? "text-white"
                            : "border border-gray-300 hover:bg-gray-50 text-gray-700"
                        }`}
                        style={
                          currentPage === page
                            ? { backgroundColor: brandColor }
                            : {}
                        }
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
