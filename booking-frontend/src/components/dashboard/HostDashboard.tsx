"use client";

import React, { useState, useEffect } from "react";
import { Card, Button, Loading } from "../ui";
import { PropertyCard } from "../property";
import { BookingCard } from "../booking";
import { CompactRating } from "../review";
import {
  Home,
  Calendar,
  DollarSign,
  Star,
  Users,
  TrendingUp,
  Clock,
  Plus,
  BarChart,
  MapPin,
  MessageSquare,
  Settings,
  Eye,
} from "lucide-react";
import { User as UserType, Property, Booking, Review } from "../../types";

interface HostDashboardProps {
  user: UserType;
  properties?: Property[];
  bookings?: Booking[];
  reviews?: Review[];
  earnings?: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    pending: number;
  };
  analytics?: {
    viewsThisMonth: number;
    bookingRate: number;
    averageRating: number;
    responseRate: number;
  };
  isLoading?: boolean;
  onPropertySelect?: (property: Property) => void;
  onBookingSelect?: (booking: Booking) => void;
  onAddProperty?: () => void;
  onReplyToReview?: (review: Review) => void;
  className?: string;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({
  user,
  properties = [],
  bookings = [],
  reviews = [],
  earnings = { total: 0, thisMonth: 0, lastMonth: 0, pending: 0 },
  analytics = {
    viewsThisMonth: 0,
    bookingRate: 0,
    averageRating: 0,
    responseRate: 0,
  },
  isLoading = false,
  onPropertySelect,
  onBookingSelect,
  onAddProperty,
  onReplyToReview,
  className = "",
}) => {
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "properties"
    | "bookings"
    | "reviews"
    | "earnings"
    | "analytics"
  >("overview");

  const upcomingBookings = bookings.filter(
    (booking) =>
      new Date(booking.checkInDate) > new Date() &&
      booking.status === "CONFIRMED"
  );

  const todaysCheckIns = bookings.filter((booking) => {
    const today = new Date();
    const checkIn = new Date(booking.checkInDate);
    return (
      checkIn.toDateString() === today.toDateString() &&
      booking.status === "CONFIRMED"
    );
  });

  const todaysCheckOuts = bookings.filter((booking) => {
    const today = new Date();
    const checkOut = new Date(booking.checkOutDate);
    return (
      checkOut.toDateString() === today.toDateString() &&
      booking.status === "CONFIRMED"
    );
  });

  const pendingReviews = reviews.filter((review) => !review.hostResponse);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getEarningsGrowth = (): number => {
    if (earnings.lastMonth === 0) return 0;
    return (
      ((earnings.thisMonth - earnings.lastMonth) / earnings.lastMonth) * 100
    );
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart },
    { id: "properties", label: "Properties", icon: Home },
    { id: "bookings", label: "Bookings", icon: Calendar },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "earnings", label: "Earnings", icon: DollarSign },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loading size="lg" />
      </div>
    );
  }

  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Key Metrics */}
      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Properties
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {properties.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Home className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <Button variant="outline" onClick={onAddProperty}>
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(earnings.thisMonth)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2">
            <div
              className={`flex items-center text-sm ${
                getEarningsGrowth() >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              {getEarningsGrowth() >= 0 ? "+" : ""}
              {getEarningsGrowth().toFixed(1)}% from last month
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Average Rating
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.averageRating.toFixed(1)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-2">
            <CompactRating
              rating={analytics.averageRating}
              reviewCount={reviews.length}
            />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Booking Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.bookingRate.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-600">
              {analytics.viewsThisMonth} views this month
            </p>
          </div>
        </Card>
      </div>

      {/* Today's Activity */}
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Today's Activity
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Check-ins</p>
                  <p className="text-xs text-gray-600">
                    {todaysCheckIns.length} guests arriving
                  </p>
                </div>
              </div>
              <span className="text-lg font-bold text-green-600">
                {todaysCheckIns.length}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Check-outs
                  </p>
                  <p className="text-xs text-gray-600">
                    {todaysCheckOuts.length} guests leaving
                  </p>
                </div>
              </div>
              <span className="text-lg font-bold text-blue-600">
                {todaysCheckOuts.length}
              </span>
            </div>

            {pendingReviews.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Pending Reviews
                    </p>
                    <p className="text-xs text-gray-600">Need your response</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-yellow-600">
                  {pendingReviews.length}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Properties Performance */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Performing
          </h3>

          <div className="space-y-3">
            {properties.slice(0, 3).map((property) => (
              <div
                key={property.id}
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
              >
                <img
                  src={property.images[0] || "/placeholder-image.jpg"}
                  alt={property.title}
                  className="w-12 h-12 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {property.title}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <CompactRating
                      rating={property.averageRating ?? 0}
                      reviewCount={property.reviewCount}
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => onPropertySelect?.(property)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderProperties = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">
          My Properties ({properties.length})
        </h3>
        <Button variant="primary" onClick={onAddProperty}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Property
        </Button>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-12">
          <Home className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No properties yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start earning by listing your first property
          </p>
          <Button variant="primary" onClick={onAddProperty}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Property
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div
              key={property.id}
              onClick={() => onPropertySelect?.(property)}
              className="cursor-pointer"
            >
              <PropertyCard property={property} />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderBookings = () => (
    <div className="space-y-6">
      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Upcoming Bookings ({upcomingBookings.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onViewDetails={() => onBookingSelect?.(booking)}
                viewType="host"
              />
            ))}
          </div>
        </div>
      )}

      {/* All Bookings */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          All Bookings ({bookings.length})
        </h3>

        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No bookings yet
            </h3>
            <p className="text-gray-600">
              Bookings will appear here once guests start booking your
              properties
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
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
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
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
                        <div className="flex items-center">
                          <img
                            src={booking.guest.avatar || "/default-avatar.png"}
                            alt={`${booking.guest.firstName} ${booking.guest.lastName}`}
                            className="w-8 h-8 object-cover rounded-full mr-3"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {booking.guest.firstName} {booking.guest.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {booking.guest.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">
                          {booking.property.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {booking.property.city}, {booking.property.country}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">
                          {formatDate(booking.checkInDate)} -{" "}
                          {formatDate(booking.checkOutDate)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {booking.nights} nights
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            booking.status === "CONFIRMED"
                              ? "bg-green-100 text-green-800"
                              : booking.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(booking.totalPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="ghost"
                          onClick={() => onBookingSelect?.(booking)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderReviews = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">
          Reviews ({reviews.length})
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-400 fill-current" />
            <span className="text-lg font-semibold">
              {analytics.averageRating.toFixed(1)}
            </span>
            <span className="text-gray-600">average</span>
          </div>
        </div>
      </div>

      {pendingReviews.length > 0 && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-yellow-800">
              Reviews Awaiting Response ({pendingReviews.length})
            </h4>
            <MessageSquare className="h-5 w-5 text-yellow-600" />
          </div>

          <div className="space-y-4">
            {pendingReviews.slice(0, 3).map((review) => (
              <div key={review.id} className="bg-white p-4 rounded-lg border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <img
                        src={review.guest.avatar || "/default-avatar.png"}
                        alt={`${review.guest.firstName} ${review.guest.lastName}`}
                        className="w-8 h-8 object-cover rounded-full"
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {review.guest.firstName} {review.guest.lastName}
                        </p>
                        <CompactRating rating={review.rating} />
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm mb-2">
                      {review.comment}
                    </p>
                    <p className="text-xs text-gray-500">
                      {review.property?.title} • {formatDate(review.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => onReplyToReview?.(review)}
                  >
                    Reply
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* All Reviews */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No reviews yet
          </h3>
          <p className="text-gray-600">
            Reviews from your guests will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="p-6">
              <div className="flex items-start space-x-4">
                <img
                  src={review.guest.avatar || "/default-avatar.png"}
                  alt={`${review.guest.firstName} ${review.guest.lastName}`}
                  className="w-12 h-12 object-cover rounded-full"
                />

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {review.guest.firstName} {review.guest.lastName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {review.property?.title} •{" "}
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                    <CompactRating rating={review.rating} />
                  </div>

                  <p className="text-gray-700 mb-3">{review.comment}</p>

                  {review.hostResponse ? (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r">
                      <p className="text-sm text-gray-700">
                        <strong>Your Response:</strong>{" "}
                        {review.hostResponse.comment}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(review.hostResponse.createdAt)}
                      </p>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => onReplyToReview?.(review)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Reply to Review
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderEarnings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Earnings
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(earnings.total)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(earnings.thisMonth)}
              </p>
            </div>
            <div
              className={`text-sm ${
                getEarningsGrowth() >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {getEarningsGrowth() >= 0 ? "+" : ""}
              {getEarningsGrowth().toFixed(1)}%
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Last Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(earnings.lastMonth)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(earnings.pending)}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>
      </div>

      {/* Earnings Chart Placeholder */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Earnings Over Time
        </h3>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">
            Earnings chart would be displayed here
          </p>
        </div>
      </Card>

      {/* Recent Transactions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Transactions
        </h3>
        <div className="space-y-4">
          {bookings.slice(0, 5).map((booking) => (
            <div
              key={booking.id}
              className="flex items-center justify-between py-3 border-b border-gray-200"
            >
              <div className="flex items-center space-x-4">
                <img
                  src={booking.property.images[0] || "/placeholder-image.jpg"}
                  alt={booking.property.title}
                  className="w-12 h-12 object-cover rounded-lg"
                />
                <div>
                  <p className="font-medium text-gray-900">
                    {booking.property.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    {booking.guest.firstName} {booking.guest.lastName} •{" "}
                    {formatDate(booking.createdAt)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  {formatCurrency(booking.totalPrice)}
                </p>
                <p className="text-sm text-gray-600">{booking.status}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Views This Month
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.viewsThisMonth}
              </p>
            </div>
            <Eye className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Booking Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.bookingRate.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Average Rating
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.averageRating.toFixed(1)}
              </p>
            </div>
            <Star className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Response Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.responseRate.toFixed(1)}%
              </p>
            </div>
            <MessageSquare className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Views vs Bookings
          </h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">
              Views vs Bookings chart would be displayed here
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Property Performance
          </h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">
              Property performance chart would be displayed here
            </p>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className={`bg-gray-50 min-h-screen ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Host Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your properties, bookings, and track your hosting performance
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.id === "reviews" && pendingReviews.length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {pendingReviews.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div>
          {activeTab === "overview" && renderOverview()}
          {activeTab === "properties" && renderProperties()}
          {activeTab === "bookings" && renderBookings()}
          {activeTab === "reviews" && renderReviews()}
          {activeTab === "earnings" && renderEarnings()}
          {activeTab === "analytics" && renderAnalytics()}
        </div>
      </div>
    </div>
  );
};
