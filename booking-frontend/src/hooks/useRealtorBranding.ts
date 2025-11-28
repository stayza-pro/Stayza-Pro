import { useState, useEffect } from "react";
import { apiClient } from "@/services/api";
import { useCurrentUser } from "./useCurrentUser";
import { getRealtorSubdomain } from "@/utils/subdomain";

interface RealtorBranding {
  businessName: string;
  tagline?: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  description?: string;
}

interface APIRealtorBranding {
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
}

/**
 * Custom hook to fetch fresh realtor branding data
 * Falls back to localStorage data if API call fails
 */
export function useRealtorBranding() {
  const { user } = useCurrentUser();
  const [realtorBranding, setRealtorBranding] =
    useState<RealtorBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRealtorBranding = async () => {
      // Only run on client side to avoid hydration issues
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }

      // Try to get subdomain first (same as guest-landing page)
      const subdomain = getRealtorSubdomain();
      console.log("🔍 useRealtorBranding: subdomain =", subdomain);

      if (subdomain) {
        try {
          console.log(
            "🌐 Fetching branding via subdomain:",
            `/branding/subdomain/${subdomain}`
          );
          // Use the same endpoint as guest-landing page
          const response = await apiClient.get<APIRealtorBranding>(
            `/branding/subdomain/${subdomain}`
          );

          console.log("✅ Subdomain API response:", response.data);
          if (response.data) {
            const newBranding = {
              businessName: response.data.businessName,
              tagline: response.data.tagline,
              primaryColor: response.data.colors.primary,
              secondaryColor: response.data.colors.secondary,
              accentColor: response.data.colors.accent,
              logoUrl: response.data.logo,
              description: response.data.description,
            };
            console.log("🎨 Setting branding:", newBranding);
            setRealtorBranding(newBranding);
          }
        } catch (error) {
          console.error(
            "Failed to fetch realtor branding via subdomain:",
            error
          );
          // Try fallback method using referredByRealtorId
          await tryFetchByRealtorId();
        } finally {
          setIsLoading(false);
        }
      } else {
        // No subdomain, try using referredByRealtorId
        await tryFetchByRealtorId();
      }
    };

    const tryFetchByRealtorId = async () => {
      // Skip the API call and go directly to localStorage fallback for now
      // since we don't have a proper realtorId-based endpoint that returns color data
      console.log("� Skipping realtorId API call, using localStorage fallback");

      if (user?.referredByRealtor) {
        console.log("💾 Using localStorage fallback:", user.referredByRealtor);
        setRealtorBranding({
          businessName: user.referredByRealtor.businessName,
          tagline: user.referredByRealtor.tagline,
          primaryColor: user.referredByRealtor.primaryColor,
          secondaryColor: user.referredByRealtor.secondaryColor,
          accentColor: user.referredByRealtor.accentColor,
          logoUrl: user.referredByRealtor.logoUrl,
          description: user.referredByRealtor.description,
        });
      }
      setIsLoading(false);
    };

    // Only fetch if we have user data or if we're on the client
    if (typeof window !== "undefined") {
      fetchRealtorBranding(); // Always fetch, don't wait for user
    }
  }, [user]);

  // Helper function to get brand color with fallback
  const getBrandColor = () => {
    return (
      realtorBranding?.primaryColor ||
      user?.referredByRealtor?.primaryColor ||
      "#000000"
    );
  };

  // Helper function to get realtor name with fallback
  const getRealtorName = () => {
    return (
      realtorBranding?.businessName ||
      user?.referredByRealtor?.businessName ||
      "Stayza"
    );
  };

  // Helper function to get logo URL with fallback
  const getLogoUrl = () => {
    return realtorBranding?.logoUrl || user?.referredByRealtor?.logoUrl;
  };

  // Helper function to get tagline with fallback
  const getTagline = () => {
    return (
      realtorBranding?.tagline ||
      user?.referredByRealtor?.tagline ||
      "Premium short-let properties"
    );
  };

  // Helper function to get description with fallback
  const getDescription = () => {
    return (
      realtorBranding?.description || user?.referredByRealtor?.description || ""
    );
  };

  // Helper function to get secondary color with fallback
  const getSecondaryColor = () => {
    return (
      realtorBranding?.secondaryColor ||
      user?.referredByRealtor?.secondaryColor ||
      "#059669" // Default green
    );
  };

  // Helper function to get accent color with fallback
  const getAccentColor = () => {
    return (
      realtorBranding?.accentColor ||
      user?.referredByRealtor?.accentColor ||
      "#D97706" // Default orange
    );
  };

  const result = {
    realtorBranding,
    isLoading,
    brandColor: getBrandColor(),
    secondaryColor: getSecondaryColor(),
    accentColor: getAccentColor(),
    realtorName: getRealtorName(),
    logoUrl: getLogoUrl(),
    tagline: getTagline(),
    description: getDescription(),
  };

  // Debug logging
  if (!isLoading) {
    console.log("🎨 useRealtorBranding result:", {
      brandColor: result.brandColor,
      secondaryColor: result.secondaryColor,
      accentColor: result.accentColor,
      realtorBranding: realtorBranding,
      userRealtor: user?.referredByRealtor,
      userRealtorColors: {
        primary: user?.referredByRealtor?.primaryColor,
        secondary: user?.referredByRealtor?.secondaryColor,
        accent: user?.referredByRealtor?.accentColor,
      },
    });
  }

  return result;
}
