"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Card, Button, Loading } from "../ui";
import { BookingCard } from "../booking";
import { CompactRating } from "../review";
import {
  Calendar,
  MapPin,
  Star,
  CreditCard,
  User,
  Heart,
  Bell,
} from "lucide-react";
import { User as UserType, Booking, Property, Review } from "../../types";

interface GuestDashboardProps {
  user: UserType;
  bookings?: Booking[];
  favoriteProperties?: Property[];
  reviews?: Review[];
  isLoading?: boolean;
  onBookingSelect?: (booking: Booking) => void;
  onPropertySelect?: (property: Property) => void;
  onWriteReview?: (booking: Booking) => void;
  className?: string;
}

export const GuestDashboard: React.FC<GuestDashboardProps> = ({
  user,
  bookings = [],
  favoriteProperties = [],
  reviews = [],
  isLoading = false,
  onBookingSelect,
  onPropertySelect,
  onWriteReview,
  className = "",
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "bookings" | "favorites" | "reviews" | "profile"
  >("overview");

  const upcomingBookings = bookings.filter(
    (booking) =>
      new Date(booking.checkInDate) > new Date() &&
      booking.status === "CONFIRMED"
  );

  const pastBookings = bookings.filter(
    (booking) =>
      new Date(booking.checkOutDate) < new Date() &&
      booking.status === "CONFIRMED"
  );

  const pendingReviews = bookings.filter(
    (booking) =>
      new Date(booking.checkOutDate) < new Date() &&
      booking.status === "CONFIRMED" &&
      !reviews.some((review) => review.bookingId === booking.id)
  );

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTotalSpent = (): number => {
    return bookings
      .filter((booking) => booking.status === "CONFIRMED")
      .reduce((total, booking) => total + booking.totalPrice, 0);
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Calendar },
    { id: "bookings", label: "My Trips", icon: MapPin },
    { id: "favorites", label: "Favorites", icon: Heart },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "profile", label: "Profile", icon: User },
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
      {/* Stats Cards */}
      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Trips</p>
              <p className="text-2xl font-bold text-gray-900">
                {bookings.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                ${getTotalSpent().toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Reviews Written
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {reviews.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full">
              <Heart className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Favorites</p>
              <p className="text-2xl font-bold text-gray-900">
                {favoriteProperties.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="space-y-6">
        {/* Upcoming Trips */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Upcoming Trips
            </h3>
            <Button variant="ghost" onClick={() => setActiveTab("bookings")}>
              View All
            </Button>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No upcoming trips</p>
              <Button variant="outline" className="mt-3">
                Browse Properties
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.slice(0, 2).map((booking) => (
                <div
                  key={booking.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start space-x-3">
                    <Image
                      src={
                        booking.property.images[0] || "/placeholder-image.jpg"
                      }
                      alt={booking.property.title}
                      width={64}
                      height={64}
                      className="w-16 h-16 object-cover rounded-lg"
                      unoptimized
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {booking.property.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {formatDate(booking.checkInDate)} -{" "}
                        {formatDate(booking.checkOutDate)}
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => onBookingSelect?.(booking)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Pending Reviews */}
        {pendingReviews.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Write Reviews
              </h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {pendingReviews.length}
              </span>
            </div>

            <div className="space-y-3">
              {pendingReviews.slice(0, 3).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Image
                      src={
                        booking.property.images[0] || "/placeholder-image.jpg"
                      }
                      alt={booking.property.title}
                      width={40}
                      height={40}
                      className="w-10 h-10 object-cover rounded"
                      unoptimized
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {booking.property.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        Stayed {formatDate(booking.checkOutDate)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => onWriteReview?.(booking)}
                  >
                    Review
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="space-y-6">
      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Upcoming Trips ({upcomingBookings.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onViewDetails={() => onBookingSelect?.(booking)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Past Trips ({pastBookings.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onViewDetails={() => onBookingSelect?.(booking)}
                onWriteReview={
                  !reviews.some((review) => review.bookingId === booking.id)
                    ? () => onWriteReview?.(booking)
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      )}

      {bookings.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No trips yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start planning your next adventure!
          </p>
          <Button variant="primary">Browse Properties</Button>
        </div>
      )}
    </div>
  );

  const renderFavorites = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">
          Favorite Properties ({favoriteProperties.length})
        </h3>
      </div>

      {favoriteProperties.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No favorites yet
          </h3>
          <p className="text-gray-600 mb-6">
            Save properties you love to find them easily later
          </p>
          <Button variant="primary">Browse Properties</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteProperties.map((property) => (
            <Card
              key={property.id}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative">
                <Image
                  src={property.images[0] || "/placeholder-image.jpg"}
                  alt={property.title}
                  width={600}
                  height={256}
                  className="w-full h-48 object-cover"
                  unoptimized
                />
                <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md">
                  <Heart className="h-5 w-5 text-red-500 fill-current" />
                </button>
              </div>

              <div className="p-4">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {property.title}
                </h4>
                <p className="text-gray-600 text-sm mb-2">
                  {property.city}, {property.country}
                </p>

                <div className="flex items-center justify-between">
                  <CompactRating
                    rating={property.averageRating ?? 0}
                    reviewCount={property.reviewCount}
                  />
                  <span className="text-lg font-bold text-gray-900">
                    ${property.pricePerNight}/night
                  </span>
                </div>

                <Button
                  variant="primary"
                  className="w-full mt-4"
                  onClick={() => onPropertySelect?.(property)}
                >
                  View Property
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderReviews = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">
          My Reviews ({reviews.length})
        </h3>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No reviews yet
          </h3>
          <p className="text-gray-600 mb-6">
            Share your experiences with other travelers
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="p-6">
              <div className="flex items-start space-x-4">
                <Image
                  src={review.property?.images[0] || "/placeholder-image.jpg"}
                  alt={review.property?.title || "Property"}
                  width={64}
                  height={64}
                  className="w-16 h-16 object-cover rounded-lg"
                  unoptimized
                />

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {review.property?.title}
                    </h4>
                    <CompactRating rating={review.rating} />
                  </div>

                  <p className="text-gray-600 text-sm mb-3">
                    Reviewed on {formatDate(review.createdAt)}
                  </p>

                  <p className="text-gray-700">{review.comment}</p>

                  {review.hostResponse && (
                    <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r">
                      <p className="text-sm text-gray-700">
                        <strong>Host Response:</strong>{" "}
                        {review.hostResponse.comment}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="max-w-2xl">
      <Card className="p-6">
        <div className="flex items-center space-x-6 mb-6">
          <Image
            src={user.avatar || "/default-avatar.png"}
            alt={`${user.firstName} ${user.lastName}`}
            width={96}
            height={96}
            className="w-24 h-24 object-cover rounded-full"
            unoptimized
          />

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-500 mt-1">
              Member since {formatDate(user.createdAt)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {bookings.length}
            </p>
            <p className="text-sm text-gray-600">Total Trips</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
            <p className="text-sm text-gray-600">Reviews Written</p>
          </div>
        </div>

        <div className="space-y-4">
          <Button variant="primary" className="w-full">
            Edit Profile
          </Button>

          <Button variant="outline" className="w-full">
            <Bell className="h-4 w-4 mr-2" />
            Notification Settings
          </Button>
        </div>
      </Card>
    </div>
  );

  return (
    <div className={`bg-gray-50 min-h-screen ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-gray-600">
            Manage your trips, reviews, and favorite properties
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
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div>
          {activeTab === "overview" && renderOverview()}
          {activeTab === "bookings" && renderBookings()}
          {activeTab === "favorites" && renderFavorites()}
          {activeTab === "reviews" && renderReviews()}
          {activeTab === "profile" && renderProfile()}
        </div>
      </div>
    </div>
  );
};
