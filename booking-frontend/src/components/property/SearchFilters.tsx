"use client";

import React, { useState } from "react";
import { Button, Card } from "../ui";
import {
  Filter,
  X,
  MapPin,
  Home,
  DollarSign,
  Star,
  Wifi,
  Car,
  Utensils,
} from "lucide-react";

interface FiltersState {
  priceRange: { min: number; max: number };
  propertyType: string;
  minRating: number;
  amenities: string[];
  instantBook: boolean;
}

interface SearchFiltersProps {
  onFiltersChange?: (filters: FiltersState) => void;
  className?: string;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  onFiltersChange,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FiltersState>({
    priceRange: { min: 0, max: 1000 },
    propertyType: "",
    minRating: 0,
    amenities: [],
    instantBook: false,
  });

  const propertyTypes = [
    { value: "apartment", label: "Apartment", icon: Home },
    { value: "house", label: "House", icon: Home },
    { value: "villa", label: "Villa", icon: Home },
    { value: "condo", label: "Condo", icon: Home },
  ];

  const amenities = [
    { value: "wifi", label: "WiFi", icon: Wifi },
    { value: "parking", label: "Parking", icon: Car },
    { value: "kitchen", label: "Kitchen", icon: Utensils },
    { value: "pool", label: "Pool", icon: MapPin },
  ];

  const handleFilterChange = <K extends keyof FiltersState>(
    key: K,
    value: FiltersState[K]
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const toggleAmenity = (amenity: string) => {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter((a) => a !== amenity)
      : [...filters.amenities, amenity];

    handleFilterChange("amenities", newAmenities);
  };

  const clearFilters = () => {
    const defaultFilters: FiltersState = {
      priceRange: { min: 0, max: 1000 },
      propertyType: "",
      minRating: 0,
      amenities: [],
      instantBook: false,
    };
    setFilters(defaultFilters);
    onFiltersChange?.(defaultFilters);
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-600"
          >
            Clear All
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-600"
          >
            {isExpanded ? (
              <X className="h-4 w-4" />
            ) : (
              <Filter className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Always visible quick filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="h-4 w-4 inline mr-1" />
            Price Range
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="0"
              value={filters.priceRange.min}
              onChange={(e) =>
                handleFilterChange("priceRange", {
                  ...filters.priceRange,
                  min: parseInt(e.target.value) ?? 0,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Min"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              min="0"
              value={filters.priceRange.max}
              onChange={(e) =>
                handleFilterChange("priceRange", {
                  ...filters.priceRange,
                  max: parseInt(e.target.value) || 1000,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Max"
            />
          </div>
        </div>

        {/* Property Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Home className="h-4 w-4 inline mr-1" />
            Property Type
          </label>
          <select
            value={filters.propertyType}
            onChange={(e) => handleFilterChange("propertyType", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Types</option>
            {propertyTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Star className="h-4 w-4 inline mr-1" />
            Minimum Rating
          </label>
          <select
            value={filters.minRating}
            onChange={(e) =>
              handleFilterChange("minRating", parseFloat(e.target.value))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value={0}>Any Rating</option>
            <option value={3}>3+ Stars</option>
            <option value={4}>4+ Stars</option>
            <option value={4.5}>4.5+ Stars</option>
          </select>
        </div>

        {/* Instant Book */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Options
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.instantBook}
              onChange={(e) =>
                handleFilterChange("instantBook", e.target.checked)
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
            />
            <span className="text-sm text-gray-700">Instant Book</span>
          </label>
        </div>
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="border-t border-gray-200 pt-4">
          <div className="space-y-4">
            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Amenities
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {amenities.map((amenity) => {
                  const IconComponent = amenity.icon;
                  return (
                    <button
                      key={amenity.value}
                      onClick={() => toggleAmenity(amenity.value)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                        filters.amenities.includes(amenity.value)
                          ? "bg-blue-100 border-blue-300 text-blue-700"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{amenity.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
