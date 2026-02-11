"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  User,
  Calendar,
  Heart,
  Bell,
  HelpCircle,
  LogOut,
  ChevronDown,
} from "lucide-react";

interface GuestNavbarProps {
  agencyName: string;
  tagline: string;
  primaryColor: string;
  logo?: string;
  isSticky?: boolean;
}

export const GuestNavbar: React.FC<GuestNavbarProps> = ({
  agencyName,
  tagline,
  primaryColor,
  logo,
  isSticky = true,
}) => {
  // User authentication state
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Check authentication status
  useEffect(() => {
    const userData = localStorage.getItem("user");
    const accessToken = localStorage.getItem("accessToken");

    if (userData && accessToken) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        
      }
    }
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      
    } finally {
      // Clear local storage regardless of API call result
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
      setIsAuthenticated(false);
      setShowUserMenu(false);
      window.location.href = "/";
    }
  };

  return (
    <nav
      className={`${
        isSticky ? "sticky" : ""
      } top-0 left-0 right-0 z-[60] transition-all duration-500 ease-out backdrop-blur-md bg-white/95 shadow-lg`}
    >
      <div className="flex items-center justify-between px-8 py-4 max-w-[1400px] mx-auto transition-all duration-500 ease-out">
        <div className="flex items-center gap-5">
          <div
            className="w-14 h-14 rounded-2xl overflow-hidden transition-all duration-500 ease-out border-2 shadow-md hover:shadow-lg"
            style={{ borderColor: `${primaryColor}40` }}
          >
            <Link href="/">
              {logo && logo.trim() !== "" ? (
                <img
                  src={logo}
                  alt={`${agencyName} Logo`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center font-bold text-xl text-white transition-all duration-500"
                  style={{ backgroundColor: primaryColor }}
                >
                  {agencyName.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
          </div>
          <div className="transition-all duration-500">
            <h2
              className="text-xl font-bold m-0 transition-all duration-500"
              style={{ color: primaryColor }}
            >
              {agencyName}
            </h2>
            <p className="text-sm m-0 text-gray-600 transition-all duration-500">
              {tagline && tagline.trim() !== ""
                ? tagline
                : "Premium short-let properties"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            // User Menu
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-5 py-3 rounded-full font-semibold border cursor-pointer text-sm transition-all duration-300 ease-out bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-md shadow-sm"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white transition-all duration-300"
                  style={{ backgroundColor: primaryColor }}
                >
                  <User size={16} />
                </div>
                <ChevronDown
                  size={16}
                  className="transition-transform duration-300"
                />
              </button>

              {showUserMenu && (
                <div className="absolute top-[calc(100%+0.75rem)] right-0 min-w-[260px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* User Info Header */}
                  <div
                    className="p-5 border-b transition-colors duration-300"
                    style={{
                      borderColor: `${primaryColor}15`,
                      background: `linear-gradient(135deg, ${primaryColor}05, ${primaryColor}10)`,
                    }}
                  >
                    <div className="font-bold text-gray-800 mb-1">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {user.email}
                    </div>
                    <div
                      className="inline-block mt-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300"
                      style={{
                        backgroundColor: `${primaryColor}20`,
                        color: primaryColor,
                      }}
                    >
                      GUEST
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    <button
                      onClick={() => (window.location.href = "/guest/profile")}
                      className="w-full flex items-center gap-3 p-3.5 bg-transparent border-none rounded-xl cursor-pointer text-sm font-medium text-gray-700 text-left transition-all duration-200 hover:bg-gray-50"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${primaryColor}10`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <User size={18} style={{ color: primaryColor }} />
                      <span>Profile</span>
                    </button>

                    <button
                      onClick={() => (window.location.href = "/guest/bookings")}
                      className="w-full flex items-center gap-3 p-3.5 bg-transparent border-none rounded-xl cursor-pointer text-sm font-medium text-gray-700 text-left transition-all duration-200 hover:bg-gray-50"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${primaryColor}10`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <Calendar size={18} style={{ color: primaryColor }} />
                      <span>Bookings</span>
                    </button>

                    <button
                      onClick={() =>
                        (window.location.href = "/guest/favorites")
                      }
                      className="w-full flex items-center gap-3 p-3.5 bg-transparent border-none rounded-xl cursor-pointer text-sm font-medium text-gray-700 text-left transition-all duration-200 hover:bg-gray-50"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${primaryColor}10`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <Heart size={18} style={{ color: primaryColor }} />
                      <span>Favourites</span>
                    </button>

                    <button
                      onClick={() =>
                        (window.location.href = "/guest/notifications")
                      }
                      className="w-full flex items-center gap-3 p-3.5 bg-transparent border-none rounded-xl cursor-pointer text-sm font-medium text-gray-700 text-left transition-all duration-200 hover:bg-gray-50"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${primaryColor}10`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <Bell size={18} style={{ color: primaryColor }} />
                      <span>Notifications</span>
                    </button>

                    <button
                      onClick={() => (window.location.href = "/help")}
                      className="w-full flex items-center gap-3 p-3.5 bg-transparent border-none rounded-xl cursor-pointer text-sm font-medium text-gray-700 text-left transition-all duration-200 hover:bg-gray-50"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${primaryColor}10`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <HelpCircle size={18} style={{ color: primaryColor }} />
                      <span>Help & Support</span>
                    </button>
                  </div>

                  {/* Sign Out */}
                  <div className="p-2 border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 p-3.5 bg-transparent border-none rounded-xl cursor-pointer text-sm font-semibold text-red-600 text-left transition-all duration-200 hover:bg-red-50"
                    >
                      <LogOut size={18} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Login/Signup Buttons (when not authenticated)
            <>
              <button
                className="px-6 py-3 rounded-xl font-semibold border cursor-pointer text-sm transition-all duration-300 ease-out transform bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-md shadow-sm hover:scale-105"
                onClick={() => (window.location.href = "/guest/login")}
              >
                Login
              </button>
              <button
                className="px-6 py-3 rounded-xl font-semibold border-none cursor-pointer text-sm transition-all duration-300 ease-out transform hover:scale-105 text-white shadow-md hover:shadow-xl"
                style={{ backgroundColor: primaryColor }}
                onClick={() => (window.location.href = "/guest/register")}
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
