"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  UserRound,
  Heart,
  Share2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Star,
  Clock,
} from "lucide-react";
import { AnimatedDateInput, Button } from "@/components/ui";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { useProperty, usePropertyAvailability } from "@/hooks/useProperties";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { bookingService, favoritesService } from "@/services";
import toast from "react-hot-toast";
import { formatPrice as formatNaira } from "@/utils/currency";
import { normalizeImageUrl } from "@/utils/imageUrl";

const toDateKey = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function GuestPropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const { user } = useCurrentUser();
  const { data: property, isLoading, error } = useProperty(propertyId);
  const { brandColor: primaryColor, accentColor } = useRealtorBranding();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [bookingCalculation, setBookingCalculation] = useState<{
    subtotal: number;
    serviceFee: number;
    cleaningFee: number;
    securityDeposit: number;
    taxes: number;
    total: number;
    currency: string;
    nights: number;
    serviceFeeBreakdown?: {
      total: number;
      stayza: number;
      processing: number;
      processingMode: string;
    };
  } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const minCheckInDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toDateKey(tomorrow);
  }, []);
  const availabilityRangeEnd = useMemo(() => {
    const rangeEnd = new Date();
    rangeEnd.setFullYear(rangeEnd.getFullYear() + 1);
    return toDateKey(rangeEnd);
  }, []);
  const { data: availabilityData } = usePropertyAvailability(
    propertyId,
    minCheckInDate,
    availabilityRangeEnd,
  );
  const unavailableDateSet = useMemo(
    () =>
      new Set(
        (availabilityData?.unavailableDates || []).filter(
          (value): value is string => Boolean(value),
        ),
      ),
    [availabilityData?.unavailableDates],
  );
  const unavailableDateList = useMemo(
    () => Array.from(unavailableDateSet),
    [unavailableDateSet],
  );
  const minimumCheckOutDate = useMemo(() => {
    if (!checkInDate) return minCheckInDate;
    const nextDay = new Date(checkInDate);
    nextDay.setDate(nextDay.getDate() + 1);
    return toDateKey(nextDay);
  }, [checkInDate, minCheckInDate]);

  const images = useMemo(
    () =>
      property?.images
        ?.map((image) =>
          normalizeImageUrl(
            image as
              | string
              | {
                  url?: string | null;
                  imageUrl?: string | null;
                  src?: string | null;
                }
              | null
              | undefined,
          ),
        )
        .filter(Boolean) || [
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&auto=format&fit=crop&q=80",
      ],
    [property?.images],
  );

  const title = property?.title || "Property";
  const address =
    property?.address ||
    [property?.city, property?.state].filter(Boolean).join(", ") ||
    "Address unavailable";

  const featureList = useMemo(() => {
    const standardAmenities =
      property?.amenities?.map((item) =>
        item
          .toLowerCase()
          .split("_")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" "),
      ) || [];
    const customAmenities =
      property?.customAmenities
        ?.map((item) => item?.trim())
        .filter((item): item is string => Boolean(item)) || [];
    const mergedAmenities = [...standardAmenities, ...customAmenities];
    const seen = new Set<string>();

    return mergedAmenities.filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [property?.amenities, property?.customAmenities]);

  const formatPrice = (value: number) => formatNaira(value);

  const totalNights = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 0;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    const nights = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    return nights > 0 ? nights : 0;
  }, [checkInDate, checkOutDate]);

  const estimatedTotal =
    totalNights > 0 ? totalNights * (property?.pricePerNight || 0) : 0;

  useEffect(() => {
    const calculateTotals = async () => {
      if (!property?.id || !checkInDate || !checkOutDate || totalNights <= 0) {
        setBookingCalculation(null);
        return;
      }

      if (checkInDate < minCheckInDate) {
        setBookingCalculation(null);
        return;
      }

      try {
        setIsCalculating(true);
        const calculation = await bookingService.calculateBookingTotal(
          property.id,
          new Date(checkInDate),
          new Date(checkOutDate),
          guests,
        );
        setBookingCalculation(calculation);
      } catch {
        setBookingCalculation(null);
      } finally {
        setIsCalculating(false);
      }
    };

    void calculateTotals();
  }, [
    property?.id,
    checkInDate,
    checkOutDate,
    guests,
    totalNights,
    minCheckInDate,
  ]);

  const handleCheckInChange = (value: string) => {
    setCheckInDate(value);

    if (!value) {
      setCheckOutDate("");
      return;
    }

    const nextDay = new Date(value);
    nextDay.setDate(nextDay.getDate() + 1);
    let suggestedCheckOut = toDateKey(nextDay);
    let guard = 0;

    while (unavailableDateSet.has(suggestedCheckOut) && guard < 365) {
      nextDay.setDate(nextDay.getDate() + 1);
      suggestedCheckOut = toDateKey(nextDay);
      guard += 1;
    }

    if (
      !checkOutDate ||
      checkOutDate <= value ||
      unavailableDateSet.has(checkOutDate)
    ) {
      setCheckOutDate(suggestedCheckOut);
    }
  };

  useEffect(() => {
    if (!checkOutDate || !unavailableDateSet.has(checkOutDate)) {
      return;
    }

    const nextAvailable = new Date(minimumCheckOutDate);
    let candidate = toDateKey(nextAvailable);
    let guard = 0;

    while (unavailableDateSet.has(candidate) && guard < 365) {
      nextAvailable.setDate(nextAvailable.getDate() + 1);
      candidate = toDateKey(nextAvailable);
      guard += 1;
    }

    setCheckOutDate(candidate);
  }, [checkOutDate, minimumCheckOutDate, unavailableDateSet]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleFavorite = async () => {
    if (!user || user.role !== "GUEST") {
      router.push(
        `/guest/login?returnTo=${encodeURIComponent(`/guest/browse/${propertyId}`)}`,
      );
      return;
    }

    try {
      if (isLiked) {
        await favoritesService.removeFavorite(propertyId);
        toast.success("Removed from favorites");
      } else {
        await favoritesService.addFavorite({ propertyId });
        toast.success("Added to favorites");
      }
      setIsLiked((prev) => !prev);
    } catch {
      toast.error("Failed to update favorites");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: property?.description || "",
          url: window.location.href,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const handleBookNow = () => {
    if (!property) {
      toast.error(
        "Property details are unavailable. Please refresh and try again.",
      );
      return;
    }

    if (!checkInDate || !checkOutDate) {
      toast.error("Please select check-in and check-out dates");
      return;
    }

    if (totalNights <= 0) {
      toast.error("Check-out date must be after check-in date");
      return;
    }

    if (checkInDate < minCheckInDate) {
      toast.error("Check-in date must be at least tomorrow");
      return;
    }

    if (
      unavailableDateSet.has(checkInDate) ||
      unavailableDateSet.has(checkOutDate)
    ) {
      toast.error("Selected date is no longer available. Choose another date.");
      return;
    }

    if (guests < 1 || guests > (property?.maxGuests || 1)) {
      toast.error(`Guests must be between 1 and ${property?.maxGuests || 1}`);
      return;
    }

    const query = new URLSearchParams({
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: String(guests),
    }).toString();

    router.push(`/booking/${property.id}/checkout?${query}`);
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: "#f8fafc" }}
      >
        <GuestHeader
          currentPage="browse"
          searchPlaceholder="Search location..."
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse space-y-4 w-80">
              <div className="h-8 bg-gray-200 rounded-xl w-3/4 mx-auto" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: "#f8fafc" }}
      >
        <GuestHeader
          currentPage="browse"
          searchPlaceholder="Search location..."
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              Property not found
            </h2>
            <p className="text-gray-500">
              This property may have been removed or the link is incorrect.
            </p>
            <Link
              href="/guest/browse"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium"
              style={{ backgroundColor: "#1a56db" }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Browse
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#f8fafc" }}
    >
      <GuestHeader
        currentPage="browse"
        searchPlaceholder="Search location..."
      />

      <div className="relative h-[500px] lg:h-[600px]">
        <img
          src={images[currentImageIndex]}
          alt={title}
          className="w-full h-full object-cover"
        />

        <button
          onClick={prevImage}
          aria-label="Previous image"
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}
        >
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </button>
        <button
          onClick={nextImage}
          aria-label="Next image"
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}
        >
          <ChevronRight className="w-6 h-6 text-gray-900" />
        </button>

        <div
          className="absolute bottom-4 right-4 px-4 py-2 rounded-full backdrop-blur-sm text-sm font-medium"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", color: "#fff" }}
        >
          {currentImageIndex + 1} / {images.length}
        </div>

        <Link
          href="/guest/browse"
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm text-white hover:underline"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Browse
        </Link>
      </div>

      <main className="max-w-[1440px] mx-auto w-full px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="font-semibold mb-3 text-4xl text-gray-900 break-words">
                    {title}
                  </h1>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <span className="text-lg text-gray-600">{address}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleFavorite}
                    className="w-12 h-12 rounded-xl border flex items-center justify-center border-gray-200"
                  >
                    <Heart
                      className="w-6 h-6"
                      style={{
                        color: isLiked
                          ? accentColor || primaryColor
                          : "#6b7280",
                        fill: isLiked ? accentColor || primaryColor : "none",
                      }}
                    />
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-12 h-12 rounded-xl border flex items-center justify-center border-gray-200"
                  >
                    <Share2 className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div
                  className="text-4xl font-bold"
                  style={{ color: primaryColor }}
                >
                  {formatPrice(property.pricePerNight)}
                  <span className="text-base font-normal text-gray-500 ml-1">
                    / night
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Bed className="w-5 h-5 text-gray-500" />
                    <span className="font-medium text-gray-600">
                      {property.bedrooms} Beds
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="w-5 h-5 text-gray-500" />
                    <span className="font-medium text-gray-600">
                      {property.bathrooms} Baths
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserRound className="w-5 h-5 text-gray-500" />
                    <span className="font-medium text-gray-600">
                      {property.maxGuests} guests
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl border bg-white border-gray-200">
              <h2 className="font-semibold mb-4 text-[24px] text-gray-900">
                About This Property
              </h2>
              <p className="leading-relaxed text-lg text-gray-600">
                {property.description}
              </p>
            </div>

            <div className="p-8 rounded-2xl border bg-white border-gray-200">
              <h2 className="font-semibold mb-6 text-[24px] text-gray-900">
                Property Features
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {(featureList.length > 0
                  ? featureList
                  : [
                      "Premium location",
                      "Secure access",
                      "Managed property",
                      "Professional support",
                    ]
                ).map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: accentColor || primaryColor }}
                    />
                    <span className="text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 rounded-2xl border bg-white border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-semibold text-[24px] text-gray-900">
                    Reviews
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Verified guests can review after a completed stay.
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-700">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-semibold">
                    {(property.averageRating || 0).toFixed(1)} / 5
                  </span>
                  <span className="text-sm text-amber-600">
                    ({property.reviewCount || 0})
                  </span>
                </div>
              </div>

              {property.reviews && property.reviews.length > 0 ? (
                <div className="space-y-4">
                  {property.reviews.slice(0, 5).map((review) => (
                    <div
                      key={review.id}
                      className="p-4 rounded-xl border border-gray-200 bg-gray-50"
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="font-medium text-gray-900">
                          {review.author?.firstName || "Guest"}{" "}
                          {review.author?.lastName || ""}
                        </div>
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: 5 }, (_, index) => (
                            <Star
                              key={`${review.id}-${index}`}
                              className={`w-4 h-4 ${
                                index < review.rating ? "fill-current" : ""
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">
                        {review.comment || "No written feedback provided."}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  No reviews yet. Guests will be able to leave feedback after
                  completing their booking.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-8 rounded-2xl border bg-white border-gray-200 sticky top-6">
              <h3 className="font-semibold mb-6 text-[20px] text-gray-900">
                Book This Property
              </h3>

              <div className="space-y-4 mb-6">
                <AnimatedDateInput
                  label="Check-in"
                  value={checkInDate}
                  min={minCheckInDate}
                  disablePastDates
                  unavailableDates={unavailableDateList}
                  onChange={handleCheckInChange}
                  inputWrapperClassName="border-gray-300 bg-gradient-to-br from-white to-blue-50/50"
                  iconClassName="text-blue-500"
                />

                <AnimatedDateInput
                  label="Check-out"
                  value={checkOutDate}
                  min={minimumCheckOutDate}
                  disablePastDates
                  unavailableDates={unavailableDateList}
                  onChange={setCheckOutDate}
                  inputWrapperClassName="border-gray-300 bg-gradient-to-br from-white to-blue-50/50"
                  iconClassName="text-blue-500"
                />

                {(property.checkInTime || property.checkOutTime) && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    {property.checkInTime &&
                      `Check-in from ${property.checkInTime}`}
                    {property.checkInTime && property.checkOutTime && " · "}
                    {property.checkOutTime &&
                      `Check-out by ${property.checkOutTime}`}
                  </p>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Guests
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={property.maxGuests}
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value) || 1)}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900"
                  />
                </div>
              </div>

              <Button
                className="w-full h-14 rounded-xl font-semibold text-base mb-4 text-white"
                style={{ backgroundColor: accentColor || primaryColor }}
                onClick={handleBookNow}
              >
                <Calendar className="w-5 h-5 mr-2" />
                Continue to Checkout
              </Button>

              <div className="p-4 rounded-xl mb-6 bg-[#f9f4ef]">
                <div className="text-sm text-gray-600">
                  Estimated stay cost:
                </div>
                <div className="font-semibold mt-1 text-gray-900">
                  {totalNights > 0
                    ? `${formatPrice(bookingCalculation?.total || estimatedTotal)} for ${totalNights} ${totalNights === 1 ? "night" : "nights"}`
                    : "Select dates to see estimate"}
                </div>
              </div>

              <div className="border-t pt-6 border-gray-200 space-y-3">
                <div className="text-sm font-medium text-gray-900">
                  Price Breakdown
                </div>

                {isCalculating ? (
                  <div className="text-sm text-gray-500">
                    Calculating totals...
                  </div>
                ) : totalNights > 0 ? (
                  <>
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>
                        {formatPrice(property.pricePerNight)} × {totalNights}{" "}
                        {totalNights === 1 ? "night" : "nights"}
                      </span>
                      <span>
                        {formatPrice(
                          bookingCalculation?.subtotal ||
                            property.pricePerNight * totalNights,
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm text-gray-700">
                      <span>Cleaning fee</span>
                      <span>
                        {formatPrice(bookingCalculation?.cleaningFee || 0)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm text-gray-700">
                      <span>Service fee</span>
                      <span>
                        {formatPrice(bookingCalculation?.serviceFee || 0)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm text-gray-700">
                      <span>Security deposit</span>
                      <span>
                        {formatPrice(bookingCalculation?.securityDeposit || 0)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm text-gray-700">
                      <span>Taxes</span>
                      <span>{formatPrice(bookingCalculation?.taxes || 0)}</span>
                    </div>

                    <div className="border-t pt-3 mt-2 border-gray-200 flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="font-bold text-gray-900">
                        {formatPrice(
                          bookingCalculation?.total || estimatedTotal,
                        )}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-500">
                    Select your dates to see a full amount breakdown.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
