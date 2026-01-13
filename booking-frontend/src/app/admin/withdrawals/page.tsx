"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "../../../store/authStore";
import { AdminNavigation } from "../../../components/admin/AdminNavigation";
import { useRouter } from "next/navigation";
import adminWithdrawalService, {
  WithdrawalRequest,
  WithdrawalStats,
} from "../../../services/adminWithdrawalService";
import { formatCurrency } from "../../../utils/formatters";
import { toast } from "react-hot-toast";

export default function WithdrawalsPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  const [stats, setStats] = useState<WithdrawalStats | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [selectedStatus, setSelectedStatus] =
    useState<string>("PENDING,FAILED");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "ADMIN")) {
      router.push("/admin/login");
    }
  }, [isAuthenticated, isLoading, user?.role, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "ADMIN") {
      loadData();
    }
  }, [isAuthenticated, user, selectedStatus, page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, withdrawalsData] = await Promise.all([
        adminWithdrawalService.getWithdrawalStats(),
        adminWithdrawalService.getWithdrawals(selectedStatus, page, 20),
      ]);
      setStats(statsData);
      setWithdrawals(withdrawalsData.data);
      setTotalPages(withdrawalsData.pagination.totalPages);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id: string) => {
    if (
      !confirm("Are you sure you want to manually process this withdrawal?")
    ) {
      return;
    }

    try {
      setProcessing(id);
      await adminWithdrawalService.processWithdrawal(id);
      toast.success("Withdrawal processed successfully!");
      loadData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to process withdrawal"
      );
    } finally {
      setProcessing(null);
    }
  };

  const handleRetryAll = async () => {
    if (!confirm("This will retry all failed withdrawals. Continue?")) {
      return;
    }

    try {
      setRetrying(true);
      const result = await adminWithdrawalService.retryFailedWithdrawals();
      toast.success(
        `Processed: ${result.processed}, Successful: ${result.successful}, Failed: ${result.failed}`
      );
      loadData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to retry withdrawals"
      );
    } finally {
      setRetrying(false);
    }
  };

  const handleCancel = async (id: string) => {
    const reason = prompt("Please provide a reason for cancellation:");
    if (!reason) return;

    try {
      setProcessing(id);
      await adminWithdrawalService.cancelWithdrawal(id, reason);
      toast.success("Withdrawal cancelled and funds released");
      loadData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to cancel withdrawal"
      );
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800",
      COMPLETED: "bg-green-100 text-green-800",
      FAILED: "bg-red-100 text-red-800",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  if (isLoading || !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#1E3A8A" }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white mx-auto"></div>
          <p className="text-white text-lg font-medium mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      <AdminNavigation />
      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Withdrawal Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage and process realtor withdrawal requests
            </p>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.pendingCount}
                    </p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <svg
                      className="w-6 h-6 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Failed</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.failedCount}
                    </p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-lg">
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Completed Today
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.completedTodayCount}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Pending Amount
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(stats.pendingAmount)}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Requires Attention
                    </p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      {stats.requiresAttention}
                    </p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions Bar */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex gap-2">
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="PENDING,FAILED">Pending & Failed</option>
                  <option value="PENDING">Pending Only</option>
                  <option value="FAILED">Failed Only</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <button
                onClick={handleRetryAll}
                disabled={retrying || stats?.failedCount === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {retrying ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⟳</span>
                    Retrying...
                  </>
                ) : (
                  `Retry All Failed (${stats?.failedCount || 0})`
                )}
              </button>
            </div>
          </div>

          {/* Withdrawals Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600/30 border-t-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading withdrawals...</p>
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="p-12 text-center">
                <svg
                  className="w-16 h-16 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-gray-600 text-lg">No withdrawals found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Realtor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requested
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Retries
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Failure Reason
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {withdrawal.realtor.businessName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {withdrawal.realtor.user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(withdrawal.amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                              withdrawal.status
                            )}`}
                          >
                            {withdrawal.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(
                            withdrawal.requestedAt
                          ).toLocaleDateString()}
                          <br />
                          {new Date(
                            withdrawal.requestedAt
                          ).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {withdrawal.retryCount} / 3
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {withdrawal.failureReason ? (
                            <div className="text-sm text-red-600 max-w-xs truncate">
                              {withdrawal.failureReason}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {withdrawal.status !== "COMPLETED" && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleProcess(withdrawal.id)}
                                disabled={processing === withdrawal.id}
                                className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                              >
                                {processing === withdrawal.id ? (
                                  <span className="inline-block animate-spin">
                                    ⟳
                                  </span>
                                ) : (
                                  "Process"
                                )}
                              </button>
                              <button
                                onClick={() => handleCancel(withdrawal.id)}
                                disabled={processing === withdrawal.id}
                                className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
