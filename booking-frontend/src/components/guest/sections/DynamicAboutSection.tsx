"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/services/api";

interface DynamicAboutSectionProps {
  agencyName: string;
  primaryColor: string; // 60% - Main backgrounds and dominant elements
  secondaryColor: string; // 30% - Text, borders, and secondary elements
  accentColor: string; // 10% - CTAs, buttons, highlights
  realtorId: string;
  description?: string;
  tagline?: string;
  stats?: {
    totalProperties: number;
    totalGuests: number;
    totalReviews: number;
    averageRating: number;
  };
}

interface Stats {
  propertiesCount: number;
  averageRating: number;
  totalReviews: number;
}

const toPropertyArray = (payload: unknown): any[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const typedPayload = payload as { properties?: any[]; data?: any[] };
    if (Array.isArray(typedPayload.properties)) {
      return typedPayload.properties;
    }
    if (Array.isArray(typedPayload.data)) {
      return typedPayload.data;
    }
  }

  return [];
};

export const DynamicAboutSection: React.FC<DynamicAboutSectionProps> = ({
  agencyName,
  primaryColor,
  secondaryColor,
  accentColor,
  realtorId,
  description,
  tagline,
  stats: propStats,
}) => {
  const [stats, setStats] = useState<Stats>({
    propertiesCount: propStats?.totalProperties || 0,
    averageRating: propStats?.averageRating || 0,
    totalReviews: propStats?.totalReviews || 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If stats are provided in props, use them
    if (propStats) {
      setStats({
        propertiesCount: propStats.totalProperties,
        averageRating: propStats.averageRating,
        totalReviews: propStats.totalReviews,
      });
      setLoading(false);
      return;
    }

    // Otherwise fetch from API (fallback)
    const fetchStats = async () => {
      try {
        const response = await apiClient.get<any[]>(
          `/properties/host/${realtorId}`
        );
        const properties = toPropertyArray(response.data);
        const activeProperties = properties.filter(
          (p: any) => p.status === "ACTIVE"
        );

        // Calculate total reviews and average rating
        const totalReviews = activeProperties.reduce(
          (sum: number, p: any) => sum + (p.reviewCount || 0),
          0
        );
        const ratingsSum = activeProperties.reduce(
          (sum: number, p: any) => sum + (p.averageRating || 0),
          0
        );
        const avgRating =
          activeProperties.length > 0
            ? ratingsSum / activeProperties.length
            : 0;

        setStats({
          propertiesCount: activeProperties.length,
          averageRating: avgRating,
          totalReviews,
        });
      } catch (error) {
        
      } finally {
        setLoading(false);
      }
    };

    if (realtorId) {
      fetchStats();
    }
  }, [realtorId, propStats]);

  const features = [
    "✅ Professional Management",
    "✅ Hand-picked Properties",
    "✅ Seamless Booking",
    "✅ Local Expertise",
  ];

  const dynamicStats = [
    { number: `${stats.propertiesCount}+`, label: "Properties" },
    { number: `${stats.totalReviews}`, label: "Happy Guests" },
    {
      number: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "0",
      label: "Rating",
    },
    { number: "5+", label: "Years Experience" },
  ];

  return (
    <section
      style={{
        padding: "clamp(3rem, 6vw, 6rem) clamp(1rem, 4vw, 3rem)",
        background: `linear-gradient(135deg, ${primaryColor}05, ${primaryColor}08, ${primaryColor}05)`, // 60% - Primary color gradient background
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Section Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "clamp(2.5rem, 5vw, 4rem)",
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
              backgroundColor: `${primaryColor}15`, // 60% - Primary color for badge
              color: primaryColor,
            }}
          >
            About Us
          </div>
          <h2
            style={{
              fontSize: "clamp(2rem, 6vw, 3.5rem)",
              fontWeight: 700,
              color: secondaryColor, // 30% - Secondary color for headings
              marginBottom: "1rem",
              margin: "0 0 1rem 0",
            }}
          >
            Why Choose {agencyName}
          </h2>
          <p
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
              color: `${secondaryColor}CC`, // 30% - Secondary color for text with opacity
              maxWidth: "768px",
              margin: "0 auto",
              lineHeight: 1.6,
              fontStyle: "italic",
            }}
          >
            {tagline && tagline.trim() !== ""
              ? tagline
              : "Premium short-let properties"}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
            gap: "clamp(2rem, 5vw, 5rem)",
            alignItems: "center",
          }}
        >
          {/* Left Content */}
          <div>
            <h3
              style={{
                fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
                fontWeight: 700,
                color: secondaryColor, // 30% - Secondary color for headings
                marginBottom: "1.5rem",
                margin: "0 0 1.5rem 0",
                lineHeight: 1.2,
              }}
            >
              Experience Exceptional Hospitality
            </h3>
            <p
              style={{
                fontSize: "clamp(1rem, 2.5vw, 1.125rem)",
                color: `${secondaryColor}99`, // 30% - Secondary color for body text
                lineHeight: 1.8,
                marginBottom: "2.5rem",
              }}
            >
              {description ||
                "We are dedicated to providing exceptional short-let experiences with carefully curated properties and personalized service. Every stay is designed to exceed your expectations and create lasting memories."}
            </p>

            {/* Features List */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
                gap: "clamp(0.75rem, 2.5vw, 1.5rem)",
                marginBottom: "3rem",
              }}
            >
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "1rem",
                    backgroundColor: `${primaryColor}10`, // 60% - Primary color for feature backgrounds
                    borderRadius: 12,
                    color: secondaryColor, // 30% - Secondary color for text
                    fontSize: "1rem",
                    fontWeight: 500,
                  }}
                >
                  <span style={{ color: accentColor, fontSize: "1.125rem" }}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* Call to Action */}
            <button
              style={{
                padding: "1rem clamp(1.5rem, 4vw, 2.5rem)",
                borderRadius: 16,
                fontWeight: 600,
                color: "white",
                border: "none",
                backgroundColor: accentColor, // 10% - Accent color for CTA button
                fontSize: "clamp(1rem, 2.5vw, 1.125rem)",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
                cursor: "pointer",
                transition: "all 0.3s ease",
                width: "100%",
                maxWidth: "22rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 25px 50px rgba(0, 0, 0, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 20px 40px rgba(0, 0, 0, 0.1)";
              }}
              onClick={() => {
                const propertiesSection = document.getElementById("properties");
                if (propertiesSection) {
                  propertiesSection.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              Explore Properties →
            </button>
          </div>

          {/* Right Content - Stats */}
          <div>
            <div
              style={{
                background: `linear-gradient(135deg, ${primaryColor}10, ${primaryColor}15)`, // 60% - Primary color gradient
                borderRadius: 32,
                padding: "clamp(1.25rem, 4vw, 3rem)",
                border: `1px solid ${primaryColor}30`, // 60% - Primary color border
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Background decoration */}
              <div
                style={{
                  position: "absolute",
                  top: "-2rem",
                  right: "-2rem",
                  width: "8rem",
                  height: "8rem",
                  background: `${primaryColor}20`, // 60% - Primary color decoration
                  borderRadius: "50%",
                  filter: "blur(2rem)",
                }}
              />

              <div style={{ position: "relative", zIndex: 10 }}>
                <h3
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: secondaryColor, // 30% - Secondary color for heading
                    textAlign: "center",
                    marginBottom: "2rem",
                    margin: "0 0 2rem 0",
                  }}
                >
                  Our Achievements
                </h3>

                {loading ? (
                  <div style={{ textAlign: "center", padding: "2rem" }}>
                    <div
                      style={{
                        display: "inline-block",
                        width: "40px",
                        height: "40px",
                        border: "4px solid #f3f3f3",
                        borderTop: `4px solid ${accentColor}`, // 10% - Accent color for loading spinner
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(min(100%, 140px), 1fr))",
                      gap: "clamp(0.75rem, 2.5vw, 2rem)",
                    }}
                  >
                    {dynamicStats.map((stat, idx) => (
                      <div
                        key={idx}
                        style={{
                          textAlign: "center",
                          backgroundColor: "rgba(255, 255, 255, 0.6)",
                          backdropFilter: "blur(20px)",
                          border: `1px solid ${primaryColor}20`, // 60% - Primary color border
                          borderRadius: 20,
                          padding: "2rem 1rem",
                          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                            fontWeight: 700,
                            color: accentColor, // 10% - Accent color for stat numbers
                            marginBottom: "0.5rem",
                          }}
                        >
                          {stat.number}
                        </div>
                        <div
                          style={{
                            color: `${secondaryColor}99`, // 30% - Secondary color for labels
                            fontWeight: 500,
                            fontSize: "0.875rem",
                          }}
                        >
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
