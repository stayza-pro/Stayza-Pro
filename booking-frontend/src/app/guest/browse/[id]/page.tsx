"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Square,
  Heart,
  Share2,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { useProperty } from "@/hooks/useProperties";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { bookingService, favoritesService } from "@/services";
import toast from "react-hot-toast";

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

  const checkInInputRef = useRef<HTMLInputElement | null>(null);
  const checkOutInputRef = useRef<HTMLInputElement | null>(null);

  const images = useMemo(
    () =>
      property?.images?.map((image) => image.url).filter(Boolean) || [
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&auto=format&fit=crop&q=80",
      ],
    [property?.images],
  );

  const title = property?.title || "Property";
  const address =
    property?.address ||
    [property?.city, property?.state].filter(Boolean).join(", ") ||
    "Address unavailable";

  const featureList =
    property?.amenities?.map((item) =>
      item
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
    ) || [];

  const formatPrice = (value: number) => {
    const safeValue = Number.isFinite(value) ? value : 0;
    return `₦${safeValue.toLocaleString("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const minCheckInDate = new Date().toISOString().split("T")[0];
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
  }, [property?.id, checkInDate, checkOutDate, guests, totalNights]);

  const triggerDatePicker = (input: HTMLInputElement | null) => {
    if (!input) return;
    input.focus();
    if (typeof input.showPicker === "function") {
      input.showPicker();
    }
  };

  const handleCheckInChange = (value: string) => {
    setCheckInDate(value);

    if (!value) {
      setCheckOutDate("");
      return;
    }

    const nextDay = new Date(value);
    nextDay.setDate(nextDay.getDate() + 1);
    const suggestedCheckOut = nextDay.toISOString().split("T")[0];

    if (!checkOutDate || checkOutDate <= value) {
      setCheckOutDate(suggestedCheckOut);
    }

    window.setTimeout(() => {
      triggerDatePicker(checkOutInputRef.current);
    }, 50);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleFavorite = async () => {
    if (!user) {
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
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Property not found
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
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}
        >
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </button>
        <button
          onClick={nextImage}
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
                  <h1 className="font-semibold mb-3 text-[36px] text-gray-900">
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
                    <Square className="w-5 h-5 text-gray-500" />
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
          </div>

          <div className="space-y-6">
            <div className="p-8 rounded-2xl border bg-white border-gray-200 sticky top-6">
              <h3 className="font-semibold mb-6 text-[20px] text-gray-900">
                Book This Property
              </h3>

              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Check-in
                  </label>
                  <button
                    type="button"
                    onClick={() => triggerDatePicker(checkInInputRef.current)}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-left flex items-center justify-between"
                  >
                    <span
                      className={
                        checkInDate ? "text-gray-900" : "text-gray-500"
                      }
                    >
                      {checkInDate
                        ? new Date(checkInDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Select check-in date"}
                    </span>
                    <Calendar className="w-4 h-4 text-gray-500" />
                  </button>
                  <input
                    ref={checkInInputRef}
                    type="date"
                    value={checkInDate}
                    min={minCheckInDate}
                    onChange={(e) => handleCheckInChange(e.target.value)}
                    className="sr-only"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Check-out
                  </label>
                  <button
                    type="button"
                    onClick={() => triggerDatePicker(checkOutInputRef.current)}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-left flex items-center justify-between"
                  >
                    <span
                      className={
                        checkOutDate ? "text-gray-900" : "text-gray-500"
                      }
                    >
                      {checkOutDate
                        ? new Date(checkOutDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Select check-out date"}
                    </span>
                    <Calendar className="w-4 h-4 text-gray-500" />
                  </button>
                  <input
                    ref={checkOutInputRef}
                    type="date"
                    value={checkOutDate}
                    min={checkInDate || minCheckInDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="sr-only"
                  />
                </div>

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
