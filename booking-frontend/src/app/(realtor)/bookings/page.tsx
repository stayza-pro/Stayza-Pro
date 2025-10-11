"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useBranding } from "@/hooks/useBranding";
import { getRealtorSubdomain } from "@/utils/subdomain";
import { bookingService } from "@/services/bookings";
import {
  Copy,
  Eye,
  Calendar,
  User,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Booking } from "@/types";
import { format } from "date-fns";

type BookingStatus =
  | "all"
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

export default function RealtorBookingsPage() {
  const { user } = useAuth();
  const { branding } = useBranding();
  const realtorSubdomain = getRealtorSubdomain();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BookingStatus>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const brandColors = branding?.colors || {
    primary: "#3B82F6",
    secondary: "#1E40AF",
    accent: "#F59E0B",
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await bookingService.getHostBookings();

      // Filter bookings by status on client side if needed
      let allBookings = Array.isArray(response.data) ? response.data : [];
      if (statusFilter !== "all") {
        allBookings = allBookings.filter((b: any) => b.status === statusFilter);
      }
      setBookings(allBookings);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (bookingId: string) => {
    try {
      setActionLoading(bookingId);
      await bookingService.updateBookingStatus(bookingId, "CONFIRMED");
      await fetchBookings();
      alert("Booking confirmed successfully!");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to confirm booking");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      setActionLoading(bookingId);
      await bookingService.cancelBooking(
        bookingId,
        "Host cancelled the booking"
      );
      await fetchBookings();
      alert("Booking cancelled successfully!");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to cancel booking");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; color: string; bg: string; icon: any }
    > = {
      PENDING: {
        label: "Pending",
        color: "text-yellow-700",
        bg: "bg-yellow-100",
        icon: Clock,
      },
      CONFIRMED: {
        label: "Confirmed",
        color: "text-blue-700",
        bg: "bg-blue-100",
        icon: CheckCircle,
      },
      COMPLETED: {
        label: "Completed",
        color: "text-green-700",
        bg: "bg-green-100",
        icon: CheckCircle,
      },
      CANCELLED: {
        label: "Cancelled",
        color: "text-red-700",
        bg: "bg-red-100",
        icon: XCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color}`}
      >
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </span>
    );
  };

  const filteredBookings = bookings;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 flex-shrink-0">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Welcome back, {user?.firstName || "User"} 👋
            </h1>
            <p className="text-gray-600 flex items-center space-x-2">
              <span>Your website:</span>
              <span
                className="font-semibold px-3 py-1 rounded-md text-sm"
                style={{
                  color: brandColors.primary,
                  backgroundColor: brandColors.primary + "15",
                }}
              >
                {realtorSubdomain || "yourcompany"}.stayza.pro
              </span>
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() =>
                copyToClipboard(
                  `https://${realtorSubdomain || "yourcompany"}.stayza.pro`
                )
              }
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </button>
            <button
              onClick={() =>
                window.open(
                  `https://${realtorSubdomain || "yourcompany"}.stayza.pro`,
                  "_blank"
                )
              }
              className="px-4 py-2 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center space-x-2"
              style={{ backgroundColor: brandColors.primary }}
            >
              <Eye className="w-4 h-4" />
              <span>Preview Site</span>
            </button>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Host Bookings
              </h2>
              <p className="text-gray-600 mt-1">
                Manage all your property bookings in one place
              </p>
            </div>
            <button
              onClick={fetchBookings}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Loader2 className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {["all", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status as BookingStatus)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        statusFilter === status
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {status === "all"
                        ? "All Bookings"
                        : status.charAt(0) + status.slice(1).toLowerCase()}
                    </button>
                  )
                )}
              </nav>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading bookings...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Error Loading Bookings
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={fetchBookings}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredBookings.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Bookings Found
                </h3>
                <p className="text-gray-600">
                  {statusFilter === "all"
                    ? "You don't have any bookings yet. They will appear here once guests book your properties."
                    : `No ${statusFilter.toLowerCase()} bookings found.`}
                </p>
              </div>
            </div>
          )}

          {/* Bookings List */}
          {!loading && !error && filteredBookings.length > 0 && (
            <div className="space-y-4">
              {filteredBookings.map((booking: any) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {booking.property?.title || "Property"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Booking #{booking.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Guest</p>
                        <p className="text-sm font-medium text-gray-900">
                          {booking.guest?.firstName || "N/A"}{" "}
                          {booking.guest?.lastName || ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Check-in</p>
                        <p className="text-sm font-medium text-gray-900">
                          {booking.checkInDate
                            ? format(
                                new Date(booking.checkInDate),
                                "MMM dd, yyyy"
                              )
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Check-out</p>
                        <p className="text-sm font-medium text-gray-900">
                          {booking.checkOutDate
                            ? format(
                                new Date(booking.checkOutDate),
                                "MMM dd, yyyy"
                              )
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Total Amount</p>
                        <p className="text-sm font-medium text-gray-900">
                          ${booking.totalPrice?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {booking.status === "PENDING" && (
                    <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleConfirm(booking.id)}
                        disabled={actionLoading === booking.id}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        {actionLoading === booking.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        <span>Confirm Booking</span>
                      </button>
                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={actionLoading === booking.id}
                        className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Decline</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
