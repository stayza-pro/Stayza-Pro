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

  const {
    data: bookingsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["guest-bookings"],
    queryFn: () => bookingService.getUserBookings(),
    enabled: !!user,
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
      router.push("/guest/login?returnTo=/guest/bookings");
    }
  }, [authChecked, authLoading, isAuthenticated, router]);

  React.useEffect(() => {
    const status = (error as { response?: { status?: number } } | null)
      ?.response?.status;
    if (status === 401) {
      router.push("/guest/login?returnTo=/guest/bookings");
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

  const getStatusColor = (status: Booking["status"]) => {
    if (status === "ACTIVE") return accentColor || "#D97706";
    if (status === "PENDING") return secondaryColor || "#059669";
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
    <Card className="text-center py-20 rounded-2xl border border-gray-200 bg-gray-50">
      <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-white">
        <Calendar className="w-10 h-10" style={{ color: primaryColor }} />
      </div>
      <h3 className="font-semibold mb-2 text-[24px] text-gray-900">
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
      <div className="min-h-screen bg-gray-50">
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <GuestHeader
        currentPage="bookings"
        searchPlaceholder="Search your bookings..."
      />

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="font-semibold mb-3 text-gray-900 text-[clamp(32px,4vw,48px)]">
            My Bookings
          </h1>
          <p className="text-lg text-gray-600">
            Manage your property viewing appointments
          </p>
        </div>

        <div
          className="inline-flex h-14 p-1.5 rounded-xl mb-8"
          style={{ backgroundColor: `${primaryColor}20` }}
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
                      {booking.property?.images?.[0]?.url ? (
                        <img
                          src={booking.property.images[0].url}
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
                            <h3 className="font-semibold mb-2 text-[20px] text-gray-900">
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
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
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
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
                                <Clock
                                  className="w-5 h-5"
                                  style={{ color: primaryColor }}
                                />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">
                                  Check-out
                                </div>
                                <div className="font-medium text-gray-900">
                                  {formatDate(booking.checkOutDate)}
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
                            href={`/guest/booking/${booking.id}`}
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

                          {booking.status === "ACTIVE" && (
                            <Button
                              variant="outline"
                              className="flex-1 min-w-[200px] h-11 rounded-xl font-medium"
                            >
                              Reschedule
                            </Button>
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
