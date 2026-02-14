"use client";

import React from "react";
import Link from "next/link";
import { Heart, Star, MapPin, BedDouble, Bath, Users, Camera } from "lucide-react";
import { Property } from "../../types";

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

const getImageUrl = (image: any): string => {
  if (!image) return "";
  if (typeof image === "string") return image;
  if (image.url) return image.url;
  if (image.imageUrl) return image.imageUrl;
  if (image.src) return image.src;
  return "";
};

const formatPrice = (price: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(price);

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onFavorite,
  isFavorited = false,
  className = "",
  onHover,
}) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavorite?.(property.id);
  };

  const hasImages = property.images && property.images.length > 0;
  const imageUrl = hasImages && property.images ? getImageUrl(property.images[0]) : "";
  const hasValidImageUrl = imageUrl && imageUrl.trim() !== "";

  return (
    <Link href={`/browse/${property.id}`} className={`group block ${className}`}>
      <article
        className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        onMouseEnter={() => onHover?.(true)}
        onMouseLeave={() => onHover?.(false)}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {hasValidImageUrl ? (
            <img
              src={imageUrl}
              alt={property.title}
              crossOrigin="anonymous"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[var(--brand-primary-light)]">
              <BedDouble size={48} className="text-[var(--brand-primary)] opacity-30" />
            </div>
          )}

          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Favorite button */}
          <button
            onClick={handleFavoriteClick}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all z-10 ${
              isFavorited
                ? "bg-red-500 text-white shadow-lg"
                : "bg-white/90 backdrop-blur-sm text-gray-600 hover:text-red-500 shadow-md"
            }`}
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart size={16} fill={isFavorited ? "currentColor" : "none"} />
          </button>

          {/* Property type badge */}
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-gray-900/80 backdrop-blur-sm text-white text-xs font-semibold capitalize z-10">
            {property.type.toLowerCase().replace("_", " ")}
          </span>

          {/* Rating */}
          {property.averageRating && property.averageRating > 0 && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm z-10">
              <Star size={14} className="text-amber-500 fill-amber-500" />
              <span className="text-xs font-bold text-gray-900">
                {property.averageRating.toFixed(1)}
              </span>
            </div>
          )}

          {/* Image count */}
          {property.images && property.images.length > 1 && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm z-10">
              <Camera size={12} className="text-white" />
              <span className="text-xs font-medium text-white">
                {property.images.length}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-base font-semibold text-gray-900 leading-snug line-clamp-1 mb-1.5">
            {property.title}
          </h3>

          <div className="flex items-start gap-1.5 text-gray-500 text-sm mb-3">
            <MapPin size={14} className="shrink-0 mt-0.5" />
            <span className="line-clamp-1">
              {[property.city, property.state].filter(Boolean).join(", ")}
            </span>
          </div>

          {/* Amenities row */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3 pb-3 border-b border-gray-100">
            <span className="flex items-center gap-1">
              <BedDouble size={14} />
              {property.bedrooms} {property.bedrooms === 1 ? "bed" : "beds"}
            </span>
            <span className="flex items-center gap-1">
              <Bath size={14} />
              {property.bathrooms} {property.bathrooms === 1 ? "bath" : "baths"}
            </span>
            <span className="flex items-center gap-1">
              <Users size={14} />
              {property.maxGuests} guests
            </span>
          </div>

          {/* Price + CTA */}
          <div className="flex items-end justify-between">
            <div>
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(property.pricePerNight, property.currency)}
              </span>
              <span className="text-sm text-gray-500 ml-0.5">/night</span>
            </div>
            <span className="text-xs font-semibold text-[var(--brand-primary)] group-hover:underline">
              View details
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};
