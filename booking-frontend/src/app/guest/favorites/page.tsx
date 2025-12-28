"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, MapPin, Star, Search, X } from "lucide-react";
import Image from "next/image";
import { Card, Button, Input } from "@/components/ui";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { Footer } from "@/components/guest/sections/Footer";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { favoritesService, type FavoriteProperty } from "@/services";
import toast from "react-hot-toast";

export default function FavoritesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);

  // Use realtor branding hook for consistent styling
  const {
    brandColor: primaryColor,
    secondaryColor,
    accentColor,
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
      router.push("/guest/login?returnTo=/guest/favorites");
    }
  }, [isLoading, isAuthenticated, authChecked, router]);

  // Fetch favorites on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchFavorites();
    }
  }, [isAuthenticated, user]);

  const fetchFavorites = async () => {
    try {
      setIsLoadingFavorites(true);
      const response = await favoritesService.getFavorites();
      if (response.success && response.data) {
        setFavorites(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
      toast.error("Failed to load favorites");
    } finally {
      setIsLoadingFavorites(false);
    }
  };

  const handleRemoveFavorite = async (propertyId: string) => {
    try {
      const response = await favoritesService.removeFavorite(propertyId);
      if (response.success) {
        toast.success("Removed from favorites");
        // Remove from local state
        setFavorites((prev) =>
          prev.filter((fav) => fav.propertyId !== propertyId)
        );
      }
    } catch (error: any) {
      console.error("Failed to remove favorite:", error);
      toast.error(
        error.response?.data?.error || "Failed to remove from favorites"
      );
    }
  };

  const handleBookNow = (propertyId: string) => {
    router.push(`/browse/${propertyId}`);
  };

  const formatPrice = (price: number, currency: string = "NGN") => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Show loading state while checking authentication or loading favorites
  if (!authChecked || isLoading || isLoadingFavorites) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GuestHeader
          currentPage="favorites"
          searchPlaceholder="Search properties..."
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-100 rounded w-1/3"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
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

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Header Section */}
        <div className="mb-16 text-center">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-lg mb-8"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <Heart className="h-8 w-8" style={{ color: primaryColor }} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            My Favorites
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Properties you've saved for your dream stay
          </p>
        </div>

        {/* Stats Overview */}
        {favorites.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card
              className="p-6 text-center border border-gray-200 !bg-white hover:shadow-md transition-shadow duration-200"
              style={{ backgroundColor: "#ffffff", color: "#111827" }}
            >
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Heart className="h-6 w-6" style={{ color: primaryColor }} />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {favorites.length}
              </p>
              <p className="text-sm text-gray-600">Saved Properties</p>
            </Card>

            <Card
              className="p-6 text-center border border-gray-200 !bg-white hover:shadow-md transition-shadow duration-200"
              style={{ backgroundColor: "#ffffff", color: "#111827" }}
            >
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4"
                style={{ backgroundColor: `${secondaryColor || "#059669"}15` }}
              >
                <MapPin
                  className="h-6 w-6"
                  style={{ color: secondaryColor || "#059669" }}
                />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {new Set(favorites.map((f) => f.property.city)).size}
              </p>
              <p className="text-sm text-gray-600">Cities</p>
            </Card>

            <Card
              className="p-6 text-center border border-gray-200 !bg-white hover:shadow-md transition-shadow duration-200"
              style={{ backgroundColor: "#ffffff", color: "#111827" }}
            >
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4"
                style={{ backgroundColor: `${accentColor || "#D97706"}15` }}
              >
                <Star
                  className="h-6 w-6"
                  style={{ color: accentColor || "#D97706" }}
                />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {favorites.length > 0
                  ? (
                      favorites.reduce(
                        (acc, f) => acc + (f.property.averageRating || 0),
                        0
                      ) / favorites.length
                    ).toFixed(1)
                  : "0.0"}
              </p>
              <p className="text-sm text-gray-600">Avg Rating</p>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {favorites.length === 0 ? (
          <Card
            className="p-16 text-center border border-gray-200 !bg-white shadow-sm"
            style={{ backgroundColor: "#ffffff", color: "#111827" }}
          >
            <div className="max-w-md mx-auto">
              <div
                className="inline-flex items-center justify-center w-20 h-20 rounded-lg mb-6"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Heart className="h-10 w-10" style={{ color: primaryColor }} />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                No favorites yet
              </h3>

              <p className="text-gray-600 mb-8">
                Start exploring and save properties you love to easily find them
                later.
              </p>

              <Button
                onClick={() => router.push("/browse")}
                className="text-white font-semibold py-2 px-6 hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                <Search className="h-4 w-4 mr-2" />
                Browse Properties
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* Favorites Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((favorite) => (
                <Card
                  key={favorite.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 !bg-white"
                  style={{ backgroundColor: "#ffffff", color: "#111827" }}
                >
                  <div className="relative h-48">
                    {favorite.property.images?.[0]?.url ? (
                      <Image
                        src={favorite.property.images[0].url}
                        alt={favorite.property.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                    <button
                      onClick={() => handleRemoveFavorite(favorite.propertyId)}
                      className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
                    >
                      <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                    </button>
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                      {favorite.property.title}
                    </h3>

                    <div className="flex items-center text-gray-600 mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm truncate">
                        {favorite.property.city}, {favorite.property.country}
                      </span>
                    </div>

                    {favorite.property.averageRating && (
                      <div className="flex items-center mb-3">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <span className="font-semibold text-gray-900 mr-1">
                          {favorite.property.averageRating.toFixed(1)}
                        </span>
                        <span className="text-gray-600 text-sm">
                          ({favorite.property.reviewCount} reviews)
                        </span>
                      </div>
                    )}

                    <div className="flex items-baseline justify-between mb-4">
                      <div>
                        <span className="text-xl font-bold text-gray-900">
                          {formatPrice(
                            favorite.property.pricePerNight,
                            favorite.property.currency
                          )}
                        </span>
                        <span className="text-gray-600 text-sm ml-1">
                          / night
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleBookNow(favorite.propertyId)}
                      className="w-full text-white font-semibold hover:opacity-90"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Book Now
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>

      <Footer
        realtorName={realtorName}
        tagline={tagline || "Premium short-let properties"}
        logo={logoUrl}
        description={description || "Experience luxury accommodations"}
        primaryColor={primaryColor}
      />
    </div>
  );
}
