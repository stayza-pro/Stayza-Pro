"use client";

import React, { useMemo, useState } from "react";
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
import { favoritesService } from "@/services";
import toast from "react-hot-toast";

export default function GuestPropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const { user } = useCurrentUser();
  const { data: property, isLoading, error } = useProperty(propertyId);
  const {
    brandColor: primaryColor,
    secondaryColor,
    accentColor,
  } = useRealtorBranding();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

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

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: property?.currency || "USD",
      minimumFractionDigits: 0,
    }).format(value);

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

              <Link href={`/booking/${property.id}/checkout`}>
                <Button
                  className="w-full h-14 rounded-xl font-semibold text-base mb-4 text-white"
                  style={{ backgroundColor: accentColor || primaryColor }}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Viewing
                </Button>
              </Link>

              <div className="p-4 rounded-xl mb-6 bg-[#f9f4ef]">
                <div className="text-sm text-gray-600">
                  Available viewing times:
                </div>
                <div className="font-semibold mt-1 text-gray-900">
                  Monday - Saturday, 9 AM - 6 PM
                </div>
              </div>

              <div className="border-t pt-6 border-gray-200">
                <div className="text-sm mb-4 text-gray-500">Your Agent</div>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-14 h-14 rounded-full overflow-hidden"
                    style={{
                      backgroundColor: `${secondaryColor || primaryColor}22`,
                    }}
                  />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {property.realtor?.businessName || "Property Specialist"}
                    </div>
                    <div className="text-sm text-gray-600">
                      Property Specialist
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-xl border-gray-200 text-gray-600"
                >
                  Contact Agent
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
