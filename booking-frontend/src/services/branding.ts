import { apiClient } from "./api";

export interface RealtorBranding {
  businessName: string;
  tagline?: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  websiteUrl?: string;

  // Additional properties expected by components
  logo?: string;
  colors?: {
    primary: string;
    secondary: string;
    accent?: string;
  };
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
        tagline: realtor.tagline,
        primaryColor: realtor.primaryColor || "#0066CC",
        secondaryColor: realtor.secondaryColor || "#10B981",
        accentColor: realtor.accentColor || "#F59E0B",
        logoUrl: realtor.logoUrl,
        websiteUrl: realtor.websiteUrl,

        // Additional properties for component compatibility
        logo: realtor.logoUrl,
        colors: {
          primary: realtor.primaryColor || "#0066CC",
          secondary: realtor.secondaryColor || "#10B981",
          accent: realtor.accentColor || "#F59E0B",
        },
      };
    } catch (error) {
      
      // Return fallback branding instead of throwing
      return {
        businessName: "My Business",
        primaryColor: "#0066CC",
        secondaryColor: "#10B981",
        accentColor: "#F59E0B",

        // Additional properties for component compatibility
        colors: {
          primary: "#0066CC",
          secondary: "#10B981",
          accent: "#F59E0B",
        },
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
          logo: "/admin-logo.png",
          colors: {
            primary: "#7C3AED",
            secondary: "#A855F7",
          },
        };
      case "GUEST":
        return {
          businessName: "My Bookings",
          primaryColor: "#059669",
          secondaryColor: "#10B981",
          colors: {
            primary: "#059669",
            secondary: "#10B981",
          },
        };
      default:
        return {
          businessName: userName ? `${userName}'s Dashboard` : "Dashboard",
          primaryColor: "#0066CC",
          secondaryColor: "#10B981",
          colors: {
            primary: "#0066CC",
            secondary: "#10B981",
          },
        };
    }
  },

  // Get branding by subdomain
  getBrandingBySubdomain: async (
    subdomain: string
  ): Promise<RealtorBranding> => {
    try {
      const response = await apiClient.get<RealtorProfile>(
        `/branding/subdomain/${subdomain}`
      );

      const realtor = response.data;

      return {
        businessName: realtor.businessName || "My Business",
        tagline: realtor.tagline,
        primaryColor: realtor.primaryColor || "#0066CC",
        secondaryColor: realtor.secondaryColor || "#10B981",
        accentColor: realtor.accentColor || "#F59E0B",
        logoUrl: realtor.logoUrl,
        websiteUrl: realtor.websiteUrl,
        logo: realtor.logoUrl,
        colors: {
          primary: realtor.primaryColor || "#0066CC",
          secondary: realtor.secondaryColor || "#10B981",
          accent: realtor.accentColor || "#F59E0B",
        },
      };
    } catch (error) {
      
      throw error;
    }
  },

  // Get current realtor's branding
  getMyBranding: async (): Promise<RealtorBranding> => {
    try {
      const response = await apiClient.get<RealtorProfile>("/branding/me");
      const realtor = response.data;

      return {
        businessName: realtor.businessName || "My Business",
        tagline: realtor.tagline,
        primaryColor: realtor.primaryColor || "#0066CC",
        secondaryColor: realtor.secondaryColor || "#10B981",
        accentColor: realtor.accentColor || "#F59E0B",
        logoUrl: realtor.logoUrl,
        websiteUrl: realtor.websiteUrl,
        logo: realtor.logoUrl,
        colors: {
          primary: realtor.primaryColor || "#0066CC",
          secondary: realtor.secondaryColor || "#10B981",
          accent: realtor.accentColor || "#F59E0B",
        },
      };
    } catch (error) {
      
      throw error;
    }
  },

  // Update realtor branding
  updateBranding: async (
    branding: Partial<RealtorBranding>
  ): Promise<RealtorBranding> => {
    try {
      const payload = {
        businessName: branding.businessName,
        tagline: branding.tagline,
        primaryColor: branding.primaryColor || branding.colors?.primary,
        secondaryColor: branding.secondaryColor || branding.colors?.secondary,
        accentColor: branding.accentColor || branding.colors?.accent,
        logoUrl: branding.logoUrl || branding.logo,
        websiteUrl: branding.websiteUrl,
      };

      const response = await apiClient.put<RealtorProfile>(
        "/branding/me",
        payload
      );
      const realtor = response.data;

      return {
        businessName: realtor.businessName || "My Business",
        tagline: realtor.tagline,
        primaryColor: realtor.primaryColor || "#0066CC",
        secondaryColor: realtor.secondaryColor || "#10B981",
        accentColor: realtor.accentColor || "#F59E0B",
        logoUrl: realtor.logoUrl,
        websiteUrl: realtor.websiteUrl,
        logo: realtor.logoUrl,
        colors: {
          primary: realtor.primaryColor || "#0066CC",
          secondary: realtor.secondaryColor || "#10B981",
          accent: realtor.accentColor || "#F59E0B",
        },
      };
    } catch (error) {
      
      throw error;
    }
  },
};
