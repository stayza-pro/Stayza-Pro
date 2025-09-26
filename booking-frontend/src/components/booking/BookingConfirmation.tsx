"use client";

import React from "react";
import { Button, Card } from "../ui";
import {
  CheckCircle,
  Calendar,
  MapPin,
  Users,
  CreditCard,
  Download,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  Home,
} from "lucide-react";
import { Booking } from "../../types";

interface BookingConfirmationProps {
  booking: Booking;
  onDownloadReceipt?: () => void;
  onContactHost?: () => void;
  onViewBookings?: () => void;
  className?: string;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  booking,
  onDownloadReceipt,
  onContactHost,
  onViewBookings,
  className = "",
}) => {
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

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
      {/* Success Header */}
      <Card className="p-8 text-center bg-green-50 border-green-200">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-green-100 rounded-full">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Booking Confirmed!
        </h1>

        <p className="text-lg text-gray-600 mb-4">
          Your reservation has been successfully submitted
        </p>

        <div className="bg-white rounded-lg p-4 inline-block">
          <div className="text-sm text-gray-600 mb-1">Booking Reference</div>
          <div className="text-2xl font-mono font-bold text-gray-900">
            #{booking.id.slice(-8).toUpperCase()}
          </div>
        </div>
      </Card>

      {/* Booking Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trip Details */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Trip Details
          </h2>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Check-in</div>
                <div className="text-gray-600">
                  {formatDate(booking.checkInDate)}
                </div>
                <div className="text-sm text-gray-500">After 3:00 PM</div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Check-out</div>
                <div className="text-gray-600">
                  {formatDate(booking.checkOutDate)}
                </div>
                <div className="text-sm text-gray-500">Before 11:00 AM</div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Users className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Guests</div>
                <div className="text-gray-600">
                  {booking.totalGuests}{" "}
                  {booking.totalGuests === 1 ? "guest" : "guests"}
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Duration</div>
                <div className="text-gray-600">
                  {nights} {nights === 1 ? "night" : "nights"}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Property Details */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Home className="h-5 w-5 mr-2" />
            Property
          </h2>

          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <img
                src={booking.property.images[0] || "/placeholder-image.jpg"}
                alt={booking.property.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div>
                <h3 className="font-medium text-gray-900">
                  {booking.property.title}
                </h3>
                <div className="flex items-center text-gray-600 text-sm mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  {booking.property.address}, {booking.property.city}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {booking.property.maxGuests}
                </div>
                <div className="text-sm text-gray-600">Max Guests</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {booking.property.bedrooms}
                </div>
                <div className="text-sm text-gray-600">Bedrooms</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {booking.property.bathrooms}
                </div>
                <div className="text-sm text-gray-600">Bathrooms</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Host Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Host</h2>

        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <img
              src={booking.property.host.avatar || "/default-avatar.png"}
              alt={`${booking.property.host.firstName} ${booking.property.host.lastName}`}
              className="w-16 h-16 object-cover rounded-full"
            />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {booking.property.host.firstName}{" "}
                {booking.property.host.lastName}
              </h3>
              <p className="text-gray-600">Property Host</p>
            </div>
          </div>

          <div className="flex space-x-3">
            {onContactHost && (
              <Button
                variant="outline"
                onClick={onContactHost}
                className="flex items-center"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Host
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Payment Summary */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Payment Summary
        </h2>

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

          <hr className="my-4" />

          <div className="flex justify-between text-lg font-semibold text-gray-900">
            <span>Total Paid</span>
            <span>
              {booking.currency} {booking.totalPrice.toFixed(2)}
            </span>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Payment Status</div>
            <div
              className={`font-medium ${
                booking.payment?.status === "COMPLETED"
                  ? "text-green-600"
                  : "text-yellow-600"
              }`}
            >
              {booking.payment?.status === "COMPLETED"
                ? "Payment Successful"
                : "Payment Processing"}
            </div>
          </div>
        </div>
      </Card>

      {/* Special Requests */}
      {booking.specialRequests && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Special Requests
          </h2>
          <p className="text-gray-600">{booking.specialRequests}</p>
        </Card>
      )}

      {/* Important Information */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          Important Information
        </h2>

        <div className="space-y-2 text-sm text-blue-800">
          <p>
            • A confirmation email has been sent to your registered email
            address
          </p>
          <p>• You can cancel free of charge until 48 hours before check-in</p>
          <p>• Please bring a valid ID for check-in verification</p>
          <p>
            • Contact your host if you need any assistance or have questions
          </p>
          <p>
            • Check-in instructions will be provided closer to your arrival date
          </p>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {onDownloadReceipt && (
          <Button
            variant="outline"
            onClick={onDownloadReceipt}
            className="flex items-center justify-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
        )}

        {onViewBookings && (
          <Button
            variant="primary"
            onClick={onViewBookings}
            className="flex items-center justify-center"
          >
            View All Bookings
          </Button>
        )}

        <Button
          variant="outline"
          onClick={() => window.print()}
          className="flex items-center justify-center"
        >
          Print Confirmation
        </Button>
      </div>

      {/* Booking Status */}
      <Card className="p-4 text-center">
        <div className="text-sm text-gray-600 mb-2">Booking Status</div>
        <div
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            booking.status === "CONFIRMED"
              ? "bg-green-100 text-green-800"
              : booking.status === "PENDING"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {booking.status === "CONFIRMED" && (
            <CheckCircle className="h-4 w-4 mr-1" />
          )}
          {booking.status}
        </div>
      </Card>
    </div>
  );
};
