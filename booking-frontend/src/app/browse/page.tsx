"use client";

import { useProperties } from "../../hooks/useProperties";

export const dynamic = "force-dynamic";
import { GuestHeader } from "../../components/guest/sections/GuestHeader";
import { Footer } from "../../components/guest/sections/Footer";
import { PropertyGrid } from "../../components/property/PropertyGrid";
import { SearchFilters } from "../../components/property/SearchFilters";
import { useState } from "react";
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
        <div className="space-y-8">
          <div>
            <h1
              className="text-3xl font-bold"
              style={{ color: secondaryColor }} // 30% - Secondary color for heading
            >
              Browse Properties
            </h1>
            <p
              className="mt-2"
              style={{ color: `${secondaryColor}99` }} // 30% - Secondary color for description text
            >
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
