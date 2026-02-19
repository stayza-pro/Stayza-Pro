import { useEffect, useMemo, useState } from "react";
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

const fallbackBranding: RealtorBranding = {
  businessName: "Stayza Pro",
  tagline: "Premium short-let properties",
  primaryColor: "#1f2937",
  secondaryColor: "#059669",
  accentColor: "#D97706",
  logoUrl: "",
  description: "",
};

const BRANDING_CACHE_TTL_MS = 5 * 60 * 1000;
const RETRY_DELAYS_MS = [0, 1200, 3000];
const inMemoryBrandingCache = new Map<
  string,
  { data: RealtorBranding; cachedAt: number }
>();

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

const getFreshCachedBranding = (cacheKey: string) => {
  const cached = inMemoryBrandingCache.get(cacheKey);
  if (!cached) return null;
  return Date.now() - cached.cachedAt < BRANDING_CACHE_TTL_MS ? cached.data : null;
};

const setCachedBranding = (cacheKey: string, branding: RealtorBranding) => {
  inMemoryBrandingCache.set(cacheKey, {
    data: branding,
    cachedAt: Date.now(),
  });
};

const getStorageKey = (subdomain: string) => `realtor-branding:${subdomain}`;

const readLocalStorageBranding = (subdomain: string): RealtorBranding | null => {
  try {
    const cached = localStorage.getItem(getStorageKey(subdomain));
    if (!cached) return null;
    return JSON.parse(cached) as RealtorBranding;
  } catch {
    return null;
  }
};

const writeLocalStorageBranding = (subdomain: string, branding: RealtorBranding) => {
  try {
    localStorage.setItem(getStorageKey(subdomain), JSON.stringify(branding));
  } catch {
    // Best effort only.
  }
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const fetchWithRetry = async <T>(request: () => Promise<T>): Promise<T> => {
  let lastError: unknown;
  for (const delay of RETRY_DELAYS_MS) {
    if (delay > 0) {
      await sleep(delay);
    }
    try {
      return await request();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

export function useRealtorBranding() {
  const { user } = useCurrentUser();
  const [realtorBranding, setRealtorBranding] =
    useState<RealtorBranding>(fallbackBranding);
  const [isLoading, setIsLoading] = useState(true);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated || typeof window === "undefined") {
      return;
    }

    let cancelled = false;

    const hydrateBranding = async () => {
      const subdomain = getRealtorSubdomain();
      const subdomainCacheKey = subdomain ? `subdomain:${subdomain}` : null;
      const userCacheKey = user?.id ? `user:${user.id}` : null;

      const applyBranding = (branding: RealtorBranding, cacheKey?: string | null) => {
        if (cancelled) return;
        setRealtorBranding(branding);
        if (cacheKey) {
          setCachedBranding(cacheKey, branding);
        }
        if (subdomain) {
          writeLocalStorageBranding(subdomain, branding);
        }
      };

      let hasImmediateBranding = false;

      if (subdomain && subdomainCacheKey) {
        const memoryCached = getFreshCachedBranding(subdomainCacheKey);
        if (memoryCached) {
          applyBranding(memoryCached, subdomainCacheKey);
          hasImmediateBranding = true;
        } else {
          const localCached = readLocalStorageBranding(subdomain);
          if (localCached) {
            applyBranding(localCached, subdomainCacheKey);
            hasImmediateBranding = true;
          }
        }
      }

      if (!hasImmediateBranding && userCacheKey) {
        const userCached = getFreshCachedBranding(userCacheKey);
        if (userCached) {
          applyBranding(userCached, userCacheKey);
          hasImmediateBranding = true;
        }
      }

      if (hasImmediateBranding) {
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }

      try {
        if (subdomain) {
          const response = await fetchWithRetry(() =>
            apiClient.get<APIRealtorBranding>(`/branding/subdomain/${subdomain}`),
          );

          if (response.data) {
            const mapped = mapApiBranding(response.data);
            applyBranding(mapped, `subdomain:${subdomain}`);
            setIsLoading(false);
            return;
          }
        }

        if (user?.role === "REALTOR" && userCacheKey) {
          const response = await fetchWithRetry(() =>
            apiClient.get<APIRealtorBranding>("/branding/me"),
          );

          if (response.data) {
            const mapped = mapApiBranding(response.data);
            applyBranding(mapped, userCacheKey);
            setIsLoading(false);
            return;
          }
        }

        if (user?.referredByRealtor) {
          applyBranding(
            {
              id: user.referredByRealtor.id,
              businessName: user.referredByRealtor.businessName,
              tagline: user.referredByRealtor.tagline,
              primaryColor: user.referredByRealtor.primaryColor,
              secondaryColor: user.referredByRealtor.secondaryColor,
              accentColor: user.referredByRealtor.accentColor,
              logoUrl: user.referredByRealtor.logoUrl,
              description: user.referredByRealtor.description,
            },
            userCacheKey,
          );
        } else if (!hasImmediateBranding) {
          applyBranding(fallbackBranding, subdomainCacheKey || userCacheKey);
        }
      } catch {
        if (!hasImmediateBranding && user?.referredByRealtor) {
          applyBranding(
            {
              id: user.referredByRealtor.id,
              businessName: user.referredByRealtor.businessName,
              tagline: user.referredByRealtor.tagline,
              primaryColor: user.referredByRealtor.primaryColor,
              secondaryColor: user.referredByRealtor.secondaryColor,
              accentColor: user.referredByRealtor.accentColor,
              logoUrl: user.referredByRealtor.logoUrl,
              description: user.referredByRealtor.description,
            },
            userCacheKey,
          );
        } else if (!hasImmediateBranding) {
          applyBranding(fallbackBranding, subdomainCacheKey || userCacheKey);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void hydrateBranding();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, user]);

  const result = useMemo(
    () => ({
      realtorBranding,
      isLoading,
      realtorId: realtorBranding.id || null,
      brandColor:
        realtorBranding.primaryColor ||
        user?.referredByRealtor?.primaryColor ||
        fallbackBranding.primaryColor,
      secondaryColor:
        realtorBranding.secondaryColor ||
        user?.referredByRealtor?.secondaryColor ||
        "#059669",
      accentColor:
        realtorBranding.accentColor ||
        user?.referredByRealtor?.accentColor ||
        "#D97706",
      realtorName:
        realtorBranding.businessName ||
        user?.referredByRealtor?.businessName ||
        fallbackBranding.businessName,
      logoUrl: realtorBranding.logoUrl || user?.referredByRealtor?.logoUrl,
      tagline:
        realtorBranding.tagline ||
        user?.referredByRealtor?.tagline ||
        "Premium short-let properties",
      description:
        realtorBranding.description || user?.referredByRealtor?.description || "",
    }),
    [isLoading, realtorBranding, user?.referredByRealtor],
  );

  return result;
}
