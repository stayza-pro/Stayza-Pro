"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Users,
  Filter,
  Search,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
  Home,
  MessageCircle,
} from "lucide-react";
import { Card, Button, Input } from "@/components/ui";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { useQuery } from "react-query";
import { bookingService } from "@/services";
import { Footer } from "@/components/guest/sections";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { BookingStatus, Booking } from "@/types";
import Image from "next/image";

type FilterTab = "all" | "upcoming" | "past" | "cancelled";

export default function GuestBookingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useCurrentUser();
  const {
    brandColor: primaryColor, // 60% - Primary brand color (strategic use for CTAs and key elements)
    secondaryColor, // 30% - Secondary color (status indicators, icons)
    accentColor, // 10% - Accent color (highlights, pending states)
    realtorName,
    logoUrl,
    tagline,
    description,
  } = useRealtorBranding();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  // Fetch bookings
  const {
    data: bookingsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["guest-bookings"],
    queryFn: () => bookingService.getUserBookings(),
    enabled: !!user,
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    onError: (error: any) => {
      console.error("Failed to fetch bookings:", error);
      // If it's an auth error, the user will be redirected by the useEffect above
    },
  });

  // Mark auth as checked once we've gotten a result
  React.useEffect(() => {
    if (!authLoading && (isAuthenticated || !authChecked)) {
      setAuthChecked(true);
    }
  }, [authLoading, isAuthenticated, authChecked]);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (authChecked && !authLoading && !isAuthenticated) {
      router.push("/guest/login?returnTo=/guest/bookings");
    }
  }, [authLoading, isAuthenticated, authChecked, router]);

  // Handle authentication errors from API
  React.useEffect(() => {
    if (error?.response?.status === 401) {
      router.push("/guest/login?returnTo=/guest/bookings");
    }
  }, [error, router]);

  // Show loading state while checking authentication
  if (!authChecked || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const bookings = bookingsData?.data || [];

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter((booking: Booking) => {
    const now = new Date();
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);

    // Apply tab filter
    if (activeTab === "upcoming") {
      if (booking.status === "CANCELLED") return false;
      return checkIn > now || (checkIn <= now && checkOut >= now);
    } else if (activeTab === "past") {
      return checkOut < now && booking.status !== "CANCELLED";
    } else if (activeTab === "cancelled") {
      return booking.status === "CANCELLED";
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const title = booking.property?.title?.toLowerCase() || "";
      const location =
        `${booking.property?.city} ${booking.property?.state}`.toLowerCase();
      return title.includes(query) || location.includes(query);
    }

    return true;
  });

  const getStatusConfig = (status: BookingStatus) => {
    switch (status) {
      case "CONFIRMED":
        return {
          icon: CheckCircle,
          text: "Confirmed",
          className: "border",
          bgColor: `${secondaryColor || "#059669"}15`,
          textColor: secondaryColor || "#059669",
          borderColor: `${secondaryColor || "#059669"}30`,
        };
      case "PENDING":
        return {
          icon: Clock,
          text: "Pending",
          className: "border",
          bgColor: `${accentColor || "#D97706"}15`,
          textColor: accentColor || "#D97706",
          borderColor: `${accentColor || "#D97706"}30`,
        };
      case "CANCELLED":
        return {
          icon: XCircle,
          text: "Cancelled",
          className: "border",
          bgColor: "#DC262615",
          textColor: "#DC2626",
          borderColor: "#DC262630",
        };
      case "COMPLETED":
        return {
          icon: CheckCircle,
          text: "Completed",
          className: "border",
          bgColor: `${primaryColor}15`, // Lighter touch - primary for completed
          textColor: primaryColor,
          borderColor: `${primaryColor}30`,
        };
      default:
        return {
          icon: Clock,
          text: status,
          className: "border",
          bgColor: "#6B728015",
          textColor: "#6B7280",
          borderColor: "#6B728030",
        };
    }
  };

  const isOngoing = (booking: any) => {
    const now = new Date();
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    return checkIn <= now && checkOut >= now && booking.status === "CONFIRMED";
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPrice = (price: number, currency: string = "NGN") => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const calculateNights = (checkIn: Date | string, checkOut: Date | string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GuestHeader
          currentPage="bookings"
          searchPlaceholder="Search your bookings..."
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
        <Footer
          realtorName={realtorName}
          tagline={tagline}
          logo={logoUrl}
          description={description}
          primaryColor={primaryColor}
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col"
      style={{ colorScheme: "light" }}
    >
      <GuestHeader
        currentPage="bookings"
        searchPlaceholder="Search your bookings..."
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Clean Header Section */}
        <div className="mb-16 text-center">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-lg mb-8"
            style={{ backgroundColor: `${primaryColor}15` }} // Lighter touch - primary for key icon
          >
            <Calendar
              className="h-8 w-8"
              style={{ color: primaryColor }} // Lighter touch - primary for key icon
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            My Bookings
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage your reservations and track your stays
          </p>
        </div>

        {/* Stats Overview */}
        {bookings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <Card
              className="p-6 text-center border border-gray-200 !bg-white hover:shadow-md transition-shadow duration-200"
              style={{ backgroundColor: "#ffffff", color: "#111827" }}
            >
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4"
                style={{ backgroundColor: `${primaryColor}15` }} // Lighter touch - primary for stat icon
              >
                <Home
                  className="h-6 w-6"
                  style={{ color: primaryColor }} // Lighter touch - primary for stat icon
                />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {bookings.length}
              </p>
              <p className="text-sm text-gray-600">Total Bookings</p>
            </Card>

            <Card
              className="p-6 text-center border border-gray-200 !bg-white hover:shadow-md transition-shadow duration-200"
              style={{ backgroundColor: "#ffffff", color: "#111827" }}
            >
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4"
                style={{ backgroundColor: `${secondaryColor || "#059669"}15` }}
              >
                <CheckCircle
                  className="h-6 w-6"
                  style={{ color: secondaryColor || "#059669" }}
                />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {
                  bookings.filter(
                    (b: Booking) =>
                      b.status === "CONFIRMED" || b.status === "COMPLETED"
                  ).length
                }
              </p>
              <p className="text-sm text-gray-600">Confirmed</p>
            </Card>

            <Card
              className="p-6 text-center border border-gray-200 !bg-white hover:shadow-md transition-shadow duration-200"
              style={{ backgroundColor: "#ffffff", color: "#111827" }}
            >
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4"
                style={{ backgroundColor: `${accentColor || "#D97706"}15` }}
              >
                <Clock
                  className="h-6 w-6"
                  style={{ color: accentColor || "#D97706" }}
                />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {bookings.filter((b: Booking) => b.status === "PENDING").length}
              </p>
              <p className="text-sm text-gray-600">Pending</p>
            </Card>

            <Card
              className="p-6 text-center border border-gray-200 !bg-white hover:shadow-md transition-shadow duration-200"
              style={{ backgroundColor: "#ffffff", color: "#111827" }}
            >
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4"
                style={{ backgroundColor: `${primaryColor}15` }} // Lighter touch - primary for stat icon
              >
                <Calendar
                  className="h-6 w-6"
                  style={{ color: primaryColor }} // Lighter touch - primary for stat icon
                />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {
                  bookings.filter((b: Booking) => {
                    const now = new Date();
                    const checkIn = new Date(b.checkInDate);
                    const checkOut = new Date(b.checkOutDate);
                    return (
                      checkIn > now ||
                      (checkIn <= now &&
                        checkOut >= now &&
                        b.status === "CONFIRMED")
                    );
                  }).length
                }
              </p>
              <p className="text-sm text-gray-600">Upcoming</p>
            </Card>
          </div>
        )}

        {/* Navigation & Search */}
        <Card
          className="p-6 mb-8 border border-gray-200 !bg-white shadow-sm"
          style={{ backgroundColor: "#ffffff", color: "#111827" }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                {
                  key: "all",
                  label: "All Bookings",
                  icon: Home,
                  count: bookings.length,
                },
                {
                  key: "upcoming",
                  label: "Upcoming",
                  icon: Calendar,
                  count: bookings.filter((b: Booking) => {
                    const now = new Date();
                    const checkIn = new Date(b.checkInDate);
                    const checkOut = new Date(b.checkOutDate);
                    return (
                      checkIn > now ||
                      (checkIn <= now &&
                        checkOut >= now &&
                        b.status === "CONFIRMED")
                    );
                  }).length,
                },
                {
                  key: "past",
                  label: "Past",
                  icon: CheckCircle,
                  count: bookings.filter((b: Booking) => {
                    const now = new Date();
                    const checkOut = new Date(b.checkOutDate);
                    return checkOut < now && b.status !== "CANCELLED";
                  }).length,
                },
                {
                  key: "cancelled",
                  label: "Cancelled",
                  icon: XCircle,
                  count: bookings.filter(
                    (b: Booking) => b.status === "CANCELLED"
                  ).length,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as FilterTab)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === tab.key
                        ? "text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    style={
                      activeTab === tab.key
                        ? { backgroundColor: primaryColor } // Lighter touch - primary for active tab
                        : {}
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          activeTab === tab.key
                            ? "bg-white/20 text-white"
                            : "text-gray-700"
                        }`}
                        style={
                          activeTab !== tab.key
                            ? {
                                backgroundColor: `${
                                  accentColor || "#D97706"
                                }15`,
                                color: accentColor || "#D97706",
                              }
                            : {}
                        }
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full lg:w-80 border bg-gray-50"
              />
            </div>
          </div>
        </Card>

        {/* Empty State */}
        {filteredBookings.length === 0 ? (
          <Card
            className="p-16 text-center border border-gray-200 !bg-white shadow-sm"
            style={{ backgroundColor: "#ffffff", color: "#111827" }}
          >
            <div className="max-w-md mx-auto">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-lg mb-6">
                <Home className="h-10 w-10 text-gray-600" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {activeTab === "all"
                  ? "No bookings yet"
                  : `No ${activeTab} bookings`}
              </h3>

              <p className="text-gray-600 mb-8">
                {activeTab === "all"
                  ? "Start exploring properties to make your first booking."
                  : `You don't have any ${activeTab} bookings at the moment.`}
              </p>

              <Button
                onClick={() => router.push("/browse")}
                className="text-white font-semibold py-2 px-6 hover:opacity-90"
                style={{ backgroundColor: primaryColor }} // Lighter touch - primary for CTA
              >
                <Search className="h-4 w-4 mr-2" />
                Browse Properties
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking: Booking, index) => {
              const status = getStatusConfig(booking.status);
              const StatusIcon = status.icon;
              const nights = calculateNights(
                booking.checkInDate,
                booking.checkOutDate
              );
              const ongoing = isOngoing(booking);

              return (
                <Card
                  key={booking.id}
                  className="p-0 hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200 !bg-white overflow-hidden"
                  style={{ backgroundColor: "#ffffff", color: "#111827" }}
                  onClick={() => router.push(`/guest/bookings/${booking.id}`)}
                >
                  <div className="flex flex-col lg:flex-row">
                    {/* Property Image */}
                    <div className="relative lg:w-80 h-64 lg:h-auto flex-shrink-0 overflow-hidden">
                      {booking.property?.images?.[0]?.url ? (
                        <Image
                          src={booking.property.images[0].url}
                          alt={booking.property.title || "Property"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <Home className="h-16 w-16 text-gray-400" />
                        </div>
                      )}

                      {/* Status Badges */}
                      <div className="absolute top-4 left-4 flex flex-col space-y-2">
                        {ongoing && (
                          <div
                            className="text-white px-3 py-2 rounded-lg text-sm font-semibold"
                            style={{ backgroundColor: secondaryColor }}
                          >
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                              <span>Currently Staying</span>
                            </div>
                          </div>
                        )}

                        <div
                          className={`${status.className} px-3 py-2 rounded-lg text-sm font-semibold`}
                          style={{
                            backgroundColor: status.bgColor,
                            color: status.textColor,
                            borderColor: status.borderColor,
                          }}
                        >
                          <div className="flex items-center space-x-2">
                            <StatusIcon className="h-4 w-4" />
                            <span>{status.text}</span>
                          </div>
                        </div>
                      </div>

                      {/* Booking ID */}
                      <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-lg text-xs font-medium">
                        #{booking.id.slice(-6).toUpperCase()}
                      </div>

                      {/* Price */}
                      <div className="absolute bottom-4 left-4 bg-white px-4 py-2 rounded-lg shadow-md">
                        <p className="text-xs text-gray-600 font-medium">
                          Total
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatPrice(booking.totalPrice, booking.currency)}
                        </p>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-8">
                      <div className="mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {booking.property?.title || "Property"}
                        </h3>
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-5 w-5 mr-2" />
                          <span className="text-lg">
                            {booking.property?.city}, {booking.property?.state}
                          </span>
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${primaryColor}20` }} // Lighter touch - primary for detail icon
                            >
                              <Calendar
                                className="h-5 w-5"
                                style={{ color: primaryColor }} // Lighter touch - primary for detail icon
                              />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 mb-1">
                                Check-in
                              </p>
                              <p className="text-lg font-bold text-gray-700">
                                {formatDate(booking.checkInDate)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${accentColor}20` }}
                            >
                              <Calendar
                                className="h-5 w-5"
                                style={{ color: accentColor }}
                              />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 mb-1">
                                Check-out
                              </p>
                              <p className="text-lg font-bold text-gray-700">
                                {formatDate(booking.checkOutDate)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${secondaryColor}20` }}
                            >
                              <Users
                                className="h-5 w-5"
                                style={{ color: secondaryColor }}
                              />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 mb-1">
                                Guests
                              </p>
                              <p className="text-lg font-bold text-gray-700">
                                {booking.totalGuests}{" "}
                                {booking.totalGuests === 1 ? "Guest" : "Guests"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                              <Home className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 mb-1">
                                Duration
                              </p>
                              <p className="text-lg font-bold text-gray-700">
                                {nights} {nights === 1 ? "Night" : "Nights"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                        <div className="text-sm text-gray-500">
                          Booked on{" "}
                          {formatDate(booking.createdAt || booking.checkInDate)}
                        </div>

                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/guest/bookings/${booking.id}`);
                          }}
                          className="text-white font-semibold py-2 px-4 hover:opacity-90"
                          style={{ backgroundColor: primaryColor }} // Lighter touch - primary for CTA
                        >
                          <span>View Details</span>
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Support Section */}
        {bookings.length > 0 && (
          <Card
            className="p-8 mt-8 border border-gray-200 !bg-white shadow-sm"
            style={{ backgroundColor: "#ffffff", color: "#111827" }}
          >
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-lg mb-6">
                <MessageCircle className="h-8 w-8 text-red-600" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Need Help with Your Bookings?
              </h3>

              <p className="text-gray-600 mb-8">
                Our support team is available to assist you with any questions
                about your reservations or special requests.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.push("/guest/messages")}
                  className="border border-gray-300 text-gray-700 hover:text-white"
                  style={{
                    borderColor: secondaryColor || "#059669",
                    color: secondaryColor || "#059669",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      secondaryColor || "#059669";
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = secondaryColor || "#059669";
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
                <Button
                  onClick={() => router.push("/browse")}
                  className="text-white hover:opacity-90"
                  style={{ backgroundColor: primaryColor }} // Lighter touch - primary for CTA
                >
                  <Search className="h-4 w-4 mr-2" />
                  Browse Properties
                </Button>
              </div>
            </div>
          </Card>
        )}
      </main>

      <Footer
        realtorName={realtorName}
        tagline={tagline}
        logo={logoUrl}
        description={description}
        primaryColor={primaryColor}
      />
    </div>
  );
}
