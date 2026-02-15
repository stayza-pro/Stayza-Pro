"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Search, Download, RotateCw } from "lucide-react";
import { toast } from "react-hot-toast";
import { useQuery } from "react-query";
import { Button, Card, Input } from "@/components/ui";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { Footer } from "@/components/guest/sections/Footer";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { bookingService } from "@/services";
import { paymentService } from "@/services/payments";
import type { Booking } from "@/types";
import { canDownloadReceipt } from "@/utils/bookingEnums";

export default function BookingHistoryPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [rebookingId, setRebookingId] = useState<string | null>(null);

  const {
    brandColor: primaryColor,
    secondaryColor,
    accentColor,
    realtorName,
    logoUrl,
    tagline,
    description,
  } = useRealtorBranding();

  React.useEffect(() => {
    if (!isLoading && (isAuthenticated || !authChecked)) {
      setAuthChecked(true);
    }
  }, [isLoading, isAuthenticated, authChecked]);

  React.useEffect(() => {
    if (authChecked && !isLoading && !isAuthenticated) {
      router.push("/guest/login?returnTo=/guest/history");
    }
  }, [authChecked, isLoading, isAuthenticated, router]);

  const { data: bookingsData, isLoading: historyLoading } = useQuery({
    queryKey: ["booking-history"],
    queryFn: () => bookingService.getUserBookings(),
    enabled: !!user,
  });

  const toBookingArray = (payload: unknown): Booking[] => {
    if (Array.isArray(payload)) {
      return payload as Booking[];
    }

    if (!payload || typeof payload !== "object") {
      return [];
    }

    const typedPayload = payload as { data?: unknown; bookings?: unknown };

    if (Array.isArray(typedPayload.data)) {
      return typedPayload.data as Booking[];
    }

    if (Array.isArray(typedPayload.bookings)) {
      return typedPayload.bookings as Booking[];
    }

    if (typedPayload.data && typeof typedPayload.data === "object") {
      const nested = typedPayload.data as { bookings?: unknown };
      if (Array.isArray(nested.bookings)) {
        return nested.bookings as Booking[];
      }
    }

    return [];
  };

  const bookings = useMemo(
    () =>
      toBookingArray(bookingsData).filter(
        (booking) => booking.status === "COMPLETED",
      ),
    [bookingsData],
  );

  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) {
      return bookings;
    }

    const query = searchQuery.toLowerCase();
    return bookings.filter((booking) => {
      const title = booking.property?.title?.toLowerCase() || "";
      const location =
        `${booking.property?.city || ""} ${booking.property?.state || ""}`.toLowerCase();
      return title.includes(query) || location.includes(query);
    });
  }, [bookings, searchQuery]);

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatPrice = (price: number, currency: string = "NGN") =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(price);

  const getRebookDates = (booking: Booking) => {
    const checkInDate = new Date();
    checkInDate.setDate(checkInDate.getDate() + 7);
    checkInDate.setHours(12, 0, 0, 0);

    const originalNights = Math.max(
      1,
      Math.ceil(
        (new Date(booking.checkOutDate).getTime() -
          new Date(booking.checkInDate).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );

    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + originalNights);
    checkOutDate.setHours(12, 0, 0, 0);

    return { checkInDate, checkOutDate };
  };

  const handleBookAgain = async (booking: Booking) => {
    if (!booking.propertyId) {
      toast.error("Unable to rebook this stay.");
      return;
    }

    const { checkInDate, checkOutDate } = getRebookDates(booking);
    setRebookingId(booking.id);

    try {
      const newBooking = await bookingService.createBooking({
        propertyId: booking.propertyId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: booking.totalGuests || 1,
        specialRequests: booking.specialRequests || "",
      });

      router.push(
        `/booking/${booking.propertyId}/payment?bookingId=${newBooking.id}&paymentMethod=paystack&autopay=1&rebookFrom=${booking.id}`,
      );
    } catch {
      const toIso = (value: Date) => value.toISOString().split("T")[0];
      router.push(
        `/booking/${booking.propertyId}/checkout?checkIn=${toIso(checkInDate)}&checkOut=${toIso(checkOutDate)}&guests=${booking.totalGuests}&rebookFrom=${booking.id}`,
      );
    } finally {
      setRebookingId(null);
    }
  };

  const handleDownloadReceipt = async (booking: Booking) => {
    const paymentId = booking.payment?.id;

    if (!paymentId) {
      toast.error("No receipt available yet.");
      return;
    }

    if (!canDownloadReceipt(booking.paymentStatus)) {
      toast.error("Receipt not available yet for this booking.");
      return;
    }

    try {
      const blob = await paymentService.downloadReceipt(paymentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Unable to download receipt.");
    }
  };

  if (!authChecked || isLoading || historyLoading) {
    return (
      <div className="min-h-screen bg-gray-50" style={{ colorScheme: "light" }}>
        <GuestHeader
          currentPage="history"
          searchPlaceholder="Search history..."
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-1/3" />
            <div className="h-48 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col"
      style={{ colorScheme: "light" }}
    >
      <GuestHeader
        currentPage="history"
        searchPlaceholder="Search history..."
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">
            Booking History
          </h1>
          <p className="text-gray-600">
            {bookings.length > 0
              ? `${bookings.length} completed stay${bookings.length > 1 ? "s" : ""}`
              : "Your completed bookings will appear here"}
          </p>
        </div>

        <div className="relative mb-6 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by property title or location"
            className="pl-10"
          />
        </div>

        {filteredBookings.length === 0 ? (
          <Card className="text-center py-12 px-6 border border-gray-200 bg-white">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              No completed bookings yet
            </h3>
            <p className="text-gray-600 mb-4">
              Complete a stay to see your booking history here.
            </p>
            <Link href="/guest/browse">
              <Button
                className="text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Browse Properties
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card
                key={booking.id}
                className="bg-white border border-gray-200 p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {booking.property?.title || "Property"}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {booking.property?.city || ""}
                        {booking.property?.state
                          ? `, ${booking.property.state}`
                          : ""}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(booking.checkInDate)} -{" "}
                      {formatDate(booking.checkOutDate)}
                    </div>
                    <div className="font-semibold text-gray-900">
                      {formatPrice(booking.totalPrice, booking.currency)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadReceipt(booking)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Receipt
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleBookAgain(booking)}
                      loading={rebookingId === booking.id}
                    >
                      <RotateCw className="w-4 h-4 mr-2" />
                      Book Again
                    </Button>
                    <Link href={`/guest/bookings/${booking.id}`}>
                      <Button
                        className="text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
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
