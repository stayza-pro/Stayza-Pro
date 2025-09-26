"use client";

import React, { useState } from "react";
import { Button, Card, Loading } from "../ui";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Star,
  MessageCircle,
  CreditCard,
  Download,
  AlertTriangle,
  CheckCircle,
  X,
  Phone,
  Mail,
  Home,
  Wifi,
  Car,
} from "lucide-react";
import { Booking } from "../../types";

interface BookingDetailsProps {
  booking: Booking;
  viewType?: "guest" | "host";
  onContactUser?: (userId: string) => void;
  onCancel?: (bookingId: string) => void;
  onWriteReview?: (bookingId: string) => void;
  onDownloadReceipt?: (bookingId: string) => void;
  onBack?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const BookingDetails: React.FC<BookingDetailsProps> = ({
  booking,
  viewType = "guest",
  onContactUser,
  onCancel,
  onWriteReview,
  onDownloadReceipt,
  onBack,
  isLoading = false,
  className = "",
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const nights = Math.ceil(
    (new Date(booking.checkOutDate).getTime() -
      new Date(booking.checkInDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const isUpcoming = new Date(booking.checkInDate) > new Date();
  const isOngoing =
    new Date(booking.checkInDate) <= new Date() &&
    new Date(booking.checkOutDate) > new Date();
  const isPast = new Date(booking.checkOutDate) <= new Date();
  const canCancel =
    booking.status === "CONFIRMED" && isUpcoming && booking.isRefundable;
  const canReview =
    booking.status === "COMPLETED" && !booking.review && viewType === "guest";

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      case "REFUNDED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string): string => {
    if (isOngoing && status === "CONFIRMED") return "Ongoing";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const handleCancel = async () => {
    if (!onCancel) return;

    setIsCancelling(true);
    try {
      await onCancel(booking.id);
      setShowCancelModal(false);
    } catch (error) {
      console.error("Cancellation error:", error);
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`max-w-4xl mx-auto ${className}`}>
        <Card className="p-8 text-center">
          <Loading size="lg" />
          <p className="text-gray-600 mt-2">Loading booking details...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {onBack && (
            <Button variant="outline" onClick={onBack} className="mb-2">
              ← Back
            </Button>
          )}
          <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
          <p className="text-gray-600">#{booking.id.slice(-8).toUpperCase()}</p>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
              booking.status
            )}`}
          >
            {getStatusText(booking.status)}
          </span>
        </div>
      </div>

      {/* Property Information */}
      <Card className="p-6">
        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0">
            <img
              src={booking.property.images[0] || "/placeholder-image.jpg"}
              alt={booking.property.title}
              className="w-32 h-32 object-cover rounded-lg"
            />
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {booking.property.title}
            </h2>

            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              {booking.property.address}, {booking.property.city},{" "}
              {booking.property.country}
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {booking.property.maxGuests} guests max
              </div>
              <div className="flex items-center">
                <Home className="h-4 w-4 mr-1" />
                {booking.property.bedrooms} bedrooms
              </div>
              <div className="flex items-center">
                <Home className="h-4 w-4 mr-1" />
                {booking.property.bathrooms} bathrooms
              </div>
            </div>

            {booking.property.averageRating && (
              <div className="flex items-center mb-4">
                <Star className="h-5 w-5 text-yellow-400 mr-1" />
                <span className="font-medium">
                  {booking.property.averageRating.toFixed(1)}
                </span>
                <span className="text-gray-600 ml-1">
                  ({booking.property.reviewCount} reviews)
                </span>
              </div>
            )}

            {booking.property.amenities.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {booking.property.amenities.slice(0, 6).map((amenity) => (
                    <span
                      key={amenity}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {amenity}
                    </span>
                  ))}
                  {booking.property.amenities.length > 6 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      +{booking.property.amenities.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Trip Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Trip Information
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Check-in</div>
                <div className="font-medium text-gray-900">
                  {formatDate(booking.checkInDate)}
                </div>
                <div className="text-sm text-gray-500">After 3:00 PM</div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">Check-out</div>
                <div className="font-medium text-gray-900">
                  {formatDate(booking.checkOutDate)}
                </div>
                <div className="text-sm text-gray-500">Before 11:00 AM</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Guests</div>
                <div className="font-medium text-gray-900">
                  {booking.totalGuests}{" "}
                  {booking.totalGuests === 1 ? "guest" : "guests"}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">Duration</div>
                <div className="font-medium text-gray-900">
                  {nights} {nights === 1 ? "night" : "nights"}
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">Booked on</div>
              <div className="font-medium text-gray-900">
                {formatDate(booking.createdAt)} at{" "}
                {formatTime(booking.createdAt)}
              </div>
            </div>
          </div>
        </Card>

        {/* Host/Guest Information */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {viewType === "guest" ? "Your Host" : "Guest Information"}
          </h3>

          <div className="flex items-start space-x-4">
            <img
              src={
                viewType === "guest"
                  ? booking.property.host.avatar || "/default-avatar.png"
                  : booking.guest.avatar || "/default-avatar.png"
              }
              alt={
                viewType === "guest"
                  ? `${booking.property.host.firstName} ${booking.property.host.lastName}`
                  : `${booking.guest.firstName} ${booking.guest.lastName}`
              }
              className="w-16 h-16 object-cover rounded-full"
            />

            <div className="flex-1">
              <h4 className="font-medium text-gray-900">
                {viewType === "guest"
                  ? `${booking.property.host.firstName} ${booking.property.host.lastName}`
                  : `${booking.guest.firstName} ${booking.guest.lastName}`}
              </h4>
              <p className="text-gray-600 text-sm">
                {viewType === "guest" ? "Property Host" : "Guest"}
              </p>

              {viewType === "host" && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {booking.guest.email}
                  </div>
                  {booking.guest.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {booking.guest.phone}
                    </div>
                  )}
                </div>
              )}
            </div>

            {onContactUser && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onContactUser(
                    viewType === "guest"
                      ? booking.property.host.id
                      : booking.guest.id
                  )
                }
                className="flex items-center"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Contact
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Payment Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Payment Details
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>
                {booking.currency} {booking.property.pricePerNight} × {nights}{" "}
                nights
              </span>
              <span>
                {booking.currency}{" "}
                {(booking.property.pricePerNight * nights).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>Service fee</span>
              <span>
                {booking.currency}{" "}
                {(booking.property.pricePerNight * nights * 0.1).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>Taxes</span>
              <span>
                {booking.currency}{" "}
                {(booking.property.pricePerNight * nights * 0.05).toFixed(2)}
              </span>
            </div>

            <hr />

            <div className="flex justify-between text-lg font-semibold text-gray-900">
              <span>Total</span>
              <span>
                {booking.currency} {booking.totalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {booking.payment && (
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600 mb-1">Payment Status</div>
                <div
                  className={`font-medium ${
                    booking.payment.status === "COMPLETED"
                      ? "text-green-600"
                      : booking.payment.status === "FAILED"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {booking.payment.status.charAt(0).toUpperCase() +
                    booking.payment.status.slice(1).toLowerCase()}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">Payment Method</div>
                <div className="font-medium text-gray-900">
                  {booking.payment.method}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">Transaction ID</div>
                <div className="font-mono text-sm text-gray-900">
                  {booking.payment.stripePaymentIntentId ||
                    booking.payment.paystackReference ||
                    "N/A"}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Special Requests */}
      {booking.specialRequests && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Special Requests
          </h3>
          <p className="text-gray-700">{booking.specialRequests}</p>
        </Card>
      )}

      {/* Review Section */}
      {booking.review && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Review</h3>

          <div className="flex items-start space-x-4">
            <img
              src={booking.review.author.avatar || "/default-avatar.png"}
              alt={`${booking.review.author.firstName} ${booking.review.author.lastName}`}
              className="w-12 h-12 object-cover rounded-full"
            />

            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-gray-900">
                  {booking.review.author.firstName}{" "}
                  {booking.review.author.lastName}
                </span>
                <div className="flex items-center">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < (booking.review?.rating ?? 0)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {booking.review.rating}/5
                  </span>
                </div>
              </div>

              {booking.review.comment && (
                <p className="text-gray-700 mb-2">{booking.review.comment}</p>
              )}

              <p className="text-sm text-gray-500">
                {formatDate(booking.review.createdAt)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Cancellation Information */}
      {booking.isRefundable && isUpcoming && booking.refundDeadline && (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900 mb-1">
                Free Cancellation
              </h4>
              <p className="text-green-800 text-sm">
                You can cancel this booking free of charge until{" "}
                {formatDate(booking.refundDeadline)} at 11:59 PM
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {onDownloadReceipt && (
          <Button
            variant="outline"
            onClick={() => onDownloadReceipt(booking.id)}
            className="flex items-center justify-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
        )}

        {canReview && onWriteReview && (
          <Button
            variant="primary"
            onClick={() => onWriteReview(booking.id)}
            className="flex items-center justify-center"
          >
            <Star className="h-4 w-4 mr-2" />
            Write Review
          </Button>
        )}

        {canCancel && onCancel && (
          <Button
            variant="outline"
            onClick={() => setShowCancelModal(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center justify-center"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel Booking
          </Button>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Cancel Booking
              </h3>
            </div>

            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel this booking? This action cannot
              be undone.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="Please let us know why you're cancelling..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
              >
                Keep Booking
              </Button>
              <Button
                variant="primary"
                onClick={handleCancel}
                loading={isCancelling}
                disabled={isCancelling}
                className="bg-red-600 hover:bg-red-700"
              >
                {isCancelling ? "Cancelling..." : "Cancel Booking"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
