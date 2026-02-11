"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/services/api";
import { Property } from "@/types";

interface DynamicPropertiesSectionProps {
  primaryColor: string; // 60% - Main backgrounds and dominant elements
  secondaryColor: string; // 30% - Text, borders, and secondary elements
  accentColor: string; // 10% - CTAs, buttons, highlights
  realtorId: string;
}

// Helper function to get image URL
const getImageUrl = (
  image: string | { url?: string | null } | null | undefined
): string => {
  if (typeof image === "string") {
    return image;
  }
  return image?.url || "";
};

const toPropertyArray = (payload: unknown): Property[] => {
  if (Array.isArray(payload)) {
    return payload as Property[];
  }

  if (payload && typeof payload === "object") {
    const typedPayload = payload as {
      properties?: Property[];
      data?: Property[];
    };

    if (Array.isArray(typedPayload.properties)) {
      return typedPayload.properties;
    }

    if (Array.isArray(typedPayload.data)) {
      return typedPayload.data;
    }
  }

  return [];
};

export const DynamicPropertiesSection: React.FC<
  DynamicPropertiesSectionProps
> = ({ primaryColor, secondaryColor, accentColor, realtorId }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filterError, setFilterError] = useState("");
  const [searchFilters, setSearchFilters] = useState({
    location: "",
    checkIn: "",
    checkOut: "",
  });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await apiClient.get<Property[]>(
          `/properties/host/${realtorId}`
        );

        // Filter only ACTIVE properties
        const activeProperties = toPropertyArray(response.data).filter(
          (p: Property) => p.status === "ACTIVE"
        );

        setProperties(activeProperties);
        setFilteredProperties(activeProperties);
      } catch (error) {
        setProperties([]);
        setFilteredProperties([]);
      } finally {
        setLoading(false);
      }
    };

    if (realtorId) {
      fetchProperties();
    }
  }, [realtorId]);

  // Listen for search events from hero section
  useEffect(() => {
    const handleSearch = (event: Event) => {
      const customEvent = event as CustomEvent<{
        location?: string;
        checkIn?: string;
        checkOut?: string;
      }>;
      const { location, checkIn, checkOut } = customEvent.detail || {};
      setSearchFilters({
        location: location || "",
        checkIn: checkIn || "",
        checkOut: checkOut || "",
      });
    };

    window.addEventListener("propertySearch", handleSearch);
    return () => window.removeEventListener("propertySearch", handleSearch);
  }, []);

  const hasActiveFilters = Boolean(
    searchFilters.location || searchFilters.checkIn || searchFilters.checkOut
  );

  // Fetch filtered properties from backend whenever search filters change.
  useEffect(() => {
    if (!realtorId) {
      return;
    }

    if (!hasActiveFilters) {
      setFilteredProperties(properties);
      setFilterError("");
      return;
    }

    let isStale = false;

    const fetchFilteredProperties = async () => {
      setIsFiltering(true);
      setFilterError("");

      try {
        const params = new URLSearchParams();
        params.append("limit", "100");
        if (searchFilters.location) {
          params.append("location", searchFilters.location);
        }
        if (searchFilters.checkIn) {
          params.append("checkIn", searchFilters.checkIn);
        }
        if (searchFilters.checkOut) {
          params.append("checkOut", searchFilters.checkOut);
        }

        const response = await apiClient.get<Property[]>(
          `/properties/host/${realtorId}?${params.toString()}`
        );

        if (isStale) {
          return;
        }

        const activeProperties = toPropertyArray(response.data).filter(
          (property) => property.status === "ACTIVE"
        );
        setFilteredProperties(activeProperties);
      } catch (error) {
        if (isStale) {
          return;
        }

        setFilterError(
          "We could not apply all filters right now. Showing locally filtered results."
        );

        const searchTerm = searchFilters.location.toLowerCase();
        const localFallback = properties.filter((property) => {
          if (!searchTerm) {
            return true;
          }

          return (
            property.title.toLowerCase().includes(searchTerm) ||
            property.address?.toLowerCase().includes(searchTerm) ||
            property.city?.toLowerCase().includes(searchTerm) ||
            property.state?.toLowerCase().includes(searchTerm) ||
            property.country?.toLowerCase().includes(searchTerm)
          );
        });
        setFilteredProperties(localFallback);
      } finally {
        if (!isStale) {
          setIsFiltering(false);
        }
      }
    };

    fetchFilteredProperties();

    return () => {
      isStale = true;
    };
  }, [hasActiveFilters, properties, realtorId, searchFilters]);

  // Currency formatter
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <section
        style={{
          padding: "6rem 3rem",
          background: `${primaryColor}08`, // 60% - Primary color with very light opacity for main background
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "1rem 2rem",
              borderRadius: 16,
              backgroundColor: `${primaryColor}15`,
              color: primaryColor,
              fontSize: "1.125rem",
              fontWeight: 600,
            }}
          >
            Loading properties...
          </div>
        </div>
      </section>
    );
  }

  if (properties.length === 0) {
    return (
      <section
        id="properties"
        style={{
          padding: "6rem 3rem",
          background: `${primaryColor}08`, // 60% - Primary color background
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "0.5rem 1rem",
              borderRadius: 9999,
              fontSize: "0.875rem",
              fontWeight: 500,
              marginBottom: "1.5rem",
              backgroundColor: `${primaryColor}15`,
              color: primaryColor,
            }}
          >
            Featured Properties
          </div>
          <h2
            style={{
              fontSize: "3.5rem",
              fontWeight: 700,
              color: secondaryColor, // 30% - Secondary color for text
              marginBottom: "1.5rem",
              margin: "0 0 1.5rem 0",
            }}
          >
            Our Properties
          </h2>
          <p
            style={{
              fontSize: "1.25rem",
              color: `${secondaryColor}99`, // 30% - Secondary color for descriptive text
              maxWidth: "768px",
              margin: "0 auto 3rem",
            }}
          >
            No properties available at the moment. Check back soon!
          </p>
        </div>
      </section>
    );
  }

  const displayProperties = hasActiveFilters ? filteredProperties : properties;

  return (
    <section
      id="properties"
      style={{
        padding: "6rem 3rem",
        background: `${primaryColor}08`, // 60% - Primary color background
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <div
            style={{
              display: "inline-block",
              padding: "0.5rem 1rem",
              borderRadius: 9999,
              fontSize: "0.875rem",
              fontWeight: 500,
              marginBottom: "1.5rem",
              backgroundColor: `${primaryColor}15`,
              color: primaryColor,
            }}
          >
            Featured Properties
          </div>
          <h2
            style={{
              fontSize: "3.5rem",
              fontWeight: 700,
              color: secondaryColor, // 30% - Secondary color for headings
              marginBottom: "1.5rem",
              margin: "0 0 1.5rem 0",
            }}
          >
            Our Properties
          </h2>
          <p
            style={{
              fontSize: "1.25rem",
              color: `${secondaryColor}99`, // 30% - Secondary color for text
              maxWidth: "768px",
              margin: "0 auto",
            }}
          >
            {hasActiveFilters && filteredProperties.length === 0
              ? "No properties match your search. Try different criteria."
              : hasActiveFilters
              ? `Found ${displayProperties.length} ${
                  displayProperties.length === 1 ? "property" : "properties"
                } matching your search`
              : `Explore our curated collection of ${
                  properties.length
                } premium ${
                  properties.length === 1 ? "property" : "properties"
                }`}
          </p>

          {isFiltering && (
            <p style={{ marginTop: "0.75rem", color: `${secondaryColor}99` }}>
              Applying availability filters...
            </p>
          )}

          {!isFiltering && filterError && (
            <p style={{ marginTop: "0.75rem", color: "#B45309" }}>
              {filterError}
            </p>
          )}

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1.5rem",
                backgroundColor: "transparent",
                color: secondaryColor, // 30% - Secondary color for border button
                border: `2px solid ${secondaryColor}`,
                borderRadius: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
              onClick={() =>
                setSearchFilters({ location: "", checkIn: "", checkOut: "" })
              }
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Show message if no results after filtering */}
        {hasActiveFilters && filteredProperties.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 0" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔍</div>
            <h3
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                color: secondaryColor, // 30% - Secondary color for text
                marginBottom: "0.5rem",
              }}
            >
              No properties found
            </h3>
            <p style={{ color: `${secondaryColor}99`, marginBottom: "2rem" }}>
              Try adjusting your search criteria
            </p>
          </div>
        ) : (
          <div>
            {/* Properties Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                gap: "2.5rem",
                marginBottom: "4rem",
              }}
            >
              {displayProperties.slice(0, 6).map((property) => (
                <div
                  key={property.id}
                  className="group"
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
                    e.currentTarget.style.boxShadow =
                      "0 30px 60px rgba(0, 0, 0, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 20px 40px rgba(0, 0, 0, 0.1)";
                  }}
                  onClick={() =>
                    (window.location.href = `/browse/${property.id}`)
                  }
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
                    {property.images && property.images.length > 0 ? (
                      <>
                        <img
                          src={getImageUrl(property.images[0])}
                          alt={property.title}
                          className="group-hover:scale-110"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                            transition: "transform 0.5s ease",
                            backgroundColor: "#e5e7eb",
                          }}
                          onLoad={(e) => {
                            
                            const target = e.target as HTMLImageElement;
                            target.style.backgroundColor = "transparent";
                          }}
                          onError={(e) => {
                            
                            // Fallback if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            if (target.parentElement) {
                              const fallbackDiv = document.createElement("div");
                              fallbackDiv.style.cssText = `
                            width: 100%;
                            height: 100%;
                            background: ${primaryColor}30;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 3rem;
                            color: ${primaryColor};
                            opacity: 0.3;
                          `;
                              fallbackDiv.textContent = "🏠";
                              target.parentElement.appendChild(fallbackDiv);
                            }
                          }}
                        />
                      </>
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: `${primaryColor}30`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "3rem",
                          color: primaryColor,
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
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add to favorites logic
                      }}
                    >
                      <span style={{ fontSize: "1.25rem", color: "#6b7280" }}>
                        ♡
                      </span>
                    </div>

                    {/* Property Type Badge */}
                    <div
                      style={{
                        position: "absolute",
                        top: 20,
                        left: 20,
                        padding: "0.5rem 1rem",
                        backgroundColor: secondaryColor, // 30% - Secondary color for badges
                        color: "white",
                        borderRadius: 9999,
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        zIndex: 10,
                      }}
                    >
                      {property.type || "Property"}
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
                        <span style={{ color: accentColor, fontSize: "1rem" }}>
                          ★
                        </span>
                        <span
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: secondaryColor, // 30% - Secondary color for text
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
                        <span style={{ color: "white", fontSize: "0.875rem" }}>
                          📸
                        </span>
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

                    {(!property.images || property.images.length === 0) && (
                      <div
                        style={{ fontSize: "5rem", color: `${primaryColor}40` }}
                      >
                        🏠
                      </div>
                    )}
                  </div>

                  {/* Property Details */}
                  <div style={{ padding: "2rem" }}>
                    <h3
                      style={{
                        fontSize: "1.375rem",
                        fontWeight: 700,
                        color: secondaryColor, // 30% - Secondary color for headings
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
                        color: `${secondaryColor}99`, // 30% - Secondary color for descriptive text
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
                        borderBottom: `1px solid ${primaryColor}20`, // 60% - Primary color for subtle borders
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          fontSize: "0.875rem",
                          color: `${secondaryColor}99`, // 30% - Secondary color for amenity text
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
                          color: `${secondaryColor}99`, // 30% - Secondary color for amenity text
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
                          color: `${secondaryColor}99`, // 30% - Secondary color for amenity text
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
                          color: secondaryColor, // 30% - Secondary color for price
                        }}
                      >
                        {formatPrice(property.pricePerNight)}
                      </span>
                      <span
                        style={{
                          color: `${secondaryColor}99`,
                          fontSize: "1rem",
                          marginLeft: "0.25rem",
                        }}
                      >
                        /night
                      </span>
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
                        backgroundColor: accentColor, // 10% - Accent color for CTA buttons
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
                        e.currentTarget.style.boxShadow =
                          "0 8px 20px rgba(0, 0, 0, 0.1)";
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/browse/${property.id}`;
                      }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* View All Button */}
            {displayProperties.length > 6 && (
              <div style={{ textAlign: "center" }}>
                <button
                  style={{
                    padding: "1.25rem 2.5rem",
                    borderRadius: 16,
                    fontWeight: 600,
                    color: "white",
                    border: "none",
                    backgroundColor: primaryColor, // 60% - Primary color for main action button
                    fontSize: "1.125rem",
                    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
                    cursor: "pointer",
                  }}
                  onClick={() => (window.location.href = "/properties")}
                >
                  View All {displayProperties.length} Properties
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
