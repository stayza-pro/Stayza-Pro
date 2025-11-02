"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Building2,
  Calendar,
  Star,
  RefreshCcw,
  TrendingUp,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useBrand } from "../context/BrandContext";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: string;
}

const navigationItems: NavItem[] = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: Building2, label: "My Properties", href: "/dashboard/properties" },
  {
    icon: Calendar,
    label: "Bookings",
    href: "/dashboard/bookings",
    badge: "3",
  },
  { icon: Star, label: "Reviews", href: "/dashboard/reviews" },
  { icon: RefreshCcw, label: "Refunds", href: "/dashboard/refunds" },
  { icon: TrendingUp, label: "Revenue", href: "/dashboard/revenue" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { brand } = useBrand();

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-40 shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center space-x-3"
            >
              {brand.logo ? (
                <img
                  src={brand.logo}
                  alt={brand.businessName}
                  className="w-8 h-8 rounded-lg object-cover"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: brand.colors.primary }}
                >
                  {brand.businessName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="font-semibold text-gray-900 truncate max-w-[140px]">
                  {brand.businessName}
                </h2>
              </div>
            </motion.div>
          )}

          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navigationItems.map((item, index) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <motion.button
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleNavigation(item.href)}
                className={`w-full flex items-center px-3 py-3 rounded-xl text-left transition-all duration-200 group relative ${
                  isActive
                    ? "text-white shadow-lg transform scale-[1.02]"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
                style={{
                  backgroundColor: isActive
                    ? brand.colors.primary
                    : "transparent",
                }}
              >
                <Icon
                  className={`w-5 h-5 ${collapsed ? "mx-auto" : "mr-3"} ${
                    isActive
                      ? "text-white"
                      : "text-gray-500 group-hover:text-gray-700"
                  }`}
                />

                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-medium truncate"
                  >
                    {item.label}
                  </motion.span>
                )}

                {!collapsed && item.badge && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="ml-auto px-2 py-1 text-xs font-medium rounded-full"
                    style={{
                      backgroundColor: isActive
                        ? "rgba(255,255,255,0.2)"
                        : brand.colors.accent,
                      color: isActive ? "white" : "white",
                    }}
                  >
                    {item.badge}
                  </motion.span>
                )}

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-16 bg-gray-900 text-white px-2 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <p className="text-xs text-gray-500">
                Powered by{" "}
                <span
                  className="font-semibold"
                  style={{ color: brand.colors.primary }}
                >
                  Stayza Pro
                </span>
              </p>
            </motion.div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
