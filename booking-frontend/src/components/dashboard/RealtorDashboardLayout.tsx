"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import { BrandProvider } from "./context/BrandContext";

interface RealtorDashboardLayoutProps {
  children: React.ReactNode;
}

export default function RealtorDashboardLayout({
  children,
}: RealtorDashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Default brand colors - will be overridden by realtor's brand
  const defaultBrandColors = {
    primary: "#3B82F6", // Blue
    secondary: "#1E40AF", // Dark Blue
    accent: "#F59E0B", // Amber
    success: "#10B981", // Emerald
    warning: "#F59E0B", // Amber
    danger: "#EF4444", // Red
    muted: "#6B7280", // Gray
  };

  const realtorBrand = {
    colors: (user as any)?.realtor?.brandColors || defaultBrandColors,
    logo: (user as any)?.realtor?.logoUrl,
    businessName:
      (user as any)?.realtor?.businessName || "Your Real Estate Business",
    slug: (user as any)?.realtor?.slug || "yourbusiness",
  };

  return (
    <BrandProvider brand={realtorBrand}>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content Area */}
        <div
          className={`min-h-screen transition-all duration-300 ${
            sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
          }`}
        >
          {/* Top Bar */}
          <TopBar />

          {/* Page Content */}
          <main className="min-h-screen">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </main>
        </div>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
              onClick={() => setSidebarCollapsed(true)}
            />
          )}
        </AnimatePresence>
      </div>
    </BrandProvider>
  );
}
