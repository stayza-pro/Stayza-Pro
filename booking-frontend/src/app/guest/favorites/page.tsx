"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MapPin, Star, Search, X } from "lucide-react";
import Image from "next/image";
import { Card, Button, Input } from "@/components/ui";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { Footer } from "@/components/guest/sections/Footer";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";

export default function FavoritesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  // Use realtor branding hook for consistent styling
  const {
    brandColor: primaryColor, // Lighter touch - primary for CTAs
    secondaryColor, // Lighter touch - secondary for accents
    accentColor, // Lighter touch - accent for highlights
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

  // TODO: Fetch favorites from API
  const favorites: any[] = [];

  const handleRemoveFavorite = (propertyId: string) => {
    // TODO: Implement remove from favorites API call
    console.log("Removing favorite:", propertyId);
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

  // Show loading state while checking authentication
  if (!authChecked || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-100 rounded w-1/3"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <GuestHeader
        currentPage="favorites"
        searchPlaceholder="Search properties..."
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Favorites
              </h1>
              <p className="text-gray-600">Properties you've saved for later</p>
            </div>
            <p className="text-xs text-gray-400 mt-1">Powered by Stayza Pro</p>
          </div>
        </div>

        {/* Search */}
        <Card className="p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search your favorites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Empty State */}
        {favorites.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No favorites yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start exploring and save properties you love to easily find them
              later.
            </p>
            <Button onClick={() => router.push("/browse")}>
              Browse Properties
            </Button>
          </Card>
        ) : (
          <>
            {/* Favorites Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((property) => (
                <Card
                  key={property.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-48">
                    {property.images?.[0]?.url ? (
                      <Image
                        src={property.images[0].url}
                        alt={property.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                    <button
                      onClick={() => handleRemoveFavorite(property.id)}
                      className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
                    >
                      <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                    </button>
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                      {property.title}
                    </h3>

                    <div className="flex items-center text-gray-600 mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm truncate">
                        {property.city}, {property.state}
                      </span>
                    </div>

                    {property.averageRating && (
                      <div className="flex items-center mb-3">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <span className="font-semibold text-gray-900 mr-1">
                          {property.averageRating.toFixed(1)}
                        </span>
                        <span className="text-gray-600 text-sm">
                          ({property.reviewCount} reviews)
                        </span>
                      </div>
                    )}

                    <div className="flex items-baseline justify-between mb-4">
                      <div>
                        <span className="text-xl font-bold text-gray-900">
                          {formatPrice(
                            property.pricePerNight,
                            property.currency
                          )}
                        </span>
                        <span className="text-gray-600 text-sm ml-1">
                          / night
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleBookNow(property.id)}
                      className="w-full"
                    >
                      Book Now
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Stats */}
            <Card className="p-6 mt-8">
              <div className="text-center">
                <p
                  className="text-3xl font-bold"
                  style={{ color: primaryColor }}
                >
                  {" "}
                  {/* Lighter touch - primary for stat */}
                  {favorites.length}
                </p>
                <p className="text-gray-600">
                  {favorites.length === 1 ? "Property" : "Properties"} Saved
                </p>
              </div>
            </Card>
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
