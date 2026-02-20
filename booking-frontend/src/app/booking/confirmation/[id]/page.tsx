"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  CheckCircle,
  Calendar,
  MapPin,
  Users,
  Home,
  Download,
  Check,
  Clock,
  Moon,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { Footer } from "@/components/guest/sections";
import { Button } from "@/components/ui";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { useQuery } from "react-query";
import { bookingService } from "@/services";
import { paymentService } from "@/services/payments";
import {
  BookingStatusBadge,
  PaymentStatusBadge,
  BookingStatusCard,
} from "@/components/booking";
import { canDownloadReceipt, formatPaymentStatus } from "@/utils/bookingEnums";
import { formatPropertyTime } from "@/utils/formatters";
import { toast } from "react-hot-toast";

export default function BookingConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useCurrentUser();

  const bookingId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : "";

  const {
    brandColor,
    secondaryColor,
    accentColor,
    realtorName,
    logoUrl,
    tagline,
    description,
  } = useRealtorBranding();

  const primary = brandColor || "#2563eb";
  const secondary = secondaryColor || "#16a34a";

  React.useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push(`/guest/login?redirect=/booking/confirmation/${bookingId}`);
    }
  }, [user, isAuthLoading, router, bookingId]);

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => {
      if (!bookingId || typeof bookingId !== "string") {
        throw new Error("Invalid booking ID");
      }
      return bookingService.getBooking(bookingId);
    },
    enabled:
      !isAuthLoading && !!user && !!bookingId && typeof bookingId === "string",
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatPrice = (price: number, currency: string = "NGN") =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(price);

  const calculateNights = () => {
    if (!booking) return 0;
    const start = new Date(booking.checkInDate);
    const end = new Date(booking.checkOutDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleDownloadConfirmation = () => {
    const paymentId = booking?.payment?.id;
    if (!paymentId) {
      toast.error("No receipt available yet.");
      return;
    }
    if (!canDownloadReceipt(booking?.paymentStatus)) {
      const label = booking?.paymentStatus
        ? formatPaymentStatus(booking.paymentStatus)
        : "Unknown";
      toast.error(
        `Receipt available once payment is released. Current status: ${label}.`,
      );
      return;
    }
    paymentService
      .downloadReceipt(paymentId)
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `receipt-${paymentId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => {
        toast.error("Unable to download receipt.");
      });
  };

  const footerProps = {
    realtorName,
    tagline,
    logo: logoUrl,
    description,
    primaryColor: primary,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GuestHeader
          currentPage="profile"
          searchPlaceholder="Search location..."
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-16 bg-gray-200 rounded-2xl max-w-md mx-auto" />
            <div className="h-64 bg-gray-200 rounded-2xl" />
          </div>
        </div>
        <Footer {...footerProps} />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GuestHeader
          currentPage="profile"
          searchPlaceholder="Search location..."
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Booking Not Found
            </h2>
            <p className="text-gray-500 mb-6">
              The booking you're looking for doesn't exist.
            </p>
            <Button
              onClick={() => router.push("/guest/bookings")}
              className="h-11 rounded-xl font-semibold"
              style={{ backgroundColor: primary }}
            >
              View My Bookings
            </Button>
          </div>
        </div>
        <Footer {...footerProps} />
      </div>
    );
  }

  const nights = calculateNights();
  const pricePerNight = booking.property?.pricePerNight ?? 0;
  const roomFee = pricePerNight * nights;
  const cleaningFee = (booking as any).cleaningFee ?? null;
  const serviceFee = (booking as any).serviceFee ?? null;
  const securityDeposit = (booking as any).securityDeposit ?? null;

  const steps = ["Guest Details", "Payment", "Confirmation"];

  return (
    <div className="min-h-screen bg-gray-50">
      <GuestHeader
        currentPage="profile"
        searchPlaceholder="Search location..."
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Progress stepper ── */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            {steps.map((label, i) => (
              <React.Fragment key={label}>
                {i > 0 && (
                  <div
                    className="hidden sm:block h-1 w-14 rounded-full"
                    style={{ backgroundColor: primary }}
                  />
                )}
                <div className="flex items-center gap-2">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: primary }}
                  >
                    <Check className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-sm font-medium text-gray-800 hidden sm:inline">
                    {label}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── Hero banner ── */}
        <div
          className="rounded-2xl p-8 mb-8 text-white text-center shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
          }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
            Booking Confirmed!
          </h1>
          <p className="text-white/80 mb-4">
            Your booking has been successfully confirmed
          </p>
          <span className="inline-block bg-white/20 text-white text-sm font-mono px-4 py-1.5 rounded-full">
            Ref #{booking.id.substring(0, 8).toUpperCase()}
          </span>
        </div>

        {/* ── Status card ── */}
        <div className="max-w-2xl mx-auto mb-8">
          <BookingStatusCard
            bookingStatus={booking.status}
            paymentStatus={booking.paymentStatus}
          />
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — property + next steps */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">
                Property Details
              </h2>

              {/* Image + title row */}
              <div className="flex flex-col md:flex-row gap-5 mb-6">
                <div className="relative w-full md:w-44 h-44 rounded-xl overflow-hidden flex-shrink-0">
                  {booking.property?.images?.[0]?.url ? (
                    <Image
                      src={booking.property.images[0].url}
                      alt={booking.property.title || "Property"}
                      fill
                      className="object-cover"
                      unoptimized={
                        !booking.property.images[0].url.startsWith("http")
                      }
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Home className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 leading-snug">
                    {booking.property?.title || "Unknown Property"}
                  </h3>
                  <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>
                      {booking.property?.city}, {booking.property?.state}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detail boxes */}
              <div className="grid grid-cols-2 gap-3">
                {/* Check-in */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${primary}18` }}
                    >
                      <Calendar
                        className="h-4 w-4"
                        style={{ color: primary }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Check-in
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(booking.checkInDate)}
                  </p>
                  {booking.property?.checkInTime && (
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      From {formatPropertyTime(booking.property.checkInTime)}
                    </p>
                  )}
                </div>

                {/* Check-out */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${primary}18` }}
                    >
                      <Calendar
                        className="h-4 w-4"
                        style={{ color: primary }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Check-out
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(booking.checkOutDate)}
                  </p>
                  {booking.property?.checkOutTime && (
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      By {formatPropertyTime(booking.property.checkOutTime)}
                    </p>
                  )}
                </div>

                {/* Duration */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${primary}18` }}
                    >
                      <Moon className="h-4 w-4" style={{ color: primary }} />
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Duration
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {nights} {nights === 1 ? "Night" : "Nights"}
                  </p>
                </div>

                {/* Guests */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${primary}18` }}
                    >
                      <Users className="h-4 w-4" style={{ color: primary }} />
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Guests
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {booking.totalGuests}{" "}
                    {booking.totalGuests === 1 ? "Guest" : "Guests"}
                  </p>
                </div>
              </div>
            </div>

            {/* What happens next */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                What Happens Next?
              </h2>
              <ol className="space-y-4">
                {[
                  {
                    icon: <CheckCircle className="h-5 w-5" />,
                    title: "Booking Confirmed",
                    body: "Your reservation is secured and the host has been notified.",
                  },
                  {
                    icon: <CreditCard className="h-5 w-5" />,
                    title: "Payment Held Securely",
                    body: "Your payment is held in escrow and will only be released after check-in.",
                  },
                  {
                    icon: <ArrowRight className="h-5 w-5" />,
                    title: "Enjoy Your Stay",
                    body: "Check in on your scheduled date. Contact the host if you need assistance.",
                  },
                ].map(({ icon, title, body }, i) => (
                  <li key={i} className="flex gap-4">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        backgroundColor: `${primary}18`,
                        color: primary,
                      }}
                    >
                      {icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {title}
                      </p>
                      <p className="text-sm text-gray-500">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Right — payment sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">
                Payment Summary
              </h2>

              {/* Fee breakdown */}
              <div className="space-y-3 pb-4 border-b border-gray-100 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>
                    {formatPrice(pricePerNight, booking.currency)} × {nights}{" "}
                    {nights === 1 ? "night" : "nights"}
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(roomFee, booking.currency)}
                  </span>
                </div>
                {cleaningFee != null && (
                  <div className="flex justify-between text-gray-600">
                    <span>Cleaning fee</span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(cleaningFee, booking.currency)}
                    </span>
                  </div>
                )}
                {serviceFee != null && (
                  <div className="flex justify-between text-gray-600">
                    <span>Service fee</span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(serviceFee, booking.currency)}
                    </span>
                  </div>
                )}
                {securityDeposit != null && (
                  <div className="flex justify-between text-gray-600">
                    <span>Security deposit</span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(securityDeposit, booking.currency)}
                    </span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center py-4 border-b border-gray-100">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold" style={{ color: primary }}>
                  {formatPrice(booking.totalPrice, booking.currency)}
                </span>
              </div>

              {/* Status rows */}
              <div className="space-y-2.5 pt-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Booking status</span>
                  <BookingStatusBadge status={booking.status} size="sm" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Payment status</span>
                  <PaymentStatusBadge
                    status={booking.paymentStatus}
                    size="sm"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Payment method</span>
                  <span className="font-medium text-gray-900">
                    {booking.payment?.method === "PAYSTACK"
                      ? "Paystack"
                      : booking.payment?.method === "FLUTTERWAVE"
                        ? "Flutterwave"
                        : booking.payment?.method || "Card"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-3">
                <Button
                  onClick={handleDownloadConfirmation}
                  disabled={!canDownloadReceipt(booking.paymentStatus)}
                  className="w-full h-11 rounded-xl font-semibold"
                  style={{ backgroundColor: primary }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
                <Button
                  onClick={() => router.push("/guest/bookings")}
                  variant="outline"
                  className="w-full h-11 rounded-xl font-semibold"
                >
                  View All Bookings
                </Button>
                <Button
                  onClick={() => router.push("/guest/browse")}
                  variant="outline"
                  className="w-full h-11 rounded-xl font-semibold"
                >
                  Browse More Properties
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer {...footerProps} />
    </div>
  );
}
