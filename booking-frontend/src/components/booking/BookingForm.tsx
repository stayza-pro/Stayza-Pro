"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Button, Input, Card, Loading } from "../ui";
import { Calendar, Users, MapPin, Clock, AlertCircle } from "lucide-react";
import { Property, BookingFormData } from "../../types";

interface BookingFormProps {
  property: Property;
  onSubmit: (data: BookingFormData) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  property,
  onSubmit,
  isLoading = false,
  className = "",
}) => {
  const [formData, setFormData] = useState<Partial<BookingFormData>>({
    propertyId: property.id,
    guests: 1,
    specialRequests: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate booking details
  const bookingDetails = useMemo(() => {
    if (!formData.checkIn || !formData.checkOut) {
      return null;
    }

    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );
    const subtotal = nights * property.pricePerNight;
    const serviceFee = subtotal * 0.1; // 10% service fee
    const taxes = subtotal * 0.05; // 5% taxes
    const total = subtotal + serviceFee + taxes;

    return {
      nights,
      subtotal,
      serviceFee,
      taxes,
      total,
    };
  }, [formData.checkIn, formData.checkOut, property.pricePerNight]);

  const handleInputChange = <K extends keyof BookingFormData>(
    field: K,
    value: BookingFormData[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.checkIn) {
      newErrors.checkIn = "Check-in date is required";
    }

    if (!formData.checkOut) {
      newErrors.checkOut = "Check-out date is required";
    }

    if (formData.checkIn && formData.checkOut) {
      const checkIn = new Date(formData.checkIn);
      const checkOut = new Date(formData.checkOut);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (checkIn < today) {
        newErrors.checkIn = "Check-in date cannot be in the past";
      }

      if (checkOut <= checkIn) {
        newErrors.checkOut = "Check-out date must be after check-in date";
      }

      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (nights > 28) {
        newErrors.checkOut = "Maximum stay is 28 nights";
      }
    }

    if (!formData.guests || formData.guests < 1) {
      newErrors.guests = "Number of guests is required";
    } else if (formData.guests > property.maxGuests) {
      newErrors.guests = `Maximum ${property.maxGuests} guests allowed`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData as BookingFormData);
    } catch (error) {
      
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  const today = formatDate(new Date());
  const tomorrow = formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Property Summary */}
      <Card className="p-6">
        <div className="flex items-start space-x-4">
          <Image
            src={property.images?.[0]?.url || "/placeholder-image.jpg"}
            alt={property.title}
            width={80}
            height={80}
            className="w-20 h-20 object-cover rounded-lg"
            unoptimized
          />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {property.title}
            </h2>
            <div className="flex items-center text-gray-600 text-sm mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              {property.city}, {property.country}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{property.maxGuests} guests max</span>
              <span>{property.bedrooms} bedrooms</span>
              <span>{property.bathrooms} bathrooms</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {property.currency} {property.pricePerNight}
            </div>
            <div className="text-sm text-gray-600">per night</div>
          </div>
        </div>
      </Card>

      {/* Booking Form */}
      <form onSubmit={handleSubmit}>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Booking Details
          </h3>

          <div className="space-y-4">
            {/* Date Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="checkIn"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Check-in Date *
                </label>
                <Input
                  id="checkIn"
                  type="date"
                  min={today}
                  value={formData.checkIn ? formatDate(formData.checkIn) : ""}
                  onChange={(e) =>
                    handleInputChange("checkIn", new Date(e.target.value))
                  }
                  disabled={isLoading || isSubmitting}
                  className={errors.checkIn ? "border-red-500" : ""}
                />
                {errors.checkIn && (
                  <p className="text-red-500 text-sm mt-1">{errors.checkIn}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="checkOut"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Check-out Date *
                </label>
                <Input
                  id="checkOut"
                  type="date"
                  min={
                    formData.checkIn
                      ? formatDate(
                          new Date(
                            formData.checkIn.getTime() + 24 * 60 * 60 * 1000
                          )
                        )
                      : tomorrow
                  }
                  value={formData.checkOut ? formatDate(formData.checkOut) : ""}
                  onChange={(e) =>
                    handleInputChange("checkOut", new Date(e.target.value))
                  }
                  disabled={isLoading || isSubmitting}
                  className={errors.checkOut ? "border-red-500" : ""}
                />
                {errors.checkOut && (
                  <p className="text-red-500 text-sm mt-1">{errors.checkOut}</p>
                )}
              </div>
            </div>

            {/* Guests */}
            <div>
              <label
                htmlFor="guests"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Number of Guests *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  id="guests"
                  value={formData.guests || 1}
                  onChange={(e) =>
                    handleInputChange("guests", parseInt(e.target.value))
                  }
                  disabled={isLoading || isSubmitting}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.guests ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  {Array.from(
                    { length: property.maxGuests },
                    (_, i) => i + 1
                  ).map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? "guest" : "guests"}
                    </option>
                  ))}
                </select>
              </div>
              {errors.guests && (
                <p className="text-red-500 text-sm mt-1">{errors.guests}</p>
              )}
            </div>

            {/* Special Requests */}
            <div>
              <label
                htmlFor="specialRequests"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Special Requests (Optional)
              </label>
              <textarea
                id="specialRequests"
                value={formData.specialRequests || ""}
                onChange={(e) =>
                  handleInputChange("specialRequests", e.target.value)
                }
                rows={3}
                placeholder="Any special requests or messages for the host..."
                disabled={isLoading || isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </Card>

        {/* Pricing Breakdown */}
        {bookingDetails && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Price Breakdown
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>
                  {property.currency} {property.pricePerNight} ×{" "}
                  {bookingDetails.nights} nights
                </span>
                <span>
                  {property.currency} {bookingDetails.subtotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Service fee</span>
                <span>
                  {property.currency} {bookingDetails.serviceFee.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Taxes</span>
                <span>
                  {property.currency} {bookingDetails.taxes.toFixed(2)}
                </span>
              </div>

              <hr className="my-4" />

              <div className="flex justify-between text-lg font-semibold text-gray-900">
                <span>Total</span>
                <span>
                  {property.currency} {bookingDetails.total.toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Important Information */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Important Information
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • You won&apos;t be charged until your reservation is accepted
                  by the host
                </li>
                <li>• Free cancellation until 48 hours before check-in</li>
                <li>• Check-in time: 3:00 PM - 11:00 PM</li>
                <li>• Check-out time: 11:00 AM</li>
                <li>• No smoking or parties allowed</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          disabled={isLoading || isSubmitting || !bookingDetails}
          className="w-full py-3 text-lg"
        >
          {isSubmitting ? (
            <Loading size="sm" />
          ) : (
            <>
              <Clock className="h-5 w-5 mr-2" />
              Reserve Now
            </>
          )}
        </Button>
      </form>
    </div>
  );
};
