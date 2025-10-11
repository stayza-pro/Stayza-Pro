"use client";

import React, { useState, useEffect } from "react";
import { paymentService } from "@/services/payments";
import { Payment } from "@/types";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  Filter,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
} from "lucide-react";
import { format } from "date-fns";

type PaymentStatus = "ALL" | "SUCCESS" | "PENDING" | "FAILED" | "REFUNDED";

const STATUS_COLORS = {
  SUCCESS: "text-green-600 bg-green-100",
  PENDING: "text-yellow-600 bg-yellow-100",
  FAILED: "text-red-600 bg-red-100",
  REFUNDED: "text-gray-600 bg-gray-100",
};

const STATUS_ICONS = {
  SUCCESS: CheckCircle,
  PENDING: Clock,
  FAILED: XCircle,
  REFUNDED: FileText,
};

const STATUS_FILTERS: { value: PaymentStatus; label: string }[] = [
  { value: "ALL", label: "All Payments" },
  { value: "SUCCESS", label: "Successful" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

interface RevenueStats {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  pendingPayouts: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<RevenueStats>({
    totalEarnings: 0,
    thisMonth: 0,
    lastMonth: 0,
    pendingPayouts: 0,
  });

  useEffect(() => {
    fetchPayments();
  }, [currentPage, selectedStatus]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getHostPayments({
        page: currentPage,
        limit: 20,
        status: selectedStatus === "ALL" ? undefined : selectedStatus,
      });

      const paymentsData = response.data || [];
      setPayments(paymentsData);
      setTotalPages(response.pagination?.totalPages || 1);

      // Calculate stats
      calculateStats(paymentsData);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (paymentsData: Payment[]) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const totalEarnings = paymentsData
      .filter((p) => p.status === "SUCCESS")
      .reduce((sum, p) => sum + p.amount, 0);

    const thisMonth = paymentsData
      .filter((p) => {
        const paymentDate = new Date(p.createdAt);
        return (
          p.status === "SUCCESS" &&
          paymentDate.getMonth() === currentMonth &&
          paymentDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, p) => sum + p.amount, 0);

    const lastMonthEarnings = paymentsData
      .filter((p) => {
        const paymentDate = new Date(p.createdAt);
        return (
          p.status === "SUCCESS" &&
          paymentDate.getMonth() === lastMonth &&
          paymentDate.getFullYear() === lastMonthYear
        );
      })
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingPayouts = paymentsData
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + p.amount, 0);

    setStats({
      totalEarnings: totalEarnings / 100, // Convert from cents
      thisMonth: thisMonth / 100,
      lastMonth: lastMonthEarnings / 100,
      pendingPayouts: pendingPayouts / 100,
    });
  };

  const handleDownloadReceipt = async (paymentId: string) => {
    try {
      const blob = await paymentService.downloadReceipt(paymentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading receipt:", error);
      alert("Failed to download receipt");
    }
  };

  const filteredPayments = payments.filter((payment) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      payment.reference?.toLowerCase().includes(query) ||
      payment.booking?.property?.name?.toLowerCase().includes(query) ||
      payment.booking?.guest?.email?.toLowerCase().includes(query)
    );
  });

  const monthlyChange =
    stats.lastMonth > 0
      ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100
      : 0;

  if (loading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600 mt-1">Track your revenue and payments</p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Earnings
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                $
                {stats.totalEarnings.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-sm text-gray-500 mt-1">All time</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                $
                {stats.thisMonth.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p
                className={`text-sm mt-1 ${
                  monthlyChange >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {monthlyChange >= 0 ? "+" : ""}
                {monthlyChange.toFixed(1)}% from last month
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Last Month</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                $
                {stats.lastMonth.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-sm text-gray-500 mt-1">Previous period</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Pending Payouts
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                $
                {stats.pendingPayouts.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-sm text-gray-500 mt-1">Being processed</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by reference, property, or guest..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  setSelectedStatus(filter.value);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedStatus === filter.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payments Table */}
      {filteredPayments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Payments Found
          </h3>
          <p className="text-gray-600">
            {selectedStatus === "ALL"
              ? "You don't have any payments yet"
              : `No ${selectedStatus.toLowerCase()} payments`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => {
                  const StatusIcon =
                    STATUS_ICONS[payment.status as keyof typeof STATUS_ICONS];
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(payment.createdAt), "MMM dd, yyyy")}
                        <div className="text-xs text-gray-500">
                          {format(new Date(payment.createdAt), "HH:mm")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">
                          {payment.reference?.slice(0, 16)}...
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {payment.booking?.property?.name || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {payment.booking?.guest?.firstName}{" "}
                          {payment.booking?.guest?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {payment.booking?.guest?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          $
                          {(payment.amount / 100).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${
                            STATUS_COLORS[
                              payment.status as keyof typeof STATUS_COLORS
                            ]
                          }`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {payment.status === "SUCCESS" && (
                          <button
                            onClick={() => handleDownloadReceipt(payment.id)}
                            className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                          >
                            <Download className="h-4 w-4" />
                            Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
