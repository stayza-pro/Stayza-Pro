"use client";

import React from "react";
import { motion } from "framer-motion";
import { Copy, ExternalLink, Share2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { getRealtorSubdomain } from "@/utils/subdomain";

interface DashboardHeaderProps {
  onCopySuccess?: () => void;
}

export function DashboardHeader({ onCopySuccess }: DashboardHeaderProps) {
  const { user } = useAuth();
  const { brandColor, tagline, realtorName, logoUrl } = useRealtorBranding();
  const realtorSubdomain = getRealtorSubdomain();
  const websiteUrl = `https://${realtorSubdomain || "yourcompany"}.stayza.pro`;
  const businessName =
    user?.realtor?.businessName || realtorName || "Stayza Realtor";
  const primary = brandColor || "#3B82F6";
  const statusKey = (user?.realtor?.status || "ACTIVE").toUpperCase();
  const statusLabel = statusKey.replace(/_/g, " ");
  const isSuspended = statusKey === "SUSPENDED";
  const fallbackInitial = businessName.charAt(0).toUpperCase();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onCopySuccess?.();
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
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
    </div>
  );
}
