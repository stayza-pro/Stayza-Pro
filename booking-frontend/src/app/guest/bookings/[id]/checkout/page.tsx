"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { bookingService } from "@/services/bookings";

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

export default function GuestBookingCheckoutBridgePage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;
  const { user, isAuthenticated, isLoading } = useCurrentUser();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      const returnTo =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : `/guest/bookings/${bookingId}/checkout`;

      router.replace(`/guest/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    if (user.role !== "GUEST") {
      const returnTo =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : `/guest/bookings/${bookingId}/checkout`;

      router.replace(`/guest/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    let cancelled = false;

    const redirectToBookAgainCheckout = async () => {
      try {
        const booking = await bookingService.getBooking(bookingId);
        if (!booking?.propertyId) {
          throw new Error("Booking property context is missing");
        }

        const query = new URLSearchParams({
          sourceBookingId: booking.id,
          checkIn: toDateParam(booking.checkInDate),
          checkOut: toDateParam(booking.checkOutDate),
          guests: String(Math.max(1, Number(booking.totalGuests || 1))),
          firstName: user.firstName || booking.guest?.firstName || "",
          lastName: user.lastName || booking.guest?.lastName || "",
          email: user.email || booking.guest?.email || "",
          phone: user.phone || "",
          specialRequests: booking.specialRequests || "",
        });

        if (!cancelled) {
          router.replace(`/booking/${booking.propertyId}/checkout?${query.toString()}`);
        }
      } catch {
        toast.error("Unable to open Book Again flow. Please try again.");
        if (!cancelled) {
          router.replace(`/guest/bookings/${bookingId}`);
        }
      }
    };

    void redirectToBookAgainCheckout();

    return () => {
      cancelled = true;
    };
  }, [bookingId, isAuthenticated, isLoading, router, user]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="flex items-center gap-3 text-gray-700">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Opening Book Again checkout...</span>
      </div>
    </div>
  );
}

