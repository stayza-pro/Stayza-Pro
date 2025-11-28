"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Download,
  Search,
  FileText,
  Home,
} from "lucide-react";
import Image from "next/image";
import { Card, Button, Input } from "@/components/ui";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { Footer } from "@/components/guest/sections/Footer";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { useQuery } from "react-query";
import { bookingService } from "@/services";
import { Booking } from "@/types";

export default function BookingHistoryPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  // Use realtor branding hook for consistent styling
  const {
    brandColor: primaryColor, // Lighter touch - primary for CTAs
    secondaryColor, // Lighter touch - secondary for accents
    accentColor, // Lighter touch - accent for highlights
    realtorName,
    logoUrl,
    tagline,
    description,
  } = useRealtorBranding();

  // Mark auth as checked once we've gotten a result
  React.useEffect(() => {
    if (!isLoading && (isAuthenticated || !authChecked)) {
      setAuthChecked(true);
    }
  }, [isLoading, isAuthenticated, authChecked]);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (authChecked && !isLoading && !isAuthenticated) {
      router.push("/guest/login?returnTo=/guest/history");
    }
  }, [isLoading, isAuthenticated, authChecked, router]);

  // Fetch completed bookings
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ["booking-history"],
    queryFn: () => bookingService.getUserBookings(),
    enabled: !!user,
  });

  const bookings = (bookingsData?.data || []).filter(
    (b: Booking) => b.status === "COMPLETED"
  );

  // Show loading state while checking authentication
  if (!authChecked || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-100 rounded w-1/3"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Filter by search query
  const filteredBookings = bookings.filter((booking: Booking) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const title = booking.property?.title?.toLowerCase() || "";
    const location =
      `${booking.property?.city} ${booking.property?.state}`.toLowerCase();
    return title.includes(query) || location.includes(query);
  });

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPrice = (price: number, currency: string = "NGN") => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const calculateNights = (checkIn: Date | string, checkOut: Date | string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const totalSpent = bookings.reduce(
    (sum: number, booking: Booking) => sum + booking.totalPrice,
    0
  );

  const handleDownloadReceipt = (bookingId: string) => {
    // TODO: Implement receipt download
    alert(`Downloading receipt for booking ${bookingId}`);
  };

  const handleDownloadAllReceipts = () => {
    // TODO: Implement bulk download
    alert("Downloading all receipts");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GuestHeader
          currentPage="history"
          searchPlaceholder="Search bookings..."
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
        <Footer
          realtorName={realtorName}
          logo={logoUrl}
          tagline={tagline || "Premium short-let properties"}
          description={description || "Experience luxury accommodations"}
          primaryColor={primaryColor}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <GuestHeader
        currentPage="history"
        searchPlaceholder="Search bookings..."
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Booking History
              </h1>
              <p className="text-gray-600">
                View all your past bookings and download receipts
              </p>
            </div>
            <p className="text-xs text-gray-400 mt-1">Powered by Stayza Pro</p>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="p-6 text-center">
            <p
              className="text-3xl font-bold mb-2"
              style={{ color: primaryColor }} // Lighter touch - primary for stat
            >
              {bookings.length}
            </p>
            <p className="text-gray-600">Total Bookings</p>
          </Card>

          <Card className="p-6 text-center">
            <p
              className="text-3xl font-bold mb-2"
              style={{ color: secondaryColor }}
            >
              {formatPrice(totalSpent)}
            </p>
            <p className="text-gray-600">Total Spent</p>
          </Card>

          <Card className="p-6 text-center">
            <Button
              onClick={handleDownloadAllReceipts}
              className="w-full"
              style={{ backgroundColor: primaryColor }} // Lighter touch - primary for CTA
            >
              <Download className="h-4 w-4 mr-2" />
              Download All Receipts
            </Button>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search booking history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? "No bookings found" : "No booking history"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Your completed bookings will appear here"}
            </p>
            {!searchQuery && (
              <Button onClick={() => router.push("/browse")}>
                Browse Properties
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking: Booking) => {
              const nights = calculateNights(booking.checkIn, booking.checkOut);

              return (
                <Card key={booking.id} className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Property Image */}
                    <div className="relative w-full md:w-48 h-48 md:h-auto rounded-lg overflow-hidden flex-shrink-0">
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

                    {/* Booking Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {booking.property?.title || "Unknown Property"}
                          </h3>
                          <div className="flex items-center text-gray-600 mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>
                              {booking.property?.city},{" "}
                              {booking.property?.state}
                            </span>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleDownloadReceipt(booking.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Receipt
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Check-in</p>
                          <p className="font-semibold text-gray-900">
                            {formatDate(booking.checkIn)}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-600">Check-out</p>
                          <p className="font-semibold text-gray-900">
                            {formatDate(booking.checkOut)}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-600">Duration</p>
                          <p className="font-semibold text-gray-900">
                            {nights} {nights === 1 ? "night" : "nights"}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-600">Total Paid</p>
                          <p className="font-semibold text-gray-900">
                            {formatPrice(booking.totalPrice, booking.currency)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Booking ID</p>
                          <p className="font-mono text-sm text-gray-900">
                            {booking.id}
                          </p>
                        </div>

                        <Button
                          onClick={() =>
                            router.push(`/guest/bookings/${booking.id}`)
                          }
                          variant="outline"
                          size="sm"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Footer
        realtorName={realtorName}
        logo={logoUrl}
        tagline={tagline || "Premium short-let properties"}
        description={description || "Experience luxury accommodations"}
        primaryColor={primaryColor}
      />
    </div>
  );
}
