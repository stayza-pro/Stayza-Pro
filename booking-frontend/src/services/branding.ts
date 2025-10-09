import { apiClient } from "./api";

export interface RealtorBranding {
  businessName: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  websiteUrl?: string;
}

export interface RealtorProfile {
  id: string;
  businessName: string;
  tagline?: string;
  description?: string;
  slug: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const brandingService = {
  // Get realtor branding data
  getRealtorBranding: async (): Promise<RealtorBranding> => {
    try {
      const response = await apiClient.get<RealtorProfile>("/realtors/profile");

      // Handle different possible response structures
      let realtor: RealtorProfile;

      if (response.data && "realtor" in response.data) {
        realtor = (response.data as any).realtor;
      } else if (response.data) {
        realtor = response.data;
      } else {
        throw new Error("No realtor data found in response");
      }

      return {
        businessName: realtor.businessName || "My Business",
        primaryColor: realtor.primaryColor || "#0066CC",
        secondaryColor: realtor.secondaryColor || "#10B981",
        accentColor: realtor.accentColor || "#F59E0B",
        logoUrl: realtor.logoUrl,
        websiteUrl: realtor.websiteUrl,
      };
    } catch (error) {
      console.error("Error fetching realtor branding:", error);
      // Return fallback branding instead of throwing
      return {
        businessName: "My Business",
        primaryColor: "#0066CC",
        secondaryColor: "#10B981",
        accentColor: "#F59E0B",
      };
    }
  },

  // Get default branding for non-realtors
  getDefaultBranding: (
    userRole: string,
    userName?: string
  ): RealtorBranding => {
    switch (userRole) {
      case "ADMIN":
        return {
          businessName: "Stayza Pro Admin",
          primaryColor: "#7C3AED",
          secondaryColor: "#A855F7",
          logoUrl: "/admin-logo.png",
        };
      case "GUEST":
        return {
          businessName: "My Bookings",
          primaryColor: "#059669",
          secondaryColor: "#10B981",
        };
      default:
        return {
          businessName: userName ? `${userName}'s Dashboard` : "Dashboard",
          primaryColor: "#0066CC",
          secondaryColor: "#10B981",
        };
    }
  },
};
