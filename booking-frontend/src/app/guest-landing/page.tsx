"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRealtorSubdomain } from "@/utils/subdomain";
import { apiClient } from "@/services/api";
import { Loading } from "@/components/ui";
import {
  DynamicHeroSection,
  DynamicPropertiesSection,
  DynamicAboutSection,
  Footer,
} from "@/components/guest/sections";

interface RealtorBranding {
  id: string;
  userId: string;
  businessName: string;
  businessEmail: string;
  subdomain: string;
  logo?: string;
  tagline?: string;
  description?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  stats?: {
    totalProperties: number;
    totalGuests: number;
    totalReviews: number;
    averageRating: number;
  };
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export default function GuestLandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [realtorData, setRealtorData] = useState<RealtorBranding | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRealtorData = async () => {
      const subdomain = getRealtorSubdomain();

      // If no subdomain, redirect to main marketing site
      if (!subdomain) {
        router.push("/en");
        return;
      }

      try {
        setLoading(true);

        // Fetch realtor branding data by subdomain
        const response = await apiClient.get<RealtorBranding>(
          `/branding/subdomain/${subdomain}`
        );

        setRealtorData(response.data);
        setLoading(false);
      } catch (err: any) {
        console.error("Failed to load realtor branding:", err);
        setError("This realtor website could not be found.");
        setLoading(false);
      }
    };

    loadRealtorData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loading size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !realtorData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4">🏠</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Property Site Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "This realtor website could not be found."}
          </p>
          <button
            onClick={() => router.push("/en")}
            className="px-6 py-3 text-white font-medium rounded-lg hover:opacity-90 transition-colors"
            style={{
              backgroundColor: realtorData?.colors.primary || "#3B82F6",
            }}
          >
            Go to Main Site
          </button>
        </div>
      </div>
    );
  }

  // Extract colors and data
  const primaryColor = realtorData.colors.primary;
  const secondaryColor = realtorData.colors.secondary || "#10B981";
  const accentColor = realtorData.colors.accent || "#F59E0B";
  const agencyName = realtorData.businessName;
  const tagline =
    realtorData.tagline && realtorData.tagline.trim() !== ""
      ? realtorData.tagline
      : "Premium short-let properties";
  const logo =
    realtorData.logo && realtorData.logo.trim() !== ""
      ? realtorData.logo
      : undefined;

  return (
    <div
      style={{
        fontFamily:
          'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
        minHeight: "100vh",
        backgroundColor: "#FFF8F0", // Warm beige/off-white
      }}
    >
      {/* Hero Section */}
      <DynamicHeroSection
        agencyName={agencyName}
        tagline={tagline}
        primaryColor={primaryColor}
        logo={logo}
        realtorId={realtorData.id}
        description={realtorData.description}
        stats={realtorData.stats}
      />

      {/* Properties Section */}
      <div id="properties">
        <DynamicPropertiesSection
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          accentColor={accentColor}
          realtorId={realtorData.id}
        />
      </div>

      {/* About Section */}
      <div id="about">
        <DynamicAboutSection
          agencyName={agencyName}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          accentColor={accentColor}
          realtorId={realtorData.id}
          description={realtorData.description}
          tagline={tagline}
          stats={realtorData.stats}
        />
      </div>

      {/* Footer */}
      <Footer
        realtorName={agencyName}
        tagline={tagline}
        logo={logo}
        description={realtorData.description || ""}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        accentColor={accentColor}
      />
    </div>
  );
}
