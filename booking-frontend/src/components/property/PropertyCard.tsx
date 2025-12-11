"use client";

import React from "react";
import Link from "next/link";
import { Property } from "../../types";
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

// Helper function to get image URL
const getImageUrl = (image: any): string => {
  if (!image) return "";

  // If it's a string, return it directly
  if (typeof image === "string") {
    return image;
  }

  // If it's an object with url property
  if (image.url) {
    return image.url;
  }

  // If it's an object with other possible properties
  if (image.imageUrl) {
    return image.imageUrl;
  }

  if (image.src) {
    return image.src;
  }

  console.warn("Unknown image format:", image);
  return "";
};

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

  // Get image URL safely
  const hasImages = property.images && property.images.length > 0;
  const imageUrl =
    hasImages && property.images ? getImageUrl(property.images[0]) : "";
  const hasValidImageUrl = imageUrl && imageUrl.trim() !== "";

  return (
    <Link href={`/browse/${property.id}`}>
      <div
        className={`group ${className}`}
        style={{
          backgroundColor: "white",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
          border: "1px solid #f3f4f6",
          transition: "all 0.3s ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-8px)";
          e.currentTarget.style.boxShadow = "0 30px 60px rgba(0, 0, 0, 0.15)";
          onHover?.(true);
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 20px 40px rgba(0, 0, 0, 0.1)";
          onHover?.(false);
        }}
      >
        {/* Property Image */}
        <div
          style={{
            height: 240,
            position: "relative",
            overflow: "hidden",
            backgroundColor: "#f3f4f6",
          }}
        >
          {hasValidImageUrl ? (
            <img
              src={imageUrl}
              alt={property.title}
              crossOrigin="anonymous"
              className="group-hover:scale-110"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                transition: "transform 0.5s ease",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: `${effectivePrimaryColor}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "3rem",
                color: effectivePrimaryColor,
                opacity: 0.3,
              }}
            >
              🏠
            </div>
          )}

          {/* Favorite Button */}
          <div
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              width: 44,
              height: 44,
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(10px)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 20px rgba(0, 0, 0, 0.1)",
              cursor: "pointer",
              zIndex: 10,
            }}
            onClick={handleFavoriteClick}
          >
            <span
              style={{
                fontSize: "1.25rem",
                color: isFavorited ? effectiveAccentColor : "#6b7280",
              }}
            >
              {isFavorited ? "♥" : "♡"}
            </span>
          </div>

          {/* Property Type Badge */}
          <div
            style={{
              position: "absolute",
              top: 20,
              left: 20,
              padding: "0.5rem 1rem",
              backgroundColor: effectiveSecondaryColor,
              color: "white",
              borderRadius: 9999,
              fontSize: "0.875rem",
              fontWeight: 600,
              textTransform: "capitalize",
              zIndex: 10,
            }}
          >
            {property.type.toLowerCase().replace("_", " ")}
          </div>

          {/* Rating Badge */}
          {property.averageRating && property.averageRating > 0 && (
            <div
              style={{
                position: "absolute",
                bottom: 20,
                left: 20,
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(10px)",
                borderRadius: 9999,
                padding: "0.5rem 1rem",
                zIndex: 10,
              }}
            >
              <span style={{ color: effectiveAccentColor, fontSize: "1rem" }}>
                ★
              </span>
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: effectiveSecondaryColor,
                }}
              >
                {property.averageRating.toFixed(1)}
              </span>
            </div>
          )}

          {/* Image Counter Badge */}
          {property.images && property.images.length > 1 && (
            <div
              style={{
                position: "absolute",
                bottom: 20,
                right: 20,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                backdropFilter: "blur(10px)",
                borderRadius: 8,
                padding: "0.5rem 0.75rem",
                zIndex: 10,
              }}
            >
              <span style={{ color: "white", fontSize: "0.875rem" }}>📸</span>
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "white",
                }}
              >
                {property.images.length}
              </span>
            </div>
          )}
        </div>

        {/* Property Details */}
        <div style={{ padding: "2rem" }}>
          <h3
            style={{
              fontSize: "1.375rem",
              fontWeight: 700,
              color: effectiveSecondaryColor,
              marginBottom: "0.75rem",
              margin: "0 0 0.75rem 0",
            }}
          >
            {property.title}
          </h3>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              color: `${effectiveSecondaryColor}99`,
              marginBottom: "1.5rem",
              fontSize: "0.875rem",
              lineHeight: 1.5,
            }}
          >
            <span
              style={{
                marginRight: "0.5rem",
                fontSize: "1rem",
                flexShrink: 0,
                marginTop: "0.125rem",
              }}
            >
              📍
            </span>
            <span>
              {[
                property.address,
                property.city,
                property.state,
                property.country,
              ]
                .filter(Boolean)
                .join(", ")}
            </span>
          </div>

          {/* Amenities */}
          <div
            style={{
              display: "flex",
              gap: "1.5rem",
              marginBottom: "1.5rem",
              paddingBottom: "1.5rem",
              borderBottom: `1px solid ${effectivePrimaryColor}20`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "0.875rem",
                color: `${effectiveSecondaryColor}99`,
                fontWeight: 500,
              }}
            >
              🛏️ {property.bedrooms} Beds
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "0.875rem",
                color: `${effectiveSecondaryColor}99`,
                fontWeight: 500,
              }}
            >
              🚿 {property.bathrooms} Baths
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "0.875rem",
                color: `${effectiveSecondaryColor}99`,
                fontWeight: 500,
              }}
            >
              👥 {property.maxGuests} Guests
            </div>
          </div>

          {/* Price */}
          <div
            style={{
              marginBottom: "1.5rem",
            }}
          >
            <span
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: effectiveSecondaryColor,
              }}
            >
              {formatPrice(property.pricePerNight, property.currency)}
            </span>
            <span
              style={{
                color: `${effectiveSecondaryColor}99`,
                fontSize: "1rem",
                marginLeft: "0.25rem",
              }}
            >
              /night
            </span>

            {/* Optional Fees Display */}
            {(property.serviceFee ||
              property.cleaningFee ||
              property.securityDeposit) && (
              <div
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.75rem",
                  color: `${effectiveSecondaryColor}99`,
                }}
              >
                {property.serviceFee && (
                  <div>
                    + {formatPrice(property.serviceFee, property.currency)}{" "}
                    service fee
                  </div>
                )}
                {property.cleaningFee && (
                  <div>
                    + {formatPrice(property.cleaningFee, property.currency)}{" "}
                    cleaning fee
                  </div>
                )}
                {property.securityDeposit && (
                  <div>
                    + {formatPrice(property.securityDeposit, property.currency)}{" "}
                    security deposit
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Book Now Button */}
          <button
            style={{
              width: "100%",
              padding: "1rem 1.5rem",
              borderRadius: 12,
              fontWeight: 600,
              color: "white",
              border: "none",
              backgroundColor: effectiveAccentColor,
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(0, 0, 0, 0.1)",
              fontSize: "1rem",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 12px 30px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.1)";
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `/browse/${property.id}`;
            }}
          >
            Book Now
          </button>
        </div>
      </div>
    </Link>
  );
};
