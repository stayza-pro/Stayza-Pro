"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bath,
  Bed,
  Search,
  SlidersHorizontal,
  MapPin,
  UserRound,
  Heart,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { Footer } from "@/components/guest/sections/Footer";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useProperties } from "@/hooks/useProperties";
import { favoritesService } from "@/services";
import { Button, Input, Select, Skeleton } from "@/components/ui";
import type { PropertyFilters } from "@/types";
import { formatPrice as formatNaira } from "@/utils/currency";
import { normalizeImageUrl } from "@/utils/imageUrl";

function SmoothPropertyImage({
  src,
  alt,
  fallbackSrc,
}: {
  src: string;
  alt: string;
  fallbackSrc: string;
}) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setIsLoaded(false);
  }, [src]);

  return (
    <div className="relative w-full h-full bg-gray-100">
      <div
        className={`absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 transition-opacity duration-500 ${
          isLoaded ? "opacity-0" : "opacity-100"
        }`}
      />
      <img
        src={currentSrc}
        alt={alt}
        loading="lazy"
        className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (currentSrc !== fallbackSrc) {
            setCurrentSrc(fallbackSrc);
            return;
          }
          setIsLoaded(true);
        }}
      />
    </div>
  );
}

export default function BrowsePropertiesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [showFilters, setShowFilters] = useState(false);
  const [likedProperties, setLikedProperties] = useState<Set<string>>(
    new Set(),
  );
  const {
    realtorId,
    brandColor: primaryColor,
    secondaryColor,
    accentColor,
    realtorName,
    logoUrl,
    tagline,
    description,
  } = useRealtorBranding();
  const primaryPale = "#e8f1f8";
  const neutralLight = "#e5e7eb";
  const neutral = "#6b7280";
  const neutralDark = "#4b5563";
  const neutralDarkest = "#111827";
  const surfaceElevated = "#ffffff";
  const { user, isAuthenticated } = useCurrentUser();

  useEffect(() => {
    const location = new URLSearchParams(window.location.search).get(
      "location",
    );
    if (location) {
      setSearchQuery(location);
    }
  }, []);

  const filters: PropertyFilters = useMemo(
    () => ({
      city: searchQuery || undefined,
      isActive: true,
      isApproved: true,
    }),
    [searchQuery],
  );

  const { data: propertiesResponse, isLoading } = useProperties(filters, {
    page: 1,
    limit: 30,
  });

  const formatPrice = (price: unknown) => {
    const numericPrice = Number(price);
    return formatNaira(Number.isFinite(numericPrice) ? numericPrice : 0);
  };

  const properties = useMemo(() => {
    const items = [...(propertiesResponse?.data || [])];
    if (sortBy === "price-low") {
      items.sort((a, b) => a.pricePerNight - b.pricePerNight);
    } else if (sortBy === "price-high") {
      items.sort((a, b) => b.pricePerNight - a.pricePerNight);
    } else if (sortBy === "newest") {
      items.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    return items;
  }, [propertiesResponse?.data, sortBy]);

  useEffect(() => {
    const loadFavoriteStates = async () => {
      if (
        !isAuthenticated ||
        user?.role !== "GUEST" ||
        properties.length === 0
      ) {
        setLikedProperties(new Set());
        return;
      }

      try {
        const checks = await Promise.all(
          properties.map((property) =>
            favoritesService
              .checkFavorite(property.id)
              .then((response) => ({
                id: property.id,
                isFavorited: !!response?.data?.isFavorited,
              }))
              .catch(() => ({ id: property.id, isFavorited: false })),
          ),
        );

        const favoriteSet = new Set(
          checks.filter((item) => item.isFavorited).map((item) => item.id),
        );
        setLikedProperties(favoriteSet);
      } catch {
        setLikedProperties(new Set());
      }
    };

    loadFavoriteStates();
  }, [properties, isAuthenticated, user?.role]);

  const toggleLike = async (propertyId: string) => {
    if (!isAuthenticated || user?.role !== "GUEST") {
      toast.error("Please sign in to save favorites");
      router.push(
        `/guest/login?returnTo=${encodeURIComponent("/guest/browse")}`,
      );
      return;
    }

    const isLiked = likedProperties.has(propertyId);

    try {
      if (isLiked) {
        await favoritesService.removeFavorite(propertyId);
        setLikedProperties((prev) => {
          const updated = new Set(prev);
          updated.delete(propertyId);
          return updated;
        });
        toast.success("Removed from favorites");
      } else {
        await favoritesService.addFavorite({ propertyId });
        setLikedProperties((prev) => new Set(prev).add(propertyId));
        toast.success("Added to favorites");
      }
    } catch {
      toast.error("Failed to update favorites");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#f8fafc" }}
    >
      <GuestHeader
        currentPage="browse"
        searchPlaceholder="Search location..."
      />

      <div
        className="border-b sticky top-0 z-10 backdrop-blur-sm"
        style={{
          backgroundColor: "#f8fafcf0",
          borderColor: "#e5e7eb",
        }}
      >
        <div className="max-w-[1440px] mx-auto px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                type="search"
                placeholder="Search by location, property type, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 rounded-xl border text-base shadow-sm border-gray-200 text-gray-900"
                style={{ backgroundColor: primaryPale }}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="h-14 px-6 rounded-xl font-medium"
                style={{
                  borderColor: neutralLight,
                  color: neutralDark,
                }}
                onClick={() => setShowFilters((prev) => !prev)}
              >
                <SlidersHorizontal className="w-5 h-5 mr-2" />
                Filters
              </Button>

              <div className="w-[180px]">
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  className="h-14 border border-gray-200 rounded-xl bg-white text-gray-900"
                  options={[
                    { value: "featured", label: "Featured" },
                    { value: "price-high", label: "Price: High to Low" },
                    { value: "price-low", label: "Price: Low to High" },
                    { value: "newest", label: "Newest First" },
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-gray-600">
              {!isLoading && (
                <>
                  <span className="font-semibold text-gray-900">
                    {properties.length} properties
                  </span>{" "}
                  available in your search
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="space-y-3">
                <Skeleton className="aspect-[4/3] rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : properties.length > 0 ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {properties.map((property) => {
                const fallbackImage =
                  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&auto=format&fit=crop&q=80";
                const imageUrl =
                  normalizeImageUrl(
                    property.images?.[0] as
                      | string
                      | {
                          url?: string | null;
                          imageUrl?: string | null;
                          src?: string | null;
                        }
                      | null
                      | undefined,
                  ) || fallbackImage;

                const propertyType = property.type
                  ? property.type.toLowerCase().replace(/_/g, " ")
                  : "property";

                return (
                  <div
                    key={property.id}
                    className="group rounded-2xl border overflow-hidden transition-all hover:shadow-xl bg-white border-gray-200"
                    style={{
                      backgroundColor: surfaceElevated,
                      borderColor: neutralLight,
                    }}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <SmoothPropertyImage
                        src={imageUrl}
                        alt={property.title}
                        fallbackSrc={fallbackImage}
                      />

                      <div
                        className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm text-white capitalize"
                        style={{
                          backgroundColor: secondaryColor || primaryColor,
                        }}
                      >
                        {propertyType}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleLike(property.id)}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110"
                        style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}
                        aria-label="Toggle favorite"
                      >
                        <Heart
                          className="w-5 h-5 transition-all"
                          style={{
                            color: likedProperties.has(property.id)
                              ? accentColor || primaryColor
                              : "#6B7280",
                            fill: likedProperties.has(property.id)
                              ? accentColor || primaryColor
                              : "none",
                          }}
                        />
                      </button>

                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-white">
                            {formatPrice(property.pricePerNight)}
                          </span>
                          <span className="text-lg text-white/90">/ night</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div>
                        <h3
                          className="font-semibold mb-2 line-clamp-1"
                          style={{
                            fontSize: "18px",
                            color: neutralDarkest,
                          }}
                        >
                          {property.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span
                            className="text-sm line-clamp-1"
                            style={{ color: neutralDark }}
                          >
                            {property.city}
                            {property.state ? `, ${property.state}` : ""}
                          </span>
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-4 pt-4 border-t"
                        style={{ borderColor: neutralLight }}
                      >
                        <div className="flex items-center gap-1.5">
                          <Bed className="w-4 h-4 text-gray-500" />
                          <span
                            className="text-sm font-medium"
                            style={{ color: neutralDark }}
                          >
                            {property.bedrooms}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Bath className="w-4 h-4 text-gray-500" />
                          <span
                            className="text-sm font-medium"
                            style={{ color: neutralDark }}
                          >
                            {property.bathrooms}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <UserRound className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">
                            {property.maxGuests} guests
                          </span>
                        </div>
                      </div>

                      <Button
                        className="w-full h-11 rounded-xl font-medium text-white"
                        style={{
                          backgroundColor: accentColor || primaryColor,
                        }}
                        onClick={() =>
                          router.push(`/guest/browse/${property.id}`)
                        }
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-12">
              {properties.length >= 30 && (
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 h-12 rounded-xl font-medium"
                  style={{
                    borderColor: neutralLight,
                    color: neutralDark,
                  }}
                  disabled
                  title="Load more coming soon"
                >
                  Load More Properties
                  <ChevronDown className="w-5 h-5 ml-2" />
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              No properties found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or search criteria
            </p>
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Clear Filters
            </Button>
          </div>
        )}
      </main>

      <Footer
        realtorName={realtorName || "Stayza Pro"}
        tagline={tagline || "Premium short-let properties"}
        logo={logoUrl}
        description={description || "Find premium properties with confidence."}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        accentColor={accentColor}
        realtorId={realtorId || undefined}
      />
    </div>
  );
}
