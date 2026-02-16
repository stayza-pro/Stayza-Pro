"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bath, Bed, Heart, MapPin, Square } from "lucide-react";
import { Button } from "@/components/ui";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { favoritesService, type FavoriteProperty } from "@/services";
import type { Property, PropertyStatus, PropertyType } from "@/types";
import toast from "react-hot-toast";

export default function FavoritesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const [authChecked, setAuthChecked] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  const { brandColor: primaryColor, accentColor } = useRealtorBranding();
  const secondarySurface = "#f9f4ef";

  useEffect(() => {
    if (!isLoading && (isAuthenticated || !authChecked)) {
      setAuthChecked(true);
    }
  }, [isLoading, isAuthenticated, authChecked]);

  useEffect(() => {
    if (authChecked && !isLoading && !isAuthenticated) {
      router.push("/guest/login?returnTo=/guest/favorites");
    }
  }, [authChecked, isLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isAuthenticated || !user) {
        return;
      }

      try {
        setLoadingFavorites(true);
        const response = await favoritesService.getFavorites();
        setFavorites(response.data || []);
      } catch {
        toast.error("Failed to load favorites");
      } finally {
        setLoadingFavorites(false);
      }
    };

    fetchFavorites();
  }, [isAuthenticated, user]);

  const favoriteProperties = useMemo<Property[]>(
    () =>
      favorites.map((item) => ({
        ...item.property,
        realtorId: item.property.realtor?.id || "",
        type: item.property.type as PropertyType,
        status: item.property.status as PropertyStatus,
        state: "",
        amenities: [],
        houseRules: [],
        checkInTime: "14:00",
        checkOutTime: "11:00",
        isApproved: true,
        realtor: undefined,
        images: (item.property.images || []).map((image) => ({
          ...image,
          propertyId: item.property.id,
          createdAt: new Date(item.createdAt),
        })),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.createdAt),
      })),
    [favorites],
  );

  const handleFavoriteToggle = async (propertyId: string) => {
    try {
      await favoritesService.removeFavorite(propertyId);
      setFavorites((prev) =>
        prev.filter((item) => item.propertyId !== propertyId),
      );
      toast.success("Removed from favorites");
    } catch {
      toast.error("Failed to update favorites");
    }
  };

  const formatPrice = (price: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getPrimaryImage = (property: Property) => {
    const firstImage = property.images?.[0]?.url;
    if (firstImage) {
      return firstImage;
    }
    return "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&auto=format&fit=crop&q=80";
  };

  if (!authChecked || isLoading || loadingFavorites) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
        <GuestHeader
          currentPage="favorites"
          searchPlaceholder="Search properties..."
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-1/3" />
            <div className="h-48 bg-gray-200 rounded" />
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
        currentPage="favorites"
        searchPlaceholder="Search properties..."
      />

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="font-semibold mb-3 text-[40px] text-gray-900">
            My Favorites
          </h1>
          <p className="text-lg text-gray-600">
            {favoriteProperties.length > 0
              ? `${favoriteProperties.length} saved properties`
              : "Save properties you love to view them later"}
          </p>
        </div>

        {favoriteProperties.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {favoriteProperties.map((property) => (
              <div
                key={property.id}
                className="group rounded-2xl border overflow-hidden transition-all hover:shadow-xl bg-white border-gray-200"
              >
                <div className="relative aspect-[4/3]">
                  <img
                    src={getPrimaryImage(property)}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  <button
                    type="button"
                    onClick={() => handleFavoriteToggle(property.id)}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center"
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}
                    aria-label="Remove from favorites"
                  >
                    <Heart
                      className="w-5 h-5"
                      style={{
                        color: accentColor || primaryColor,
                        fill: accentColor || primaryColor,
                      }}
                    />
                  </button>

                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                    <div className="text-2xl font-bold text-white">
                      {formatPrice(property.pricePerNight, property.currency)}
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2 text-[18px] text-gray-900">
                      {property.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 line-clamp-1">
                        {property.city}
                        {property.state ? `, ${property.state}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
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
                        {property.maxGuests}
                      </span>
                    </div>
                  </div>

                  <Link href={`/guest/browse/${property.id}`}>
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
            ))}
          </div>
        ) : (
          <div
            className="text-center py-16 rounded-2xl border"
            style={{
              backgroundColor: secondarySurface,
              borderColor: "#e5e7eb",
            }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: `${primaryColor}1a` }}
            >
              <Heart className="w-9 h-9" style={{ color: primaryColor }} />
            </div>
            <h3 className="text-2xl font-semibold mb-3 text-gray-900">
              No saved properties yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-lg mx-auto px-6">
              Properties you save with the heart icon appear here so you can
              compare and book faster.
            </p>
            <Link href="/guest/browse">
              <Button
                className="text-white h-11 px-6 rounded-xl"
                style={{ backgroundColor: accentColor || primaryColor }}
              >
                Browse Properties
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
