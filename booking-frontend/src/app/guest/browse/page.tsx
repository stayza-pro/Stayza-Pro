"use client";

import React, { useState, useEffect } from "react";
import { useProperties } from "../../hooks/useProperties";
import { GuestHeader } from "../../components/guest/sections/GuestHeader";
import { Footer } from "../../components/guest/sections/Footer";
import { PropertyGrid } from "../../components/property/PropertyGrid";
import { SearchFilters } from "../../components/property/SearchFilters";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import type {
  PropertyFilters,
  PropertyType,
  PropertyAmenity,
} from "../../types";

interface FiltersState {
  priceRange: { min: number; max: number };
  propertyType: string;
  minRating: number;
  amenities: string[];
  instantBook: boolean;
}

export default function BrowsePropertiesPage() {
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [mounted, setMounted] = useState(false);
  const {
    brandColor: primaryColor,
    secondaryColor,
    accentColor,
    realtorName,
    logoUrl,
    tagline,
    description,
  } = useRealtorBranding(); // 60-30-10 color rule

  const { data: propertiesResponse, isLoading } = useProperties(filters, {
    page: 1,
    limit: 20,
  });

  // Prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFiltersChange = (filtersState: FiltersState) => {
    // Convert FiltersState to PropertyFilters
    const convertedFilters: PropertyFilters = {
      minPrice:
        filtersState.priceRange.min > 0
          ? filtersState.priceRange.min
          : undefined,
      maxPrice:
        filtersState.priceRange.max < 1000
          ? filtersState.priceRange.max
          : undefined,
      type: filtersState.propertyType
        ? (filtersState.propertyType.toUpperCase() as PropertyType)
        : undefined,
      amenities:
        filtersState.amenities.length > 0
          ? filtersState.amenities.map(
              (a) => a.toUpperCase() as PropertyAmenity
            )
          : undefined,
    };

    setFilters(convertedFilters);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col"
      style={{ colorScheme: "light" }}
    >
      <GuestHeader
        currentPage="browse"
        searchPlaceholder="Search location..."
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 animate-in fade-in duration-500">
        <div className="space-y-8">
          {/* Hero Header Section */}
          <div className="text-center mb-16">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-lg mb-8"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <svg
                className="h-8 w-8"
                style={{ color: primaryColor }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Browse Properties
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover amazing places to stay around the world
            </p>
          </div>

          <SearchFilters
            onFiltersChange={handleFiltersChange}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            accentColor={accentColor}
          />

          <PropertyGrid
            properties={propertiesResponse?.data || []}
            loading={isLoading}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            accentColor={accentColor}
          />
        </div>
      </main>

      <Footer
        realtorName={realtorName || "Stayza"}
        tagline={tagline || "Your Trusted Property Partner"}
        logo={logoUrl}
        description={description || "Find your perfect stay with us"}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        accentColor={accentColor}
      />
    </div>
  );
}
