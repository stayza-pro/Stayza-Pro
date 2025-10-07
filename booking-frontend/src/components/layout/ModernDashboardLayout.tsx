"use client";

import React, { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Home,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Shield,
  HelpCircle,
  Building2,
} from "lucide-react";
import Image from "next/image";
import { User as UserType } from "@/types";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

interface ModernDashboardLayoutProps {
  children: ReactNode;
  currentUser: UserType;
  activeRoute?: string;
  onRouteChange?: (route: string) => void;
}

export const ModernDashboardLayout: React.FC<ModernDashboardLayoutProps> = ({
  children,
  currentUser,
  activeRoute = "overview",
  onRouteChange,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      {
        id: "overview",
        label: "Overview",
        icon: LayoutDashboard,
        href: "/dashboard",
      },
    ];

    const roleSpecificItems = {
      ADMIN: [
        { id: "users", label: "Users", icon: Users, href: "/dashboard/users" },
        {
          id: "properties",
          label: "Properties",
          icon: Home,
          href: "/dashboard/properties",
        },
        {
          id: "bookings",
          label: "Bookings",
          icon: Calendar,
          href: "/dashboard/bookings",
        },
        {
          id: "realtor-management",
          label: "Realtor Management",
          icon: Users,
          href: "/dashboard/admin/realtor-management",
        },
        {
          id: "refunds-admin",
          label: "Refund Management",
          icon: DollarSign,
          href: "/dashboard/admin/refunds",
        },
        {
          id: "cac-verification",
          label: "CAC Verification",
          icon: Building2,
          href: "/dashboard/admin/cac-verification",
        },
        {
          id: "analytics",
          label: "Analytics",
          icon: BarChart3,
          href: "/dashboard/analytics",
        },
        {
          id: "revenue",
          label: "Revenue",
          icon: DollarSign,
          href: "/dashboard/revenue",
        },
      ],
      REALTOR: [
        {
          id: "properties",
          label: "My Properties",
          icon: Home,
          href: "/dashboard/properties",
        },
        {
          id: "bookings",
          label: "Bookings",
          icon: Calendar,
          href: "/dashboard/bookings",
        },
        {
          id: "review-moderation",
          label: "Review Moderation",
          icon: Shield,
          href: "/dashboard/realtor/reviews",
        },
        {
          id: "refunds-realtor",
          label: "Refund Requests",
          icon: DollarSign,
          href: "/dashboard/realtor/refunds",
        },
        {
          id: "revenue",
          label: "Revenue",
          icon: DollarSign,
          href: "/dashboard/revenue",
        },
        {
          id: "analytics",
          label: "Analytics",
          icon: BarChart3,
          href: "/dashboard/analytics",
        },
      ],
      GUEST: [
        {
          id: "bookings",
          label: "My Bookings",
          icon: Calendar,
          href: "/dashboard/bookings",
        },
        {
          id: "refunds-guest",
          label: "My Refunds",
          icon: DollarSign,
          href: "/dashboard/guest/refunds",
        },
        {
          id: "favorites",
          label: "Favorites",
          icon: Home,
          href: "/dashboard/favorites",
        },
      ],
    };

    const notificationsItem = {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      href: "/dashboard/notifications",
    };

    const settingsItem = {
      id: "settings",
      label: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
    };

    return [
      ...baseItems,
      ...(roleSpecificItems[currentUser.role] || []),
      notificationsItem,
      settingsItem,
    ];
  };

  const navigationItems = getNavigationItems();

  const sidebarVariants = {
    open: { width: 280, opacity: 1 },
    closed: { width: 80, opacity: 1 },
  };

  const menuItemVariants = {
    open: { opacity: 1, x: 0 },
    closed: { opacity: 0, x: -10 },
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="fixed inset-0 bg-gray-900/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              className="fixed top-0 left-0 h-full w-80 bg-white shadow-xl"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <MobileSidebar
                navigationItems={navigationItems}
                activeRoute={activeRoute}
                onRouteChange={onRouteChange}
                onClose={() => setMobileMenuOpen(false)}
                currentUser={currentUser}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        className="hidden lg:flex flex-col bg-white border-r border-gray-200 shadow-sm"
        variants={sidebarVariants}
        animate={sidebarOpen ? "open" : "closed"}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <motion.div
            className="flex items-center space-x-3"
            variants={menuItemVariants}
            animate={sidebarOpen ? "open" : "closed"}
          >
            {sidebarOpen && (
              <>
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">
                    Stayza Pro
                  </h1>
                  <p className="text-xs text-gray-500">Admin Dashboard</p>
                </div>
              </>
            )}
          </motion.div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onRouteChange?.(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all group relative ${
                  isActive
                    ? "bg-gray-800 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive
                      ? "text-blue-600"
                      : "text-gray-400 group-hover:text-gray-600"
                  }`}
                />

                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      className="font-medium truncate"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {isActive && (
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-1 bg-gray-800 rounded-r-full"
                    layoutId="activeIndicator"
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div
            className={`flex items-center ${
              sidebarOpen ? "space-x-3" : "justify-center"
            } p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer`}
          >
            <Image
              src={currentUser.avatar || "/default-avatar.png"}
              alt={`${currentUser.firstName} ${currentUser.lastName}`}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
            />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  className="flex-1 min-w-0"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {currentUser.firstName} {currentUser.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {currentUser.email}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-auto lg:mx-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search properties, users, bookings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <NotificationCenter />

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <Image
                    src={currentUser.avatar || "/default-avatar.png"}
                    alt={`${currentUser.firstName} ${currentUser.lastName}`}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <ChevronDown className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <Image
                            src={currentUser.avatar || "/default-avatar.png"}
                            alt={`${currentUser.firstName} ${currentUser.lastName}`}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {currentUser.firstName} {currentUser.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {currentUser.email}
                            </p>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                currentUser.role === "ADMIN"
                                  ? "bg-purple-100 text-purple-800"
                                  : currentUser.role === "REALTOR"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {currentUser.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        {[
                          {
                            icon: User,
                            label: "Profile",
                            href: "/dashboard/profile",
                          },
                          {
                            icon: Settings,
                            label: "Settings",
                            href: "/dashboard/settings",
                          },
                          {
                            icon: Shield,
                            label: "Security",
                            href: "/dashboard/security",
                          },
                          {
                            icon: HelpCircle,
                            label: "Help & Support",
                            href: "/help",
                          },
                        ].map((item) => (
                          <a
                            key={item.label}
                            href={item.href}
                            className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <item.icon className="w-4 h-4 text-gray-400" />
                            <span>{item.label}</span>
                          </a>
                        ))}
                      </div>

                      <div className="border-t border-gray-100 py-2">
                        <button className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full">
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

// Mobile Sidebar Component
const MobileSidebar: React.FC<{
  navigationItems: any[];
  activeRoute: string;
  onRouteChange?: (route: string) => void;
  onClose: () => void;
  currentUser: UserType;
}> = ({
  navigationItems,
  activeRoute,
  onRouteChange,
  onClose,
  currentUser,
}) => {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Stayza Pro</h1>
            <p className="text-xs text-gray-500">Admin Dashboard</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeRoute === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onRouteChange?.(item.id);
                onClose();
              }}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive ? "text-blue-600" : "text-gray-400"
                }`}
              />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
          <Image
            src={currentUser.avatar || "/default-avatar.png"}
            alt={`${currentUser.firstName} ${currentUser.lastName}`}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {currentUser.firstName} {currentUser.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {currentUser.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
