"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle,
  Calendar,
  MapPin,
  Users,
  Home,
  Download,
  Check,
} from "lucide-react";
import Image from "next/image";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { Footer } from "@/components/guest/sections";
import { Card, Button } from "@/components/ui";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { useQuery } from "react-query";
import { bookingService } from "@/services";

export default function BookingConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useCurrentUser();
  const bookingId = params.id as string;

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

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!user) {
      router.push(`/guest/login?redirect=/booking/confirmation/${bookingId}`);
    }
  }, [user, router, bookingId]);

  // Fetch booking details
  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => bookingService.getBooking(bookingId),
    enabled: !!user && !!bookingId,
  });

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPrice = (price: number, currency: string = "NGN") => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const calculateNights = () => {
    if (!booking) return 0;
    const start = new Date(booking.checkInDate);
    const end = new Date(booking.checkOutDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleDownloadConfirmation = () => {
    // TODO: Implement PDF download
    alert("PDF download will be implemented");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GuestHeader
          currentPage="profile"
          searchPlaceholder="Search location..."
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
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

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GuestHeader
          currentPage="profile"
          searchPlaceholder="Search location..."
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Booking Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The booking you're looking for doesn't exist.
            </p>
            <Button onClick={() => router.push("/guest/bookings")}>
              View My Bookings
            </Button>
          </Card>
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

  const nights = calculateNights();

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
                <Check className="h-6 w-6" />
              </div>
              <span className="ml-2 font-medium text-gray-900">
                Guest Details
              </span>
            </div>
            <div
              className="w-16 h-1"
              style={{ backgroundColor: brandColor }}
            ></div>
            <div className="flex items-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white"
                style={{ backgroundColor: brandColor }}
              >
                <Check className="h-6 w-6" />
              </div>
              <span className="ml-2 font-medium text-gray-900">Payment</span>
            </div>
            <div
              className="w-16 h-1"
              style={{ backgroundColor: brandColor }}
            ></div>
            <div className="flex items-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white"
                style={{ backgroundColor: brandColor }}
              >
                <Check className="h-6 w-6" />
              </div>
              <span className="ml-2 font-medium text-gray-900">
                Confirmation
              </span>
            </div>
          </div>
        </div>

        {/* Success Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 shadow-lg"
            style={{
              backgroundColor: `${secondaryColor}15`,
              border: `2px solid ${secondaryColor}`,
            }}
          >
            <CheckCircle
              className="h-12 w-12"
              style={{ color: secondaryColor }}
            />
          </div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: secondaryColor }}
          >
            Booking Confirmed!
          </h1>
          <p className="text-gray-600">
            Your booking has been successfully confirmed
          </p>
          <p className="text-sm text-gray-500 font-mono bg-gray-100 inline-block px-4 py-2 rounded-full mt-3">
            Confirmation #{booking.id.substring(0, 8).toUpperCase()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={handleDownloadConfirmation}
            className="shadow-sm hover:shadow-md transition-all"
            style={{ backgroundColor: brandColor }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>

        {/* Property Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card
              className="p-6 border border-gray-200 !bg-white shadow-sm"
              style={{ backgroundColor: "#ffffff", color: "#111827" }}
            >
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: secondaryColor }}
              >
                Property Details
              </h2>

              <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
                <div className="relative w-full md:w-48 h-48 rounded-xl overflow-hidden flex-shrink-0">
                  {booking.property?.images?.[0]?.url ? (
                    <Image
                      src={booking.property.images[0].url}
                      alt={booking.property.title || "Property"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Home className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {booking.property?.title || "Unknown Property"}
                  </h3>
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>
                      {booking.property?.city}, {booking.property?.state}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center mb-2">
                    <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-900">
                      Check-in
                    </span>
                  </div>
                  <p className="text-gray-900 font-semibold">
                    {formatDate(booking.checkInDate)}
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="flex items-center mb-2">
                    <Calendar className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="text-sm font-medium text-purple-900">
                      Check-out
                    </span>
                  </div>
                  <p className="text-gray-900 font-semibold">
                    {formatDate(booking.checkOutDate)}
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-center mb-2">
                    <Users className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-900">
                      Guests
                    </span>
                  </div>
                  <p className="text-gray-900 font-semibold">
                    {booking.totalGuests}{" "}
                    {booking.totalGuests === 1 ? "Guest" : "Guests"}
                  </p>
                </div>

                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="flex items-center mb-2">
                    <Calendar className="h-5 w-5 text-orange-600 mr-2" />
                    <span className="text-sm font-medium text-orange-900">
                      Duration
                    </span>
                  </div>
                  <p className="text-gray-900 font-semibold">
                    {nights} {nights === 1 ? "Night" : "Nights"}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card
              className="p-6 border border-gray-200 !bg-white shadow-sm sticky top-8"
              style={{ backgroundColor: "#ffffff", color: "#111827" }}
            >
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: secondaryColor }}
              >
                Payment Summary
              </h2>

              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                <div className="flex justify-between text-gray-700">
                  <span>
                    {formatPrice(
                      booking.property?.pricePerNight || 0,
                      booking.currency
                    )}{" "}
                    x {nights} nights
                  </span>
                  <span className="font-medium">
                    {formatPrice(
                      (booking.property?.pricePerNight || 0) * nights,
                      booking.currency
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <span
                  className="text-lg font-semibold"
                  style={{ color: secondaryColor }}
                >
                  Total
                </span>
                <span
                  className="text-2xl font-bold"
                  style={{ color: brandColor }}
                >
                  {formatPrice(booking.totalPrice, booking.currency)}
                </span>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span
                      className="font-semibold"
                      style={{ color: brandColor }}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="font-medium">
                      {booking.payment?.providerId?.toUpperCase() ||
                        booking.payment?.method?.toUpperCase() ||
                        "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => router.push("/guest/bookings")}
                className="w-full mt-6"
                style={{ backgroundColor: brandColor }}
              >
                View All Bookings
              </Button>
            </Card>
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
