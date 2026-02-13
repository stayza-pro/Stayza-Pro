"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Users } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { Footer } from "@/components/guest/sections/Footer";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { bookingService } from "@/services";
import { useQuery } from "react-query";
import type { Booking } from "@/types";

type BookingTab = "upcoming" | "completed" | "cancelled";

export default function GuestBookingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<BookingTab>("upcoming");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [authChecked, setAuthChecked] = React.useState(false);

  const { user, isAuthenticated, isLoading: authLoading } = useCurrentUser();
  const {
    brandColor: primaryColor,
    secondaryColor,
    accentColor,
    realtorName,
    logoUrl,
    tagline,
    description,
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
      const status = (queryError as { response?: { status?: number } })?.response
        ?.status;
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
    const status = (error as { response?: { status?: number } } | null)?.response
      ?.status;
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

  const visibleBookings = bookings.filter((booking) => {
    const tabMatch = getBucket(booking) === activeTab;
    if (!tabMatch) {
      return false;
    }

    if (!searchQuery.trim()) {
      return true;
    }

    const query = searchQuery.toLowerCase();
    const title = booking.property?.title?.toLowerCase() || "";
    const location = `${booking.property?.city || ""} ${booking.property?.state || ""}`.toLowerCase();
    return title.includes(query) || location.includes(query);
  });

  const upcomingCount = bookings.filter((booking) => getBucket(booking) === "upcoming").length;
  const completedCount = bookings.filter((booking) => getBucket(booking) === "completed").length;
  const cancelledCount = bookings.filter((booking) => getBucket(booking) === "cancelled").length;

  const formatDate = (value: Date | string) =>
    new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatPrice = (value: number, currency: string = "NGN") =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(value);

  const calculateNights = (checkIn: Date | string, checkOut: Date | string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const EmptyState = ({ message }: { message: string }) => (
    <Card className="text-center py-12 px-6 border border-gray-200 bg-white">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Calendar className="w-8 h-8 text-gray-500" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900">No bookings yet</h3>
      <p className="text-gray-600 mb-4">{message}</p>
      <Link href="/guest/browse">
        <Button className="px-6 py-2 text-white" style={{ backgroundColor: primaryColor }}>
          Browse Properties
        </Button>
      </Link>
    </Card>
  );

  if (!authChecked || authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GuestHeader currentPage="bookings" searchPlaceholder="Search your bookings..." />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-1/3" />
            <div className="h-40 bg-gray-200 rounded" />
            <div className="h-40 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ colorScheme: "light" }}>
      <GuestHeader currentPage="bookings" searchPlaceholder="Search your bookings..." />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">My Bookings</h1>
          <p className="text-gray-600">Manage your property reservations</p>
        </div>

        <div className="mb-6 max-w-xl">
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by property name or location"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: "upcoming", label: `Upcoming${upcomingCount > 0 ? ` (${upcomingCount})` : ""}` },
            { key: "completed", label: `Completed${completedCount > 0 ? ` (${completedCount})` : ""}` },
            { key: "cancelled", label: `Cancelled${cancelledCount > 0 ? ` (${cancelledCount})` : ""}` },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Button
                key={tab.key}
                variant={isActive ? "primary" : "outline"}
                className="rounded-lg"
                style={isActive ? { backgroundColor: primaryColor, color: "#fff" } : undefined}
                onClick={() => setActiveTab(tab.key as BookingTab)}
              >
                {tab.label}
              </Button>
            );
          })}
        </div>

        <div className="space-y-4">
          {visibleBookings.length === 0 ? (
            <EmptyState
              message={
                activeTab === "upcoming"
                  ? "You don't have any upcoming bookings. Start exploring properties to make your first reservation!"
                  : activeTab === "completed"
                    ? "You don't have any completed bookings yet."
                    : "You don't have any cancelled bookings."
              }
            />
          ) : (
            visibleBookings.map((booking) => {
              const nights = calculateNights(booking.checkInDate, booking.checkOutDate);
              return (
                <Card key={booking.id} className="border border-gray-200 bg-white p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900">{booking.property?.title || "Property"}</h3>
                      <div className="flex items-center text-gray-600 text-sm gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{booking.property?.city || ""}{booking.property?.state ? `, ${booking.property.state}` : ""}</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {booking.totalGuests} guests
                        </span>
                        <span>{nights} night{nights > 1 ? "s" : ""}</span>
                      </div>
                    </div>

                    <div className="lg:text-right space-y-3">
                      <div
                        className="inline-flex px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor:
                            booking.status === "CANCELLED"
                              ? "#fee2e2"
                              : booking.status === "COMPLETED"
                                ? `${secondaryColor || "#059669"}20`
                                : `${accentColor || "#D97706"}20`,
                          color:
                            booking.status === "CANCELLED"
                              ? "#b91c1c"
                              : booking.status === "COMPLETED"
                                ? secondaryColor || "#059669"
                                : accentColor || "#D97706",
                        }}
                      >
                        {booking.status}
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{formatPrice(booking.totalPrice, booking.currency)}</p>
                      <Link href={`/guest/bookings/${booking.id}`}>
                        <Button variant="outline">View Details</Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </main>

      <Footer
        realtorName={realtorName}
        tagline={tagline}
        logo={logoUrl}
        description={description}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        accentColor={accentColor}
      />
    </div>
  );
}
