"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  MapPin,
  Calendar,
  Users,
  CreditCard,
  AlertCircle,
  ArrowLeft,
  Check,
} from "lucide-react";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { Footer } from "@/components/guest/sections";
import { Card, Button, Input } from "@/components/ui";
import { useProperty } from "@/hooks/useProperties";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { bookingService } from "@/services";

export default function BookingCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useCurrentUser();

  // Get realtor branding
  const {
    brandColor,
    secondaryColor,
    accentColor,
    realtorName,
    logoUrl,
    tagline,
    description,
  } = useRealtorBranding();

  const propertyId = params.propertyId as string;
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guestsParam = searchParams.get("guests") || "1";

  const { data: property, isLoading: propertyLoading } =
    useProperty(propertyId);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    specialRequests: "",
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingCalculation, setBookingCalculation] = useState<{
    subtotal: number;
    taxes: number;
    fees: number;
    total: number;
    currency: string;
    nights: number;
  } | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push(
        `/guest/login?redirect=/booking/${propertyId}/checkout?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guestsParam}`
      );
    }
  }, [user, router, propertyId, checkIn, checkOut, guestsParam]);

  // Calculate booking total
  useEffect(() => {
    const fetchBookingCalculation = async () => {
      if (!checkIn || !checkOut || !propertyId) return;

      try {
        const calculation = await bookingService.calculateBookingTotal(
          propertyId,
          new Date(checkIn),
          new Date(checkOut),
          parseInt(guestsParam)
        );
        setBookingCalculation(calculation);
      } catch (error) {
        console.error("Error calculating booking:", error);
      }
    };

    fetchBookingCalculation();
  }, [propertyId, checkIn, checkOut, guestsParam]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions";
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
      // Create booking
      const booking = await bookingService.createBooking({
        propertyId,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        guests: parseInt(guestsParam),
        specialRequests: formData.specialRequests,
      });

      // Redirect to payment page
      router.push(`/booking/${propertyId}/payment?bookingId=${booking.id}`);
    } catch (error: any) {
      console.error("Booking error:", error);
      setErrors({
        submit: error.message || "Failed to create booking. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number, currency: string = "NGN") => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (propertyLoading || !property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GuestHeader
          currentPage="profile"
          searchPlaceholder="Search location..."
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
        <Footer
          realtorName={realtorName}
          tagline={tagline}
          logo={logoUrl}
          description={description}
          primaryColor={brandColor}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <GuestHeader
        currentPage="profile"
        searchPlaceholder="Search location..."
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Confirm and pay
              </h1>
              <p className="text-gray-600">
                Please review your booking details and complete your information
              </p>
            </div>

            {/* Guest Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Guest Information
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <Input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      className={errors.firstName ? "border-red-500" : ""}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <Input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      className={errors.lastName ? "border-red-500" : ""}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    value={formData.specialRequests}
                    onChange={(e) =>
                      handleInputChange("specialRequests", e.target.value)
                    }
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any special requests or notes for the host..."
                  />
                </div>
              </form>
            </Card>

            {/* Payment Method */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Payment Method
              </h2>

              <div className="space-y-3">
                <div className="border-2 border-blue-500 bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CreditCard className="h-6 w-6 text-blue-600 mr-3" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          Pay with Card (Flutterwave)
                        </p>
                        <p className="text-sm text-gray-600">
                          Secure payment via Flutterwave
                        </p>
                      </div>
                    </div>
                    <Check className="h-6 w-6 text-blue-600" />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">Secure Payment</p>
                    <p>
                      Your payment information is encrypted and secure. You will
                      be redirected to Flutterwave to complete your payment.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Terms and Conditions */}
            <Card className="p-6">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.agreeToTerms}
                  onChange={(e) =>
                    handleInputChange("agreeToTerms", e.target.checked)
                  }
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="ml-3 text-sm text-gray-700">
                  I agree to the{" "}
                  <a
                    href="/legal/terms"
                    className="text-blue-600 hover:underline"
                  >
                    Terms and Conditions
                  </a>{" "}
                  and{" "}
                  <a
                    href="/legal/privacy"
                    className="text-blue-600 hover:underline"
                  >
                    Privacy Policy
                  </a>
                  . I understand the cancellation policy and agree to the house
                  rules.
                </label>
              </div>
              {errors.agreeToTerms && (
                <p className="text-red-500 text-sm mt-2 ml-7">
                  {errors.agreeToTerms}
                </p>
              )}
            </Card>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-900">{errors.submit}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Continue to Payment"}
            </Button>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Property Card */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Booking Summary
                </h2>

                <div className="flex items-start space-x-4 mb-4">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    {property.images && property.images.length > 0 ? (
                      <Image
                        src={property.images[0].url}
                        alt={property.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">
                      {property.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="truncate">
                        {property.city}, {property.state}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex items-center text-gray-700">
                    <Calendar
                      className="h-5 w-5 mr-3"
                      style={{ color: accentColor }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Check-in</p>
                      <p className="text-sm">{formatDate(checkIn)}</p>
                    </div>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <Calendar
                      className="h-5 w-5 mr-3"
                      style={{ color: accentColor }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Check-out</p>
                      <p className="text-sm">{formatDate(checkOut)}</p>
                    </div>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <Users
                      className="h-5 w-5 mr-3"
                      style={{ color: accentColor }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Guests</p>
                      <p className="text-sm">
                        {guestsParam}{" "}
                        {parseInt(guestsParam) === 1 ? "guest" : "guests"}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Price Breakdown */}
              <Card
                className="p-6"
                style={{ borderTop: `4px solid ${secondaryColor}` }}
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Price Details
                </h2>

                {bookingCalculation ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-700">
                      <span>
                        {formatPrice(
                          bookingCalculation.subtotal /
                            bookingCalculation.nights,
                          bookingCalculation.currency
                        )}{" "}
                        × {bookingCalculation.nights}{" "}
                        {bookingCalculation.nights === 1 ? "night" : "nights"}
                      </span>
                      <span>
                        {formatPrice(
                          bookingCalculation.subtotal,
                          bookingCalculation.currency
                        )}
                      </span>
                    </div>

                    {bookingCalculation.fees > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span>Service fee</span>
                        <span>
                          {formatPrice(
                            bookingCalculation.fees,
                            bookingCalculation.currency
                          )}
                        </span>
                      </div>
                    )}

                    {bookingCalculation.taxes > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span>Taxes</span>
                        <span>
                          {formatPrice(
                            bookingCalculation.taxes,
                            bookingCalculation.currency
                          )}
                        </span>
                      </div>
                    )}

                    <div
                      className="border-t border-gray-200 pt-3 flex justify-between font-semibold text-lg"
                      style={{ color: brandColor }}
                    >
                      <span>Total</span>
                      <span>
                        {formatPrice(
                          bookingCalculation.total,
                          bookingCalculation.currency
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer
        realtorName={realtorName}
        tagline={tagline}
        logo={logoUrl}
        description={description}
        primaryColor={brandColor}
      />
    </div>
  );
}
