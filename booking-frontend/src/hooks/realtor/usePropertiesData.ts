import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { propertyService } from "@/services";
import type { Property, PropertyFilters, SearchParams } from "@/types";

/**
 * Hook to fetch and manage properties data
 * - List, filter, and search properties
 * - Property details and analytics
 * - Add/edit/delete property actions
 */

interface UsePropertiesDataParams {
  filters?: PropertyFilters;
  searchParams?: SearchParams;
  autoFetch?: boolean;
}

interface UsePropertiesDataReturn {
  properties: Property[];
  total: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setFilters: (filters: PropertyFilters) => void;
  setSearchParams: (params: SearchParams) => void;
}

export function usePropertiesData(
  params: UsePropertiesDataParams = {}
): UsePropertiesDataReturn {
  const { filters, searchParams, autoFetch = true } = params;
  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [hasPrev, setHasPrev] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [localFilters, setLocalFilters] = useState<PropertyFilters | undefined>(
    filters
  );
  const [localSearchParams, setLocalSearchParams] = useState<
    SearchParams | undefined
  >(searchParams);
  const { accessToken, user } = useAuthStore();

  const fetchProperties = useCallback(async () => {
    if (!accessToken || !user) {
      setIsLoading(false);
      setError("Not authenticated");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await propertyService.getHostProperties(
        user.id,
        localSearchParams
      );

      if (response && response.data) {
        setProperties(response.data);
        setTotal(response.pagination?.totalItems || response.data.length);
        setCurrentPage(response.pagination?.currentPage || 1);
        setTotalPages(response.pagination?.totalPages || 1);
        setHasNext(response.pagination?.hasNext || false);
        setHasPrev(response.pagination?.hasPrev || false);
      } else {
        setProperties([]);
        setTotal(0);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load properties";
      setError(errorMessage);
      console.error("Error fetching properties:", err);
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, user, localFilters, localSearchParams]);

  useEffect(() => {
    if (autoFetch) {
      fetchProperties();
    }
  }, [fetchProperties, autoFetch]);

  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
    setLocalSearchParams((prev) => ({
      ...prev,
      page,
    }));
  }, []);

  const setFilters = useCallback((newFilters: PropertyFilters) => {
    setLocalFilters(newFilters);
    setCurrentPage(1); // Reset to first page on filter change
  }, []);

  const setSearchParams = useCallback((newParams: SearchParams) => {
    setLocalSearchParams(newParams);
    setCurrentPage(1); // Reset to first page on search param change
  }, []);

  return {
    properties,
    total,
    currentPage,
    totalPages,
    hasNext,
    hasPrev,
    isLoading,
    error,
    refetch: fetchProperties,
    setPage,
    setFilters,
    setSearchParams,
  };
}
