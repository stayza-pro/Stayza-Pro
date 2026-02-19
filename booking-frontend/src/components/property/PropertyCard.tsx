"use client";

import React from "react";
import Link from "next/link";
import { Bath, Bed, Heart, MapPin, Square } from "lucide-react";
import { Property } from "../../types";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { normalizeImageUrl } from "@/utils/imageUrl";

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
  accentColor,
}) => {
  const { brandColor } = useRealtorBranding();

  const effectivePrimaryColor: string = primaryColor || brandColor || "#3B82F6";
  const effectiveAccentColor: string = accentColor || "#F59E0B";

  const hasImages = Boolean(property.images && property.images.length > 0);
  const imageUrl =
    hasImages && property.images ? normalizeImageUrl(property.images[0]) : "";
  const hasValidImageUrl = imageUrl && imageUrl.trim() !== "";

  const handleFavoriteClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onFavorite?.(property.id);
  };

  const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <Link href={`/guest/browse/${property.id}`}>
      <div
        className={`group rounded-2xl border overflow-hidden transition-all hover:shadow-xl bg-white border-gray-200 ${
          layout === "horizontal" ? "md:flex" : ""
        } ${className}`}
        onMouseEnter={() => onHover?.(true)}
        onMouseLeave={() => onHover?.(false)}
      >
        <div
          className={`relative overflow-hidden ${
            layout === "horizontal"
              ? "md:w-[42%] aspect-[4/3] md:aspect-auto"
              : "aspect-[4/3]"
          }`}
        >
          {hasValidImageUrl ? (
            <img
              src={imageUrl}
              alt={property.title}
              crossOrigin="anonymous"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-4xl"
              style={{ backgroundColor: `${effectivePrimaryColor}22` }}
            >
              No image
            </div>
          )}

          {property.type ? (
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm bg-black/65 text-white capitalize">
              {property.type.toLowerCase().replace("_", " ")}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleFavoriteClick}
            className="absolute top-4 right-4 w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.9)" }}
            aria-label="Toggle favorite"
          >
            <Heart
              className="w-5 h-5"
              style={{
                color: isFavorited ? effectiveAccentColor : "#6b7280",
                fill: isFavorited ? effectiveAccentColor : "none",
              }}
            />
          </button>

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
            <div className="text-2xl font-bold text-white">
              {formatPrice(property.pricePerNight, property.currency)}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 flex-1">
          <div>
            <h3 className="font-semibold mb-2 line-clamp-1 text-[18px] text-gray-900">
              {property.title}
            </h3>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm line-clamp-1 text-gray-600">
                {property.city}
                {property.state ? `, ${property.state}` : ""}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-1.5">
              <Bed className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {property.bedrooms}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {property.bathrooms}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Square className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {property.maxGuests} guests
              </span>
            </div>
          </div>

          <div
            className="w-full h-11 rounded-xl font-medium text-white flex items-center justify-center"
            style={{ backgroundColor: effectiveAccentColor }}
          >
            View Details
          </div>
        </div>
      </div>
    </Link>
  );
};
