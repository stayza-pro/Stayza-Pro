import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { brandingService, RealtorBranding } from "../services/branding";

export const useBranding = () => {
  const { user } = useAuthStore();
  const [branding, setBranding] = useState<RealtorBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBranding = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        if (user.role === "REALTOR") {
          // Fetch realtor-specific branding
          const realtorBranding = await brandingService.getRealtorBranding();
          setBranding(realtorBranding);
        } else {
          // Use default branding for non-realtors
          const defaultBranding = brandingService.getDefaultBranding(
            user.role,
            user.firstName
          );
          setBranding(defaultBranding);
        }
      } catch (err) {
        console.error("Failed to fetch branding:", err);
        setError("Failed to load branding");

        // Fallback to default branding
        const fallbackBranding = brandingService.getDefaultBranding(
          user.role,
          user.firstName
        );
        setBranding(fallbackBranding);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranding();
  }, [user]);

  const refetch = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      if (user.role === "REALTOR") {
        const realtorBranding = await brandingService.getRealtorBranding();
        setBranding(realtorBranding);
      } else {
        const defaultBranding = brandingService.getDefaultBranding(
          user.role,
          user.firstName
        );
        setBranding(defaultBranding);
      }
    } catch (err) {
      console.error("Failed to fetch branding:", err);
      setError("Failed to load branding");

      const fallbackBranding = brandingService.getDefaultBranding(
        user.role,
        user.firstName
      );
      setBranding(fallbackBranding);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    branding,
    isLoading,
    error,
    refetch,
  };
};
