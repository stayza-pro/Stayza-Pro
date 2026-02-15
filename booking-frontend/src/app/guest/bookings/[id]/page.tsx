"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  MessageSquare,
  Download,
  X,
  Mail,
  User,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { bookingService } from "@/services/bookings";
import { paymentService } from "@/services/payments";
import { canDownloadReceipt, formatPaymentStatus } from "@/utils/bookingEnums";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { Button, Card } from "@/components/ui";
import AlertModal from "@/components/ui/AlertModal";

export default function GuestBookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bookingId = params.id as string;

  const [authChecked, setAuthChecked] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const {
    brandColor: primaryColor,
    secondaryColor,
    accentColor,
  } = useRealtorBranding();

  React.useEffect(() => {
    if (!isLoading && (isAuthenticated || !authChecked)) {
      setAuthChecked(true);
    }
  }, [isLoading, isAuthenticated, authChecked]);

  React.useEffect(() => {
    if (authChecked && !isLoading && !isAuthenticated) {
      router.push(`/guest/login?returnTo=/guest/booking/${bookingId}`);
    }
  }, [authChecked, isLoading, isAuthenticated, router, bookingId]);

  const { data: booking, isLoading: bookingLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => bookingService.getBooking(bookingId),
    enabled: !!user && !!bookingId,
  });

  const cancelBookingMutation = useMutation({
    mutationFn: () => bookingService.cancelBooking(bookingId, ""),
    onSuccess: () => {
      toast.success("Booking cancelled successfully");
      setShowCancelDialog(false);
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["guest-bookings"] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to cancel booking";
      toast.error(message);
    },
  });

  const formatDate = (value: Date | string) =>
    new Date(value).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const formatCurrency = (value: number, currency: string = "NGN") =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(value);

  const formatTime = (value?: Date | string) => {
    if (!value) {
      return "Time not specified";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Time not specified";
    }

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStatusColor = () => {
    if (!booking) return "#6b7280";
    if (booking.status === "ACTIVE") return accentColor || "#D97706";
    if (booking.status === "PENDING") return secondaryColor || "#059669";
    if (booking.status === "COMPLETED") return "#6b7280";
    if (booking.status === "CANCELLED") return "#ef4444";
    return "#6b7280";
  };

  const getStatusLabel = () => {
    if (!booking) return "Unknown";
    if (booking.status === "ACTIVE") return "Confirmed";
    if (booking.status === "PENDING") return "Pending";
    if (booking.status === "COMPLETED") return "Completed";
    if (booking.status === "CANCELLED") return "Cancelled";
    return booking.status;
  };

  const canCancel = useMemo(() => {
    if (!booking) {
      return false;
    }
    return booking.status === "PENDING" || booking.status === "ACTIVE";
  }, [booking]);

  const handleDownloadReceipt = () => {
    const paymentId = booking?.payment?.id;
    if (!paymentId) {
      toast.error("No receipt available yet");
      return;
    }

    if (!canDownloadReceipt(booking?.paymentStatus)) {
      toast.error(
        `Receipt not available yet. Payment status: ${formatPaymentStatus(booking?.paymentStatus)}`,
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
      .catch(() => toast.error("Unable to download receipt"));
  };

  if (!authChecked || isLoading || bookingLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GuestHeader currentPage="bookings" />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/3" />
            <div className="h-48 bg-gray-200 rounded" />
            <div className="h-48 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GuestHeader currentPage="bookings" />
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Card className="p-8 text-center bg-white border border-gray-200">
            <h2 className="text-2xl font-bold mb-2 text-gray-900">
              Booking Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              The booking you requested does not exist.
            </p>
            <Link href="/guest/bookings">
              <Button>View All Bookings</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <GuestHeader currentPage="bookings" />

      <div className="relative h-[320px] lg:h-[420px]">
        {booking.property?.images?.[0]?.url ? (
          <img
            src={booking.property.images[0].url}
            alt={booking.property?.title || "Property"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200" />
        )}

        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${primaryColor}dd 0%, ${primaryColor}55 100%)`,
          }}
        />

        <div className="absolute inset-0 flex items-end">
          <div className="max-w-[1440px] mx-auto w-full px-6 lg:px-8 pb-10">
            <Link
              href="/guest/bookings"
              className="inline-flex items-center gap-2 text-white mb-5 hover:underline"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Bookings
            </Link>

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div>
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 text-white"
                  style={{ backgroundColor: getStatusColor() }}
                >
                  {getStatusLabel()}
                </div>
                <h1 className="text-3xl lg:text-5xl font-semibold text-white mb-2">
                  {booking.property?.title || "Booking Details"}
                </h1>
                <div className="flex items-center gap-2 text-white text-base lg:text-lg">
                  <MapPin className="w-5 h-5" />
                  {booking.property?.city || ""}
                  {booking.property?.state ? `, ${booking.property.state}` : ""}
                </div>
              </div>

              <div className="px-6 py-4 rounded-xl backdrop-blur-sm bg-white/20">
                <div className="text-white/80 text-sm mb-1">
                  Confirmation Code
                </div>
                <div className="text-white text-xl lg:text-2xl font-mono font-bold">
                  BK-{String(booking.id).slice(0, 6).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8 rounded-2xl border bg-white border-gray-200">
              <h2 className="font-semibold mb-6 text-[24px] text-gray-900">
                Appointment Details
              </h2>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}14` }}
                  >
                    <Calendar
                      className="w-6 h-6"
                      style={{ color: primaryColor }}
                    />
                  </div>
                  <div>
                    <div className="text-sm mb-1 text-gray-500">Date</div>
                    <div className="font-semibold text-[18px] text-gray-900">
                      {formatDate(booking.checkInDate)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}14` }}
                  >
                    <Clock
                      className="w-6 h-6"
                      style={{ color: primaryColor }}
                    />
                  </div>
                  <div>
                    <div className="text-sm mb-1 text-gray-500">Time</div>
                    <div className="font-semibold text-[18px] text-gray-900">
                      {formatTime(booking.checkInTime || booking.checkInDate)}
                    </div>
                    <div className="text-sm mt-1 text-gray-500">
                      Duration based on stay period
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}14` }}
                  >
                    <Users
                      className="w-6 h-6"
                      style={{ color: primaryColor }}
                    />
                  </div>
                  <div>
                    <div className="text-sm mb-1 text-gray-500">Guests</div>
                    <div className="font-semibold text-[18px] text-gray-900">
                      {booking.totalGuests} guest
                      {booking.totalGuests > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}14` }}
                  >
                    <MapPin
                      className="w-6 h-6"
                      style={{ color: primaryColor }}
                    />
                  </div>
                  <div>
                    <div className="text-sm mb-1 text-gray-500">
                      Property Address
                    </div>
                    <div className="font-semibold text-[18px] text-gray-900">
                      {booking.property?.address || "Address unavailable"}
                    </div>
                    <button
                      type="button"
                      className="text-sm mt-2 hover:underline"
                      style={{ color: primaryColor }}
                      onClick={() =>
                        window.open(
                          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            booking.property?.address || "",
                          )}`,
                          "_blank",
                        )
                      }
                    >
                      Get Directions →
                    </button>
                  </div>
                </div>
              </div>

              {booking.specialRequests ? (
                <div className="mt-6 p-4 rounded-xl bg-gray-50">
                  <div className="text-sm font-semibold mb-2 text-gray-900">
                    Important Notes
                  </div>
                  <p className="text-gray-600">{booking.specialRequests}</p>
                </div>
              ) : null}
            </Card>

            <Card className="p-6 rounded-2xl border bg-white border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Payment Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Total Amount</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(booking.totalPrice, booking.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>Payment Status</span>
                  <span>{formatPaymentStatus(booking.paymentStatus)}</span>
                </div>
              </div>
            </Card>

            <div className="grid sm:grid-cols-2 gap-4">
              <Button
                className="h-12 rounded-xl font-medium text-white"
                style={{ backgroundColor: accentColor || primaryColor }}
                onClick={handleDownloadReceipt}
              >
                <Download className="w-5 h-5 mr-2" />
                Download Confirmation
              </Button>

              <Button
                variant="outline"
                className="h-12 rounded-xl font-medium"
                onClick={() =>
                  router.push(`/guest/messages?bookingId=${bookingId}`)
                }
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Message Host
              </Button>

              <Button
                variant="outline"
                className="h-12 rounded-xl font-medium"
                onClick={() => router.push(`/guest/bookings/${bookingId}/checkout`)}
              >
                Reschedule Viewing
              </Button>

              {canCancel ? (
                <Button
                  variant="outline"
                  className="h-12 rounded-xl font-medium border-red-500 text-red-600 hover:text-red-700"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <X className="w-5 h-5 mr-2" />
                  Cancel Booking
                </Button>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="p-6 rounded-2xl border bg-white border-gray-200">
              <h3 className="font-semibold mb-6 text-[18px] text-gray-900">
                Your Agent
              </h3>

              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <User className="w-7 h-7" style={{ color: primaryColor }} />
                </div>
                <div>
                  <div className="font-semibold text-[18px] text-gray-900">
                    {booking.property?.realtor?.businessName || "Property Host"}
                  </div>
                  <div className="text-sm text-gray-600">Property Specialist</div>
                </div>
              </div>

              <div className="space-y-3">
                {(booking.property?.realtor?.businessEmail || booking.property?.realtor?.user?.email) && (
                  <a
                    href={`mailto:${booking.property?.realtor?.businessEmail || booking.property?.realtor?.user?.email}`}
                    className="flex items-center gap-3 p-3 rounded-lg transition-all hover:shadow-sm bg-gray-50"
                  >
                    <Mail className="w-5 h-5" style={{ color: primaryColor }} />
                    <span className="text-sm text-gray-900">
                      {booking.property?.realtor?.businessEmail || booking.property?.realtor?.user?.email}
                    </span>
                  </a>
                )}

                <Button
                  className="w-full mt-2 h-11 rounded-xl font-medium text-white"
                  style={{ backgroundColor: secondaryColor || primaryColor }}
                  onClick={() =>
                    router.push(`/guest/messages?bookingId=${bookingId}`)
                  }
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Send Message
                </Button>
              </div>
            </Card>

            <Card className="p-6 rounded-2xl bg-gray-50 border border-gray-200">
              <h3 className="font-semibold mb-4 text-[18px] text-gray-900">
                Viewing Tips
              </h3>
              <ul className="space-y-3">
                {[
                  "Arrive 5-10 minutes early",
                  "Bring questions about the property",
                  "Take photos if permitted",
                  "Check neighborhood amenities",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                      style={{
                        backgroundColor: secondaryColor || primaryColor,
                      }}
                    />
                    <span className="text-gray-600">{tip}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>

        <AlertModal
          isOpen={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          onConfirm={() => cancelBookingMutation.mutate()}
          type="confirm"
          title="Cancel This Booking?"
          message={`Are you sure you want to cancel your viewing appointment for ${booking.property?.title || "this property"}? This action cannot be undone.`}
          confirmText="Yes, Cancel Booking"
          cancelText="Keep Booking"
          showCancel
        />
      </main>
    </div>
  );
}
