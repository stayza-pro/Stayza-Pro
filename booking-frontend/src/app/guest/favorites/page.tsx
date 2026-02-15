"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { Footer } from "@/components/guest/sections/Footer";
import { PropertyCard } from "@/components/property/PropertyCard";
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

  const {
    brandColor: primaryColor,
    secondaryColor,
    accentColor,
    realtorName,
    logoUrl,
    tagline,
    description,
  } = useRealtorBranding();

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

  if (!authChecked || isLoading || loadingFavorites) {
    return (
      <div className="min-h-screen bg-gray-50">
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
      className="min-h-screen bg-gray-50 flex flex-col"
      style={{ colorScheme: "light" }}
    >
      <GuestHeader
        currentPage="favorites"
        searchPlaceholder="Search properties..."
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">
            My Favorites
          </h1>
          <p className="text-gray-600">
            {favoriteProperties.length > 0
              ? `${favoriteProperties.length} saved propert${favoriteProperties.length !== 1 ? "ies" : "y"}`
              : "Save properties you love to view them later"}
          </p>
        </div>

        {favoriteProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onFavorite={handleFavoriteToggle}
                isFavorited={true}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                accentColor={accentColor}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              No favorites yet
            </h3>
            <p className="text-gray-600 mb-4">
              Start browsing and save properties you love by clicking the heart
              icon
            </p>
            <Link href="/guest/browse">
              <Button
                className="text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Browse Properties
              </Button>
            </Link>
          </div>
        )}
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
