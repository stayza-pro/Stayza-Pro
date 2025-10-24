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
  const [showBookingModal, setShowBookingModal] = useState(false);
  
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
  const [actionModal, setActionModal] = useState<{
    type: "status" | "cancel" | null;
    booking: AdminBooking | null;
  }>({ type: null, booking: null });

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, [filters]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAdminBookings(filters);
      
      setBookings(response.data.bookings);
      setCurrentPage(response.data.pagination.currentPage);
      setTotalPages(response.data.pagination.totalPages);
      setTotalItems(response.data.pagination.totalItems);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getBookingStats();
      setStats(response.data);
    } catch (error: any) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm,
      page: 1,
    }));
  };

  const handleFilterChange = (newFilters: Partial<BookingSearchFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };



  const handleStatusUpdate = async (
    bookingId: string,
    newStatus: BookingStatus,
    reason: string
  ) => {
    try {
      setActionLoading(bookingId);
      await updateBookingStatus(bookingId, { status: newStatus, reason });
      await fetchBookings(); // Refresh data
    } catch (error: any) {
      setError(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelBooking = async (
    bookingId: string,
    reason: string,
    refundPercentage: number = 100
  ) => {
    try {
      setActionLoading(bookingId);
      await cancelBooking(bookingId, { reason, refundPercentage });
      await fetchBookings(); // Refresh data
    } catch (error: any) {
      setError(error.message);
    } finally {
      setActionLoading(null);
    }
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
        title: "Active Bookings", 
        value: (stats.overview.confirmed + stats.overview.pending).toLocaleString(),
        icon: <Clock className="h-6 w-6" />,
        color: "bg-yellow-500",
        change: `${stats.overview.pending} pending`,
      },
      {
        title: "Total Revenue",
        value: formatCurrency(stats.metrics.totalRevenue),
        icon: <DollarSign className="h-6 w-6" />,
        color: "bg-green-500",
        change: `Avg: ${formatCurrency(stats.metrics.averageBookingValue)}`,
      },
      {
        title: "Success Rate",
        value: `${stats.metrics.conversionRate.toFixed(1)}%`,
        icon: <TrendingUp className="h-6 w-6" />,
        color: "bg-purple-500",
        change: `${stats.metrics.cancellationRate.toFixed(1)}% cancelled`,
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`${card.color} p-3 rounded-lg text-white mr-4`}>
                {card.icon}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
                <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-500">{card.change}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Search and filter bar component
  const SearchAndFilters: React.FC = () => (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="p-4">
        {/* Search bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by guest name, property title, or booking ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.search || ""}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
              showFilters 
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>

        {/* Filter summary */}
        <div className="text-sm text-gray-600 mb-2">
          {buildFilterSummary(filters)} • {totalItems} bookings found
        </div>

        {/* Advanced filters panel */}
        {showFilters && (
          <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status || ""}
                onChange={(e) => handleFilterChange({ 
                  status: e.target.value as BookingStatus || undefined 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            {/* Date from */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date From
              </label>
              <input
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) => handleFilterChange({ dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date to */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date To
              </label>
              <input
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) => handleFilterChange({ dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Sort by */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split("-");
                  handleFilterChange({ 
                    sortBy: sortBy as any,
                    sortOrder: sortOrder as "asc" | "desc"
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="checkInDate-asc">Check-in (Soon)</option>
                <option value="checkInDate-desc">Check-in (Far)</option>
                <option value="totalPrice-desc">Highest Value</option>
                <option value="totalPrice-asc">Lowest Value</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Bookings table component
  const BookingsTable: React.FC = () => (
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
                Property & Realtor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dates & Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount & Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      #{booking.id.slice(-8).toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {booking.totalGuests} guest{booking.totalGuests !== 1 ? "s" : ""}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {booking.guest.firstName} {booking.guest.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {booking.guest.email}
                    </div>
                    {booking.guest.phone && (
                      <div className="text-xs text-gray-400">
                        {booking.guest.phone}
                      </div>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {booking.property.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {booking.property.city}, {booking.property.country}
                    </div>
                    <div className="text-xs text-gray-400">
                      by {booking.property.realtor.businessName}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(booking.checkInDate).toLocaleDateString()} -
                    </div>
                    <div className="text-sm text-gray-900">
                      {new Date(booking.checkOutDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {getBookingDuration(booking.checkInDate, booking.checkOutDate)} nights
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(booking.totalPrice, booking.currency)}
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBookingStatusColor(booking.status)}`}>
                      {formatBookingStatus(booking.status)}
                    </span>
                    {booking.payment?.refundAmount && (
                      <div className="text-xs text-red-500 mt-1">
                        Refunded: {formatCurrency(booking.payment.refundAmount)}
                      </div>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
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
                of <span className="font-medium">{totalItems}</span> bookings
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
                
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNumber = currentPage <= 3 
                    ? i + 1 
                    : currentPage + i - 2;
                  
                  if (pageNumber > totalPages) return null;
                  
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Booking Management
          </h1>
          <p className="text-gray-600">
            Monitor and manage all platform bookings with advanced filtering and actions
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

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