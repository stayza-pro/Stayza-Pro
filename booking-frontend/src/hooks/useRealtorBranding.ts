import { useState, useEffect } from "react";
import { apiClient } from "@/services/api";
import { useCurrentUser } from "./useCurrentUser";
import { getRealtorSubdomain } from "@/utils/subdomain";

interface RealtorBranding {
  id?: string;
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

  const mapApiBranding = (data: APIRealtorBranding): RealtorBranding => ({
    id: data.id,
    businessName: data.businessName,
    tagline: data.tagline,
    primaryColor: data.colors.primary,
    secondaryColor: data.colors.secondary,
    accentColor: data.colors.accent,
    logoUrl: data.logo,
    description: data.description,
  });

  useEffect(() => {
    const fetchRealtorBranding = async () => {
      // Only run on client side to avoid hydration issues
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }

      // Try to get subdomain first (same as guest-landing page)
      const subdomain = getRealtorSubdomain();
      

      if (subdomain) {
        try {
          
          // Use the same endpoint as guest-landing page
          const response = await apiClient.get<APIRealtorBranding>(
            `/branding/subdomain/${subdomain}`
          );

          
          if (response.data) {
            setRealtorBranding(mapApiBranding(response.data));
          }
        } catch (error) {
          
          // Subdomain lookup failed; try authenticated or referral fallback
          await tryFetchByRealtorContext();
        } finally {
          setIsLoading(false);
        }
      } else {
        // No subdomain, try authenticated or referral fallback
        await tryFetchByRealtorContext();
      }
    };

    const tryFetchByRealtorContext = async () => {
      if (user?.role === "REALTOR") {
        try {
          const response = await apiClient.get<APIRealtorBranding>(
            "/branding/me"
          );
          if (response.data) {
            setRealtorBranding(mapApiBranding(response.data));
            setIsLoading(false);
            return;
          }
        } catch (error) {
          
        }
      }

      if (user?.referredByRealtor) {
        
        setRealtorBranding({
          id: user.referredByRealtor.id,
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
      "Stayza Pro"
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

  // Helper function to get realtor ID
  const getRealtorId = () => {
    return realtorBranding?.id || null;
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
    realtorId: getRealtorId(),
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
    
  }

  return result;
}
