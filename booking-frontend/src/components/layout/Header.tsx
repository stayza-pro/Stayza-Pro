"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../ui";
import { useAuthStore } from "../../store/authStore";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export const Header: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Get realtor branding
  const { brandColor, realtorName, logoUrl } = useRealtorBranding();

  // Add scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {}
  };

  const getDashboardLink = () => {
    if (!user) return "/dashboard";

    switch (user.role) {
      case "ADMIN":
        return "/admin";
      case "REALTOR":
        return "/realtor";
      case "GUEST":
        return "/guest";
      default:
        return "/dashboard";
    }
  };

  return (
    <header
      className={`bg-white border-b border-gray-200 transition-all duration-300 sticky top-0 z-50 ${
        isScrolled ? "shadow-md" : "shadow-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/guest-landing" className="flex items-center space-x-2">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={realtorName}
                  className="w-8 h-8 rounded-lg object-cover"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: brandColor }}
                >
                  <span className="text-white font-bold text-lg">
                    {realtorName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-xl font-bold text-gray-900">
                {realtorName}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/guest/browse"
              className="transition-colors hover:opacity-80"
              style={{ color: brandColor }}
            >
              Browse Properties
            </Link>
            {isAuthenticated && user?.role === "REALTOR" && (
              <Link
                href="/realtor/properties"
                className="transition-colors hover:opacity-80"
                style={{ color: brandColor }}
              >
                My Properties
              </Link>
            )}
            <Link
              href="/how-it-works"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              How it Works
            </Link>
            <Link
              href="/guest/help"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Help
            </Link>
          </nav>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {/* Become a Host */}
                {user?.role === "GUEST" && (
                  <Link
                    href="/become-host"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Become a Host
                  </Link>
                )}

                {/* Notification Bell */}
                <NotificationBell
                  iconColor={brandColor}
                  viewAllHref={
                    user?.role === "GUEST"
                      ? "/guest/messages"
                      : "/notifications"
                  }
                />

                {/* User Menu */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors">
                    {user?.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={`${user.firstName} ${user.lastName}`}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: brandColor }}
                      >
                        <span className="text-white text-sm font-medium">
                          {user?.firstName?.charAt(0) || "U"}
                        </span>
                      </div>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-1">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {user?.email}
                      </p>
                    </div>

                    <Link
                      href={getDashboardLink()}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                      Dashboard
                    </Link>

                    <Link
                      href={
                        user?.role === "REALTOR"
                          ? "/realtor/profile"
                          : "/guest/profile"
                      }
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Profile Settings
                    </Link>

                    {user?.role === "REALTOR" && (
                      <>
                        <Link
                          href="/realtor/bookings"
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          My Bookings
                        </Link>
                        <Link
                          href="/realtor/properties"
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          My Properties
                        </Link>
                      </>
                    )}

                    {user?.role === "GUEST" && (
                      <>
                        <Link
                          href="/guest/profile"
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Profile
                        </Link>
                        <Link
                          href="/guest/bookings"
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          My Bookings
                        </Link>
                        <Link
                          href="/guest/favorites"
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Favourites
                        </Link>
                        <Link
                          href="/guest/bookings"
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          History
                        </Link>
                        <Link
                          href="/guest/messages"
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Messages
                        </Link>
                        <Link
                          href="/guest/messages"
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Notifications
                        </Link>
                      </>
                    )}

                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/guest/login"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Sign In
                </Link>
                <Button variant="primary" size="sm">
                  <Link href="/guest/register">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              <Link
                href="/guest/browse"
                className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
              >
                Browse Properties
              </Link>

              {isAuthenticated && user?.role === "REALTOR" && (
                <Link
                  href="/realtor/properties"
                  className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                >
                  My Properties
                </Link>
              )}

              <Link
                href="/how-it-works"
                className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
              >
                How it Works
              </Link>

              <Link
                href="/guest/help"
                className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
              >
                Help
              </Link>

              {isAuthenticated ? (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="px-4 pb-2">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>

                  <Link
                    href={getDashboardLink()}
                    className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    Dashboard
                  </Link>

                  <Link
                    href={
                      user?.role === "REALTOR"
                        ? "/realtor/profile"
                        : "/guest/profile"
                    }
                    className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    Profile Settings
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
                  <Link
                    href="/guest/login"
                    className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/guest/register"
                    className="block px-4 py-2 font-medium rounded-md transition-colors"
                    style={{
                      color: brandColor,
                      backgroundColor: `${brandColor}10`,
                    }}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
