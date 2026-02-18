import { useMemo } from "react";
import { useQuery } from "react-query";
import { useAuthStore } from "../store/authStore";
import { brandingService, RealtorBranding } from "../services/branding";

export const useBranding = () => {
  const { user } = useAuthStore();

  const fallbackBranding = useMemo(() => {
    if (!user) {
      return null;
    }

    return brandingService.getDefaultBranding(user.role, user.firstName);
  }, [user]);

  const query = useQuery<RealtorBranding | null>(
    ["branding", user?.id, user?.role],
    async () => {
      if (!user) {
        return null;
      }

      if (user.role === "REALTOR") {
        return brandingService.getRealtorBranding();
      }

      return brandingService.getDefaultBranding(user.role, user.firstName);
    },
    {
      enabled: !!user,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: true,
    }
  );

  return {
    branding: query.data || fallbackBranding,
    isLoading: query.isLoading,
    error: query.error ? "Failed to load branding" : null,
    refetch: query.refetch,
    refreshBranding: query.refetch,
  };
};
