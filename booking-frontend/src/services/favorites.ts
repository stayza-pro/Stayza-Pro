import { apiClient, ApiResponse } from "./api";

export interface FavoriteProperty {
  id: string;
  userId: string;
  propertyId: string;
  createdAt: string;
  property: {
    id: string;
    title: string;
    description: string;
    type: string;
    pricePerNight: number;
    currency: string;
    maxGuests: number;
    bedrooms: number;
    bathrooms: number;
    address: string;
    city: string;
    country: string;
    isActive: boolean;
    status: string;
    averageRating: number;
    reviewCount: number;
    images: Array<{
      id: string;
      url: string;
      order: number;
    }>;
    realtor: {
      id: string;
      businessName: string;
      slug: string;
      logoUrl: string | null;
    };
  };
}

export interface AddFavoriteRequest {
  propertyId: string;
}

class FavoritesService {
  /**
   * Get all user favorites
   */
  async getFavorites(): Promise<ApiResponse<FavoriteProperty[]>> {
    return apiClient.get<FavoriteProperty[]>("/favorites");
  }

  /**
   * Add a property to favorites
   */
  async addFavorite(
    data: AddFavoriteRequest
  ): Promise<ApiResponse<FavoriteProperty>> {
    return apiClient.post<FavoriteProperty>("/favorites", data);
  }

  /**
   * Remove a property from favorites
   */
  async removeFavorite(
    propertyId: string
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.delete<{ success: boolean; message: string }>(
      `/favorites/${propertyId}`
    );
  }

  /**
   * Check if a property is favorited
   */
  async checkFavorite(
    propertyId: string
  ): Promise<ApiResponse<{ isFavorited: boolean; favoriteId: string | null }>> {
    return apiClient.get<{
      isFavorited: boolean;
      favoriteId: string | null;
    }>(`/favorites/check/${propertyId}`);
  }
}

export const favoritesService = new FavoritesService();
