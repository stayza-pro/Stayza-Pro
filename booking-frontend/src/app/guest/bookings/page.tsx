"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Clock, ChevronRight } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { bookingService } from "@/services";
import { useQuery } from "react-query";
import type { Booking } from "@/types";
import { normalizeImageUrl } from "@/utils/imageUrl";

type BookingTab = "upcoming" | "completed" | "cancelled";

export default function GuestBookingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<BookingTab>("upcoming");
  const [authChecked, setAuthChecked] = React.useState(false);

  const { user, isAuthenticated, isLoading: authLoading } = useCurrentUser();
  const {
    brandColor: primaryColor,
    secondaryColor,
    accentColor,
  } = useRealtorBranding();
  const primaryPale = "#e8f1f8";
  const secondarySurface = "#f9f4ef";

  const {
    data: bookingsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["guest-bookings"],
    queryFn: () => bookingService.getUserBookings(),
    enabled: !!user && user.role === "GUEST",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 30 * 1000,
    retry: (failureCount, queryError: unknown) => {
      const status = (queryError as { response?: { status?: number } })
        ?.response?.status;
      if (status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });

  React.useEffect(() => {
    if (!authLoading && (isAuthenticated || !authChecked)) {
      setAuthChecked(true);
    }
  }, [authLoading, isAuthenticated, authChecked]);

  React.useEffect(() => {
    if (authChecked && !authLoading && !isAuthenticated) {
      const returnTo =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "/guest/bookings";
      router.push(`/guest/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [authChecked, authLoading, isAuthenticated, router]);

  React.useEffect(() => {
    if (authChecked && !authLoading && user && user.role !== "GUEST") {
      const returnTo =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "/guest/bookings";
      router.push(`/guest/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [authChecked, authLoading, user, router]);

  React.useEffect(() => {
    const status = (error as { response?: { status?: number } } | null)
      ?.response?.status;
    if (status === 401) {
      const returnTo =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "/guest/bookings";
      router.push(`/guest/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [error, router]);

  const bookings = (bookingsData?.data || []) as Booking[];

  const getBucket = (booking: Booking): BookingTab => {
    const now = new Date();
    const checkOut = new Date(booking.checkOutDate);

    if (booking.status === "CANCELLED") {
      return "cancelled";
    }

    if (checkOut < now || booking.status === "COMPLETED") {
      return "completed";
    }

    return "upcoming";
  };

  const visibleBookings = bookings.filter(
    (booking) => getBucket(booking) === activeTab,
  );

  const formatDate = (value: Date | string) =>
    new Date(value).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (value: Date | string) =>
    new Date(value).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

  const formatScheduledTime = (value?: string | null) => {
    if (!value) return "";

    const timeMatch = value.match(/^(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const hours = Number(timeMatch[1]);
      const minutes = Number(timeMatch[2]);
      if (Number.isFinite(hours) && Number.isFinite(minutes)) {
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        });
      }
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return formatTime(parsed);
    }

    return value;
  };

  const getBookingTimeLabel = (booking: Booking) => {
    const stayStatus = booking.stayStatus;
    const checkedInOrOut =
      stayStatus === "CHECKED_IN" || stayStatus === "CHECKED_OUT";

    if (checkedInOrOut && booking.checkInTime) {
      return formatTime(booking.checkInTime);
    }

    const scheduledPropertyTime = booking.property?.checkInTime;
    if (scheduledPropertyTime) {
      return formatScheduledTime(scheduledPropertyTime);
    }

    // Fall back to showing the check-in date when no specific time is set
    if (booking.checkInDate) {
      return new Date(booking.checkInDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    return "To be confirmed";
  };

  const toDateParam = (value: Date | string) => {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value.slice(0, 10);
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "";
    }
    return parsed.toISOString().slice(0, 10);
  };

  const getBookingImageUrl = (booking: Booking) => {
    const firstImage =
      (
        booking.property?.images as Array<
          | string
          | {
              url?: string | null;
              imageUrl?: string | null;
              src?: string | null;
            }
        >
      )?.[0] ?? null;
    return normalizeImageUrl(firstImage);
  };

  const getBookAgainUrl = (booking: Booking) => {
    const params = new URLSearchParams({
      sourceBookingId: booking.id,
      checkIn: toDateParam(booking.checkInDate),
      checkOut: toDateParam(booking.checkOutDate),
      guests: String(Math.max(1, Number(booking.totalGuests || 1))),
      firstName: user?.firstName || booking.guest?.firstName || "",
      lastName: user?.lastName || booking.guest?.lastName || "",
      email: user?.email || booking.guest?.email || "",
      phone: user?.phone || "",
      specialRequests: booking.specialRequests || "",
    });

    return `/booking/${booking.propertyId}/checkout?${params.toString()}`;
  };

  const getStatusColor = (status: Booking["status"]) => {
    if (status === "ACTIVE") return secondaryColor || "#059669";
    if (status === "PENDING") return accentColor || "#D97706";
    if (status === "COMPLETED") return "#6b7280";
    if (status === "CANCELLED") return "#ef4444";
    return "#6b7280";
  };

  const getStatusLabel = (status: Booking["status"]) => {
    if (status === "ACTIVE") return "Confirmed";
    if (status === "PENDING") return "Pending";
    if (status === "COMPLETED") return "Completed";
    if (status === "CANCELLED") return "Cancelled";
    return status;
  };

  const EmptyState = ({ message }: { message: string }) => (
    <Card
      className="text-center py-20 rounded-2xl border"
      style={{
        borderColor: "#e5e7eb",
        backgroundColor: secondarySurface,
      }}
    >
      <div
        className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
        style={{ backgroundColor: primaryPale }}
      >
        <Calendar className="w-10 h-10" style={{ color: primaryColor }} />
      </div>
      <h3 className="font-semibold mb-2 text-2xl text-gray-900">
        No {activeTab} bookings
      </h3>
      <p className="mb-8 max-w-md mx-auto text-gray-600">{message}</p>
      <Link href="/guest/browse">
        <Button
          className="h-12 px-8 rounded-xl font-medium text-white"
          style={{ backgroundColor: accentColor || primaryColor }}
        >
          Browse Properties
        </Button>
      </Link>
    </Card>
  );

  if (!authChecked || authLoading || isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
        <GuestHeader
          currentPage="bookings"
          searchPlaceholder="Search your bookings..."
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-1/3" />
            <div className="h-56 bg-gray-200 rounded" />
            <div className="h-56 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
      <GuestHeader
        currentPage="bookings"
        searchPlaceholder="Search your bookings..."
      />

      <main className="max-w-[1440px] mx-auto w-full px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="font-semibold mb-3 text-gray-900 text-[clamp(32px,4vw,48px)]">
            My Bookings
          </h1>
          <p className="text-lg text-gray-600">Manage your property bookings</p>
        </div>

        <div
          className="inline-flex h-14 p-1.5 rounded-xl mb-8"
          style={{ backgroundColor: primaryPale }}
        >
          {[
            { key: "upcoming", label: "Upcoming" },
            { key: "completed", label: "Completed" },
            { key: "cancelled", label: "Cancelled" },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Button
                key={tab.key}
                variant={isActive ? "primary" : "ghost"}
                className="h-11 px-6 rounded-lg font-medium"
                style={
                  isActive
                    ? { backgroundColor: "#fff", color: primaryColor }
                    : undefined
                }
                onClick={() => setActiveTab(tab.key as BookingTab)}
              >
                {tab.label}
              </Button>
            );
          })}
        </div>

        <div className="grid gap-6">
          {visibleBookings.length === 0 ? (
            <EmptyState
              message={`You don't have any ${activeTab} property viewings at the moment`}
            />
          ) : (
            visibleBookings.map((booking) => {
              const confirmationCode = `BK-${String(booking.id).slice(0, 6).toUpperCase()}`;
              return (
                <Card
                  key={booking.id}
                  className="group rounded-2xl border overflow-hidden transition-all hover:shadow-lg bg-white border-gray-200"
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-80 aspect-[4/3] md:aspect-auto relative overflow-hidden">
                      {getBookingImageUrl(booking) ? (
                        <img
                          src={getBookingImageUrl(booking)}
                          alt={booking.property?.title || "Property"}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100" />
                      )}

                      <div
                        className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm text-white"
                        style={{
                          backgroundColor: getStatusColor(booking.status),
                        }}
                      >
                        {getStatusLabel(booking.status)}
                      </div>
                    </div>

                    <div className="flex-1 p-6 lg:p-8">
                      <div className="flex flex-col h-full justify-between">
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold mb-2 text-xl text-gray-900">
                              {booking.property?.title || "Property"}
                            </h3>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {booking.property?.city || ""}
                                {booking.property?.state
                                  ? `, ${booking.property.state}`
                                  : ""}
                              </span>
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: primaryPale }}
                              >
                                <Calendar
                                  className="w-5 h-5"
                                  style={{ color: primaryColor }}
                                />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">
                                  Date
                                </div>
                                <div className="font-medium text-gray-900">
                                  {formatDate(booking.checkInDate)}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  to {formatDate(booking.checkOutDate)}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: primaryPale }}
                              >
                                <Clock
                                  className="w-5 h-5"
                                  style={{ color: primaryColor }}
                                />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">
                                  Time
                                </div>
                                <div className="font-medium text-gray-900">
                                  {getBookingTimeLabel(booking)}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-600">
                            <span className="font-mono font-medium">
                              {confirmationCode}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 mt-6">
                          <Link
                            href={`/guest/bookings/${booking.id}`}
                            className="flex-1 min-w-[200px]"
                          >
                            <Button
                              className="w-full h-11 rounded-xl font-medium text-white"
                              style={{
                                backgroundColor: accentColor || primaryColor,
                              }}
                            >
                              View Details
                              <ChevronRight className="w-5 h-5 ml-2" />
                            </Button>
                          </Link>

                          {(booking.status === "ACTIVE" ||
                            booking.status === "PENDING") && (
                            <Link
                              href={getBookAgainUrl(booking)}
                              className="flex-1 min-w-[200px]"
                            >
                              <Button
                                variant="outline"
                                className="w-full h-11 rounded-xl font-medium"
                              >
                                Book Again
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
