"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import { useBranding } from "@/hooks/useBranding";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  DollarSign,
  Calendar,
  ArrowRight,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import walletService, {
  WalletBalance,
  WalletTransaction,
  WithdrawalRequest,
  EarningsSummary,
} from "@/services/wallet";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";

interface PendingPayout {
  bookingId: string;
  propertyTitle: string;
  amount: number;
  releaseDate: string;
  eventType: string;
}

interface PayoutHistory {
  id: string;
  bookingId: string;
  amount: number;
  status: string;
  createdAt: string;
  processedAt?: string;
  reference?: string;
  notes?: string;
}

export default function PayoutsPage() {
  const { user } = useAuth();
  const { showSuccess, showError, showConfirm } = useAlert();
  const { branding } = useBranding();

  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [pendingPayouts, setPendingPayouts] = useState<PendingPayout[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistory[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [hasPayoutAccount, setHasPayoutAccount] = useState(false);

  // Wallet state
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(
    null
  );
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Transaction filters
  const [txFilter, setTxFilter] = useState<"ALL" | "CREDIT" | "DEBIT">("ALL");
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);

  const brandColor = branding?.primaryColor || "#3B82F6";

  useEffect(() => {
    fetchPayoutData();
    fetchWalletData();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [txPage, txFilter]);

  const fetchWalletData = async () => {
    try {
      const [balanceData, earningsData] = await Promise.all([
        walletService.getWalletBalance(),
        walletService.getEarningsSummary(),
      ]);
      setWalletBalance(balanceData);
      setEarnings(earningsData);
    } catch (error: any) {
      console.error("Failed to load wallet data:", error);
    }
  };

  const loadTransactions = async () => {
    try {
      const type = txFilter === "ALL" ? undefined : txFilter;
      const response = await walletService.getWalletTransactions(
        txPage,
        20,
        type
      );
      setTransactions(response.data);
      setTxTotalPages(response.pagination.totalPages);
    } catch (error: any) {
      console.error("Failed to load transactions:", error);
    }
  };

  const fetchPayoutData = async () => {
    try {
      setLoading(true);
      const [pendingRes, historyRes, settingsRes] = await Promise.all([
        fetch(`${API_URL}/realtors/payouts/pending`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }),
        fetch(`${API_URL}/realtors/payouts/history`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }),
        fetch(`${API_URL}/realtors/payout/settings`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }),
      ]);

      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPendingPayouts(data.data.pendingPayouts || []);
        setTotalPending(data.data.totalPending || 0);
        // Check hasPayoutAccount from both endpoints for reliability
        if (data.data.hasPayoutAccount !== undefined) {
          setHasPayoutAccount(data.data.hasPayoutAccount);
        }
      } else {
        const errorData = await pendingRes.json();
        console.error("Pending payouts error:", errorData);
        console.error("Response status:", pendingRes.status);
        console.error("Response headers:", pendingRes.headers);
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        setPayoutHistory(data.data.history || []);
      } else {
        const errorData = await historyRes.json();
        console.error("History error:", errorData);
        console.error("Response status:", historyRes.status);
        console.error(
          "Error message:",
          errorData.message || errorData.error?.message
        );
      }

      // Use payout settings as the primary source of truth for hasPayoutAccount
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setHasPayoutAccount(data.data.hasPayoutAccount || false);
        console.log("Payout account status:", data.data.hasPayoutAccount);
        console.log("Subaccount code:", data.data.subAccountCode);
      } else {
        const errorData = await settingsRes.json();
        console.error("Settings error:", errorData);
      }
    } catch (error) {
      console.error("Failed to fetch payout data:", error);
      showError("Failed to load payout information");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!hasPayoutAccount) {
      showError("Please set up your bank account in Settings first");
      return;
    }

    if (totalPending <= 0) {
      showError("No pending funds available for withdrawal");
      return;
    }

    showConfirm(
      `Request withdrawal of ₦${totalPending.toLocaleString()}?\n\nFunds will be transferred to your registered bank account within 24-48 hours.`,
      async () => {
        try {
          setRequesting(true);
          const response = await fetch(`${API_URL}/realtors/payouts/request`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body: JSON.stringify({
              amount: totalPending,
            }),
          });

          if (response.ok) {
            showSuccess("Payout request submitted successfully!");
            await fetchPayoutData();
            await fetchWalletData();
          } else {
            const error = await response.json();
            showError(error.message || "Failed to request payout");
          }
        } catch (error) {
          showError("Error requesting payout");
        } finally {
          setRequesting(false);
        }
      },
      "Confirm Payout Request"
    );
  };

  const handleWithdrawFromWallet = async () => {
    const amount = parseFloat(withdrawAmount);

    if (!amount || amount <= 0) {
      showError("Please enter a valid amount");
      return;
    }

    if (walletBalance && amount > walletBalance.availableBalance) {
      showError("Insufficient available balance");
      return;
    }

    if (!hasPayoutAccount) {
      showError("Please set up your bank account in Settings first");
      return;
    }

    try {
      setIsWithdrawing(true);
      await walletService.requestWithdrawal(amount);
      showSuccess("Withdrawal request submitted successfully!");
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      await fetchWalletData();
      await loadTransactions();
    } catch (error: any) {
      console.error("Withdrawal failed:", error);
      showError(
        error.response?.data?.message || "Failed to request withdrawal"
      );
    } finally {
      setIsWithdrawing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      PROCESSING: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
      FAILED: "bg-red-100 text-red-800",
      REJECTED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "PROCESSING":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "FAILED":
      case "REJECTED":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<
      string,
      { color: string; bg: string; icon: React.ElementType }
    > = {
      PENDING: { color: "text-yellow-700", bg: "bg-yellow-100", icon: Clock },
      PROCESSING: {
        color: "text-blue-700",
        bg: "bg-blue-100",
        icon: Loader2,
      },
      COMPLETED: {
        color: "text-green-700",
        bg: "bg-green-100",
        icon: CheckCircle,
      },
      FAILED: { color: "text-red-700", bg: "bg-red-100", icon: XCircle },
    };

    const config = configs[status] || configs.PENDING;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
      >
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-spin" />
          <p className="text-gray-600 font-medium">
            Loading payout information...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Wallet className="w-8 h-8" style={{ color: brandColor }} />
            Wallet & Payouts
          </h1>
          <p className="text-gray-600">
            Manage your earnings, transactions, and withdrawals
          </p>
        </div>

        {/* Bank Account Setup Warning - Only show if not verified */}
        {user?.realtor?.paystackSubaccountCode === null && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border-l-4 border-yellow-400 p-5 rounded-r-lg shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 text-lg mb-2">
                  Bank Account Setup Required
                </h3>
                <p className="text-yellow-800 text-sm mb-3 leading-relaxed">
                  You need to link your bank account to receive payouts. Once
                  your account is verified, automatic transfers will begin for
                  all released escrow funds.
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() =>
                      (window.location.href = "/settings?tab=payout")
                    }
                    style={{ backgroundColor: brandColor }}
                    className="px-6 py-2.5 text-white rounded-lg font-medium hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2"
                  >
                    Set Up Bank Account
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-yellow-700">
                    Setup takes less than 2 minutes
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Available Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                <span className="text-sm font-medium opacity-90">
                  Available Balance
                </span>
              </div>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
              >
                Withdraw
              </button>
            </div>
            <div className="text-3xl font-bold mb-1">
              {walletBalance
                ? formatCurrency(walletBalance.availableBalance)
                : "₦0.00"}
            </div>
            <p className="text-sm opacity-75">Ready to withdraw</p>
          </motion.div>

          {/* Pending Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-600">
                Pending Balance
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {walletBalance
                ? formatCurrency(walletBalance.pendingBalance)
                : "₦0.00"}
            </div>
            <p className="text-sm text-gray-500">Being processed</p>
          </motion.div>

          {/* Total Earnings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-gray-600">
                Total Earnings
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {earnings ? formatCurrency(earnings.totalEarnings) : "₦0.00"}
            </div>
            <p className="text-sm text-gray-500">All time</p>
          </motion.div>

          {/* Escrow Pending */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-600">
                Escrow Pending
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              ₦{totalPending.toLocaleString()}
            </div>
            <p className="text-sm text-gray-500">
              {pendingPayouts.length} payout(s)
            </p>
          </motion.div>
        </div>

        {/* Withdrawal Button */}
        <div className="flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowWithdrawModal(true)}
            disabled={!walletBalance || walletBalance.availableBalance <= 0}
            style={{ backgroundColor: brandColor }}
            className="px-8 py-3 text-white rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
          >
            <Download className="w-5 h-5" />
            Request Withdrawal
          </motion.button>
        </div>

        {/* Transactions Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Transaction History
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              View all your credits and debits
            </p>
          </div>

          <div className="p-6">
            {/* Filter */}
            <div className="mb-4 flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={txFilter}
                onChange={(e) => {
                  setTxFilter(e.target.value as any);
                  setTxPage(1);
                }}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="ALL">All Transactions</option>
                <option value="CREDIT">Credits Only</option>
                <option value="DEBIT">Debits Only</option>
              </select>
            </div>

            {/* Transactions List */}
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      {tx.type === "CREDIT" ? (
                        <ArrowDownRight className="w-6 h-6 text-green-500" />
                      ) : (
                        <ArrowUpRight className="w-6 h-6 text-red-500" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {tx.description || tx.source}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(tx.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <div
                          className={`font-bold ${
                            tx.type === "CREDIT"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {tx.type === "CREDIT" ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </div>
                        <div className="text-xs text-gray-500">{tx.status}</div>
                      </div>
                      {getStatusIcon(tx.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {txTotalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <button
                  onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                  disabled={txPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Page {txPage} of {txTotalPages}
                </span>
                <button
                  onClick={() =>
                    setTxPage((p) => Math.min(txTotalPages, p + 1))
                  }
                  disabled={txPage === txTotalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Payout History from Old System */}
        {payoutHistory.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Legacy Payout History
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Historical payout requests from previous system
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {payoutHistory.map((payout) => (
                <div
                  key={payout.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-medium text-gray-900">
                          ₦{payout.amount.toLocaleString()}
                        </p>
                        {getStatusBadge(payout.status)}
                      </div>
                      {payout.reference && (
                        <p className="text-sm text-gray-600">
                          Reference: {payout.reference}
                        </p>
                      )}
                      {payout.notes && (
                        <p className="text-sm text-gray-600 mt-1">
                          {payout.notes}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Requested{" "}
                        {formatDistanceToNow(new Date(payout.createdAt), {
                          addSuffix: true,
                        })}
                        {payout.processedAt &&
                          ` • Processed ${formatDistanceToNow(
                            new Date(payout.processedAt),
                            { addSuffix: true }
                          )}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Request Withdrawal
              </h2>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Balance
              </label>
              <div className="text-2xl font-bold text-green-600">
                {walletBalance
                  ? formatCurrency(walletBalance.availableBalance)
                  : "₦0.00"}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Withdrawal Amount
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-yellow-800">
                ⏱️ Withdrawals typically take 1-3 business days to process
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawAmount("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isWithdrawing}
              >
                Cancel
              </button>
              <button
                onClick={handleWithdrawFromWallet}
                disabled={isWithdrawing}
                style={{ backgroundColor: brandColor }}
                className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isWithdrawing ? "Processing..." : "Withdraw"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
