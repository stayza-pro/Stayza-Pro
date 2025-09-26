"use client";

import React, { useState } from "react";
import { Button, Input, Card } from "../ui";
import { PropertyFilters as PropertyFiltersType, Property } from "../../types";

const propertyTypes: Array<{ value: Property["type"]; label: string }> = [
  { value: "APARTMENT", label: "Apartment" },
  { value: "HOUSE", label: "House" },
  { value: "VILLA", label: "Villa" },
  { value: "COTTAGE", label: "Cottage" },
  { value: "STUDIO", label: "Studio" },
  { value: "LOFT", label: "Loft" },
  { value: "TOWNHOUSE", label: "Townhouse" },
  { value: "OTHER", label: "Other" },
];

const amenitiesList = [
  "WiFi",
  "Kitchen",
  "Parking",
  "Pool",
  "Gym",
  "Air Conditioning",
  "Heating",
  "Balcony",
  "Garden",
  "Pet Friendly",
  "Washing Machine",
  "TV",
  "Hot Tub",
  "BBQ Grill",
  "Beach Access",
];

interface PropertyFiltersProps {
  filters: PropertyFiltersType;
  onFiltersChange: (filters: PropertyFiltersType) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  isLoading?: boolean;
  className?: string;
}

export const PropertyFilters: React.FC<PropertyFiltersProps> = ({
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  isLoading = false,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleInputChange = (field: keyof PropertyFiltersType, value: any) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  const handleAmenityToggle = (amenity: string) => {
    const currentAmenities = filters.amenities || [];
    const updatedAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter((a) => a !== amenity)
      : [...currentAmenities, amenity];

    onFiltersChange({
      ...filters,
      amenities: updatedAmenities,
    });
  };

  const hasActiveFilters = () => {
    return (
      filters.city ||
      filters.country ||
      filters.type ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.maxGuests ||
      (filters.amenities && filters.amenities.length > 0)
    );
  };

  return (
    <Card className={`${className}`}>
      {/* Basic Filters - Always Visible */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {hasActiveFilters() && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              disabled={isLoading}
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Location Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <Input
              type="text"
              placeholder="Enter city..."
              value={filters.city || ""}
              onChange={(e) => handleInputChange("city", e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <Input
              type="text"
              placeholder="Enter country..."
              value={filters.country || ""}
              onChange={(e) => handleInputChange("country", e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Property Type and Guests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Type
            </label>
            <select
              value={filters.type || ""}
              onChange={(e) =>
                handleInputChange("type", e.target.value || undefined)
              }
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All types</option>
              {propertyTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Guests
            </label>
            <Input
              type="number"
              min="1"
              placeholder="Any"
              value={filters.maxGuests || ""}
              onChange={(e) =>
                handleInputChange(
                  "maxGuests",
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range (per night)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                type="number"
                min="0"
                placeholder="Min price"
                value={filters.minPrice || ""}
                onChange={(e) =>
                  handleInputChange(
                    "minPrice",
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                disabled={isLoading}
              />
            </div>
            <div>
              <Input
                type="number"
                min="0"
                placeholder="Max price"
                value={filters.maxPrice || ""}
                onChange={(e) =>
                  handleInputChange(
                    "maxPrice",
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Toggle for Advanced Filters */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          disabled={isLoading}
        >
          <span>{isExpanded ? "Hide" : "Show"} Advanced Filters</span>
          <svg
            className={`ml-2 w-4 h-4 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Advanced Filters - Collapsible */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* Date Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-in & Check-out
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  type="date"
                  value={
                    filters.checkIn
                      ? filters.checkIn.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    handleInputChange(
                      "checkIn",
                      e.target.value ? new Date(e.target.value) : undefined
                    )
                  }
                  disabled={isLoading}
                />
              </div>
              <div>
                <Input
                  type="date"
                  value={
                    filters.checkOut
                      ? filters.checkOut.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    handleInputChange(
                      "checkOut",
                      e.target.value ? new Date(e.target.value) : undefined
                    )
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amenities
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {amenitiesList.map((amenity) => (
                <label key={amenity} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.amenities?.includes(amenity) || false}
                    onChange={() => handleAmenityToggle(amenity)}
                    disabled={isLoading}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{amenity}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Apply Filters Button */}
      <div className="border-t border-gray-200 p-4">
        <Button
          variant="primary"
          size="lg"
          onClick={onApplyFilters}
          disabled={isLoading}
          loading={isLoading}
          className="w-full"
        >
          Apply Filters
        </Button>
      </div>
    </Card>
  );
};
