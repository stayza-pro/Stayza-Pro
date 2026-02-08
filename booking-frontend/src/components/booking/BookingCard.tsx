"use client";

import React from "react";
import Image from "next/image";
import { Button, Card } from "../ui";
import {
  MapPin,
  Users,
  Clock,
  Star,
  MessageCircle,
  CreditCard,
} from "lucide-react";
import { Booking } from "../../types";
import {
  getPaymentStatusColor,
  formatPaymentStatus,
} from "@/utils/bookingEnums";

interface BookingCardProps {
  booking: Booking;
  viewType?: "guest" | "host";
  onViewDetails?: (bookingId: string) => void;
  onContactUser?: (userId: string) => void;
  onCancel?: (bookingId: string) => void;
  onWriteReview?: (bookingId: string) => void;
  onViewReceipt?: (bookingId: string) => void;
  className?: string;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  viewType = "guest",
  onViewDetails,
  onContactUser,
  onCancel,
  onWriteReview,
  onViewReceipt,
  className = "",
}) => {
  const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
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
  const canCancel =
    booking.status === "ACTIVE" && isUpcoming && booking.isRefundable;
  const canReview =
    booking.status === "COMPLETED" &&
    (!booking.reviews || booking.reviews.length === 0) &&
    viewType === "guest";

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "ACTIVE":
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
    if (isOngoing && status === "ACTIVE") return "Ongoing";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  return (
    <Card className={`p-6 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-start justify-between mb-4">
        {/* Property Image and Basic Info */}
        <div className="flex items-start space-x-4 flex-1">
          <Image
            src={booking.property?.images?.[0]?.url || "/placeholder-image.jpg"}
            alt={booking.property?.title || "Property"}
            width={80}
            height={80}
            className="w-20 h-20 object-cover rounded-lg"
            unoptimized
          />

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {booking.property?.title || "Unknown Property"}
            </h3>

            <div className="flex items-center text-gray-600 text-sm mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              {booking.property?.city || "Unknown"},{" "}
              {booking.property?.country || "Unknown"}
            </div>

            {viewType === "host" && (
              <div className="flex items-center text-gray-600 text-sm mt-1">
                <Users className="h-4 w-4 mr-1" />
                Guest: {booking.guest?.firstName || "Unknown"}{" "}
                {booking.guest?.lastName || ""}
              </div>
            )}

            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {booking.totalGuests}{" "}
                {booking.totalGuests === 1 ? "guest" : "guests"}
              </div>

              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {nights} {nights === 1 ? "night" : "nights"}
              </div>
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-col items-end space-y-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
              booking.status
            )}`}
          >
            {getStatusText(booking.status)}
          </span>

          {/* Payment Status Badge */}
          {booking.paymentStatus &&
            (() => {
              const colors = getPaymentStatusColor(booking.paymentStatus);
              return (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
                >
                  {formatPaymentStatus(booking.paymentStatus)}
                </span>
              );
            })()}

          {booking.property?.averageRating && (
            <div className="flex items-center text-sm text-gray-600">
              <Star className="h-4 w-4 text-yellow-400 mr-1" />
              {booking.property.averageRating.toFixed(1)}
            </div>
          )}
        </div>
      </div>

      {/* Dates and Price */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-sm text-gray-600 mb-1">Check-in</div>
          <div className="font-medium text-gray-900">
            {formatDate(booking.checkInDate)}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-600 mb-1">Check-out</div>
          <div className="font-medium text-gray-900">
            {formatDate(booking.checkOutDate)}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-600 mb-1">Total Price</div>
          <div className="font-semibold text-gray-900">
            {booking.currency} {booking.totalPrice.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Special Requests */}
      {booking.specialRequests && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Special Requests</div>
          <div className="text-sm text-gray-900">{booking.specialRequests}</div>
        </div>
      )}

      {/* Payment Status */}
      {booking.payment && (
        <div className="mb-4 flex items-center space-x-2">
          <CreditCard className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            Payment:
            <span
              className={`ml-1 font-medium ${
                booking.payment.status === "SETTLED"
                  ? "text-green-600"
                  : booking.payment.status === "FAILED"
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            >
              {booking.payment.status.toLowerCase()}
            </span>
          </span>
        </div>
      )}

      {/* Review Status */}
      {booking.reviews &&
        booking.reviews.length > 0 &&
        viewType === "guest" && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-blue-600 mb-1">Your Review</div>
                <div className="flex items-center">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < (booking.reviews?.[0]?.rating ?? 0)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {booking.reviews?.[0]?.rating ?? 0}/5
                  </span>
                </div>
              </div>
            </div>
            {booking.reviews?.[0]?.comment && (
              <div className="text-sm text-gray-700 mt-2">
                &ldquo;{booking.reviews[0].comment}&rdquo;
              </div>
            )}
          </div>
        )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center space-x-2">
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(booking.id)}
            >
              View Details
            </Button>
          )}

          {onContactUser && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onContactUser(
                  viewType === "guest"
                    ? booking.property?.realtorId || ""
                    : booking.guest?.id || ""
                )
              }
              className="flex items-center"
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Contact {viewType === "guest" ? "Host" : "Guest"}
            </Button>
          )}

          {onViewReceipt && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewReceipt(booking.id)}
              className="flex items-center"
            >
              <CreditCard className="h-3 w-3 mr-1" />
              Receipt
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {canReview && onWriteReview && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onWriteReview(booking.id)}
            >
              Write Review
            </Button>
          )}

          {canCancel && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(booking.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Refund Information */}
      {booking.isRefundable && isUpcoming && booking.refundDeadline && (
        <div className="mt-3 p-2 bg-green-50 rounded text-sm text-green-700">
          Free cancellation until {formatDate(booking.refundDeadline)}
        </div>
      )}

      {/* Booking ID */}
      <div className="mt-3 text-xs text-gray-500 text-center">
        Booking ID: #{booking.id.slice(-8).toUpperCase()}
      </div>
    </Card>
  );
};


