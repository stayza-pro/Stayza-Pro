"use client";

import React from "react";
import { Property } from "../../types";
import { PropertyCard } from "./PropertyCard";
import { Loading } from "../ui";

interface PropertyGridProps {
  properties: Property[];
  loading?: boolean;
  onFavorite?: (propertyId: string) => void;
  favoritedProperties?: string[];
  emptyMessage?: string;
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

export const PropertyGrid: React.FC<PropertyGridProps> = ({
  properties,
  loading = false,
  onFavorite,
  favoritedProperties = [],
  emptyMessage = "No properties found matching your criteria.",
  className = "",
  primaryColor = "#3B82F6",
  secondaryColor = "#059669",
  accentColor = "#D97706",
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <svg
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: `${secondaryColor}60` }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <h3
            className="text-lg font-medium mb-2"
            style={{ color: secondaryColor }}
          >
            No Properties Found
          </h3>
          <p className="text-gray-600">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}
    >
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          onFavorite={onFavorite}
          isFavorited={favoritedProperties.includes(property.id)}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          accentColor={accentColor}
        />
      ))}
    </div>
  );
};
