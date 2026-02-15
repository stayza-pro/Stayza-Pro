"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { PropertyCard } from "@/components/property";
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
    brandColor: primaryColor,
    accentColor,
  } = useRealtorBranding();
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
      router.push(`/guest/login?returnTo=${encodeURIComponent("/guest/browse")}`);
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <GuestHeader
        currentPage="browse"
        searchPlaceholder="Search location..."
      />

      <div className="border-b sticky top-0 z-10 backdrop-blur-sm bg-gray-50/90 border-gray-200">
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
                style={{ backgroundColor: `${primaryColor}14` }}
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
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onFavorite={toggleLike}
                  isFavorited={likedProperties.has(property.id)}
                  primaryColor={primaryColor}
                  accentColor={accentColor}
                />
              ))}
            </div>

            <div className="text-center mt-12">
              <Button variant="outline" size="lg" className="px-8 h-12 rounded-xl font-medium">
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
            <Button variant="outline" onClick={() => setSearchQuery("")}>Clear Filters</Button>
          </div>
        )}
      </main>
    </div>
  );
}
