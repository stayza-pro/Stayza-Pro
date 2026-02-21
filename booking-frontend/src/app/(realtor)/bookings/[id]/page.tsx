"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Users,
  Mail,
  Home,
  Download,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useBranding } from "@/hooks/useBranding";
import { useQuery, useQueryClient } from "react-query";
import { bookingService } from "@/services/bookings";
import { paymentService } from "@/services/payments";
import { BookingStatus } from "@/types";
import { canDownloadReceipt, formatPaymentStatus } from "@/utils/bookingEnums";
import { EscrowStatusSection } from "@/components/booking/EscrowStatusSection";
import BookingLifecycleActions from "@/components/booking/BookingLifecycleActions";
import { toast as showToast } from "react-hot-toast";

const DISPLAY_TIMEZONE = "Africa/Lagos";

const formatDateInLagos = (
  value: string | Date,
  options?: Intl.DateTimeFormatOptions,
) =>
  new Date(value).toLocaleDateString("en-US", {
    timeZone: DISPLAY_TIMEZONE,
    ...options,
  });

export default function RealtorBookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { branding } = useBranding();
  const bookingId = params.id as string;

  const brandColor = branding?.colors?.primary || "#3B82F6";

  // Fetch booking details
  const {
    data: booking,
    isLoading,
    refetch: refetchBooking,
  } = useQuery({
    queryKey: ["realtor-booking", bookingId],
    queryFn: () => bookingService.getRealtorBooking(bookingId),
    enabled: !!user && !!bookingId,
  });

  const handleLifecycleRefresh = React.useCallback(async () => {
    await refetchBooking();
    await queryClient.invalidateQueries({
      queryKey: ["realtor-booking", bookingId],
    });
    await queryClient.invalidateQueries({ queryKey: ["realtor-bookings"] });
  }, [bookingId, queryClient, refetchBooking]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount || 0);

  const handleDownloadReceipt = async () => {
    const paymentId = booking?.payment?.id;

    if (!paymentId) {
      showToast.error("No receipt available yet.");
      return;
    }

    if (!canDownloadReceipt(booking?.paymentStatus)) {
      const paymentStatusLabel = booking?.paymentStatus
        ? formatPaymentStatus(booking.paymentStatus)
        : "Unknown";
      showToast.error(
        `Receipt available once payment is released. Current status: ${paymentStatusLabel}.`,
      );
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
    } catch (error) {
      showToast.error("Unable to download receipt.");
    }
  };

  // Refund calculation now handled by backend

  const calculateNights = () => {
    if (!booking) return 0;
    const start = new Date(booking.checkInDate);
    const end = new Date(booking.checkOutDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusConfig = (status: BookingStatus, stayStatus?: string) => {
    if (status === "ACTIVE" && stayStatus === "CHECKED_IN") {
      return {
        text: "Checked In",
        color: "#8B5CF6",
        backgroundColor: "#EDE9FE",
        borderColor: "#C4B5FD",
        icon: CheckCircle,
      };
    }

    if (status === "ACTIVE" && stayStatus === "CHECKED_OUT") {
      return {
        text: "Checked Out",
        color: "#6366F1",
        backgroundColor: "#E0E7FF",
        borderColor: "#A5B4FC",
        icon: CheckCircle,
      };
    }

    const configs = {
      PENDING: {
        text: "Pending",
        color: "#F59E0B",
        backgroundColor: "#FEF3C7",
        borderColor: "#FCD34D",
        icon: Clock,
      },
      ACTIVE: {
        text: "Active",
        color: "#10B981",
        backgroundColor: "#D1FAE5",
        borderColor: "#6EE7B7",
        icon: CheckCircle,
      },
      DISPUTED: {
        text: "Disputed",
        color: "#F97316",
        backgroundColor: "#FFEDD5",
        borderColor: "#FED7AA",
        icon: AlertCircle,
      },
      COMPLETED: {
        text: "Completed",
        color: "#10B981",
        backgroundColor: "#D1FAE5",
        borderColor: "#6EE7B7",
        icon: CheckCircle,
      },
      CANCELLED: {
        text: "Cancelled",
        color: "#EF4444",
        backgroundColor: "#FEE2E2",
        borderColor: "#FCA5A5",
        icon: XCircle,
      },
      EXPIRED: {
        text: "Expired",
        color: "#6B7280",
        backgroundColor: "#F3F4F6",
        borderColor: "#D1D5DB",
        icon: Clock,
      },
    };
    return configs[status] || configs.PENDING;
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-gray-200 rounded w-1/3"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Booking Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The booking you're looking for doesn't exist or you don't have
            access to it.
          </p>
          <button
            onClick={() => router.push("/bookings")}
            className="px-6 py-3 rounded-xl font-bold text-white"
            style={{ backgroundColor: brandColor }}
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  const status = getStatusConfig(booking.status, booking.stayStatus);
  const StatusIcon = status.icon;
  const nights = calculateNights();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.push("/bookings")}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 font-medium"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to bookings
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
          <div
            className="flex items-center space-x-2 px-4 py-2 rounded-full border-2 font-medium"
            style={{
              backgroundColor: status.backgroundColor,
              color: status.color,
              borderColor: status.borderColor,
            }}
          >
            <StatusIcon className="h-5 w-5" />
            <span>{status.text}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Information */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Home className="h-5 w-5 mr-2" />
              Property
            </h2>

            <div className="flex items-start space-x-4 mb-4">
              <div className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                {booking.property?.images?.[0]?.url ? (
                  <Image
                    src={booking.property.images[0].url}
                    alt={booking.property.title || "Property"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Home className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {booking.property?.title || "Property"}
                </h3>
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">
                    {booking.property?.address}, {booking.property?.city},{" "}
                    {booking.property?.state}
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="h-4 w-4 mr-1" />
                  <span className="text-sm">
                    {booking.totalGuests}{" "}
                    {booking.totalGuests === 1 ? "guest" : "guests"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Guest Information */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Guest Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Name</p>
                <p className="font-medium text-gray-900">
                  {booking.guest?.firstName} {booking.guest?.lastName}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  <p className="font-medium text-gray-900">
                    {booking.guest?.email}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Booking Date</p>
                <p className="font-medium text-gray-900">
                  {formatDateInLagos(booking.createdAt, {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Booking Information */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Booking Information
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Check-in</p>
                  <p className="font-semibold text-gray-900">
                    {formatDateInLagos(booking.checkInDate, {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDateInLagos(booking.checkInDate, {
                      weekday: "long",
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Check-out</p>
                  <p className="font-semibold text-gray-900">
                    {formatDateInLagos(booking.checkOutDate, {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDateInLagos(booking.checkOutDate, {
                      weekday: "long",
                    })}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-1">Duration</p>
                <p className="font-semibold text-gray-900">
                  {nights} {nights === 1 ? "night" : "nights"}
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-1">Booking ID</p>
                <p className="font-mono text-sm text-gray-900">{booking.id}</p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Payment Details
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Booking Amount</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(booking.totalPrice || 0)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status</span>
                <span className="font-medium text-gray-900 capitalize">
                  {booking.paymentStatus?.toLowerCase().replace(/_/g, " ")}
                </span>
              </div>

              {booking.payment?.reference && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Reference</span>
                  <span className="font-mono text-sm text-gray-900">
                    {booking.payment.reference}
                  </span>
                </div>
              )}

              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">
                  Total Amount
                </span>
                <span className="font-bold text-gray-900 text-lg">
                  {formatCurrency(booking.totalPrice || 0)}
                </span>
              </div>

              {/* Cancelled Booking Fee Breakdown */}
              {booking.status === "CANCELLED" && booking.payment && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Cancellation Breakdown
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Your portion (room fee % + cleaning):</span>
                      <span className="font-medium text-green-700">
                        View escrow for details
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Guest refund (room fee % + deposit):</span>
                      <span className="font-medium text-blue-700">
                        Processed automatically
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Platform fee (room fee % + service):</span>
                      <span className="font-medium text-gray-700">
                        Per cancellation policy
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 italic mt-3 pt-3 border-t">
                      Note: Cancellation fees are split based on timing. Check
                      escrow tracker for exact amounts released to you.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Escrow Status */}
          {(booking.status === "ACTIVE" ||
            booking.status === "DISPUTED" ||
            booking.status === "COMPLETED") && (
            <EscrowStatusSection booking={booking} viewType="host" />
          )}

          <BookingLifecycleActions
            booking={booking}
            role="REALTOR"
            onRefresh={handleLifecycleRefresh}
          />
        </div>

        {/* Sidebar Actions */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">
                Booking Tools
              </h3>
              <div className="space-y-3">
                <button
                  onClick={handleDownloadReceipt}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center font-medium text-gray-700"
                  disabled={!canDownloadReceipt(booking.paymentStatus)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </button>
              </div>
            </div>

            <div
              className="rounded-2xl p-6 border"
              style={{
                backgroundColor: brandColor + "10",
                borderColor: brandColor + "30",
              }}
            >
              <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-sm text-gray-700 mb-4">
                If you have any questions or need assistance with this booking,
                please contact support.
              </p>
              <button
                onClick={() => router.push("/contact")}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl hover:bg-white transition-all font-medium text-gray-700"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
