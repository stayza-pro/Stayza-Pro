"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Users,
  Phone,
  Mail,
  Home,
  Download,
  X,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Ban,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useBranding } from "@/hooks/useBranding";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { bookingService } from "@/services/bookings";
import { paymentService } from "@/services/payments";
import { BookingStatus } from "@/types";
import { canDownloadReceipt, formatPaymentStatus } from "@/utils/bookingEnums";
import { EscrowStatusSection } from "@/components/booking/EscrowStatusSection";
import { format } from "date-fns";
import { toast as showToast } from "react-hot-toast";

export default function RealtorBookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { branding } = useBranding();
  const queryClient = useQueryClient();
  const bookingId = params.id as string;

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  const brandColor = branding?.colors?.primary || "#3B82F6";

  // Fetch booking details
  const { data: booking, isLoading } = useQuery({
    queryKey: ["realtor-booking", bookingId],
    queryFn: () => bookingService.getRealtorBooking(bookingId),
    enabled: !!user && !!bookingId,
  });

  // Cancel booking mutation
  const cancelMutation = useMutation({
    mutationFn: (reason: string) =>
      bookingService.cancelBooking(bookingId, reason),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ["realtor-booking", bookingId],
      });
      queryClient.invalidateQueries({ queryKey: ["realtor-bookings"] });
      setShowCancelModal(false);
      setCancelReason("");

      // Show refund breakdown using new structure
      if (response?.data?.refund) {
        const refund = response.data.refund;
        const totals = refund.totals;

        showToast.success(
          `Booking Cancelled. Refund processed automatically (${
            refund.tier
          } tier). Guest receives: ₦${
            totals.customerRefund?.toLocaleString() || 0
          }, You receive: ₦${totals.realtorPortion?.toLocaleString() || 0}`,
          { duration: 6000 }
        );
      } else {
        showToast.success("Booking cancelled successfully");
      }
    },
    onError: (error: any) => {
      showToast.error(
        error?.response?.data?.message || "Failed to cancel booking"
      );
    },
  });

  // Request refund mutation (for disputes/cancellations)
  const refundMutation = useMutation({
    mutationFn: ({ amount, reason }: { amount: number; reason: string }) =>
      bookingService.requestRefund(bookingId, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["realtor-booking", bookingId],
      });
      setShowRefundModal(false);
      setRefundAmount("");
      setRefundReason("");
    },
  });

  const handleCancelBooking = () => {
    if (!cancelReason.trim()) {
      alert("Please provide a cancellation reason");
      return;
    }
    cancelMutation.mutate(cancelReason);
  };

  const handleRequestRefund = () => {
    const amount = parseFloat(refundAmount);
    if (!amount || amount <= 0) {
      alert("Please provide a valid refund amount");
      return;
    }
    if (!refundReason.trim()) {
      alert("Please provide a refund reason");
      return;
    }
    refundMutation.mutate({ amount, reason: refundReason });
  };

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
        `Receipt available once payment is released. Current status: ${paymentStatusLabel}.`
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

  const getStatusConfig = (status: BookingStatus) => {
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
      PAID: {
        text: "Paid",
        color: "#10B981",
        backgroundColor: "#D1FAE5",
        borderColor: "#6EE7B7",
        icon: CheckCircle,
      },
      CONFIRMED: {
        text: "Confirmed",
        color: "#3B82F6",
        backgroundColor: "#DBEAFE",
        borderColor: "#93C5FD",
        icon: CheckCircle,
      },
      DISPUTED: {
        text: "Disputed",
        color: "#F97316",
        backgroundColor: "#FFEDD5",
        borderColor: "#FED7AA",
        icon: AlertCircle,
      },
      CHECKED_IN: {
        text: "Checked In",
        color: "#8B5CF6",
        backgroundColor: "#EDE9FE",
        borderColor: "#C4B5FD",
        icon: CheckCircle,
      },
      CHECKED_OUT: {
        text: "Checked Out",
        color: "#6366F1",
        backgroundColor: "#E0E7FF",
        borderColor: "#A5B4FC",
        icon: CheckCircle,
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
      DISPUTE_OPENED: {
        text: "Dispute",
        color: "#F97316",
        backgroundColor: "#FFEDD5",
        borderColor: "#FED7AA",
        icon: AlertCircle,
      },
    };
    return configs[status] || configs.PENDING;
  };

  const canCancel = () => {
    return (
      booking &&
      (booking.status === "PENDING" ||
        booking.status === "ACTIVE" ||
        booking.status === "PAID" ||
        booking.status === "CONFIRMED")
    );
  };

  const canRequestRefund = () => {
    return (
      booking &&
      (booking.status === "CANCELLED" ||
        booking.status === "DISPUTED" ||
        booking.status === "DISPUTE_OPENED" ||
        booking.status === "COMPLETED")
    );
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

  const status = getStatusConfig(booking.status);
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
                  {format(new Date(booking.createdAt), "MMM dd, yyyy")}
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
                    {format(new Date(booking.checkInDate), "MMM dd, yyyy")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(booking.checkInDate), "EEEE")}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Check-out</p>
                  <p className="font-semibold text-gray-900">
                    {format(new Date(booking.checkOutDate), "MMM dd, yyyy")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(booking.checkOutDate), "EEEE")}
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
                  ₦{(booking.totalPrice || 0).toLocaleString()}
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
                  ₦{(booking.totalPrice || 0).toLocaleString()}
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
            booking.status === "PAID" ||
            booking.status === "CONFIRMED" ||
            booking.status === "CHECKED_IN" ||
            booking.status === "CHECKED_OUT" ||
            booking.status === "COMPLETED") && (
            <EscrowStatusSection booking={booking} viewType="host" />
          )}
        </div>

        {/* Sidebar Actions */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleDownloadReceipt}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center font-medium text-gray-700"
                  disabled={!canDownloadReceipt(booking.paymentStatus)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </button>

                {canCancel() && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full px-4 py-3 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-all flex items-center justify-center font-medium"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Cancel Booking
                  </button>
                )}

                {canRequestRefund() && (
                  <button
                    onClick={() => setShowRefundModal(true)}
                    className="w-full px-4 py-3 rounded-xl text-white font-medium hover:opacity-90 transition-all flex items-center justify-center"
                    style={{ backgroundColor: brandColor }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Request Refund
                  </button>
                )}
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

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Cancel Booking
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel this booking? Please provide a
              reason for cancellation.
            </p>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              placeholder="Reason for cancellation..."
            />

            <div className="flex space-x-3">
              <button
                onClick={handleCancelBooking}
                className="flex-1 px-4 py-3 rounded-xl font-medium text-white"
                style={{ backgroundColor: brandColor }}
                disabled={cancelMutation.isLoading}
              >
                {cancelMutation.isLoading ? "Cancelling..." : "Confirm Cancel"}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                disabled={cancelMutation.isLoading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Request Refund
            </h3>
            <p className="text-gray-600 mb-4">
              Submit a refund request for this booking. The admin will review
              and process it.
            </p>

            {/* Refund info displayed in cancellation toast - removed complex breakdown */}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refund Amount (₦)
              </label>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                max={booking.totalPrice}
              />
              <p className="text-xs text-gray-500 mt-1">
                Max: ₦{booking.totalPrice.toLocaleString()}
              </p>
            </div>

            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              placeholder="Reason for refund..."
            />

            <div className="flex space-x-3">
              <button
                onClick={handleRequestRefund}
                className="flex-1 px-4 py-3 rounded-xl font-medium text-white"
                style={{ backgroundColor: brandColor }}
                disabled={refundMutation.isLoading}
              >
                {refundMutation.isLoading ? "Requesting..." : "Submit Request"}
              </button>
              <button
                onClick={() => setShowRefundModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                disabled={refundMutation.isLoading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
