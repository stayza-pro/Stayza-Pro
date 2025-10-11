"use client";

import { useProperties } from "../../hooks/useProperties";

export const dynamic = "force-dynamic";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import { PropertyGrid } from "../../components/property/PropertyGrid";
import { SearchFilters } from "../../components/property/SearchFilters";
import { useState } from "react";
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
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Browse Properties
            </h1>
            <p className="mt-2 text-gray-600">
              Discover amazing places to stay around the world
            </p>
          </div>

          <SearchFilters onFiltersChange={handleFiltersChange} />

          <PropertyGrid
            properties={propertiesResponse?.data || []}
            loading={isLoading}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
