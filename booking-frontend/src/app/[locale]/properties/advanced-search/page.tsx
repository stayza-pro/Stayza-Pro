"use client";

import React, { useState, useEffect } from "react";
import { useProperties } from "@/hooks/useProperties";
import {
  PropertyFilters as PropertyFiltersType,
  Property,
  PropertyType,
  PropertyAmenity,
} from "@/types";
import { AdvancedSearchFilters } from "@/components/property/AdvancedSearchFilters";
import { PropertyMapView } from "@/components/property/PropertyMapView";

import { PropertyCard } from "@/components/property/PropertyCard";
import { Button } from "@/components/ui";
import { motion, AnimatePresence } from "framer-motion";
import {
  Grid3X3,
  List,
  Map,
  Filter,
  Search,
  MapPin,
  Calendar,
  Users,
  SlidersHorizontal,
} from "lucide-react";

interface ViewMode {
  mode: "list" | "grid" | "map";
  label: string;
  icon: React.ElementType;
}

const viewModes: ViewMode[] = [
  { mode: "grid", label: "Grid", icon: Grid3X3 },
  { mode: "list", label: "List", icon: List },
  { mode: "map", label: "Map", icon: Map },
];

export default function AdvancedPropertySearchPage() {
  const [viewMode, setViewMode] = useState<"list" | "grid" | "map">("grid");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [hoveredProperty, setHoveredProperty] = useState<Property | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<PropertyFiltersType>({
    city: "",
    country: "",
    type: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    maxGuests: undefined,
    checkIn: undefined,
    checkOut: undefined,
    amenities: [],
    isActive: true,
    isApproved: true,
  });

  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: viewMode === "map" ? 100 : 20,
    sortBy: "createdAt" as const,
    sortOrder: "desc" as const,
  });

  const {
    data: propertiesResponse,
    isLoading,
    error,
    refetch,
  } = useProperties(filters, searchParams);

  const handleRefetch = () => refetch();

  const properties = propertiesResponse?.data || [];
  const totalCount = propertiesResponse?.pagination?.totalItems ?? 0;
  const hasMore = propertiesResponse?.pagination?.hasNext || false;

  // Update search params when view mode changes
  useEffect(() => {
    setSearchParams((prev) => ({
      ...prev,
      limit: viewMode === "map" ? 100 : 20,
    }));
  }, [viewMode]);

  const handleFiltersChange = (newFilters: any) => {
    // Convert advanced filters to our PropertyFilters format
    const convertedFilters: PropertyFiltersType = {
      city: newFilters.location || "",
      country: "",
      type: newFilters.propertyType || undefined,
      minPrice: newFilters.priceRange?.min || undefined,
      maxPrice: newFilters.priceRange?.max || undefined,
      maxGuests: newFilters.maxGuests || undefined,
      checkIn: newFilters.checkIn || undefined,
      checkOut: newFilters.checkOut || undefined,
      amenities: newFilters.amenities || [],
      isActive: true,
      isApproved: true,
    };

    setFilters(convertedFilters);
    setSearchParams((prev) => ({
      ...prev,
      page: 1, // Reset to first page when filters change
      sortBy: newFilters.sortBy || "createdAt",
      sortOrder: newFilters.sortOrder || "desc",
    }));
  };

  const handleViewModeChange = (mode: "list" | "grid" | "map") => {
    setViewMode(mode);
    if (mode === "map") {
      setSelectedProperty(null);
    }
  };

  const handlePropertySelect = (property: Property | null) => {
    setSelectedProperty(property);
  };

  const handlePropertyHover = (property: Property | null) => {
    setHoveredProperty(property);
  };

  const handleLoadMore = () => {
    setSearchParams((prev) => ({
      ...prev,
      page: prev.page + 1,
    }));
  };

  const quickSearchOptions: Array<{
    label: string;
    filters: Partial<PropertyFiltersType>;
    icon: any;
  }> = [
    {
      label: "Lagos Apartments",
      filters: { city: "Lagos", type: "APARTMENT" as PropertyType },
      icon: MapPin,
    },
    {
      label: "Weekend Getaways",
      filters: { type: "VILLA" as PropertyType, minPrice: 100 },
      icon: Calendar,
    },
    {
      label: "Family Friendly",
      filters: {
        maxGuests: 6,
        amenities: ["KITCHEN", "WIFI"] as PropertyAmenity[],
      },
      icon: Users,
    },
  ];

  const handleQuickSearch = (quickFilters: Partial<PropertyFiltersType>) => {
    const convertedFilters: PropertyFiltersType = {
      ...filters,
      city: quickFilters.city || filters.city,
      type: quickFilters.type || filters.type,
      minPrice: quickFilters.minPrice || filters.minPrice,
      maxGuests: quickFilters.maxGuests || filters.maxGuests,
      amenities: quickFilters.amenities || filters.amenities,
    };
    setFilters(convertedFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Title and Count */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Find Your Perfect Stay
                </h1>
                <p className="text-gray-600 mt-1">
                  {isLoading
                    ? "Searching properties..."
                    : `${Number(totalCount || 0).toLocaleString("en-NG")} ${
                        totalCount === 1 ? "property" : "properties"
                      } found`}
                </p>
              </div>

              {/* Quick Search Pills */}
              <div className="flex items-center space-x-2 overflow-x-auto">
                {quickSearchOptions.map((option, index) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleQuickSearch(option.filters)}
                      className="flex-shrink-0 flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium transition-colors"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdvancedSearchFilters
          onFiltersChange={handleFiltersChange}
          onViewModeChange={handleViewModeChange}
          viewMode={viewMode}
          showMap={true}
        />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <AnimatePresence mode="wait">
          {viewMode === "map" ? (
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-[calc(100vh-300px)] min-h-[500px]"
            >
              <PropertyMapView
                properties={properties}
                selectedProperty={selectedProperty}
                onPropertySelect={handlePropertySelect}
                onPropertyHover={handlePropertyHover}
                center={{ lat: 6.5244, lng: 3.3792 }} // Lagos default
                zoom={12}
                className="rounded-xl overflow-hidden shadow-lg"
              />
            </motion.div>
          ) : (
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Results Controls */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  {/* View Mode Toggle */}
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                    <button
                      onClick={() => handleViewModeChange("grid")}
                      className={`px-3 py-2 text-sm transition-colors ${
                        viewMode === "grid"
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleViewModeChange("list")}
                      className={`px-3 py-2 text-sm transition-colors ${
                        viewMode === "list"
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {isLoading && properties.length === 0 && (
                <div className="space-y-6">
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="bg-gray-200 rounded-lg h-80 animate-pulse"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="bg-gray-200 rounded-lg h-40 animate-pulse"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Error State */}
              {!!error && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Search className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Something went wrong
                  </h3>
                  <p className="text-gray-600 mb-4">
                    We couldn't load the properties. Please try again.
                  </p>
                  <Button onClick={handleRefetch}>Try Again</Button>
                </div>
              )}

              {/* No Results */}
              {!isLoading && properties.length === 0 && !error && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Search className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No properties found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search filters or explore different
                    locations.
                  </p>
                  <Button
                    onClick={() =>
                      setFilters({
                        city: "",
                        country: "",
                        type: undefined,
                        minPrice: undefined,
                        maxPrice: undefined,
                        maxGuests: undefined,
                        checkIn: undefined,
                        checkOut: undefined,
                        amenities: [],
                        isActive: true,
                        isApproved: true,
                      })
                    }
                  >
                    Clear Filters
                  </Button>
                </div>
              )}

              {/* Results */}
              {properties.length > 0 && (
                <>
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {properties.map((property, index) => (
                        <motion.div
                          key={property.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <PropertyCard
                            property={property}
                            onHover={(hovered) =>
                              handlePropertyHover(hovered ? property : null)
                            }
                            className={
                              hoveredProperty?.id === property.id
                                ? "ring-2 ring-blue-300"
                                : ""
                            }
                          />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {properties.map((property, index) => (
                        <motion.div
                          key={property.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <PropertyCard
                            property={property}
                            layout="horizontal"
                            onHover={(hovered) =>
                              handlePropertyHover(hovered ? property : null)
                            }
                            className={`${
                              hoveredProperty?.id === property.id
                                ? "ring-2 ring-blue-300"
                                : ""
                            } transition-all`}
                          />
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Load More Button */}
                  {hasMore && (
                    <div className="text-center mt-8">
                      <Button
                        onClick={handleLoadMore}
                        variant="outline"
                        loading={isLoading}
                        className="px-8"
                      >
                        {isLoading ? "Loading..." : "Load More Properties"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
