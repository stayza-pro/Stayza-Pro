"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  MapPin,
  Download,
  XCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { bookingService } from "@/services/bookings";
import { paymentService } from "@/services/payments";
import { canDownloadReceipt, formatPaymentStatus } from "@/utils/bookingEnums";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import BookingLifecycleActions from "@/components/booking/BookingLifecycleActions";
import { Button, Card } from "@/components/ui";
import AlertModal from "@/components/ui/AlertModal";
import { normalizeImageUrl } from "@/utils/imageUrl";

const DISPLAY_TIMEZONE = "Africa/Lagos";

export default function GuestBookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bookingId = params.id as string;

  const [authChecked, setAuthChecked] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [previewData, setPreviewData] = useState<{
    canCancel: boolean;
    refundInfo?: {
      totals?: { customerRefund?: number };
      currency?: string;
      warning?: string | null;
    };
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const {
    brandColor: primaryColor,
    secondaryColor,
    accentColor,
  } = useRealtorBranding();
  const primaryPale = "#e8f1f8";
  const secondarySurface = "#f9f4ef";

  React.useEffect(() => {
    if (!isLoading && (isAuthenticated || !authChecked)) {
      setAuthChecked(true);
    }
  }, [isLoading, isAuthenticated, authChecked]);

  React.useEffect(() => {
    if (authChecked && !isLoading && !isAuthenticated) {
      const returnTo =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : `/guest/bookings/${bookingId}`;
      router.push(`/guest/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [authChecked, isLoading, isAuthenticated, router, bookingId]);

  React.useEffect(() => {
    if (authChecked && !isLoading && user && user.role !== "GUEST") {
      const returnTo =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : `/guest/bookings/${bookingId}`;
      router.push(`/guest/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [authChecked, isLoading, user, router, bookingId]);

  const {
    data: booking,
    isLoading: bookingLoading,
    refetch: refetchBooking,
  } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => bookingService.getBooking(bookingId),
    enabled: !!user && user.role === "GUEST" && !!bookingId,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 30 * 1000,
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
      timeZone: DISPLAY_TIMEZONE,
    });

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
      timeZone: DISPLAY_TIMEZONE,
    });
  };

  const formatScheduledTime = (value?: string | null) => {
    if (!value) return "Not scheduled yet";

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
          timeZone: DISPLAY_TIMEZONE,
        });
      }
    }

    return value;
  };

  const timeLabel = useMemo(() => {
    if (!booking) return "Not scheduled yet";
    const stayStatus = booking.stayStatus;
    const checkedInOrOut =
      stayStatus === "CHECKED_IN" || stayStatus === "CHECKED_OUT";

    if (checkedInOrOut && booking.checkInTime) {
      return formatTime(booking.checkInTime);
    }

    if (booking.property?.checkInTime) {
      return formatScheduledTime(booking.property.checkInTime);
    }

    return "Not scheduled yet";
  }, [booking]);

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

  const bookAgainUrl = useMemo(() => {
    if (!booking) return "";
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
  }, [booking, user?.email, user?.firstName, user?.lastName, user?.phone]);

  const heroImageUrl = useMemo(() => {
    const firstImage =
      (
        booking?.property?.images as Array<
          | string
          | {
              url?: string | null;
              imageUrl?: string | null;
              src?: string | null;
            }
        >
      )?.[0] ?? null;
    return normalizeImageUrl(firstImage);
  }, [booking?.property?.images]);

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
    const isActiveOrPending =
      booking.status === "PENDING" || booking.status === "ACTIVE";
    const hoursUntilCheckIn =
      (new Date(booking.checkInDate).getTime() - Date.now()) / 3_600_000;
    return isActiveOrPending && hoursUntilCheckIn >= 24;
  }, [booking]);

  const canCompletePayment = useMemo(() => {
    if (!booking) return false;
    return (
      booking.paymentStatus === "INITIATED" && booking.status === "PENDING"
    );
  }, [booking]);

  const handleCancelClick = React.useCallback(async () => {
    if (!bookingId) return;
    setPreviewLoading(true);
    try {
      const preview = await bookingService.previewCancellation(bookingId);
      setPreviewData(preview);
    } catch {
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
    setShowCancelDialog(true);
  }, [bookingId]);

  const handleLifecycleRefresh = React.useCallback(async () => {
    await refetchBooking();
    await queryClient.invalidateQueries({ queryKey: ["guest-bookings"] });
    await queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
  }, [bookingId, queryClient, refetchBooking]);

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
      <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
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
      <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
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
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#f8fafc" }}
    >
      <GuestHeader currentPage="bookings" />

      <div className="relative h-[400px] lg:h-[500px]">
        {heroImageUrl ? (
          <img
            src={heroImageUrl}
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
          <div className="max-w-[1440px] mx-auto w-full px-6 lg:px-8 pb-12">
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
                <h1 className="text-4xl lg:text-5xl font-semibold text-white mb-3">
                  {booking.property?.title || "Booking Details"}
                </h1>
                <div className="flex items-center gap-2 text-white text-lg">
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
                Booking Details
              </h2>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: primaryPale }}
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
                    <div className="text-sm mt-1 text-gray-500">
                      to {formatDate(booking.checkOutDate)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: primaryPale }}
                  >
                    <Clock
                      className="w-6 h-6"
                      style={{ color: primaryColor }}
                    />
                  </div>
                  <div>
                    <div className="text-sm mb-1 text-gray-500">
                      Check-in Time
                    </div>
                    <div className="font-semibold text-[18px] text-gray-900">
                      {timeLabel}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: primaryPale }}
                  >
                    <Clock
                      className="w-6 h-6"
                      style={{ color: primaryColor }}
                    />
                  </div>
                  <div>
                    <div className="text-sm mb-1 text-gray-500">
                      Check-out Time
                    </div>
                    <div className="font-semibold text-[18px] text-gray-900">
                      {booking.checkOutTime
                        ? formatTime(booking.checkOutTime)
                        : formatScheduledTime(booking.property?.checkOutTime)}
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2 flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: primaryPale }}
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
                      Get Directions {"->"}
                    </button>
                  </div>
                </div>
              </div>

              {booking.specialRequests ? (
                <div
                  className="mt-6 p-4 rounded-xl"
                  style={{ backgroundColor: secondarySurface }}
                >
                  <div className="text-sm font-semibold mb-2 text-gray-900">
                    Important Notes
                  </div>
                  <p className="text-gray-600">{booking.specialRequests}</p>
                </div>
              ) : null}
            </Card>

            <BookingLifecycleActions
              booking={booking}
              role="GUEST"
              onRefresh={handleLifecycleRefresh}
            />

            {canCompletePayment && (
              <Button
                className="w-full h-12 rounded-xl font-semibold text-white mb-4"
                style={{ backgroundColor: accentColor || primaryColor }}
                onClick={() =>
                  router.push(
                    `/booking/${booking.propertyId}/payment?bookingId=${booking.id}`,
                  )
                }
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Complete Payment
              </Button>
            )}

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
                onClick={() => {
                  if (!bookAgainUrl) {
                    toast.error("Unable to open Book Again right now.");
                    return;
                  }
                  router.push(bookAgainUrl);
                }}
              >
                Book Again
              </Button>

              {canCancel ? (
                <Button
                  variant="outline"
                  className="sm:col-span-2 h-12 rounded-xl font-medium border-red-500 text-red-600 hover:text-red-700"
                  onClick={handleCancelClick}
                  disabled={previewLoading}
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  {previewLoading ? "Loading..." : "Cancel Booking"}
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <AlertModal
          isOpen={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          onConfirm={() => cancelBookingMutation.mutate()}
          type="confirm"
          title="Cancel This Booking?"
          message={`Are you sure you want to cancel your booking for ${booking.property?.title || "this property"}? ${
            previewData?.refundInfo?.totals?.customerRefund != null
              ? `You will receive a refund of ${previewData.refundInfo.currency || booking.currency || ""} ${previewData.refundInfo.totals.customerRefund.toLocaleString("en-NG", { minimumFractionDigits: 2 })} (90% room fee + full security deposit). `
              : ""
          }This action cannot be undone.`}
          confirmText="Yes, Cancel Booking"
          cancelText="Keep Booking"
          showCancel
        />
      </main>
    </div>
  );
}
