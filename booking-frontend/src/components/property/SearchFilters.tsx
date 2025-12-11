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
  primaryColor?: string; // 60% - Main theme color
  secondaryColor?: string; // 30% - Secondary elements
  accentColor?: string; // 10% - CTAs and highlights
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  onFiltersChange,
  className = "",
  primaryColor = "#3B82F6", // Default blue
  secondaryColor = "#059669", // Default green
  accentColor = "#D97706", // Default orange
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
    <Card
      className={`p-6 border border-gray-200 !bg-white shadow-sm ${className}`}
      style={{ backgroundColor: "#ffffff", color: "#111827" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5" style={{ color: secondaryColor }} />
          <h3
            className="text-lg font-semibold"
            style={{ color: secondaryColor }}
          >
            Filters
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="transition-colors"
            style={{ color: secondaryColor }}
          >
            Clear All
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ color: secondaryColor }}
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
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: secondaryColor }}
          >
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
              className="w-full px-3 py-2 border rounded-md text-sm"
              style={{ borderColor: `${secondaryColor}40` }}
              placeholder="Min"
            />
            <span style={{ color: `${secondaryColor}60` }}>-</span>
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
              className="w-full px-3 py-2 border rounded-md text-sm"
              style={{ borderColor: `${secondaryColor}40` }}
              placeholder="Max"
            />
          </div>
        </div>

        {/* Property Type */}
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: secondaryColor }}
          >
            <Home className="h-4 w-4 inline mr-1" />
            Property Type
          </label>
          <select
            value={filters.propertyType}
            onChange={(e) => handleFilterChange("propertyType", e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm"
            style={{ borderColor: `${secondaryColor}40` }}
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
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: secondaryColor }}
          >
            <Star className="h-4 w-4 inline mr-1" />
            Minimum Rating
          </label>
          <select
            value={filters.minRating}
            onChange={(e) =>
              handleFilterChange("minRating", parseFloat(e.target.value))
            }
            className="w-full px-3 py-2 border rounded-md text-sm"
            style={{ borderColor: `${secondaryColor}40` }}
          >
            <option value={0}>Any Rating</option>
            <option value={3}>3+ Stars</option>
            <option value={4}>4+ Stars</option>
            <option value={4.5}>4.5+ Stars</option>
          </select>
        </div>

        {/* Instant Book */}
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: secondaryColor }}
          >
            Quick Options
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.instantBook}
              onChange={(e) =>
                handleFilterChange("instantBook", e.target.checked)
              }
              className="rounded mr-2"
              style={{
                color: accentColor,
                accentColor: accentColor,
                borderColor: `${secondaryColor}40`,
              }}
            />
            <span className="text-sm" style={{ color: secondaryColor }}>
              Instant Book
            </span>
          </label>
        </div>
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div
          className="border-t pt-4"
          style={{ borderColor: `${secondaryColor}20` }}
        >
          <div className="space-y-4">
            {/* Amenities */}
            <div>
              <label
                className="block text-sm font-medium mb-3"
                style={{ color: secondaryColor }}
              >
                Amenities
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {amenities.map((amenity) => {
                  const IconComponent = amenity.icon;
                  const isSelected = filters.amenities.includes(amenity.value);
                  return (
                    <button
                      key={amenity.value}
                      onClick={() => toggleAmenity(amenity.value)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                        !isSelected ? "" : ""
                      }`}
                      style={
                        isSelected
                          ? {
                              backgroundColor: `${accentColor}20`,
                              borderColor: `${accentColor}60`,
                              color: accentColor,
                            }
                          : {
                              backgroundColor: "white",
                              borderColor: `${secondaryColor}30`,
                              color: secondaryColor,
                            }
                      }
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
