"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Mail,
  TrendingUp,
  Calendar,
  Building2,
  Phone,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { toast } from "react-hot-toast";

interface WaitlistEntry {
  id: string;
  email: string;
  fullName: string | null;
  companyName: string | null;
  phone: string | null;
  message: string | null;
  source: string | null;
  status: string;
  createdAt: string;
}

export default function AdminWaitlistPage() {
  const [count, setCount] = useState<number>(0);
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchWaitlistData();
  }, []);

  const fetchWaitlistData = async () => {
    try {
      setIsLoading(true);

      // Fetch count
      const countResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/waitlist/count`
      );
      const countData = await countResponse.json();

      if (countData.success) {
        setCount(countData.data.count);
      }

      setIsLoading(false);
    } catch (error) {
      
      toast.error("Failed to load waitlist data");
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchWaitlistData();
    setIsRefreshing(false);
    toast.success("Waitlist data refreshed");
  };

  const displayedCount = count + 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading waitlist data...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminPageLayout>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Waitlist Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                Track signups and manage your pre-launch waitlist
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Actual Count */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Actual Signups
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {count.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Real database count
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </motion.div>

          {/* Displayed Count */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">
                  Public Display Count
                </p>
                <p className="text-3xl font-bold mt-2">
                  {displayedCount.toLocaleString()}+
                </p>
                <p className="text-xs text-blue-200 mt-1">
                  Actual count + 100 baseline
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Growth Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Baseline Boost
                </p>
                <p className="text-3xl font-bold text-emerald-600 mt-2">+100</p>
                <p className="text-xs text-gray-500 mt-1">
                  Added to actual count
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Calendar className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                How the Display Count Works
              </h3>
              <p className="text-sm text-blue-800 leading-relaxed">
                The <strong>Public Display Count</strong> is what visitors see
                on your marketing pages. It adds a baseline of 100 to your
                actual signups to create social proof. Every new signup
                increases both numbers, keeping it honest while maintaining
                momentum.
              </p>
              <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700 font-mono">
                  Formula: Display Count = Actual Count + 100
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Waitlist Overview
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">Total Email Addresses</span>
              </div>
              <span className="font-semibold text-gray-900">{count}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">Pending Status</span>
              </div>
              <span className="font-semibold text-gray-900">{count}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">Public Display</span>
              </div>
              <span className="font-semibold text-blue-600">
                {displayedCount}+
              </span>
            </div>
          </div>
        </div>

        {/* API Endpoint Info */}
        <div className="mt-8 bg-gray-900 rounded-xl p-6 text-white">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <code className="text-emerald-400">GET</code>
            <span>API Endpoint</span>
          </h3>
          <div className="bg-black/30 rounded-lg p-4 font-mono text-sm">
            <p className="text-gray-300">
              {process.env.NEXT_PUBLIC_API_URL}/api/waitlist/count
            </p>
          </div>
          <p className="text-sm text-gray-400 mt-3">
            This endpoint returns the real-time count of waitlist signups. Use
            it on your marketing pages to display live statistics.
          </p>
        </div>
      </div>
    </div>
    </AdminPageLayout>
  );
}
