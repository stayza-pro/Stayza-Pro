"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Search,
  Filter,
  Eye,
  DollarSign,
  Users,
  AlertTriangle,
} from "lucide-react";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import BookingDetailsModal from "@/components/admin/BookingDetailsModal";
import DisputeResolutionModal from "@/components/admin/DisputeResolutionModal";
import {
  getAdminBookings,
  getBookingStats,
  formatBookingStatus,
  getBookingStatusColor,
  formatCurrency,
  getBookingDuration,
  BookingStatsResponse,
  buildFilterSummary,
  type AdminBooking,
  type BookingSearchFilters,
} from "@/services/adminBookingsService";
import { BookingStatus } from "@/types";
import { getAnalytics, PlatformAnalytics } from "@/services/adminService";

interface BookingsPageProps {}

const BookingsManagementPage: React.FC<BookingsPageProps> = () => {
  const getErrorMessage = (error: unknown, fallback: string): string => {
    if (!error || typeof error !== "object") {
      return fallback;
    }

    const maybeError = error as { message?: string };
    return maybeError.message || fallback;
  };

  // State management
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [stats, setStats] = useState<BookingStatsResponse["data"] | null>(null);
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string>("");
  const [selectedDisputeId, setSelectedDisputeId] = useState<string>("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filter state
  const [filters, setFilters] = useState<BookingSearchFilters>({
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Fetch bookings data
  const fetchBookings = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAdminBookings(filters);
      setBookings(response.data.bookings);
      setCurrentPage(response.data.pagination.currentPage);
      setTotalPages(response.data.pagination.totalPages);
      setTotalItems(response.data.pagination.totalItems);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Failed to fetch bookings"));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch stats data
  const fetchStats = React.useCallback(async () => {
    try {
      const response = await getBookingStats(30);
      setStats(response.data);
    } catch (error: unknown) {
      // Keep existing stats if refresh fails.
    }
  }, []);

  // Fetch analytics data for realtor counts
  const fetchAnalytics = React.useCallback(async () => {
    try {
      const data = await getAnalytics("30d");
      setAnalytics(data);
    } catch (error: unknown) {
      // Keep existing analytics if refresh fails.
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchBookings();
    fetchStats();
    fetchAnalytics();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchBookings();
      fetchStats();
      fetchAnalytics();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchAnalytics, fetchBookings, fetchStats]);

  // Handle page changes
  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // Modal handlers
  const handleViewBooking = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setShowDetailsModal(true);
  };

  const handleViewDispute = (disputeId: string) => {
    setSelectedDisputeId(disputeId);
    setShowDisputeModal(true);
  };

  // Statistics cards component
  const StatsCards: React.FC = () => {
    if (!stats) return null;

    const cards = [
      {
        title: "Total Bookings",
        value: Number(stats.overview.total ?? 0).toLocaleString("en-NG"),
        icon: <Calendar className="h-6 w-6" />,
        color: "bg-blue-500",
        change: `+${stats.overview.recent} this period`,
      },
      {
        title: "Total Revenue",
        value: formatCurrency(stats.metrics.totalRevenue),
        icon: <DollarSign className="h-6 w-6" />,
        color: "bg-green-500",
        change: `Commission: ${formatCurrency(
          stats.metrics.totalRevenue * 0.05
        )}`,
      },
      {
        title: "Active Realtors",
        value: (analytics?.overview?.activeRealtors ?? 0).toString(),
        icon: <Users className="h-6 w-6" />,
        color: "bg-orange-500",
        change: `${
          analytics?.overview?.pendingRealtors ?? 0
        } pending approvals`,
      },
      {
        title: "Cancellation Rate",
        value: `${stats.metrics.cancellationRate.toFixed(1)}%`,
        icon: <AlertTriangle className="h-6 w-6" />,
        color: "bg-red-500",
        change: `${stats.overview.cancelled} cancelled bookings`,
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`${card.color} text-white rounded-lg p-3 mr-4`}>
                {card.icon}
              </div>
              <div>
                <p className="text-sm text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500">{card.change}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Search and filters component
  const SearchAndFilters: React.FC = () => {
    return (
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search bookings by reference, guest name, or property..."
                  value={filters.search || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      search: e.target.value,
                      page: 1,
                    }))
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filter Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg ${
                  showFilters
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-gray-300 text-gray-700 bg-gray-50"
                }`}
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        status: e.target.value as BookingStatus,
                        page: 1,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="ACTIVE">Active</option>
                    <option value="DISPUTED">Disputed</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <select
                    value={filters.dateRange || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        dateRange: e.target.value,
                        page: 1,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Time</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="last7days">Last 7 days</option>
                    <option value="last30days">Last 30 days</option>
                    <option value="thisMonth">This month</option>
                    <option value="lastMonth">Last month</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split("-");
                      setFilters((prev) => ({
                        ...prev,
                        sortBy: sortBy as
                          | "createdAt"
                          | "checkInDate"
                          | "totalPrice"
                          | "status",
                        sortOrder: sortOrder as "asc" | "desc",
                        page: 1,
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="createdAt-desc">Newest First</option>
                    <option value="createdAt-asc">Oldest First</option>
                    <option value="checkInDate-desc">
                      Check-in Date (Latest)
                    </option>
                    <option value="checkInDate-asc">
                      Check-in Date (Earliest)
                    </option>
                    <option value="totalAmount-desc">Amount (Highest)</option>
                    <option value="totalAmount-asc">Amount (Lowest)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() =>
                      setFilters({
                        page: 1,
                        limit: 20,
                        sortBy: "createdAt",
                        sortOrder: "desc",
                      })
                    }
                    className="w-full px-4 py-2 text-gray-600 bg-gray-100 rounded-lg"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              {/* Active Filter Summary */}
              <div className="mt-4">
                <div className="text-sm text-gray-600">
                  {buildFilterSummary(filters)} | {totalItems} bookings found
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Bookings table component
  const BookingsTable: React.FC = () => {
    if (loading) {
      return (
        <div className="bg-white rounded-lg shadow">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading bookings...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-white rounded-lg shadow">
          <div className="p-8 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 font-medium">Error loading bookings</p>
            <p className="text-gray-500 text-sm mt-1">{error}</p>
            <button
              onClick={() => fetchBookings()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    if (bookings.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow">
          <div className="p-8 text-center">
            <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 font-medium">No bookings found</p>
            <p className="text-gray-500 text-sm mt-1">
              Try adjusting your search criteria or filters
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking Details
                </th>
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
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Refund Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  {/* Booking Details */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.bookingReference}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </div>
                        {booking.hasDisputes && (
                          <div className="flex items-center mt-1">
                            <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                            <span className="text-xs text-red-600">
                              {booking.disputeCount} dispute
                              {booking.disputeCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Guest */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.guestName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {booking.guestEmail}
                    </div>
                  </td>

                  {/* Property */}
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                      {booking.propertyTitle}
                    </div>
                    <div className="text-sm text-gray-500">
                      {booking.propertyLocation}
                    </div>
                  </td>

                  {/* Dates */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(booking.checkInDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      to {new Date(booking.checkOutDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {getBookingDuration(
                        booking.checkInDate,
                        booking.checkOutDate
                      )}
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(booking.totalAmount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Commission: {formatCurrency(booking.commissionAmount)}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBookingStatusColor(
                        booking.status
                      )}`}
                    >
                      {formatBookingStatus(booking.status)}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      Updated {new Date(booking.updatedAt).toLocaleString()}
                    </div>
                  </td>

                  {/* Refund Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {booking.refundStatus ? (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          booking.refundStatus === "completed"
                            ? "bg-green-100 text-green-800"
                            : booking.refundStatus === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {booking.refundStatus === "completed"
                          ? "Refunded"
                          : booking.refundStatus === "pending"
                          ? "Pending"
                          : "Failed"}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">No refund</span>
                    )}
                    {booking.refundAmount && (
                      <div className="text-xs text-gray-500 mt-1">
                        {formatCurrency(booking.refundAmount)}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewBooking(booking.id)}
                        className="text-blue-600 p-1 rounded"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {booking.hasDisputes && (
                        <button
                          onClick={() =>
                            handleViewDispute(`dispute-${booking.id}`)
                          }
                          className="text-orange-600 p-1 rounded"
                          title="View Dispute"
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * (filters.limit || 20) + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * (filters.limit || 20), totalItems)}
                  </span>{" "}
                  of <span className="font-medium">{totalItems}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNumber
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <AdminNavigation />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Booking Management
              </h1>
              <p className="text-gray-600 mt-2">
                Monitor and manage all platform bookings from this central
                dashboard
              </p>
            </div>

            {/* Statistics cards */}
            <StatsCards />

            {/* Search and filters */}
            <SearchAndFilters />

            {/* Bookings table */}
            <BookingsTable />

            {/* Modals */}
            <BookingDetailsModal
              isOpen={showDetailsModal}
              onClose={() => setShowDetailsModal(false)}
              bookingId={selectedBookingId}
            />

            <DisputeResolutionModal
              isOpen={showDisputeModal}
              onClose={() => setShowDisputeModal(false)}
              disputeId={selectedDisputeId}
              // onResolveDispute={handleResolveDispute}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default BookingsManagementPage;
