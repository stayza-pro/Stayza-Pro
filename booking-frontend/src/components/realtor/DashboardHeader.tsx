"use client";

import React from "react";
import { motion } from "framer-motion";
import { Copy, ExternalLink, Share2, Wallet, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { getRealtorSubdomain } from "@/utils/subdomain";
import walletService from "@/services/wallet";
import { useQuery } from "react-query";

interface DashboardHeaderProps {
  onCopySuccess?: () => void;
}

export function DashboardHeader({ onCopySuccess }: DashboardHeaderProps) {
  const { user } = useAuth();
  const { brandColor, tagline, realtorName, logoUrl } = useRealtorBranding();
  const realtorSubdomain = getRealtorSubdomain();
  const { data: walletBalance, isLoading: loadingBalance } = useQuery(
    ["realtor-wallet-balance"],
    () => walletService.getWalletBalance(),
    {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchInterval: 30 * 1000,
      staleTime: 30 * 1000,
    }
  );

  const websiteUrl = `https://${realtorSubdomain || "yourcompany"}.stayza.pro`;
  const businessName =
    user?.realtor?.businessName || realtorName || "Stayza Realtor";
  const primary = brandColor || "#3B82F6";
  const statusKey = (user?.realtor?.status || "ACTIVE").toUpperCase();
  const statusLabel = statusKey.replace(/_/g, " ");
  const isSuspended = statusKey === "SUSPENDED";
  const fallbackInitial = businessName.charAt(0).toUpperCase();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onCopySuccess?.();
    } catch (error) {
      
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex flex-col gap-6">
        {/* Top Row: Greeting and Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Greeting */}
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={businessName}
                className="h-14 w-14 rounded-xl object-cover border-2 border-gray-100"
              />
            ) : (
              <div
                className="h-14 w-14 rounded-xl flex items-center justify-center text-white text-xl font-bold"
                style={{ backgroundColor: primary }}
              >
                {fallbackInitial}
              </div>
            )}

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {user?.firstName || "User"}! 👋
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">{businessName}</p>
            </div>
          </div>

          {/* Right: Website & Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-gray-700 font-mono">
                {realtorSubdomain || "yourcompany"}.stayza.pro
              </span>
            </div>

            <motion.a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: primary,
                color: "white",
              }}
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Site</span>
            </motion.a>
          </div>
        </div>

        {/* Bottom Row: Wallet Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Available Balance */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium opacity-90">
                Available Balance
              </span>
              <Wallet className="w-5 h-5 opacity-75" />
            </div>
            <div className="text-2xl font-bold">
              {loadingBalance
                ? "Loading..."
                : walletBalance
                ? formatCurrency(walletBalance.availableBalance)
                : "₦0.00"}
            </div>
            <p className="text-xs opacity-75 mt-1">Ready to withdraw</p>
          </motion.div>

          {/* Pending Balance */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-4 text-white"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium opacity-90">
                Pending Balance
              </span>
              <TrendingUp className="w-5 h-5 opacity-75" />
            </div>
            <div className="text-2xl font-bold">
              {loadingBalance
                ? "Loading..."
                : walletBalance
                ? formatCurrency(walletBalance.pendingBalance)
                : "₦0.00"}
            </div>
            <p className="text-xs opacity-75 mt-1">Being processed</p>
          </motion.div>

          {/* Total Balance */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl p-4 border-2 border-gray-200 bg-white"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Total Balance
              </span>
              <div
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: `${primary}20` }}
              >
                <Wallet className="w-5 h-5" style={{ color: primary }} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {loadingBalance
                ? "Loading..."
                : walletBalance
                ? formatCurrency(walletBalance.totalBalance)
                : "₦0.00"}
            </div>
            <p className="text-xs text-gray-500 mt-1">Available + Pending</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
