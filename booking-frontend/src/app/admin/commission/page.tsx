"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  RefreshCw,
  Download,
  ArrowUpRight,
  Calendar,
} from "lucide-react";
import { DataTable } from "@/components/admin/DataTable";
import { ActionModal } from "@/components/admin/ActionModal";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import {
  getPlatformCommissionReport,
  getPendingPayouts,
  processRealtorPayout,
  CommissionReport,
  PendingPayout,
} from "@/services/adminService";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function CommissionPage() {
  const [platformReport, setPlatformReport] = useState<CommissionReport | null>(
    null
  );
  const [pendingPayouts, setPendingPayouts] = useState<PendingPayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPayoutsLoading, setIsPayoutsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Modal states
  const [selectedPayout, setSelectedPayout] = useState<PendingPayout | null>(
    null
  );
  const [payoutModal, setPayoutModal] = useState(false);

  // Date range (optional - for future enhancement)
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  // Fetch platform report
  useEffect(() => {
    fetchPlatformReport();
  }, []);

  // Fetch pending payouts
  useEffect(() => {
    fetchPendingPayouts();
  }, [currentPage]);

  const fetchPlatformReport = async () => {
    try {
      setIsLoading(true);
      const report = await getPlatformCommissionReport({
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
      });
      setPlatformReport(report);
    } catch (error: any) {
      console.error("Failed to fetch platform report:", error);
      toast.error(
        error.response?.data?.message || "Failed to load commission report"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingPayouts = async () => {
    try {
      setIsPayoutsLoading(true);
      const response = await getPendingPayouts({
        page: currentPage,
        limit: 10,
      });
      setPendingPayouts(response.payouts);
      setPagination(response.pagination);
    } catch (error: any) {
      console.error("Failed to fetch pending payouts:", error);
      toast.error(
        error.response?.data?.message || "Failed to load pending payouts"
      );
    } finally {
      setIsPayoutsLoading(false);
    }
  };

  const handleProcessPayout = async (payoutReference: string) => {
    if (!selectedPayout) return;
    try {
      await processRealtorPayout(selectedPayout.id, payoutReference);
      toast.success("Payout processed successfully!");
      fetchPendingPayouts();
      fetchPlatformReport();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to process payout");
      throw error;
    }
  };

  const handleRefresh = () => {
    fetchPlatformReport();
    fetchPendingPayouts();
  };

  // Format currency
  const formatCurrency = (amount: string) => {
    return `₦${parseFloat(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Metric Card Component
  const MetricCard = ({
    title,
    value,
    icon: Icon,
    color,
    trend,
  }: {
    title: string;
    value: string;
    icon: any;
    color: string;
    trend?: string;
  }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className="flex items-center text-green-600 text-sm font-medium">
            <ArrowUpRight className="w-4 h-4 mr-1" />
            {trend}
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  );

  // Table columns
  const columns = [
    {
      key: "booking",
      label: "Booking Details",
      render: (payout: PendingPayout) => (
        <div>
          <p className="font-medium text-gray-900">
            {payout.booking.property.title}
          </p>
          <p className="text-xs text-gray-500">
            {format(new Date(payout.booking.checkIn), "MMM dd")} -{" "}
            {format(new Date(payout.booking.checkOut), "MMM dd, yyyy")}
          </p>
        </div>
      ),
    },
    {
      key: "realtor",
      label: "Realtor",
      render: (payout: PendingPayout) => (
        <div>
          <p className="font-medium text-gray-900">
            {payout.booking.property.realtor.businessName}
          </p>
          <p className="text-xs text-gray-500">
            {payout.booking.property.realtor.user.email}
          </p>
        </div>
      ),
    },
    {
      key: "amount",
      label: "Total Amount",
      render: (payout: PendingPayout) => (
        <span className="font-medium text-gray-900">
          {formatCurrency(payout.amount)}
        </span>
      ),
    },
    {
      key: "commission",
      label: "Platform Commission (7%)",
      render: (payout: PendingPayout) => (
        <span className="font-medium text-blue-600">
          {formatCurrency(payout.platformCommission)}
        </span>
      ),
    },
    {
      key: "earnings",
      label: "Realtor Earnings",
      render: (payout: PendingPayout) => (
        <span className="font-medium text-green-600">
          {formatCurrency(payout.realtorEarnings)}
        </span>
      ),
    },
    {
      key: "date",
      label: "Payment Date",
      render: (payout: PendingPayout) => (
        <span className="text-sm text-gray-600">
          {format(new Date(payout.createdAt), "MMM dd, yyyy")}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (payout: PendingPayout) => (
        <button
          onClick={() => {
            setSelectedPayout(payout);
            setPayoutModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Process Payout
        </button>
      ),
    },
  ];

  return (
    <AdminPageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Commission & Payouts
            </h1>
            <p className="text-gray-600 mt-1">
              Manage platform commissions and process realtor payouts
            </p>
          </div>

          <div className="mt-4 lg:mt-0 flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>

            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Platform Commission Report */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"
              >
                <div className="h-12 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : platformReport ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(platformReport.totalRevenue)}
              icon={DollarSign}
              color="bg-blue-600"
            />
            <MetricCard
              title="Platform Commission (7%)"
              value={formatCurrency(platformReport.totalCommissions)}
              icon={TrendingUp}
              color="bg-green-600"
            />
            <MetricCard
              title="Payouts Made"
              value={formatCurrency(platformReport.totalPayouts)}
              icon={CheckCircle}
              color="bg-purple-600"
            />
            <MetricCard
              title="Pending Payouts"
              value={formatCurrency(platformReport.pendingPayouts)}
              icon={Clock}
              color="bg-orange-600"
            />
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <p className="text-red-800">Failed to load commission report</p>
          </div>
        )}

        {/* Commission Info Card */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Platform Commission Rate
              </h3>
              <p className="text-gray-700 mb-4">
                Stayza charges a <strong>7% commission</strong> on all completed
                bookings. This commission is automatically calculated and
                deducted from the booking amount before payout to realtors.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Booking Amount</p>
                  <p className="text-lg font-bold text-gray-900">100%</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">
                    Platform Commission
                  </p>
                  <p className="text-lg font-bold text-blue-600">7%</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Realtor Earnings</p>
                  <p className="text-lg font-bold text-green-600">93%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Payouts Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Pending Payouts
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>
                {pagination.total} payout{pagination.total !== 1 ? "s" : ""}{" "}
                awaiting processing
              </span>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={pendingPayouts}
            keyExtractor={(payout) => payout.id}
            isLoading={isPayoutsLoading}
            pagination={{
              currentPage: pagination.page,
              totalPages: pagination.totalPages,
              total: pagination.total,
              onPageChange: setCurrentPage,
            }}
            emptyMessage="No pending payouts at the moment"
          />
        </div>

        {/* Process Payout Modal */}
        <ActionModal
          isOpen={payoutModal}
          onClose={() => setPayoutModal(false)}
          onConfirm={handleProcessPayout}
          title="Process Payout"
          description={
            selectedPayout
              ? `Process payout of ${formatCurrency(
                  selectedPayout.realtorEarnings
                )} to ${
                  selectedPayout.booking.property.realtor.businessName
                }. Please enter the payment reference/transaction ID.`
              : ""
          }
          confirmText="Process Payout"
          variant="success"
          requiresInput
          inputLabel="Payment Reference / Transaction ID"
          inputPlaceholder="e.g., TRX-2024-001234, BANK-REF-123456"
        />
      </div>
    </AdminPageLayout>
  );
}
