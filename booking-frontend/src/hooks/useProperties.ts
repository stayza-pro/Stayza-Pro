import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "react-query";
import { propertyService } from "../services";
import {
  Property,
  PropertyFilters,
  SearchParams,
  PropertyFormData,
} from "../types";
import type { PaginatedResponse } from "../services";

// Query keys
export const propertyKeys = {
  all: ["properties"] as const,
  lists: () => [...propertyKeys.all, "list"] as const,
  list: (filters?: PropertyFilters, search?: SearchParams) =>
    [...propertyKeys.lists(), { filters, search }] as const,
  details: () => [...propertyKeys.all, "detail"] as const,
  detail: (id: string) => [...propertyKeys.details(), id] as const,
  host: (hostId?: string) => [...propertyKeys.all, "host", hostId] as const,
  featured: () => [...propertyKeys.all, "featured"] as const,
  search: (query: string) => [...propertyKeys.all, "search", query] as const,
  availability: (id: string, dates: { start: string; end: string }) =>
    [...propertyKeys.detail(id), "availability", dates] as const,
  reviews: (id: string) => [...propertyKeys.detail(id), "reviews"] as const,
  analytics: (id: string, period: string) =>
    [...propertyKeys.detail(id), "analytics", period] as const,
};

// Queries
export const useProperties = (
  filters?: PropertyFilters,
  searchParams?: SearchParams
) => {
  return useQuery(
    propertyKeys.list(filters, searchParams),
    () => propertyService.getProperties(filters, searchParams),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      keepPreviousData: true,
      enabled: typeof window !== "undefined",
    }
  );
};

export const useInfiniteProperties = (
  filters?: PropertyFilters,
  searchParams?: SearchParams
) => {
  return useInfiniteQuery(
    propertyKeys.list(filters, searchParams),
    ({ pageParam = 1 }) =>
      propertyService.getProperties(filters, {
        ...searchParams,
        page: pageParam,
      }),
    {
      getNextPageParam: (lastPage: PaginatedResponse<Property>) => {
        if (lastPage.pagination.hasNext) {
          return lastPage.pagination.currentPage + 1;
        }
        return undefined;
      },
      staleTime: 2 * 60 * 1000,
      keepPreviousData: true,
    }
  );
};

