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
  Mail,
  Phone,
  ArrowLeft,
  Share2,
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
    const start = new Date(booking.checkIn);
    const end = new Date(booking.checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleDownloadConfirmation = () => {
    // TODO: Implement PDF download
    alert("PDF download will be implemented");
  };

  const handleAddToCalendar = () => {
    // TODO: Implement calendar export
    alert("Add to calendar will be implemented");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "My Booking",
        text: `I've booked ${booking?.property?.title}!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GuestHeader
          currentPage="profile"
          searchPlaceholder="Search location..."
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ backgroundColor: `${secondaryColor}20` }}
          >
            <CheckCircle
              className="h-10 w-10"
              style={{ color: secondaryColor }}
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-gray-600 text-lg">
            Your booking has been successfully confirmed
          </p>
          <p className="text-gray-500 mt-2">Confirmation #{booking.id}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <Button onClick={handleDownloadConfirmation} variant="primary">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={handleAddToCalendar} variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Add to Calendar
          </Button>
          <Button onClick={handleShare} variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Property Details */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your Booking
          </h2>

          <div className="flex items-start space-x-4 mb-6">
            <div className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
              {booking.property?.images?.[0]?.url ? (
                <Image
                  src={booking.property.images[0].url}
                  alt={booking.property.title || "Property"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Home className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {booking.property?.title || "Unknown Property"}
              </h3>
              <div className="space-y-1 text-gray-600">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{booking.property?.address}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>
                    {booking.property?.city}, {booking.property?.state},{" "}
                    {booking.property?.country}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-200 pt-6">
            <div>
              <div className="flex items-center text-gray-700 mb-1">
                <Calendar
                  className="h-5 w-5 mr-2"
                  style={{ color: accentColor }}
                />
                <p className="font-medium">Check-in</p>
              </div>
              <p className="text-gray-900 ml-7">
                {formatDate(booking.checkIn)}
              </p>
              <p className="text-sm text-gray-600 ml-7">
                After {booking.property?.checkInTime || "2:00 PM"}
              </p>
            </div>

            <div>
              <div className="flex items-center text-gray-700 mb-1">
                <Calendar
                  className="h-5 w-5 mr-2"
                  style={{ color: accentColor }}
                />
                <p className="font-medium">Check-out</p>
              </div>
              <p className="text-gray-900 ml-7">
                {formatDate(booking.checkOut)}
              </p>
              <p className="text-sm text-gray-600 ml-7">
                Before {booking.property?.checkOutTime || "11:00 AM"}
              </p>
            </div>

            <div>
              <div className="flex items-center text-gray-700 mb-1">
                <Users
                  className="h-5 w-5 mr-2"
                  style={{ color: accentColor }}
                />
                <p className="font-medium">Guests</p>
              </div>
              <p className="text-gray-900 ml-7">
                {booking.guests} {booking.guests === 1 ? "guest" : "guests"}
              </p>
            </div>

            <div>
              <div className="flex items-center text-gray-700 mb-1">
                <Home className="h-5 w-5 mr-2 text-gray-400" />
                <p className="font-medium">Duration</p>
              </div>
              <p className="text-gray-900 ml-7">
                {nights} {nights === 1 ? "night" : "nights"}
              </p>
            </div>
          </div>
        </Card>

        {/* Host Information */}
        {booking.property?.realtor && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Host Information
            </h2>
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                {booking.property.realtor.businessName?.charAt(0) || "H"}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {booking.property.realtor.businessName || "Host"}
                </h3>
                {booking.property.realtor.businessEmail && (
                  <div className="flex items-center text-gray-600 mb-1">
                    <Mail className="h-4 w-4 mr-2" />
                    <a
                      href={`mailto:${booking.property.realtor.businessEmail}`}
                      className="hover:text-blue-600"
                    >
                      {booking.property.realtor.businessEmail}
                    </a>
                  </div>
                )}
                {booking.property.realtor.businessPhone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <a
                      href={`tel:${booking.property.realtor.businessPhone}`}
                      className="hover:text-blue-600"
                    >
                      {booking.property.realtor.businessPhone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Payment Summary */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Payment Summary
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>
                {formatPrice(booking.totalPrice / nights, booking.currency)} ×{" "}
                {nights} {nights === 1 ? "night" : "nights"}
              </span>
              <span>{formatPrice(booking.totalPrice, booking.currency)}</span>
            </div>

            <div className="border-t border-gray-200 pt-3 flex justify-between font-semibold text-gray-900 text-lg">
              <span>Total Paid</span>
              <span>{formatPrice(booking.totalPrice, booking.currency)}</span>
            </div>
          </div>
        </Card>

        {/* What's Next */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            What's Next?
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-3 text-green-600 mt-0.5 flex-shrink-0" />
              <span>
                You'll receive a confirmation email at{" "}
                <strong>{user?.email}</strong>
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-3 text-green-600 mt-0.5 flex-shrink-0" />
              <span>
                The host will send you check-in instructions closer to your
                arrival date
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-3 text-green-600 mt-0.5 flex-shrink-0" />
              <span>
                You can contact the host directly through the Messages section
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-3 text-green-600 mt-0.5 flex-shrink-0" />
              <span>
                View your booking details anytime in the "My Bookings" section
              </span>
            </li>
          </ul>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button
            onClick={() => router.push(`/guest/bookings/${bookingId}`)}
            className="flex-1"
            variant="primary"
          >
            View Booking Details
          </Button>
          <Button
            onClick={() => router.push("/browse")}
            className="flex-1"
            variant="outline"
          >
            Browse More Properties
          </Button>
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
