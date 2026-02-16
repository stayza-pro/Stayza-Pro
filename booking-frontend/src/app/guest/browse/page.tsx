"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bath,
  Bed,
  Search,
  SlidersHorizontal,
  MapPin,
  Square,
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

export default function BrowsePropertiesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("featured");
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
  const { isAuthenticated } = useCurrentUser();

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

  const formatPrice = (price: number, currency: string = "USD") =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

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
      if (!isAuthenticated || properties.length === 0) {
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
  }, [properties, isAuthenticated]);

  const toggleLike = async (propertyId: string) => {
    if (!isAuthenticated) {
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
                onClick={() => toast("Advanced filters are not available yet")}
              >
                <SlidersHorizontal className="w-5 h-5 mr-2" />
                Filters
              </Button>

              <div className="w-[180px]">
                <Select
                  value={sortBy}
                  onChange={setSortBy}
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
              <span className="font-semibold text-gray-900">
                {properties.length} properties
              </span>{" "}
              available in your search
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
                const imageUrl =
                  property.images?.[0]?.url ||
                  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&auto=format&fit=crop&q=80";

                const propertyType = property.type
                  ? property.type.toLowerCase().replace(/_/g, " ")
                  : "property";

                return (
                  <div
                    key={property.id}
                    className="group rounded-2xl border overflow-hidden transition-all hover:shadow-xl bg-white border-gray-200"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={property.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                        <div className="text-2xl font-bold text-white">
                          {formatPrice(
                            property.pricePerNight,
                            property.currency,
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div>
                        <div
                          className="text-xl font-bold mb-1"
                          style={{ color: primaryColor }}
                        >
                          {formatPrice(
                            property.pricePerNight,
                            property.currency,
                          )}
                          <span className="text-sm font-medium text-gray-600 ml-1">
                            / night
                          </span>
                        </div>
                        <h3 className="font-semibold mb-2 line-clamp-1 text-[18px] text-gray-900">
                          {property.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-sm line-clamp-1 text-gray-600">
                            {property.city}
                            {property.state ? `, ${property.state}` : ""}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-4 pb-2 border-t border-gray-200">
                        <div className="flex items-center gap-1.5">
                          <Bed className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">
                            {property.bedrooms}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Bath className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">
                            {property.bathrooms}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Square className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">
                            {property.maxGuests} guests
                          </span>
                        </div>
                      </div>

                      <Link href={`/browse/${property.id}`}>
                        <Button
                          className="w-full h-11 rounded-xl font-medium text-white"
                          style={{
                            backgroundColor: accentColor || primaryColor,
                          }}
                        >
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-12">
              <Button
                variant="outline"
                size="lg"
                className="px-8 h-12 rounded-xl font-medium"
              >
                Load More Properties
                <ChevronDown className="w-5 h-5 ml-2" />
              </Button>
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
