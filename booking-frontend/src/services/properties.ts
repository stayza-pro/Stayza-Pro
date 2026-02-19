import { apiClient, PaginatedResponse } from "./api";
import {
  Property,
  PropertyFilters,
  SearchParams,
  PropertyFormData,
  Review,
} from "../types";

export const propertyService = {
  // Get all properties with filtering and pagination
  getProperties: async (
    filters?: PropertyFilters,
    searchParams?: SearchParams
  ): Promise<PaginatedResponse<Property>> => {
    const params = new URLSearchParams();

    // Add filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (key === "amenities" && Array.isArray(value)) {
            params.append(key, value.join(","));
          } else if (key === "checkIn" || key === "checkOut") {
            params.append(key, (value as Date).toISOString().split("T")[0]);
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    // Add search params
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/properties?${queryString}` : "/properties";

    const response = await apiClient.get<Property[]>(url);
    return response as PaginatedResponse<Property>;
  },

  // Get single property by ID
  getProperty: async (id: string): Promise<Property> => {
    const response = await apiClient.get<Property>(`/properties/${id}`);
    return response.data;
  },

  // Create new property (hosts only)
  createProperty: async (data: PropertyFormData): Promise<Property> => {
    const response = await apiClient.post<Property>("/properties", data);
    return response.data;
  },

  // Update property (hosts only)
  updateProperty: async (
    id: string,
    data: Partial<PropertyFormData>
  ): Promise<Property> => {
    const response = await apiClient.put<Property>(`/properties/${id}`, data);
    return response.data;
  },

  // Delete property (hosts only)
  deleteProperty: async (id: string): Promise<void> => {
    await apiClient.delete(`/properties/${id}`);
  },

  // Toggle property status (DRAFT, ACTIVE, INACTIVE)
  togglePropertyStatus: async (
    id: string,
    status: "DRAFT" | "ACTIVE" | "INACTIVE"
  ): Promise<Property> => {
    const response = await apiClient.patch<Property>(
      `/properties/${id}/status`,
      { status }
    );
    return response.data;
  },

  // Upload property images
  uploadImages: async (
    propertyId: string,
    files: File[]
  ): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });

    const response = await apiClient.post<string[]>(
      `/properties/${propertyId}/images`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  },

  // Delete property image
  deleteImage: async (propertyId: string, imageId: string): Promise<void> => {
    await apiClient.delete(`/properties/${propertyId}/images/${imageId}`);
  },

  // Reorder property images
  reorderImages: async (
    propertyId: string,
    imageOrder: Array<{ id: string; order: number }>
  ): Promise<void> => {
    await apiClient.put(`/properties/${propertyId}/images/reorder`, {
      images: imageOrder,
    });
  },

  // Get host's properties
  getHostProperties: async (
    hostId?: string,
    searchParams?: SearchParams
  ): Promise<PaginatedResponse<Property>> => {
    const params = new URLSearchParams();

    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const baseUrl = `/properties/host/${hostId}`;
    const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

    const response = await apiClient.get<Property[]>(url);
    return response as PaginatedResponse<Property>;
  },

  // Get property availability
  getAvailability: async (
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<{ available: boolean; unavailableDates: string[] }> => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const monthDiff =
      Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())
        ? 12
        : Math.min(
            12,
            Math.max(
              1,
              (end.getFullYear() - start.getFullYear()) * 12 +
                (end.getMonth() - start.getMonth()) +
                1
            )
          );

    const response = await apiClient.get<{
      propertyId?: string;
      propertyName?: string;
      calendar?: Array<{ date: string; available: boolean }>;
    }>(
      `/bookings/properties/${propertyId}/calendar?format=json&months=${monthDiff}`
    );

    const calendar =
      ((response as unknown as { data?: { calendar?: Array<{ date: string; available: boolean }> } })
        .data?.calendar as Array<{ date: string; available: boolean }> | undefined) || [];

    const unavailableDates = calendar
      .filter((day) => day?.available === false && typeof day.date === "string")
      .map((day) => day.date);

    return {
      available: unavailableDates.length === 0,
      unavailableDates,
    };
  },

  // Set property unavailable dates (hosts only)
  setUnavailableDates: async (
    propertyId: string,
    dates: string[],
    reason?: string
  ): Promise<void> => {
    await apiClient.post(`/properties/${propertyId}/unavailable`, {
      dates,
      reason,
    });
  },

  // Remove unavailable dates (hosts only)
  removeUnavailableDates: async (
    propertyId: string,
    dates: string[]
  ): Promise<void> => {
    await apiClient.delete(`/properties/${propertyId}/unavailable`, {
      data: { dates },
    });
  },

  // Get property reviews
  getPropertyReviews: async (
    propertyId: string,
    searchParams?: SearchParams
  ): Promise<PaginatedResponse<Review>> => {
    const params = new URLSearchParams();

    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString
      ? `/properties/${propertyId}/reviews?${queryString}`
      : `/properties/${propertyId}/reviews`;

    const response = await apiClient.get<PaginatedResponse<Review>>(url);
    return response.data;
  },

  // Search properties by location
  searchByLocation: async (
    query: string,
    searchParams?: SearchParams
  ): Promise<PaginatedResponse<Property>> => {
    const params = new URLSearchParams();
    params.append("q", query);

    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get<Property[]>(
      `/properties/search?${params.toString()}`
    );
    return response as PaginatedResponse<Property>;
  },

  // Get featured properties
  getFeaturedProperties: async (limit = 8): Promise<Property[]> => {
    const response = await apiClient.get<Property[]>(
      `/properties/featured?limit=${limit}`
    );
    return response.data;
  },

  // Get property analytics (hosts only)
  getPropertyAnalytics: async (
    propertyId: string,
    period = "30d"
  ): Promise<{
    views: number;
    bookings: number;
    revenue: number;
    occupancyRate: number;
    averageRating: number;
  }> => {
    const response = await apiClient.get<{
      views: number;
      bookings: number;
      revenue: number;
      occupancyRate: number;
      averageRating: number;
    }>(`/properties/${propertyId}/analytics?period=${period}`);
    return response.data;
  },
};
