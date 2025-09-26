"use client";

import React, { useState } from "react";
import { Button, Card, Loading } from "../ui";
import { BookingCard } from "./BookingCard";
import { Search, Filter, Calendar, SortAsc } from "lucide-react";
import { Booking } from "../../types";

interface BookingListProps {
  bookings: Booking[];
  viewType?: "guest" | "host";
  isLoading?: boolean;
  onViewDetails?: (bookingId: string) => void;
  onContactUser?: (userId: string) => void;
  onCancel?: (bookingId: string) => void;
  onWriteReview?: (bookingId: string) => void;
  onViewReceipt?: (bookingId: string) => void;
  className?: string;
}

type FilterType = "all" | "upcoming" | "ongoing" | "past" | "cancelled";
type SortType = "newest" | "oldest" | "checkIn" | "checkOut" | "price";

export const BookingList: React.FC<BookingListProps> = ({
  bookings,
  viewType = "guest",
  isLoading = false,
  onViewDetails,
  onContactUser,
  onCancel,
  onWriteReview,
  onViewReceipt,
  className = "",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortType, setSortType] = useState<SortType>("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Filter bookings based on status and date
  const getFilteredBookings = (): Booking[] => {
    let filtered = bookings;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (booking) =>
          booking.property.title
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          booking.property.city
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          booking.property.country
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          booking.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterType !== "all") {
      const now = new Date();

      filtered = filtered.filter((booking) => {
        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);

        switch (filterType) {
          case "upcoming":
            return checkIn > now && booking.status === "CONFIRMED";
          case "ongoing":
            return (
              checkIn <= now && checkOut > now && booking.status === "CONFIRMED"
            );
          case "past":
            return (
              checkOut <= now &&
              (booking.status === "COMPLETED" || booking.status === "CONFIRMED")
            );
          case "cancelled":
            return (
              booking.status === "CANCELLED" || booking.status === "REFUNDED"
            );
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortType) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "checkIn":
          return (
            new Date(a.checkInDate).getTime() -
            new Date(b.checkInDate).getTime()
          );
        case "checkOut":
          return (
            new Date(a.checkOutDate).getTime() -
            new Date(b.checkOutDate).getTime()
          );
        case "price":
          return b.totalPrice - a.totalPrice;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredBookings = getFilteredBookings();

  // Get booking counts for each filter
  const getBookingCounts = () => {
    const now = new Date();
    const counts = {
      all: bookings.length,
      upcoming: 0,
      ongoing: 0,
      past: 0,
      cancelled: 0,
    };

    bookings.forEach((booking) => {
      const checkIn = new Date(booking.checkInDate);
      const checkOut = new Date(booking.checkOutDate);

      if (checkIn > now && booking.status === "CONFIRMED") {
        counts.upcoming++;
      } else if (
        checkIn <= now &&
        checkOut > now &&
        booking.status === "CONFIRMED"
      ) {
        counts.ongoing++;
      } else if (
        checkOut <= now &&
        (booking.status === "COMPLETED" || booking.status === "CONFIRMED")
      ) {
        counts.past++;
      } else if (
        booking.status === "CANCELLED" ||
        booking.status === "REFUNDED"
      ) {
        counts.cancelled++;
      }
    });

    return counts;
  };

  const bookingCounts = getBookingCounts();

  const filterOptions: Array<{
    value: FilterType;
    label: string;
    count: number;
  }> = [
    { value: "all", label: "All Bookings", count: bookingCounts.all },
    { value: "upcoming", label: "Upcoming", count: bookingCounts.upcoming },
    { value: "ongoing", label: "Ongoing", count: bookingCounts.ongoing },
    { value: "past", label: "Past", count: bookingCounts.past },
    { value: "cancelled", label: "Cancelled", count: bookingCounts.cancelled },
  ];

  const sortOptions: Array<{ value: SortType; label: string }> = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "checkIn", label: "Check-in Date" },
    { value: "checkOut", label: "Check-out Date" },
    { value: "price", label: "Price (High to Low)" },
  ];

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card className="p-8 text-center">
          <Loading size="lg" />
          <p className="text-gray-600 mt-2">Loading bookings...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Search and Filters */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {viewType === "guest" ? "My Bookings" : "Guest Bookings"} (
            {filteredBookings.length})
          </h2>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by property name, location, or booking ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilterType(option.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filterType === option.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {option.label} ({option.count})
            </button>
          ))}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortType}
                  onChange={(e) => setSortType(e.target.value as SortType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No bookings found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterType !== "all"
              ? "No bookings match your current filters. Try adjusting your search or filters."
              : viewType === "guest"
              ? "You haven't made any bookings yet. Start exploring properties to make your first booking!"
              : "You don't have any guest bookings yet. Make sure your properties are listed and visible to guests."}
          </p>
          {(searchTerm || filterType !== "all") && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setFilterType("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              viewType={viewType}
              onViewDetails={onViewDetails}
              onContactUser={onContactUser}
              onCancel={onCancel}
              onWriteReview={onWriteReview}
              onViewReceipt={onViewReceipt}
            />
          ))}
        </div>
      )}

      {/* Load More / Pagination could be added here */}
      {filteredBookings.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-600">
            Showing {filteredBookings.length} of {bookings.length} bookings
          </p>
        </div>
      )}
    </div>
  );
};