export const useProperty = (id: string) => {
  return useQuery(
    propertyKeys.detail(id),
    () => propertyService.getProperty(id),
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

export const useHostProperties = (
  hostId?: string,
  searchParams?: SearchParams
) => {
  return useQuery(
    propertyKeys.host(hostId),
    () => propertyService.getHostProperties(hostId, searchParams),
    {
      staleTime: 2 * 60 * 1000,
    }
  );
};

export const useFeaturedProperties = (limit = 8) => {
  return useQuery(
    propertyKeys.featured(),
    () => propertyService.getFeaturedProperties(limit),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
};

export const usePropertyAvailability = (
  propertyId: string,
  startDate: string,
  endDate: string
) => {
  return useQuery(
    propertyKeys.availability(propertyId, {
      start: startDate,
      end: endDate,
    }),
    () => propertyService.getAvailability(propertyId, startDate, endDate),
    {
      enabled: !!propertyId && !!startDate && !!endDate,
      staleTime: 30 * 1000, // 30 seconds (availability changes frequently)
    }
  );
};

export const usePropertyReviews = (
  propertyId: string,
  searchParams?: SearchParams
) => {
  return useQuery(
    propertyKeys.reviews(propertyId),
    () => propertyService.getPropertyReviews(propertyId, searchParams),
    {
      enabled: !!propertyId,
      staleTime: 5 * 60 * 1000,
    }
  );
};

export const usePropertyAnalytics = (propertyId: string, period = "30d") => {
  return useQuery(
    propertyKeys.analytics(propertyId, period),
    () => propertyService.getPropertyAnalytics(propertyId, period),
    {
      enabled: !!propertyId,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
};

export const useSearchProperties = (
  query: string,
  searchParams?: SearchParams
) => {
  return useQuery(
    propertyKeys.search(query),
    () => propertyService.searchByLocation(query, searchParams),
    {
      enabled: query.length > 2, // Only search if query is at least 3 characters
      staleTime: 2 * 60 * 1000,
    }
  );
};

// Mutations
export const useCreateProperty = () => {
  const queryClient = useQueryClient();

  return useMutation<Property, unknown, PropertyFormData>(
    propertyService.createProperty,
    {
      onSuccess: (newProperty) => {
        // Invalidate properties lists
        queryClient.invalidateQueries(propertyKeys.lists());
        queryClient.invalidateQueries(propertyKeys.host());

        // Add the new property to the cache
        queryClient.setQueryData(
          propertyKeys.detail(newProperty.id),
          newProperty
        );
      },
      onError: (error) => {
        console.error("Create property error:", error);
      },
    }
  );
};

export const useUpdateProperty = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Property,
    unknown,
    { id: string; data: Partial<PropertyFormData> }
  >(({ id, data }) => propertyService.updateProperty(id, data), {
    onSuccess: (updatedProperty) => {
      // Update the property in cache
      queryClient.setQueryData(
        propertyKeys.detail(updatedProperty.id),
        updatedProperty
      );

      // Invalidate lists to reflect changes
      queryClient.invalidateQueries(propertyKeys.lists());
      queryClient.invalidateQueries(propertyKeys.host());
    },
    onError: (error) => {
      console.error("Update property error:", error);
    },
  });
};

export const useDeleteProperty = () => {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, string>(propertyService.deleteProperty, {
    onSuccess: (_data, deletedId) => {
      // Remove from cache
      queryClient.removeQueries(propertyKeys.detail(deletedId));

      // Invalidate lists
      queryClient.invalidateQueries(propertyKeys.lists());
      queryClient.invalidateQueries(propertyKeys.host());
    },
    onError: (error) => {
      console.error("Delete property error:", error);
    },
  });
};

export const useUploadPropertyImages = () => {
  const queryClient = useQueryClient();

  return useMutation<string[], unknown, { propertyId: string; files: File[] }>(
    ({ propertyId, files }) => propertyService.uploadImages(propertyId, files),
    {
      onSuccess: (_data, { propertyId }) => {
        // Invalidate property details to refetch with new images
        queryClient.invalidateQueries(propertyKeys.detail(propertyId));
      },
      onError: (error) => {
        console.error("Upload images error:", error);
      },
    }
  );
};

export const useDeletePropertyImage = () => {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, { propertyId: string; imageUrl: string }>(
    ({ propertyId, imageUrl }) =>
      propertyService.deleteImage(propertyId, imageUrl),
    {
      onSuccess: (_data, { propertyId }) => {
        // Invalidate property details to refetch without deleted image
        queryClient.invalidateQueries(propertyKeys.detail(propertyId));
      },
      onError: (error) => {
        console.error("Delete image error:", error);
      },
    }
  );
};

export const useSetUnavailableDates = () => {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    unknown,
    { propertyId: string; dates: string[]; reason?: string }
  >(
    ({ propertyId, dates, reason }) =>
      propertyService.setUnavailableDates(propertyId, dates, reason),
    {
      onSuccess: (_data, { propertyId }) => {
        // Invalidate availability queries
        queryClient.invalidateQueries([
          ...propertyKeys.detail(propertyId),
          "availability",
        ]);
      },
      onError: (error) => {
        console.error("Set unavailable dates error:", error);
      },
    }
  );
};

export const useRemoveUnavailableDates = () => {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, { propertyId: string; dates: string[] }>(
    ({ propertyId, dates }) =>
      propertyService.removeUnavailableDates(propertyId, dates),
    {
      onSuccess: (_data, { propertyId }) => {
        // Invalidate availability queries
        queryClient.invalidateQueries([
          ...propertyKeys.detail(propertyId),
          "availability",
        ]);
      },
      onError: (error) => {
        console.error("Remove unavailable dates error:", error);
      },
    }
  );
};
