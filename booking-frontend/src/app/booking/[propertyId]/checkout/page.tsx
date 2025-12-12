"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  MapPin,
  Calendar,
  Users,
  CreditCard,
  AlertCircle,
  ArrowLeft,
  Check,
  Home,
} from "lucide-react";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { Footer } from "@/components/guest/sections";
import { Card, Button, Input } from "@/components/ui";
import { useProperty } from "@/hooks/useProperties";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { bookingService } from "@/services";
import { PaymentRetryAlert } from "@/components/payments/RetryIndicator";

export default function BookingCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: userLoading } = useCurrentUser();

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

  console.log("🔍 Checkout Page Render - URL Params:", {
    propertyId,
    checkIn,
    checkOut,
    guestsParam,
    userLoading,
    hasUser: !!user,
  });

  const { data: property, isLoading: propertyLoading } =
    useProperty(propertyId);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    specialRequests: "",
    agreeToTerms: false,
    paymentMethod: "paystack" as "paystack" | "flutterwave",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingCalculation, setBookingCalculation] = useState<{
    subtotal: number;
    serviceFee: number;
    cleaningFee: number;
    securityDeposit: number;
    taxes: number;
    fees: number;
    total: number;
    currency: string;
    nights: number;
  } | null>(null);

  // Update form data when user loads
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  // Redirect if not authenticated (only after loading completes)
  useEffect(() => {
    if (!userLoading && !user) {
      router.push(
        `/guest/login?redirect=/booking/${propertyId}/checkout?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guestsParam}`
      );
    }
  }, [user, userLoading, router, propertyId, checkIn, checkOut, guestsParam]);

  // Calculate booking total
  useEffect(() => {
    const fetchBookingCalculation = async () => {
      if (!checkIn || !checkOut || !propertyId) {
        console.log("⚠️ Missing required params for booking calculation:", {
          checkIn,
          checkOut,
          propertyId,
        });
        return;
      }

      try {
        console.log("💰 Fetching booking calculation...", {
          propertyId,
          checkIn,
          checkOut,
          guests: guestsParam,
        });

        const calculation = await bookingService.calculateBookingTotal(
          propertyId,
          new Date(checkIn),
          new Date(checkOut),
          parseInt(guestsParam)
        );

        console.log("✅ Booking calculation received:", calculation);
        console.log("✅ Calculation type:", typeof calculation);
        console.log("✅ Calculation keys:", Object.keys(calculation || {}));

        // Backend returns all fields we need
        setBookingCalculation(calculation);
      } catch (error: any) {
        console.error("❌ Error calculating booking:", error);
        console.error("❌ Error message:", error?.message);
        console.error("❌ Error response:", error?.response?.data);
      }
    };

    fetchBookingCalculation();
  }, [propertyId, checkIn, checkOut, guestsParam]);

  // Debug: Log when bookingCalculation state changes
  useEffect(() => {
    console.log("📊 bookingCalculation state updated:", bookingCalculation);
  }, [bookingCalculation]);

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

      // Redirect to payment page with payment method
      router.push(
        `/booking/${propertyId}/payment?bookingId=${booking.id}&paymentMethod=${formData.paymentMethod}`
      );
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

  // Show loading state while checking authentication or loading property
  if (userLoading || propertyLoading || !property) {
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

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <GuestHeader
        currentPage="profile"
        searchPlaceholder="Search location..."
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white"
                style={{ backgroundColor: brandColor }}
              >
                1
              </div>
              <span className="ml-2 font-medium text-gray-900">
                Guest Details
              </span>
            </div>
            <div className="w-16 h-1 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold bg-gray-200 text-gray-600">
                2
              </div>
              <span className="ml-2 font-medium text-gray-500">Payment</span>
            </div>
            <div className="w-16 h-1 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold bg-gray-200 text-gray-600">
                3
              </div>
              <span className="ml-2 font-medium text-gray-500">
                Confirmation
              </span>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center hover:opacity-80 mb-6 transition-all"
          style={{ color: secondaryColor }}
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to property
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1
                className="text-3xl font-bold mb-2"
                style={{ color: secondaryColor }}
              >
                Confirm and pay
              </h1>
              <p className="text-gray-600">
                Please review your booking details and complete your information
              </p>
            </div>

            {/* Guest Information */}
            <Card
              className="p-6 border border-gray-200 !bg-white shadow-sm"
              style={{ backgroundColor: "#ffffff", color: "#111827" }}
            >
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: secondaryColor }}
              >
                Guest Information
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: secondaryColor }}
                    >
                      First Name *
                    </label>
                    <Input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      className={`w-full px-4 py-3 bg-transparent border-2 ${
                        errors.firstName ? "border-red-500" : "border-gray-200"
                      } rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2`}
                      placeholder="Enter first name"
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: secondaryColor }}
                    >
                      Last Name *
                    </label>
                    <Input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      className={`w-full px-4 py-3 bg-transparent border-2 ${
                        errors.lastName ? "border-red-500" : "border-gray-200"
                      } rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2`}
                      placeholder="Enter last name"
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: secondaryColor }}
                  >
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`w-full px-4 py-3 bg-transparent border-2 ${
                      errors.email ? "border-red-500" : "border-gray-200"
                    } rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2`}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: secondaryColor }}
                  >
                    Phone Number *
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className={`w-full px-4 py-3 bg-transparent border-2 ${
                      errors.phone ? "border-red-500" : "border-gray-200"
                    } rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2`}
                    placeholder="Enter phone number"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: secondaryColor }}
                  >
                    Special Requests (Optional)
                  </label>
                  <textarea
                    value={formData.specialRequests}
                    onChange={(e) =>
                      handleInputChange("specialRequests", e.target.value)
                    }
                    rows={4}
                    className="w-full px-4 py-3 bg-transparent border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 resize-none"
                    placeholder="Any special requests or notes for the host..."
                  />
                </div>
              </form>
            </Card>

            {/* Payment Method */}
            <Card
              className="p-6 border border-gray-200 !bg-white shadow-sm"
              style={{ backgroundColor: "#ffffff", color: "#111827" }}
            >
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: secondaryColor }}
              >
                Payment Method
              </h2>

              <div className="space-y-3">
                {/* Paystack Option */}
                <button
                  type="button"
                  onClick={() => handleInputChange("paymentMethod", "paystack")}
                  className={`w-full border-2 rounded-xl p-4 transition-all ${
                    formData.paymentMethod === "paystack"
                      ? "border-2"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={
                    formData.paymentMethod === "paystack"
                      ? {
                          borderColor: brandColor,
                          backgroundColor: `${brandColor}08`,
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center mr-4"
                        style={
                          formData.paymentMethod === "paystack"
                            ? { backgroundColor: `${brandColor}15` }
                            : { backgroundColor: "#f3f4f6" }
                        }
                      >
                        <CreditCard
                          className="h-6 w-6"
                          style={
                            formData.paymentMethod === "paystack"
                              ? { color: brandColor }
                              : { color: "#9ca3af" }
                          }
                        />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">Paystack</p>
                        <p className="text-sm text-gray-600">
                          Pay with card, bank transfer, or USSD
                        </p>
                      </div>
                    </div>
                    {formData.paymentMethod === "paystack" && (
                      <Check
                        className="h-6 w-6"
                        style={{ color: brandColor }}
                      />
                    )}
                  </div>
                </button>

                {/* Flutterwave Option */}
                <button
                  type="button"
                  onClick={() =>
                    handleInputChange("paymentMethod", "flutterwave")
                  }
                  className={`w-full border-2 rounded-xl p-4 transition-all ${
                    formData.paymentMethod === "flutterwave"
                      ? "border-2"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={
                    formData.paymentMethod === "flutterwave"
                      ? {
                          borderColor: brandColor,
                          backgroundColor: `${brandColor}08`,
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center mr-4"
                        style={
                          formData.paymentMethod === "flutterwave"
                            ? { backgroundColor: `${brandColor}15` }
                            : { backgroundColor: "#f3f4f6" }
                        }
                      >
                        <CreditCard
                          className="h-6 w-6"
                          style={
                            formData.paymentMethod === "flutterwave"
                              ? { color: brandColor }
                              : { color: "#9ca3af" }
                          }
                        />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">
                          Flutterwave
                        </p>
                        <p className="text-sm text-gray-600">
                          Secure international payment gateway
                        </p>
                      </div>
                    </div>
                    {formData.paymentMethod === "flutterwave" && (
                      <Check
                        className="h-6 w-6"
                        style={{ color: brandColor }}
                      />
                    )}
                  </div>
                </button>

                {/* Security Notice */}
                <div
                  className="border rounded-lg p-4 flex items-start"
                  style={{
                    backgroundColor: `${brandColor}08`,
                    borderColor: `${brandColor}30`,
                  }}
                >
                  <AlertCircle
                    className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0"
                    style={{ color: brandColor }}
                  />
                  <div className="text-sm" style={{ color: secondaryColor }}>
                    <p className="font-semibold mb-1">🔒 Secure Payment</p>
                    <p>
                      Your payment information is encrypted and secure. You will
                      be redirected to{" "}
                      {formData.paymentMethod === "paystack"
                        ? "Paystack"
                        : "Flutterwave"}{" "}
                      to complete your payment safely.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Terms and Conditions */}
            <Card
              className="p-6 border border-gray-200 !bg-white shadow-sm"
              style={{ backgroundColor: "#ffffff", color: "#111827" }}
            >
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
              className="w-full text-white font-semibold hover:opacity-90"
              size="lg"
              disabled={isSubmitting}
              style={{ backgroundColor: brandColor }}
            >
              {isSubmitting ? "Processing..." : "Continue to Payment"}
            </Button>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Property Card */}
              <Card
                className="p-6 border border-gray-200 !bg-white shadow-sm"
                style={{ backgroundColor: "#ffffff", color: "#111827" }}
              >
                <h2
                  className="text-lg font-semibold mb-4"
                  style={{ color: secondaryColor }}
                >
                  Booking Summary
                </h2>

                <div className="flex items-start space-x-4 mb-4">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                    {property.images &&
                    property.images.length > 0 &&
                    property.images[0]?.url ? (
                      <img
                        src={property.images[0].url}
                        alt={property.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Home className="h-8 w-8 text-gray-400" />
                      </div>
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
                className="p-6 border border-gray-200 !bg-white shadow-sm"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  borderTop: `4px solid ${brandColor}`,
                }}
              >
                <h2
                  className="text-lg font-semibold mb-4"
                  style={{ color: secondaryColor }}
                >
                  Price Details
                </h2>

                {(() => {
                  console.log(
                    "📊 Rendering price details, bookingCalculation:",
                    bookingCalculation
                  );
                  return bookingCalculation ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-gray-700">
                        <span className="text-sm">
                          {formatPrice(
                            bookingCalculation.subtotal /
                              bookingCalculation.nights,
                            bookingCalculation.currency
                          )}{" "}
                          × {bookingCalculation.nights}{" "}
                          {bookingCalculation.nights === 1 ? "night" : "nights"}
                        </span>
                        <span className="font-medium">
                          {formatPrice(
                            bookingCalculation.subtotal,
                            bookingCalculation.currency
                          )}
                        </span>
                      </div>

                      {bookingCalculation.serviceFee > 0 && (
                        <div className="flex justify-between text-gray-700">
                          <span className="text-sm">Service fee</span>
                          <span className="font-medium">
                            {formatPrice(
                              bookingCalculation.serviceFee,
                              bookingCalculation.currency
                            )}
                          </span>
                        </div>
                      )}

                      {bookingCalculation.cleaningFee > 0 && (
                        <div className="flex justify-between text-gray-700">
                          <span className="text-sm">Cleaning fee</span>
                          <span className="font-medium">
                            {formatPrice(
                              bookingCalculation.cleaningFee,
                              bookingCalculation.currency
                            )}
                          </span>
                        </div>
                      )}

                      {bookingCalculation.securityDeposit > 0 && (
                        <div className="flex justify-between text-gray-700">
                          <span className="text-sm">
                            Security deposit (refundable)
                          </span>
                          <span className="font-medium">
                            {formatPrice(
                              bookingCalculation.securityDeposit,
                              bookingCalculation.currency
                            )}
                          </span>
                        </div>
                      )}

                      {bookingCalculation.taxes > 0 && (
                        <div className="flex justify-between text-gray-700">
                          <span className="text-sm">Taxes</span>
                          <span className="font-medium">
                            {formatPrice(
                              bookingCalculation.taxes,
                              bookingCalculation.currency
                            )}
                          </span>
                        </div>
                      )}

                      <div
                        className="border-t-2 pt-4 flex justify-between items-center"
                        style={{ borderColor: `${brandColor}30` }}
                      >
                        <span
                          className="text-lg font-bold"
                          style={{ color: secondaryColor }}
                        >
                          Total
                        </span>
                        <span
                          className="text-xl font-bold"
                          style={{ color: brandColor }}
                        >
                          {formatPrice(
                            bookingCalculation.total,
                            bookingCalculation.currency
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-6 bg-gray-200 rounded animate-pulse mt-4"></div>
                    </div>
                  );
                })()}
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
