"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Copy,
  ExternalLink,
  LogOut,
  Bell,
  User,
  ChevronDown,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useBrand } from "../context/BrandContext";
import toast from "react-hot-toast";

export default function TopBar() {
  const { user, logout } = useAuthStore();
  const { brand } = useBrand();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const subdomain = `${brand.slug}.stayza.pro`;
  const subdomainUrl = `https://${subdomain}`;

  const handleCopySubdomain = async () => {
    try {
      await navigator.clipboard.writeText(subdomainUrl);
      toast.success("Website URL copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy URL");
    }
  };

  const handlePreviewSite = () => {
    window.open(subdomainUrl, "_blank");
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/realtor/login");
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const firstName = user?.firstName || "User";

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {firstName}! 👋
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Here's what's happening with your properties today.
            </p>
          </motion.div>

          {/* Right Section */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center space-x-4"
          >
            {/* Subdomain Section */}
            <div className="hidden md:flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-xl">
              <span className="text-sm font-medium text-gray-700">
                {subdomain}
              </span>
              <div className="flex space-x-1">
                <button
                  onClick={handleCopySubdomain}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-all"
                  title="Copy website URL"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={handlePreviewSite}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-all"
                  title="Preview website"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all">
              <Bell className="w-5 h-5" />
              <span
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full text-xs flex items-center justify-center text-white"
                style={{ backgroundColor: brand.colors.danger }}
              >
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              </span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                    style={{ backgroundColor: brand.colors.primary }}
                  >
                    {firstName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user?.role}</p>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50"
                >
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push("/dashboard/settings");
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile Settings</span>
                  </button>

                  <div className="border-t border-gray-100 my-1"></div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Mobile Subdomain Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="md:hidden mt-4 flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl"
        >
          <span className="text-sm font-medium text-gray-700 truncate">
            {subdomain}
          </span>
          <div className="flex space-x-2 ml-2">
            <button
              onClick={handleCopySubdomain}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-all"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handlePreviewSite}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-all"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
}
