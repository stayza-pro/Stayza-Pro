"use client";

import React, { useState, useEffect, useRef } from "react";
import { apiClient } from "@/services/api";
import {
  User,
  Calendar,
  Heart,
  HelpCircle,
  LogOut,
  ChevronDown,
} from "lucide-react";

interface DynamicHeroSectionProps {
  agencyName: string;
  tagline: string;
  primaryColor: string;
  logo?: string;
  realtorId: string;
  description?: string;
  stats?: {
    totalProperties: number;
    totalGuests: number;
    totalReviews: number;
    averageRating: number;
  };
}

interface Stats {
  propertiesCount: number;
  averageRating: number;
  totalGuests: number;
}

export const DynamicHeroSection: React.FC<DynamicHeroSectionProps> = ({
  agencyName,
  tagline,
  primaryColor,
  logo,
  realtorId,
  description,
  stats: propStats,
}) => {
  const [stats, setStats] = useState<Stats>({
    propertiesCount: propStats?.totalProperties || 0,
    averageRating: propStats?.averageRating || 0,
    totalGuests: propStats?.totalGuests || 0,
  });

  // Search state
  const [searchLocation, setSearchLocation] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");

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
        console.error("Failed to parse user data:", error);
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

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    setIsAuthenticated(false);
    setShowUserMenu(false);
    window.location.reload();
  };

  useEffect(() => {
    // If stats are provided in props, use them
    if (propStats) {
      setStats({
        propertiesCount: propStats.totalProperties,
        averageRating: propStats.averageRating,
        totalGuests: propStats.totalGuests,
      });
      return;
    }

    // Otherwise fetch from API (fallback)
    const fetchStats = async () => {
      try {
        const response = await apiClient.get<any[]>(
          `/properties/host/${realtorId}`
        );
        const properties = response.data || [];
        const activeProperties = properties.filter(
          (p: any) => p.status === "ACTIVE"
        );

        // Calculate average rating
        const ratingsSum = activeProperties.reduce(
          (sum: number, p: any) => sum + (p.averageRating || 0),
          0
        );
        const avgRating =
          activeProperties.length > 0
            ? ratingsSum / activeProperties.length
            : 0;

        // Calculate total guests from review count (guests who left reviews)
        const totalGuestsSum = activeProperties.reduce(
          (sum: number, p: any) => sum + (p.reviewCount || 0),
          0
        );

        setStats({
          propertiesCount: activeProperties.length,
          averageRating: avgRating,
          totalGuests: totalGuestsSum,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    if (realtorId) {
      fetchStats();
    }
  }, [realtorId, propStats]);

  const heroGradient = `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`;
  const meshGradient = `linear-gradient(135deg, ${primaryColor}15, rgba(16, 185, 129, 0.1))`;

  return (
    <div
      className="relative min-h-[90vh] text-white overflow-hidden"
      style={{ background: heroGradient }}
    >
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-[3rem]" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-white/10 rounded-full blur-[2rem]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[37.5rem] h-[37.5rem] bg-white/5 rounded-full blur-[3rem]" />
      </div>

      {/* Header Navigation */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="flex items-center justify-between p-12">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[20px] overflow-hidden border-2 border-white/30 bg-white/10 backdrop-blur-[10px]">
              {logo && logo.trim() !== "" ? (
                <img
                  src={logo}
                  alt={`${agencyName} Logo`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-2xl">
                  {agencyName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold m-0">{agencyName}</h2>
              <p className="text-white/80 text-sm m-0">
                {tagline && tagline.trim() !== ""
                  ? tagline
                  : "Premium short-let properties"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              // User Menu
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-[10px] text-white rounded-full font-semibold border border-white/30 cursor-pointer text-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
                    <User size={16} />
                  </div>
                  <ChevronDown size={16} />
                </button>

                {showUserMenu && (
                  <div className="absolute top-[calc(100%+0.5rem)] right-0 min-w-[240px] bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-hidden z-50">
                    {/* User Info Header */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <div className="font-bold text-gray-800 mb-1">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-md">
                        GUEST
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <button
                        onClick={() =>
                          (window.location.href = "/guest/profile")
                        }
                        className="w-full flex items-center gap-3 p-3 bg-transparent border-none rounded-lg cursor-pointer text-sm font-medium text-gray-700 text-left transition-colors hover:bg-gray-100"
                      >
                        <User size={18} />
                        <span>Profile</span>
                      </button>

                      <button
                        onClick={() =>
                          (window.location.href = "/guest/bookings")
                        }
                        className="w-full flex items-center gap-3 p-3 bg-transparent border-none rounded-lg cursor-pointer text-sm font-medium text-gray-700 text-left transition-colors hover:bg-gray-100"
                      >
                        <Calendar size={18} />
                        <span>Bookings</span>
                      </button>

                      <button
                        onClick={() =>
                          (window.location.href = "/guest/favorites")
                        }
                        className="w-full flex items-center gap-3 p-3 bg-transparent border-none rounded-lg cursor-pointer text-sm font-medium text-gray-700 text-left transition-colors hover:bg-gray-100"
                      >
                        <Heart size={18} />
                        <span>Favourites</span>
                      </button>

                      <button
                        onClick={() => (window.location.href = "/help")}
                        className="w-full flex items-center gap-3 p-3 bg-transparent border-none rounded-lg cursor-pointer text-sm font-medium text-gray-700 text-left transition-colors hover:bg-gray-100"
                      >
                        <HelpCircle size={18} />
                        <span>Help & Support</span>
                      </button>
                    </div>

                    {/* Sign Out */}
                    <div className="p-2 border-t border-gray-200">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-3 bg-transparent border-none rounded-lg cursor-pointer text-sm font-semibold text-red-600 text-left transition-colors hover:bg-red-50"
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
                  className="px-6 py-3 bg-white/10 backdrop-blur-[10px] text-white rounded-xl font-semibold border border-white/30 cursor-pointer text-sm"
                  onClick={() => (window.location.href = "/guest/login")}
                >
                  Login
                </button>
                <button
                  className="px-6 py-3 bg-white text-gray-800 rounded-xl font-semibold border-none shadow-[0_10px_25px_rgba(0,0,0,0.1)] cursor-pointer text-sm"
                  onClick={() => (window.location.href = "/guest/register")}
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 grid grid-cols-[1fr_auto] gap-12 items-center min-h-[90vh] p-12 max-w-[1400px] mx-auto">
        {/* Left Content */}
        <div className="max-w-[600px] pt-24">
          <div className="inline-block px-4 py-2 bg-white/10 my-4 backdrop-blur-[10px] rounded-full border border-white/20 text-sm font-medium">
            🏆 Premium Short-Let Specialist
          </div>

          <h1 className="text-6xl font-bold leading-tight mb-6 m-0">
            Find Your Perfect Stay
          </h1>

          {/* Dynamic Stats */}
          <div className="grid grid-cols-3 gap-8 mb-8 py-8 border-b border-white/10">
            <div className="text-center">
              <div className="text-[2.5rem] font-bold mb-2">
                {stats.propertiesCount}+
              </div>
              <div className="text-white/70 text-sm">Properties</div>
            </div>
            <div className="text-center">
              <div className="text-[2.5rem] font-bold mb-2">
                {stats.totalGuests}
              </div>
              <div className="text-white/70 text-sm">Happy Guests</div>
            </div>
            <div className="text-center">
              <div className="text-[2.5rem] font-bold mb-2">
                {stats.averageRating > 0
                  ? `${stats.averageRating.toFixed(1)}★`
                  : "0★"}
              </div>
              <div className="text-white/70 text-sm">Avg Rating</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4 mb-12">
            <button
              className="px-8 py-4 bg-white text-gray-800 rounded-2xl font-semibold border-none text-lg shadow-[0_20px_40px_rgba(0,0,0,0.1)] cursor-pointer translate-y-0 transition-all duration-200 hover:translate-y-[-2px] hover:shadow-[0_25px_50px_rgba(0,0,0,0.15)]"
              onClick={() => {
                const propertiesSection = document.getElementById("properties");
                if (propertiesSection) {
                  propertiesSection.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              Explore Properties
            </button>
            <button
              className="px-8 py-4 bg-white/10 backdrop-blur-[10px] text-white rounded-2xl font-semibold border border-white/20 text-lg cursor-pointer"
              onClick={() => {
                const aboutSection = document.getElementById("about");
                if (aboutSection) {
                  aboutSection.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Right Content - Search Card */}
        <div className="w-[400px]">
          <div
            style={{ background: meshGradient }}
            className="backdrop-blur-[20px] border border-white/20 rounded-3xl p-8 shadow-[0_25px_50px_rgba(0,0,0,0.1)]"
          >
            <h3 className="text-2xl font-bold text-center mb-8 m-0">
              Book Your Stay
            </h3>

            <div className="flex flex-col gap-6">
              <div>
                <label className="block font-medium mb-2 text-white/90 text-sm">
                  Location
                </label>
                <input
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full p-4 bg-white/10 backdrop-blur-[10px] border border-white/20 rounded-xl text-white text-sm box-border placeholder:text-white/50"
                  placeholder="Where would you like to stay?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-2 text-white/90 text-sm">
                    Check In
                  </label>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full p-4 bg-white/10 backdrop-blur-[10px] border border-white/20 rounded-xl text-white text-sm box-border [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2 text-white/90 text-sm">
                    Check Out
                  </label>
                  <input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    min={checkInDate || new Date().toISOString().split("T")[0]}
                    className="w-full p-4 bg-white/10 backdrop-blur-[10px] border border-white/20 rounded-xl text-white text-sm box-border [color-scheme:dark]"
                  />
                </div>
              </div>

              <button
                className="w-full px-6 py-4 bg-white text-gray-800 rounded-xl font-semibold border-none text-base shadow-[0_10px_25px_rgba(0,0,0,0.1)] cursor-pointer mt-2"
                onClick={() => {
                  // Build search query string
                  const params = new URLSearchParams();
                  if (searchLocation) params.append("location", searchLocation);
                  if (checkInDate) params.append("checkIn", checkInDate);
                  if (checkOutDate) params.append("checkOut", checkOutDate);

                  // Scroll to properties section and trigger filter event
                  const propertiesSection =
                    document.getElementById("properties");
                  if (propertiesSection) {
                    // Store search params for the properties section to use
                    window.dispatchEvent(
                      new CustomEvent("propertySearch", {
                        detail: {
                          location: searchLocation,
                          checkIn: checkInDate,
                          checkOut: checkOutDate,
                        },
                      })
                    );

                    propertiesSection.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                Search Properties
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
