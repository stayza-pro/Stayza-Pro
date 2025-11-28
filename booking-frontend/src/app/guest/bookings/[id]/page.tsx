"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Users,
  Phone,
  Mail,
  Home,
  Download,
  X,
  ArrowLeft,
  Star,
  MessageCircle,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { Footer } from "@/components/guest/sections";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { Card, Button } from "@/components/ui";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { bookingService } from "@/services/bookings";
import { BookingStatus } from "@/types";

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const {
    brandColor: primaryColor, // Lighter touch - primary for CTAs and key elements
    secondaryColor, // Lighter touch - secondary for confirmed status
    accentColor, // Lighter touch - accent for pending status
    realtorName,
    logoUrl,
    tagline,
    description,
  } = useRealtorBranding();
  const queryClient = useQueryClient();
  const bookingId = params.id as string;
  const [authChecked, setAuthChecked] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Mark auth as checked once we've gotten a result
  React.useEffect(() => {
    if (!isLoading && (isAuthenticated || !authChecked)) {
      setAuthChecked(true);
    }
  }, [isLoading, isAuthenticated, authChecked]);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (authChecked && !isLoading && !isAuthenticated) {
      router.push(`/guest/login?returnTo=/guest/bookings/${bookingId}`);
    }
  }, [isLoading, isAuthenticated, authChecked, router, bookingId]);

  // Fetch booking details
  const { data: booking, isLoading: bookingLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => bookingService.getBooking(bookingId),
    enabled: !!user && !!bookingId,
  });

  // Cancel booking mutation
  const cancelMutation = useMutation({
    mutationFn: (reason: string) =>
      bookingService.cancelBooking(bookingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["guest-bookings"] });
      setShowCancelModal(false);
      setCancelReason("");
    },
  });

  const handleCancelBooking = () => {
    if (!cancelReason.trim()) {
      alert("Please provide a cancellation reason");
      return;
    }
    cancelMutation.mutate(cancelReason);
  };

  const handleDownloadReceipt = () => {
    // TODO: Implement receipt download
    alert("Receipt download will be implemented");
  };

  const handleWriteReview = () => {
    router.push(`/guest/bookings/${bookingId}/review`);
  };

  const handleContactHost = () => {
    router.push(`/guest/messages?hostId=${booking?.property?.realtorId}`);
  };

  const getStatusConfig = (status: BookingStatus) => {
    switch (status) {
      case "CONFIRMED":
        return {
          icon: CheckCircle,
          text: "Confirmed",
          backgroundColor: secondaryColor,
          color: "#ffffff",
          borderColor: secondaryColor,
        };
      case "PENDING":
        return {
          icon: Clock,
          text: "Pending",
          backgroundColor: accentColor,
          color: "#ffffff",
          borderColor: accentColor,
        };
      case "CANCELLED":
        return {
          icon: XCircle,
          text: "Cancelled",
          backgroundColor: "#FEE2E2",
          color: "#991B1B",
          borderColor: "#FECACA",
        };
      case "COMPLETED":
        return {
          icon: CheckCircle,
          text: "Completed",
          backgroundColor: primaryColor, // Lighter touch - primary for completed status
          color: "#ffffff",
          borderColor: primaryColor,
        };
      default:
        return {
          icon: Clock,
          text: status,
          backgroundColor: "#F3F4F6",
          color: "#1F2937",
          borderColor: "#E5E7EB",
        };
    }
  };

  const isOngoing = () => {
    if (!booking) return false;
    const now = new Date();
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    return checkIn <= now && checkOut >= now && booking.status === "CONFIRMED";
  };

  const canCancel = () => {
    if (!booking) return false;
    const checkIn = new Date(booking.checkIn);
    const now = new Date();
    const hoursDiff = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);
    return (
      booking.status === "CONFIRMED" &&
      hoursDiff > 24 &&
      booking.paymentStatus !== "REFUNDED"
    );
  };

  const canReview = () => {
    if (!booking) return false;
    const checkOut = new Date(booking.checkOut);
    const now = new Date();
    return (
      booking.status === "COMPLETED" &&
      checkOut < now &&
      !booking.reviews?.length
    );
  };

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

  if (!authChecked || isLoading || bookingLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GuestHeader
          currentPage="bookings"
          searchPlaceholder="Search your bookings..."
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
        <Footer
          realtorName={realtorName}
          tagline={tagline}
          logo={logoUrl}
          description={description}
          primaryColor={primaryColor}
        />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GuestHeader
          currentPage="bookings"
          searchPlaceholder="Search your bookings..."
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Booking Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The booking you're looking for doesn't exist or you don't have
              access to it.
            </p>
            <Button onClick={() => router.push("/guest/bookings")}>
              Back to Bookings
            </Button>
          </Card>
        </div>
        <Footer
          realtorName={realtorName}
          tagline={tagline}
          logo={logoUrl}
          description={description}
          primaryColor={primaryColor}
        />
      </div>
    );
  }

  const status = getStatusConfig(booking.status);
  const StatusIcon = status.icon;
  const nights = calculateNights();
  const ongoing = isOngoing();

  return (
    <div className="min-h-screen bg-gray-50">
      <GuestHeader
        currentPage="bookings"
        searchPlaceholder="Search your bookings..."
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/guest/bookings")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to bookings
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Booking Details
            </h1>
            <div
              className="flex items-center space-x-2 px-4 py-2 rounded-full border-2 font-medium"
              style={{
                backgroundColor: status.backgroundColor,
                color: status.color,
                borderColor: status.borderColor,
              }}
            >
              <StatusIcon className="h-5 w-5" />
              <span>{status.text}</span>
            </div>
          </div>

          {ongoing && (
            <div
              className="border rounded-lg p-4 flex items-center"
              style={{
                backgroundColor: accentColor + "10",
                borderColor: accentColor + "30",
              }}
            >
              <AlertCircle
                className="h-5 w-5 mr-3"
                style={{ color: accentColor }}
              />
              <p className="font-medium" style={{ color: accentColor }}>
                Your stay is currently ongoing. Enjoy your time!
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Home className="h-5 w-5 mr-2" />
                Property
              </h2>

              <div className="flex items-start space-x-4 mb-4">
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
                        {booking.property?.city}, {booking.property?.state}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {booking.property?.realtor && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <p className="text-sm text-gray-600 mb-2">Hosted by</p>
                  <p className="font-semibold text-gray-900">
                    {booking.property.realtor.businessName}
                  </p>
                  {booking.property.realtor.businessEmail && (
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Mail className="h-4 w-4 mr-2" />
                      <span>{booking.property.realtor.businessEmail}</span>
                    </div>
                  )}
                  {booking.property.realtor.businessPhone && (
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{booking.property.realtor.businessPhone}</span>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Booking Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Booking Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Check-in</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(booking.checkIn)}
                  </p>
                  <p className="text-sm text-gray-600">
                    After {booking.property?.checkInTime || "2:00 PM"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Check-out</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(booking.checkOut)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Before {booking.property?.checkOutTime || "11:00 AM"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Guests</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {booking.guests} {booking.guests === 1 ? "guest" : "guests"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Duration</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {nights} {nights === 1 ? "night" : "nights"}
                  </p>
                </div>
              </div>

              {booking.specialRequests && (
                <div className="border-t border-gray-200 mt-6 pt-6">
                  <p className="text-sm text-gray-600 mb-2">Special Requests</p>
                  <p className="text-gray-900">{booking.specialRequests}</p>
                </div>
              )}
            </Card>

            {/* Payment Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Payment Details
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>
                    {formatPrice(booking.totalPrice / nights, booking.currency)}{" "}
                    × {nights} {nights === 1 ? "night" : "nights"}
                  </span>
                  <span>
                    {formatPrice(booking.totalPrice, booking.currency)}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-3 flex justify-between font-semibold text-gray-900 text-lg">
                  <span>Total</span>
                  <span>
                    {formatPrice(booking.totalPrice, booking.currency)}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {booking.paymentStatus?.toLowerCase()}
                  </p>
                </div>

                {booking.payment?.reference && (
                  <div>
                    <p className="text-sm text-gray-600">Payment Reference</p>
                    <p className="font-mono text-sm text-gray-900">
                      {booking.payment.reference}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
                <div className="space-y-2">
                  {canReview() && (
                    <Button
                      onClick={handleWriteReview}
                      className="w-full"
                      variant="primary"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Write a Review
                    </Button>
                  )}

                  <Button
                    onClick={handleDownloadReceipt}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </Button>

                  <Button
                    onClick={handleContactHost}
                    className="w-full"
                    variant="outline"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact Host
                  </Button>

                  {canCancel() && (
                    <Button
                      onClick={() => setShowCancelModal(true)}
                      className="w-full"
                      variant="outline"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel Booking
                    </Button>
                  )}
                </div>
              </Card>

              <Card
                className="p-4 border"
                style={{
                  backgroundColor: accentColor + "10",
                  borderColor: accentColor + "30",
                }}
              >
                <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
                <p className="text-sm text-gray-700 mb-3">
                  If you have any questions or concerns about your booking,
                  please contact our support team.
                </p>
                <Button
                  onClick={() => router.push("/contact")}
                  variant="outline"
                  className="w-full"
                >
                  Contact Support
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Cancel Booking
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel this booking? Please provide a
              reason for cancellation.
            </p>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              placeholder="Reason for cancellation..."
            />

            <div className="flex space-x-3">
              <Button
                onClick={handleCancelBooking}
                variant="primary"
                className="flex-1"
                disabled={cancelMutation.isLoading}
              >
                {cancelMutation.isLoading ? "Cancelling..." : "Confirm Cancel"}
              </Button>
              <Button
                onClick={() => setShowCancelModal(false)}
                variant="outline"
                className="flex-1"
                disabled={cancelMutation.isLoading}
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Footer
        realtorName={realtorName}
        tagline={tagline}
        logo={logoUrl}
        description={description}
        primaryColor={primaryColor}
      />
    </div>
  );
}
