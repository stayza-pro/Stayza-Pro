"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Property } from "../../types";
import { Card } from "../ui";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";

interface PropertyCardProps {
  property: Property;
  onFavorite?: (propertyId: string) => void;
  isFavorited?: boolean;
  className?: string;
  layout?: "vertical" | "horizontal";
  onHover?: (hovered: boolean) => void;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onFavorite,
  isFavorited = false,
  className = "",
  layout = "vertical",
  onHover,
  primaryColor,
  secondaryColor,
  accentColor,
}) => {
  const { brandColor } = useRealtorBranding();

  // Use provided colors or fall back to brandColor/defaults
  const effectivePrimaryColor: string = primaryColor || brandColor || "#3B82F6";
  const effectiveSecondaryColor: string = secondaryColor || "#1F2937";
  const effectiveAccentColor: string = accentColor || "#F59E0B";

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavorite?.(property.id);
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getRatingDisplay = () => {
    if (!property.averageRating || !property.reviewCount) {
      return (
        <span
          className="text-sm"
          style={{ color: `${effectiveSecondaryColor}80` }}
        >
          New
        </span>
      );
    }

    return (
      <div className="flex items-center space-x-1">
        <svg
          className="w-4 h-4 fill-current"
          viewBox="0 0 20 20"
          style={{ color: effectiveAccentColor }}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.518 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        <span
          className="text-sm font-medium"
          style={{ color: effectiveSecondaryColor }}
        >
          {property.averageRating.toFixed(1)}
        </span>
        <span
          className="text-sm"
          style={{ color: `${effectiveSecondaryColor}80` }}
        >
          ({property.reviewCount})
        </span>
      </div>
    );
  };

  return (
    <Link href={`/browse/${property.id}`}>
      <Card
        className={`group hover:shadow-lg transition-shadow duration-200 overflow-hidden ${
          layout === "horizontal" ? "flex" : ""
        } ${className}`}
        onMouseEnter={() => onHover?.(true)}
        onMouseLeave={() => onHover?.(false)}
      >
        <div
          className={`relative ${
            layout === "horizontal" ? "flex-shrink-0 w-64" : ""
          }`}
        >
          {/* Image */}
          <div
            className={`relative overflow-hidden ${
              layout === "horizontal" ? "h-full" : "aspect-w-16 aspect-h-10"
            }`}
          >
            {property.images && property.images.length > 0 ? (
              <Image
                src={property.images[0].url}
                alt={property.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div
                className={`flex items-center justify-center ${
                  layout === "horizontal" ? "w-full h-full" : "w-full h-48"
                }`}
                style={{ backgroundColor: `${effectiveSecondaryColor}10` }}
              >
                <svg
                  className="w-12 h-12"
                  style={{ color: `${effectiveSecondaryColor}40` }}
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
              </div>
            )}
          </div>

          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 p-2 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 transition-all duration-200 shadow-sm"
          >
            <svg
              className="w-5 h-5 fill-current"
              style={{
                color: isFavorited
                  ? effectiveAccentColor
                  : `${effectiveSecondaryColor}60`,
              }}
              fill={isFavorited ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>

          {/* Property Type Badge */}
          <div className="absolute top-3 left-3">
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
              style={{
                backgroundColor: `${effectiveSecondaryColor}20`,
                color: effectiveSecondaryColor,
              }}
            >
              {property.type.toLowerCase().replace("_", " ")}
            </span>
          </div>

          {/* Images Count */}
          {property.images && property.images.length > 1 && (
            <div className="absolute bottom-3 right-3">
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-black bg-opacity-70 text-white">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {property.images.length}
              </span>
            </div>
          )}
        </div>

        <div
          className={`p-4 ${
            layout === "horizontal"
              ? "flex-1 flex flex-col justify-between"
              : ""
          }`}
        >
          <div>
            {/* Location */}
            <div
              className="flex items-center text-sm mb-2"
              style={{ color: `${effectiveSecondaryColor}99` }}
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="truncate">
                {property.city}, {property.state}, {property.country}
              </span>
            </div>

            {/* Title */}
            <h3
              className={`font-semibold line-clamp-2 transition-colors ${
                layout === "horizontal" ? "text-lg mb-2" : "text-lg mb-2"
              }`}
              style={{
                color: effectiveSecondaryColor,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = effectivePrimaryColor)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = effectiveSecondaryColor)
              }
            >
              {property.title}
            </h3>

            {/* Property Details */}
            <div
              className={`flex items-center text-sm ${
                layout === "horizontal" ? "space-x-4 mb-2" : "space-x-4 mb-3"
              }`}
              style={{ color: `${effectiveSecondaryColor}99` }}
            >
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>{property.maxGuests} guests</span>
              </div>
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z"
                  />
                </svg>
                <span>{property.bedrooms} bed</span>
              </div>
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                  />
                </svg>
                <span>{property.bathrooms} bath</span>
              </div>
            </div>
          </div>

          {/* Rating and Price */}
          <div
            className={`flex items-center ${
              layout === "horizontal"
                ? "justify-between mt-2"
                : "justify-between"
            }`}
          >
            {getRatingDisplay()}
            <div className="text-right">
              <div
                className="text-xl font-bold"
                style={{ color: effectiveAccentColor }}
              >
                {formatPrice(property.pricePerNight, property.currency)}
              </div>
              <div
                className="text-sm"
                style={{ color: `${effectiveSecondaryColor}80` }}
              >
                per night
              </div>
            </div>
          </div>

          {/* Realtor Info */}
          {property.realtor && (
            <div
              className={`flex items-center border-t ${
                layout === "horizontal" ? "mt-2 pt-2" : "mt-3 pt-3"
              }`}
              style={{ borderColor: `${effectiveSecondaryColor}20` }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: effectivePrimaryColor }}
              >
                <span className="text-white text-xs font-medium">
                  {property.realtor.businessName}
                </span>
              </div>
              <span
                className="ml-2 text-sm"
                style={{ color: `${effectiveSecondaryColor}80` }}
              >
                By {property.realtor.businessName}
              </span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
};
