"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { apiClient } from "@/services/api";
import {
  User,
  Calendar,
  MessageCircle,
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

interface HostPropertySummary {
  status?: string;
  averageRating?: number;
  reviewCount?: number;
}

interface AuthenticatedUser {
  firstName?: string;
  lastName?: string;
  email?: string;
}

const toPropertyArray = (payload: unknown): HostPropertySummary[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const typedPayload = payload as {
      properties?: HostPropertySummary[];
      data?: HostPropertySummary[];
    };
    if (Array.isArray(typedPayload.properties)) {
      return typedPayload.properties;
    }
    if (Array.isArray(typedPayload.data)) {
      return typedPayload.data;
    }
  }

  return [];
};

export const DynamicHeroSection: React.FC<DynamicHeroSectionProps> = ({
  agencyName,
  tagline,
  primaryColor,
  logo,
  realtorId,
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
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sticky navbar state
  const [isScrolled, setIsScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Check authentication status
  useEffect(() => {
    const userData = localStorage.getItem("user");
    const accessToken = localStorage.getItem("accessToken");

    if (userData && accessToken) {
      try {
        const parsedUser = JSON.parse(userData) as AuthenticatedUser;
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        
      }
    }
  }, []);

  // Handle scroll for sticky navbar
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const heroBottom = heroRef.current.offsetHeight - 100;
        setIsScrolled(window.scrollY > heroBottom);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
        const response = await apiClient.get<HostPropertySummary[]>(
          `/properties/host/${realtorId}`
        );
        const properties = toPropertyArray(response.data);
        const activeProperties = properties.filter(
          (property) => property.status === "ACTIVE"
        );

        // Calculate average rating
        const ratingsSum = activeProperties.reduce(
          (sum, property) => sum + (property.averageRating || 0),
          0
        );
        const avgRating =
          activeProperties.length > 0
            ? ratingsSum / activeProperties.length
            : 0;

        // Calculate total guests from review count (guests who left reviews)
        const totalGuestsSum = activeProperties.reduce(
          (sum, property) => sum + (property.reviewCount || 0),
          0
        );

        setStats({
          propertiesCount: activeProperties.length,
          averageRating: avgRating,
          totalGuests: totalGuestsSum,
        });
      } catch (error) {
        
      }
    };

    if (realtorId) {
      fetchStats();
    }
  }, [realtorId, propStats]);

  const heroGradient = `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`;
  const meshGradient = `linear-gradient(135deg, ${primaryColor}15, rgba(16, 185, 129, 0.1))`;

  // Navbar component - can be used in hero and sticky
  const NavbarContent = ({ isSticky = false }: { isSticky?: boolean }) => (
    <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8 max-w-[1400px] mx-auto transition-all duration-500 ease-out">
      <div className="flex items-center gap-3 sm:gap-5 min-w-0">
        <div
          className={`w-11 h-11 sm:w-14 sm:h-14 rounded-2xl overflow-hidden transition-all duration-500 ease-out shrink-0 ${
            isSticky
              ? "border-2 shadow-md hover:shadow-lg"
              : "border-2 border-white/30 bg-white/10 backdrop-blur-[10px] hover:border-white/50"
          }`}
          style={isSticky ? { borderColor: `${primaryColor}40` } : undefined}
        >
          {logo && logo.trim() !== "" ? (
            <Image
              src={logo}
              alt={`${agencyName} Logo`}
              width={56}
              height={56}
              unoptimized
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center font-bold text-base sm:text-xl transition-all duration-500 ${
                isSticky ? "text-white" : ""
              }`}
              style={isSticky ? { backgroundColor: primaryColor } : undefined}
            >
              {agencyName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="transition-all duration-500 min-w-0">
          <h2
            className={`text-base sm:text-xl font-bold m-0 transition-all duration-500 truncate ${
              isSticky ? "" : "text-white"
            }`}
            style={isSticky ? { color: primaryColor } : undefined}
          >
            {agencyName}
          </h2>
          <p
            className={`hidden sm:block text-sm m-0 transition-all duration-500 truncate ${
              isSticky ? "text-gray-600" : "text-white/80"
            }`}
          >
            {tagline && tagline.trim() !== ""
              ? tagline
              : "Premium short-let properties"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 ml-2">
        {isAuthenticated && user ? (
          // User Menu
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3 rounded-full font-semibold border cursor-pointer text-xs sm:text-sm transition-all duration-300 ease-out ${
                isSticky
                  ? "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-md shadow-sm"
                  : "bg-white/10 backdrop-blur-[10px] text-white border-white/30 hover:bg-white/20 hover:border-white/40"
              }`}
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  isSticky ? "text-white" : "bg-white/20"
                }`}
                style={isSticky ? { backgroundColor: primaryColor } : undefined}
              >
                <User size={16} />
              </div>
              <ChevronDown
                size={16}
                className="transition-transform duration-300"
              />
            </button>

            {showUserMenu && (
              <div className="absolute top-[calc(100%+0.75rem)] right-0 min-w-[240px] sm:min-w-[260px] max-w-[90vw] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
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
                    onClick={() => (window.location.href = "/guest/favorites")}
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
                    onClick={() => (window.location.href = "/guest/messages")}
                    className="w-full flex items-center gap-3 p-3.5 bg-transparent border-none rounded-xl cursor-pointer text-sm font-medium text-gray-700 text-left transition-all duration-200 hover:bg-gray-50"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${primaryColor}10`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <MessageCircle size={18} style={{ color: primaryColor }} />
                    <span>Messages</span>
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
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold border cursor-pointer text-xs sm:text-sm transition-all duration-300 ease-out transform ${
                isSticky
                  ? "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-md shadow-sm hover:scale-105"
                  : "bg-white/10 backdrop-blur-[10px] text-white border-white/30 hover:bg-white/20 hover:border-white/40 hover:scale-105"
              }`}
              onClick={() => (window.location.href = "/guest/login")}
            >
              Login
            </button>
            <button
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold border-none cursor-pointer text-xs sm:text-sm transition-all duration-300 ease-out transform hover:scale-105 ${
                isSticky
                  ? "text-white shadow-md hover:shadow-xl"
                  : "bg-white text-gray-800 shadow-[0_10px_25px_rgba(0,0,0,0.1)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.15)]"
              }`}
              style={isSticky ? { backgroundColor: primaryColor } : undefined}
              onClick={() => (window.location.href = "/guest/register")}
            >
              Sign up
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Sticky Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ease-out backdrop-blur-md ${
          isScrolled
            ? "translate-y-0 opacity-100 bg-white/95 shadow-lg"
            : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <NavbarContent isSticky={true} />
      </nav>

      {/* Hero Section */}
      <div
        ref={heroRef}
        id="hero"
        className="relative min-h-[90vh] text-white overflow-hidden"
        style={{ background: heroGradient }}
      >
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-16 right-4 sm:right-10 lg:right-20 w-56 h-56 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-white/5 rounded-full blur-[3rem]" />
          <div className="absolute bottom-10 left-4 sm:left-10 lg:left-20 w-44 h-44 sm:w-64 sm:h-64 lg:w-80 lg:h-80 bg-white/10 rounded-full blur-[2rem]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-[28rem] sm:h-[28rem] lg:w-[37.5rem] lg:h-[37.5rem] bg-white/5 rounded-full blur-[3rem]" />
        </div>

        {/* Header Navigation in Hero */}
        <div className="absolute top-0 left-0 right-0 z-20">
          <NavbarContent isSticky={false} />
        </div>

        {/* Main Content */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_24rem] gap-8 lg:gap-12 items-start lg:items-center min-h-[90vh] px-4 sm:px-6 lg:px-12 pt-28 sm:pt-32 lg:pt-24 pb-10 max-w-[1400px] mx-auto">
          {/* Left Content */}
          <div className="max-w-[600px]">
            <div className="inline-block px-3 sm:px-4 py-2 bg-white/10 my-4 backdrop-blur-[10px] rounded-full border border-white/20 text-xs sm:text-sm font-medium">
              🏆 Premium Short-Let Specialist
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 m-0">
              Find Your Perfect Stay
            </h1>

            {/* Dynamic Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-8 mb-8 py-6 sm:py-8 border-b border-white/10">
              <div className="text-center">
                <div className="text-3xl sm:text-[2.5rem] font-bold mb-2">
                  {stats.propertiesCount}+
                </div>
                <div className="text-white/70 text-xs sm:text-sm">Properties</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-[2.5rem] font-bold mb-2">
                  {stats.totalGuests}
                </div>
                <div className="text-white/70 text-xs sm:text-sm">Happy Guests</div>
              </div>
              <div className="text-center col-span-2 sm:col-span-1">
                <div className="text-3xl sm:text-[2.5rem] font-bold mb-2">
                  {stats.averageRating > 0
                    ? `${stats.averageRating.toFixed(1)}★`
                    : "0★"}
                </div>
                <div className="text-white/70 text-xs sm:text-sm">Avg Rating</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12">
              <button
                className="px-6 sm:px-8 py-3.5 sm:py-4 bg-white text-gray-800 rounded-2xl font-semibold border-none text-base sm:text-lg shadow-[0_20px_40px_rgba(0,0,0,0.1)] cursor-pointer translate-y-0 transition-all duration-200 hover:translate-y-[-2px] hover:shadow-[0_25px_50px_rgba(0,0,0,0.15)]"
                onClick={() => {
                  const propertiesSection =
                    document.getElementById("properties");
                  if (propertiesSection) {
                    propertiesSection.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                Explore Properties
              </button>
              <button
                className="px-6 sm:px-8 py-3.5 sm:py-4 bg-white/10 backdrop-blur-[10px] text-white rounded-2xl font-semibold border border-white/20 text-base sm:text-lg cursor-pointer"
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
          <div className="w-full lg:w-[400px] max-w-[420px] mx-auto lg:mx-0">
            <div
              style={{ background: meshGradient }}
              className="backdrop-blur-[20px] border border-white/20 rounded-3xl p-5 sm:p-8 shadow-[0_25px_50px_rgba(0,0,0,0.1)]"
            >
              <h3 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8 m-0">
                Book Your Stay
              </h3>

              <div className="flex flex-col gap-5 sm:gap-6">
                <div>
                  <label className="block font-medium mb-2 text-white/90 text-sm">
                    Location
                  </label>
                  <input
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full p-3.5 sm:p-4 bg-white/10 backdrop-blur-[10px] border border-white/20 rounded-xl text-white text-sm box-border placeholder:text-white/50"
                    placeholder="Where would you like to stay?"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium mb-2 text-white/90 text-sm">
                      Check In
                    </label>
                    <input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full p-3.5 sm:p-4 bg-white/10 backdrop-blur-[10px] border border-white/20 rounded-xl text-white text-sm box-border [color-scheme:dark]"
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
                      min={
                        checkInDate || new Date().toISOString().split("T")[0]
                      }
                      className="w-full p-3.5 sm:p-4 bg-white/10 backdrop-blur-[10px] border border-white/20 rounded-xl text-white text-sm box-border [color-scheme:dark]"
                    />
                  </div>
                </div>

                <button
                  className="w-full px-6 py-3.5 sm:py-4 bg-white text-gray-800 rounded-xl font-semibold border-none text-sm sm:text-base shadow-[0_10px_25px_rgba(0,0,0,0.1)] cursor-pointer mt-2"
                  onClick={() => {
                    // Build search query string
                    const params = new URLSearchParams();
                    if (searchLocation)
                      params.append("location", searchLocation);
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
    </>
  );
};
