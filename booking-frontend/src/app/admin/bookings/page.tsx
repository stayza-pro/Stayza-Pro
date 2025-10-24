"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import BookingDetailsModal from "@/components/admin/BookingDetailsModal";
import DisputeResolutionModal from "@/components/admin/DisputeResolutionModal";
import {
  getAdminBookings,
  getBookingStats,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  formatBookingStatus,
  getBookingStatusColor,
  formatCurrency,
  getBookingDuration,
  canCancelBooking,
  buildFilterSummary,
  type AdminBooking,
  type BookingSearchFilters,
  type BookingStatus,
} from "@/services/adminBookingsService";

interface BookingsPageProps {}

const BookingsManagementPage: React.FC<BookingsPageProps> = () => {
  // State management
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
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

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch bookings data
  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAdminBookings(filters);
      setBookings(response.data.bookings);
      setCurrentPage(response.data.page);
      setTotalPages(response.data.totalPages);
      setTotalItems(response.data.total);
    } catch (error: any) {
      setError(error.message || "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats data
  const fetchStats = async () => {
    try {
      const response = await getBookingStats({
        period: "30d",
        includeDetails: true,
      });
      setStats(response.data);
    } catch (error: any) {
      console.error("Failed to fetch stats:", error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, [filters]);

  // Handle page changes
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
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

  const handleBookingStatusUpdate = async (bookingId: string, status: string, reason?: string) => {
    try {
      setActionLoading(bookingId);
      await updateBookingStatus(bookingId, { status: status as BookingStatus, reason: reason || '' });
      await fetchBookings();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBookingCancellation = async (bookingId: string, reason: string, refundAmount: number) => {
    try {
      setActionLoading(bookingId);
      // Convert refund amount to percentage for the service call
      const booking = bookings.find(b => b.id === bookingId);
      const refundPercentage = booking ? (refundAmount / booking.totalAmount) * 100 : 100;
      await cancelBooking(bookingId, { reason, refundPercentage });
      await fetchBookings();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveDispute = async (disputeId: string, resolution: any) => {
    try {
      // This would be an API call to resolve the dispute
      console.log('Resolving dispute:', disputeId, resolution);
      // For now, just refresh the bookings
      await fetchBookings();
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Statistics cards component
  const StatsCards: React.FC = () => {
    if (!stats) return null;

    const cards = [
      {
        title: "Total Bookings",
        value: stats.overview.total.toLocaleString(),
        icon: <Calendar className="h-6 w-6" />,
        color: "bg-blue-500",
        change: `+${stats.overview.recent} this period`,
      },
      {
        title: "Total Revenue",
        value: formatCurrency(stats.revenue.total),
        icon: <DollarSign className="h-6 w-6" />,
        color: "bg-green-500",
        change: `+${formatCurrency(stats.revenue.recent)} this period`,
      },
      {
        title: "Active Bookings",
        value: stats.status.active.toLocaleString(),
        icon: <Users className="h-6 w-6" />,
        color: "bg-orange-500",
        change: `${stats.status.pendingReview} pending review`,
      },
      {
        title: "Growth Rate",
        value: `${stats.growth.percentage}%`,
        icon: <TrendingUp className="h-6 w-6" />,
        color: "bg-purple-500",
        change: stats.growth.trend,
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search bookings by reference, guest name, or property..."
                  value={filters.search || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filter Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                  showFilters
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
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
                      setFilters((prev) => ({ ...prev, status: e.target.value as BookingStatus, page: 1 }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="checked-in">Checked In</option>
                    <option value="checked-out">Checked Out</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <select
                    value={filters.dateRange || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, dateRange: e.target.value, page: 1 }))
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
                      setFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="createdAt-desc">Newest First</option>
                    <option value="createdAt-asc">Oldest First</option>
                    <option value="checkInDate-desc">Check-in Date (Latest)</option>
                    <option value="checkInDate-asc">Check-in Date (Earliest)</option>
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
                    className="w-full px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              {/* Active Filter Summary */}
              <div className="mt-4">
                <div className="text-sm text-gray-600">
                  {buildFilterSummary(filters, totalItems)}
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
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
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
                              {booking.disputeCount} dispute{booking.disputeCount !== 1 ? 's' : ''}
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
                    <div className="text-sm text-gray-500">{booking.guestEmail}</div>
                  </td>

                  {/* Property */}
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                      {booking.propertyTitle}
                    </div>
                    <div className="text-sm text-gray-500">{booking.propertyLocation}</div>
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
                      {getBookingDuration(booking.checkInDate, booking.checkOutDate)}
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBookingStatusColor(booking.status)}`}>
                      {formatBookingStatus(booking.status)}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      Updated {new Date(booking.updatedAt).toLocaleString()}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewBooking(booking.id)}
                        disabled={actionLoading === booking.id}
                        className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {booking.hasDisputes && (
                        <button
                          onClick={() => handleViewDispute(`dispute-${booking.id}`)}
                          className="text-orange-600 hover:text-orange-900 p-1 hover:bg-orange-50 rounded"
                          title="View Dispute"
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </button>
                      )}

                      {canCancelBooking(booking) && (
                        <button
                          onClick={() => handleViewBooking(booking.id)}
                          className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                          title="Update Status"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}

                      {canCancelBooking(booking) && (
                        <button
                          onClick={() => handleViewBooking(booking.id)}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                          title="Cancel Booking"
                        >
                          <Ban className="h-4 w-4" />
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
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage all platform bookings from this central dashboard
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
          onStatusUpdate={handleBookingStatusUpdate}
          onCancelBooking={handleBookingCancellation}
        />

        <DisputeResolutionModal
          isOpen={showDisputeModal}
          onClose={() => setShowDisputeModal(false)}
          disputeId={selectedDisputeId}
          onResolveDispute={handleResolveDispute}
        />
      </div>
    </div>
  );
};

export default BookingsManagementPage;