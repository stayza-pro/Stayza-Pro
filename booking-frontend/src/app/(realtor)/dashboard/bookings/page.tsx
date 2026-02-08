"use client";

import React, { useState, useEffect } from "react";
import { bookingService } from "@/services/bookings";
import { Booking } from "@/types";
import { useAlert } from "@/context/AlertContext";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import {
  Calendar,
  Clock,
  User,
  Home,
  DollarSign,
  Check,
  X,
  Eye,
  Filter,
  Search,
  Loader2,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";

type BookingStatus =
  | "ALL"
  | "PENDING"
  | "ACTIVE"
  | "CANCELLED"
  | "COMPLETED";

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ACTIVE: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  COMPLETED: "", // Will use dynamic brand colors
};

const STATUS_FILTERS: { value: BookingStatus; label: string }[] = [
  { value: "ALL", label: "All Bookings" },
  { value: "PENDING", label: "Pending" },
  { value: "ACTIVE", label: "Active" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "COMPLETED", label: "Completed" },
];

export default function BookingsPage() {
  const { showSuccess, showError } = useAlert();
  const { brandColor } = useRealtorBranding();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [currentPage, selectedStatus]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const searchParams: any = {
        page: currentPage,
        limit: 20,
      };

      if (selectedStatus !== "ALL") {
        searchParams.status = selectedStatus;
      }

      const response = await bookingService.getHostBookings(searchParams);

      setBookings(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (
    bookingId: string,
    newStatus: "ACTIVE" | "CANCELLED"
  ) => {
    try {
      await bookingService.updateBookingStatus(bookingId, newStatus);
      fetchBookings(); // Refresh list
      setShowDetailModal(false);
      showSuccess(`Booking ${newStatus.toLowerCase()} successfully!`);
    } catch (error) {
      
      showError("Failed to update booking status");
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      booking.property?.title?.toLowerCase().includes(query) ||
      booking.guest?.firstName?.toLowerCase().includes(query) ||
      booking.guest?.lastName?.toLowerCase().includes(query) ||
      booking.guest?.email?.toLowerCase().includes(query)
    );
  });

  const openDetailModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2
            className="h-12 w-12 animate-spin mx-auto mb-4"
            style={{ color: brandColor }}
          />
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-600 mt-1">Manage your property bookings</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by property, guest name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  setSelectedStatus(filter.value);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedStatus === filter.value
                    ? "text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                style={
                  selectedStatus === filter.value
                    ? { backgroundColor: brandColor }
                    : undefined
                }
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Bookings Found
          </h3>
          <p className="text-gray-600">
            {selectedStatus === "ALL"
              ? "You don't have any bookings yet"
              : `No ${selectedStatus.toLowerCase()} bookings`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: brandColor + "20" }}
                        >
                          <User
                            className="h-5 w-5"
                            style={{ color: brandColor }}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.guest?.firstName} {booking.guest?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.guest?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Home className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {booking.property?.title || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {booking.checkInDate &&
                          format(new Date(booking.checkInDate), "MMM dd, yyyy")}
                      </div>
                      <div className="text-sm text-gray-500">
                        to{" "}
                        {booking.checkOutDate &&
                          format(
                            new Date(booking.checkOutDate),
                            "MMM dd, yyyy"
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {booking.totalGuests}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${booking.totalPrice?.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          booking.status === "COMPLETED"
                            ? ""
                            : STATUS_COLORS[
                                booking.status as keyof typeof STATUS_COLORS
                              ]
                        }`}
                        style={
                          booking.status === "COMPLETED"
                            ? {
                                backgroundColor: brandColor + "20",
                                color: brandColor,
                              }
                            : undefined
                        }
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openDetailModal(booking)}
                        className="mr-4 hover:opacity-80"
                        style={{ color: brandColor }}
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      {booking.status === "PENDING" && (
                        <>
                          <button
                            onClick={() =>
                              handleStatusUpdate(booking.id, "ACTIVE")
                            }
                            className="text-green-600 hover:text-green-900 mr-2"
                            title="Confirm"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() =>
                              handleStatusUpdate(booking.id, "CANCELLED")
                            }
                            className="text-red-600 hover:text-red-900"
                            title="Cancel"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Booking Detail Modal */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Booking Details
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Status */}
                <div>
                  <span
                    className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                      STATUS_COLORS[
                        selectedBooking.status as keyof typeof STATUS_COLORS
                      ]
                    }`}
                  >
                    {selectedBooking.status}
                  </span>
                </div>

                {/* Property */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Property
                  </h3>
                  <div className="flex items-start">
                    <Home className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedBooking.property?.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedBooking.property?.address},{" "}
                        {selectedBooking.property?.city}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Guest */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Guest Information
                  </h3>
                  <div className="flex items-start">
                    <User className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedBooking.guest?.firstName}{" "}
                        {selectedBooking.guest?.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedBooking.guest?.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Stay Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Check-in
                        </p>
                        <p className="text-sm text-gray-900">
                          {selectedBooking.checkInDate &&
                            format(
                              new Date(selectedBooking.checkInDate),
                              "MMMM dd, yyyy"
                            )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Check-out
                        </p>
                        <p className="text-sm text-gray-900">
                          {selectedBooking.checkOutDate &&
                            format(
                              new Date(selectedBooking.checkOutDate),
                              "MMMM dd, yyyy"
                            )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">
                      {selectedBooking.totalGuests} guest
                      {selectedBooking.totalGuests !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Payment Details
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">
                        ${selectedBooking.totalPrice?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-medium pt-2 border-t border-gray-200">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">
                        ${selectedBooking.totalPrice?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {selectedBooking.status === "PENDING" && (
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() =>
                        handleStatusUpdate(selectedBooking.id, "ACTIVE")
                      }
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Check className="h-4 w-4" />
                      Confirm Booking
                    </button>
                    <button
                      onClick={() =>
                        handleStatusUpdate(selectedBooking.id, "CANCELLED")
                      }
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <X className="h-4 w-4" />
                      Cancel Booking
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


