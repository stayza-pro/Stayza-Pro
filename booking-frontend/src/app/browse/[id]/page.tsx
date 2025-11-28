"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  MapPin,
  Users,
  Bed,
  Bath,
  Star,
  Heart,
  Share2,
  Wifi,
  Car,
  Waves,
  Dumbbell,
  Wind,
  Tv,
  UtensilsCrossed,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from "lucide-react";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { Footer } from "@/components/guest/sections";
import { Card, Button } from "@/components/ui";
import { useProperty } from "@/hooks/useProperties";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { PropertyAmenity } from "@/types";

const amenityIcons: Record<PropertyAmenity, any> = {
  WIFI: Wifi,
  PARKING: Car,
  POOL: Waves,
  GYM: Dumbbell,
  AC: Wind,
  TV: Tv,
  KITCHEN: UtensilsCrossed,
  WASHING_MACHINE: null,
  BALCONY: null,
  PET_FRIENDLY: null,
  SMOKING_ALLOWED: null,
  WHEELCHAIR_ACCESSIBLE: null,
  FIREPLACE: null,
  HOT_TUB: null,
  BBQ: null,
  GARDEN: null,
  SECURITY: null,
  CONCIERGE: null,
  ELEVATOR: null,
  HEATING: null,
  DISHWASHER: null,
  MICROWAVE: null,
  COFFEE_MAKER: null,
  IRON: null,
  HAIR_DRYER: null,
  TOWELS: null,
  LINENS: null,
  SHAMPOO: null,
  SOAP: null,
};

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  const { user } = useCurrentUser();

  // Get realtor branding
  const {
    brandColor: primaryColor, // 60% - Primary color for backgrounds and dominant elements
    secondaryColor, // 30% - Secondary color for text and borders
    accentColor, // 10% - Accent color for CTAs and highlights
    realtorName,
    logoUrl,
    tagline,
    description,
  } = useRealtorBranding();

  const { data: property, isLoading, error } = useProperty(propertyId);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [isFavorited, setIsFavorited] = useState(false);

  // Calculate nights and total
  const calculateBooking = () => {
    if (!checkIn || !checkOut || !property) {
      return { nights: 0, total: 0 };
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    const total = nights * property.pricePerNight;

    return { nights, total };
  };

  const { nights, total } = calculateBooking();

  const handleBookNow = () => {
    if (!user) {
      router.push(`/guest/login?redirect=/browse/${propertyId}`);
      return;
    }

    if (!checkIn || !checkOut) {
      alert("Please select check-in and check-out dates");
      return;
    }

    router.push(
      `/booking/${propertyId}/checkout?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`
    );
  };

  const handleFavorite = () => {
    if (!user) {
      router.push(`/guest/login?redirect=/browse/${propertyId}`);
      return;
    }
    setIsFavorited(!isFavorited);
    // TODO: Call API to add/remove from favorites
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.title,
        text: property?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const nextImage = () => {
    if (property?.images && property.images.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === (property.images?.length ?? 1) - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (property?.images && property.images.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === 0 ? (property.images?.length ?? 1) - 1 : prev - 1
      );
    }
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: `${primaryColor}05` }}
      >
        <GuestHeader
          currentPage="profile"
          searchPlaceholder="Search location..."
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
        <Footer
          realtorName={realtorName}
          tagline={tagline}
          logo={logoUrl}
          description={description}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          accentColor={accentColor}
        />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: `${primaryColor}05` }}
      >
        <GuestHeader
          currentPage="profile"
          searchPlaceholder="Search location..."
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="p-8 text-center">
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: secondaryColor }}
            >
              Property Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The property you're looking for doesn't exist or has been removed.
            </p>
            <Button
              onClick={() => router.push("/browse")}
              style={{ backgroundColor: accentColor }}
              className="text-white"
            >
              Browse Properties
            </Button>
          </Card>
        </div>
        <Footer
          realtorName={realtorName}
          tagline={tagline}
          logo={logoUrl}
          description={description}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          accentColor={accentColor}
        />
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: property.currency || "NGN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: `${primaryColor}05` }}
    >
      <GuestHeader
        currentPage="profile"
        searchPlaceholder="Search location..."
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center hover:opacity-80 mb-6 transition-all"
          style={{ color: secondaryColor }}
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to search
        </button>

        {/* Image Gallery */}
        <div className="mb-8">
          <div className="relative h-96 md:h-[500px] rounded-lg overflow-hidden bg-gray-200">
            {property.images && property.images.length > 0 ? (
              <>
                <Image
                  src={property.images[selectedImageIndex]?.url || ""}
                  alt={property.title}
                  fill
                  className="object-cover"
                  priority
                />
                {property.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                    >
                      <ChevronLeft className="h-6 w-6 text-gray-800" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                    >
                      <ChevronRight className="h-6 w-6 text-gray-800" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                      {selectedImageIndex + 1} / {property.images.length}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">No images available</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex space-x-2">
              <button
                onClick={handleShare}
                className="bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
              >
                <Share2 className="h-5 w-5 text-gray-800" />
              </button>
              <button
                onClick={handleFavorite}
                className="bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
              >
                <Heart
                  className={`h-5 w-5 ${
                    isFavorited ? "fill-red-500 text-red-500" : "text-gray-800"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Thumbnail Gallery */}
          {property.images && property.images.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {property.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImageIndex === index
                      ? "ring-2"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={
                    selectedImageIndex === index
                      ? {
                          borderColor: primaryColor,
                          boxShadow: `0 0 0 2px ${primaryColor}33`,
                        }
                      : undefined
                  }
                >
                  <Image
                    src={image.url}
                    alt={`${property.title} - ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Header */}
            <Card className="p-6">
              <h1
                className="text-3xl font-bold mb-2"
                style={{ color: secondaryColor }}
              >
                {property.title}
              </h1>

              <div
                className="flex flex-wrap items-center gap-4 mb-4"
                style={{ color: `${secondaryColor}99` }}
              >
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>
                    {property.city}, {property.state}, {property.country}
                  </span>
                </div>

                {property.averageRating && (
                  <div className="flex items-center">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
                    <span
                      className="font-semibold"
                      style={{ color: secondaryColor }}
                    >
                      {property.averageRating.toFixed(1)}
                    </span>
                    <span className="ml-1">
                      ({property.reviewCount || 0} reviews)
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-gray-700">
                <div className="flex items-center">
                  <Users
                    className="h-5 w-5 mr-2"
                    style={{ color: secondaryColor }}
                  />
                  <span>{property.maxGuests} guests</span>
                </div>
                <div className="flex items-center">
                  <Bed
                    className="h-5 w-5 mr-2"
                    style={{ color: secondaryColor }}
                  />
                  <span>{property.bedrooms} bedrooms</span>
                </div>
                <div className="flex items-center">
                  <Bath
                    className="h-5 w-5 mr-2"
                    style={{ color: secondaryColor }}
                  />
                  <span>{property.bathrooms} bathrooms</span>
                </div>
              </div>
            </Card>

            {/* Description */}
            <Card className="p-6">
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: secondaryColor }}
              >
                About this property
              </h2>
              <p className="text-gray-700 whitespace-pre-line">
                {property.description}
              </p>
            </Card>

            {/* Amenities */}
            <Card className="p-6">
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: secondaryColor }}
              >
                Amenities
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.amenities?.map((amenity) => {
                  const Icon = amenityIcons[amenity] || Check;
                  return (
                    <div
                      key={amenity}
                      className="flex items-center text-gray-700"
                    >
                      <Icon
                        className="h-5 w-5 mr-2"
                        style={{ color: accentColor }}
                      />
                      <span>{amenity.replace(/_/g, " ").toLowerCase()}</span>
                    </div>
                  );
                })}
                {property.customAmenities?.map((amenity, index) => (
                  <div
                    key={`custom-${index}`}
                    className="flex items-center text-gray-700"
                  >
                    <Check
                      className="h-5 w-5 mr-2"
                      style={{ color: accentColor }}
                    />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* House Rules */}
            {property.houseRules && property.houseRules.length > 0 && (
              <Card className="p-6">
                <h2
                  className="text-xl font-semibold mb-4"
                  style={{ color: secondaryColor }}
                >
                  House Rules
                </h2>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-700">
                    <Calendar
                      className="h-5 w-5 mr-2"
                      style={{ color: secondaryColor }}
                    />
                    <span>Check-in: {property.checkInTime}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Calendar
                      className="h-5 w-5 mr-2"
                      style={{ color: secondaryColor }}
                    />
                    <span>Check-out: {property.checkOutTime}</span>
                  </div>
                  {property.houseRules.map((rule, index) => (
                    <div key={index} className="flex items-start text-gray-700">
                      <Check className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-gray-400" />
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Location */}
            <Card className="p-6">
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: secondaryColor }}
              >
                Location
              </h2>
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <MapPin
                      className="h-12 w-12 mx-auto mb-2"
                      style={{ color: `${secondaryColor}60` }}
                    />
                    <p className="text-gray-600">{property.address}</p>
                    <p className="text-gray-500 text-sm">
                      {property.city}, {property.state}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Host Information */}
            {property.realtor && (
              <Card className="p-6">
                <h2
                  className="text-xl font-semibold mb-4"
                  style={{ color: secondaryColor }}
                >
                  Hosted by {property.realtor.businessName || "Host"}
                </h2>
                <div className="flex items-start space-x-4">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={property.realtor.businessName || "Host"}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {property.realtor.businessName?.charAt(0) || "H"}
                    </div>
                  )}
                  <div className="flex-1">
                    {property.realtor.description && (
                      <p className="text-gray-700 mb-3">
                        {property.realtor.description}
                      </p>
                    )}
                    {property.realtor.website && (
                      <a
                        href={property.realtor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline"
                        style={{ color: accentColor }}
                      >
                        Visit website →
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Reviews Section */}
            <Card className="p-6">
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: secondaryColor }}
              >
                Reviews
                {property.reviewCount && property.reviewCount > 0 && (
                  <span className="text-gray-500 ml-2 font-normal">
                    ({property.reviewCount})
                  </span>
                )}
              </h2>

              {property.reviews && property.reviews.length > 0 ? (
                <div className="space-y-6">
                  {property.reviews.slice(0, 5).map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-gray-200 pb-6 last:border-0"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-10 h-10 rounded-full bg-gray-300" />
                          <div>
                            <p className="font-semibold text-gray-900">
                              {review.author?.firstName}{" "}
                              {review.author?.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="font-semibold">{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No reviews yet. Be the first to review this property!
                </p>
              )}
            </Card>
          </div>

          {/* Booking Widget Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="p-6">
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span
                      className="text-3xl font-bold"
                      style={{ color: accentColor }}
                    >
                      {formatPrice(property.pricePerNight)}
                    </span>
                    <span className="text-gray-600 ml-2">/ night</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Check-in Date */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: secondaryColor }}
                    >
                      Check-in
                    </label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    />
                  </div>

                  {/* Check-out Date */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: secondaryColor }}
                    >
                      Check-out
                    </label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      min={checkIn || new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    />
                  </div>

                  {/* Guests */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: secondaryColor }}
                    >
                      Guests
                    </label>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
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

                  {/* Price Breakdown */}
                  {nights > 0 && (
                    <div className="border-t border-gray-200 pt-4 space-y-2">
                      <div className="flex justify-between text-gray-700">
                        <span>
                          {formatPrice(property.pricePerNight)} × {nights}{" "}
                          {nights === 1 ? "night" : "nights"}
                        </span>
                        <span>{formatPrice(total)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-gray-900 text-lg border-t border-gray-200 pt-2">
                        <span>Total</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                    </div>
                  )}

                  {/* Book Button */}
                  <button
                    onClick={handleBookNow}
                    disabled={!checkIn || !checkOut}
                    className="w-full px-6 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: accentColor }}
                  >
                    {user ? "Book Now" : "Login to Book"}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    You won't be charged yet
                  </p>
                </div>
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
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        accentColor={accentColor}
      />
    </div>
  );
}
