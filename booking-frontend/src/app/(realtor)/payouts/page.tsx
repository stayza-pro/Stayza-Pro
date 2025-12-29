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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

  const brandColor = branding?.primaryColor || "#3B82F6";

  useEffect(() => {
    fetchPayoutData();
  }, []);

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payouts</h1>
          <p className="text-gray-600">
            Manage your earnings and withdrawal requests
          </p>
        </div>

        {/* Bank Account Setup Warning - Only show if no payout account */}
        {!hasPayoutAccount && (
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pending Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-gray-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${brandColor}15` }}
              >
                <Wallet className="w-6 h-6" style={{ color: brandColor }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{totalPending.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {pendingPayouts.length} pending payout(s)
            </p>
          </motion.div>

          {/* Total Paid Out */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border border-gray-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-lg bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Paid Out</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦
                  {payoutHistory
                    .filter((p) => p.status === "COMPLETED")
                    .reduce((sum, p) => sum + p.amount, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">All time earnings</p>
          </motion.div>

          {/* Pending Requests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-gray-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-lg bg-blue-100">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    payoutHistory.filter(
                      (p) => p.status === "PENDING" || p.status === "PROCESSING"
                    ).length
                  }
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Being processed</p>
          </motion.div>
        </div>

        {/* Request Payout Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRequestPayout}
          disabled={requesting || totalPending <= 0 || !hasPayoutAccount}
          style={{ backgroundColor: brandColor }}
          className="w-full md:w-auto px-8 py-4 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-shadow"
        >
          {requesting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Request Withdrawal (₦{totalPending.toLocaleString()})
            </>
          )}
        </motion.button>

        {/* Pending Payouts */}
        {pendingPayouts.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Available for Withdrawal
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                These funds have been released from escrow and are ready to
                withdraw
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {pendingPayouts.map((payout, index) => (
                <div
                  key={index}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {payout.propertyTitle}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Booking #{payout.bookingId.slice(0, 8)}... •{" "}
                        {payout.eventType === "RELEASE_CLEANING_FEE"
                          ? "Cleaning Fee"
                          : "Room Fee (90%)"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Released{" "}
                        {formatDistanceToNow(new Date(payout.releaseDate), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        +₦{payout.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payout History */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Payout History
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Track all your withdrawal requests and transfers
            </p>
          </div>
          {payoutHistory.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No payout history yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Your payout requests will appear here
              </p>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
