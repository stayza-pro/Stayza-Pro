import { apiClient, PaginatedResponse } from "./api";
import { Review, ReviewFormData, ReviewResponse, SearchParams } from "../types";

export const reviewService = {
  // Create a new review
  createReview: async (data: ReviewFormData): Promise<Review> => {
    const response = await apiClient.post<Review>("/reviews", data);
    return response.data;
  },

  // Get review by ID
  getReview: async (id: string): Promise<Review> => {
    const response = await apiClient.get<Review>(`/reviews/${id}`);
    return response.data;
  },

  // Update review (only author can update)
  updateReview: async (
    id: string,
    data: Partial<ReviewFormData>
  ): Promise<Review> => {
    const response = await apiClient.put<Review>(`/reviews/${id}`, data);
    return response.data;
  },

  // Delete review (only author can delete)
  deleteReview: async (id: string): Promise<void> => {
    await apiClient.delete(`/reviews/${id}`);
  },

  // Get property reviews
  getPropertyReviews: async (
    propertyId: string,
    searchParams?: SearchParams
  ): Promise<PaginatedResponse<Review>> => {
    const params = new URLSearchParams();

    if (searchParams) {
      Object.keys(searchParams).forEach((key) => {
        const value = searchParams[key as keyof SearchParams];
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString
      ? `/reviews/property/${propertyId}?${queryString}`
      : `/reviews/property/${propertyId}`;

    const response = await apiClient.get<Review[]>(url);
    return response as PaginatedResponse<Review>;
  },

  // Get user's reviews (as author)
  getUserReviews: async (
    searchParams?: SearchParams
  ): Promise<PaginatedResponse<Review>> => {
    const params = new URLSearchParams();

    if (searchParams) {
      Object.keys(searchParams).forEach((key) => {
        const value = searchParams[key as keyof SearchParams];
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString
      ? `/reviews/my/reviews?${queryString}`
      : "/reviews/my/reviews";

    const response = await apiClient.get<Review[]>(url);
    return response as PaginatedResponse<Review>;
  },

  // Get reviews received by realtor
  getRealtorReviews: async (
    searchParams?: SearchParams
  ): Promise<PaginatedResponse<Review>> => {
    const params = new URLSearchParams();

    if (searchParams) {
      Object.keys(searchParams).forEach((key) => {
        const value = searchParams[key as keyof SearchParams];
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString
      ? `/reviews/realtor/reviews?${queryString}`
      : "/reviews/realtor/reviews";

    const response = await apiClient.get<Review[]>(url);
    return response as PaginatedResponse<Review>;
  },

  // Get reviews for a booking
  getBookingReviews: async (bookingId: string): Promise<Review[]> => {
    const response = await apiClient.get<Review[]>(
      `/reviews/booking/${bookingId}`
    );
    return response.data;
  },

  // Check if user can review a booking
  canReview: async (
    bookingId: string
  ): Promise<{
    canReview: boolean;
    reason?: string;
  }> => {
    const response = await apiClient.get<{
      canReview: boolean;
      reason?: string;
    }>(`/reviews/can-review/${bookingId}`);
    return response.data;
  },

  // Report a review (inappropriate content)
  reportReview: async (reviewId: string, reason: string): Promise<void> => {
    await apiClient.post(`/reviews/${reviewId}/report`, { reason });
  },

  // Get review statistics for property
  getPropertyReviewStats: async (
    propertyId: string
  ): Promise<{
    totalReviews: number;
    averageRating: number;
    ratingDistribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
    recentReviews: Review[];
  }> => {
    const response = await apiClient.get<{
      totalReviews: number;
      averageRating: number;
      ratingDistribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
      };
      recentReviews: Review[];
    }>(`/reviews/property/${propertyId}/stats`);
    return response.data;
  },

  // Get host review statistics
  getHostReviewStats: async (
    hostId?: string
  ): Promise<{
    totalReviews: number;
    averageRating: number;
    recentReviews: Review[];
    propertiesRated: number;
  }> => {
    const url = hostId
      ? `/reviews/host/${hostId}/stats`
      : "/reviews/host-stats";
    const response = await apiClient.get<{
      totalReviews: number;
      averageRating: number;
      recentReviews: Review[];
      propertiesRated: number;
    }>(url);
    return response.data;
  },

  // Get all reviews (admin only)
  getAllReviews: async (
    searchParams?: SearchParams
  ): Promise<PaginatedResponse<Review>> => {
    const params = new URLSearchParams();

    if (searchParams) {
      Object.keys(searchParams).forEach((key) => {
        const value = searchParams[key as keyof SearchParams];
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/reviews?${queryString}` : "/reviews";

    const response = await apiClient.get<Review[]>(url);
    return response as PaginatedResponse<Review>;
  },

  // Moderate review visibility (admin only)
  moderateReview: async (
    reviewId: string,
    isVisible: boolean,
    reason?: string
  ): Promise<Review> => {
    const response = await apiClient.patch<Review>(
      `/reviews/${reviewId}/moderate`,
      {
        isVisible,
        reason,
      }
    );
    return response.data;
  },

  // Get pending reviews (admin only)
  getPendingReviews: async (
    searchParams?: SearchParams
  ): Promise<PaginatedResponse<Review>> => {
    const params = new URLSearchParams();

    if (searchParams) {
      Object.keys(searchParams).forEach((key) => {
        const value = searchParams[key as keyof SearchParams];
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString
      ? `/reviews/pending?${queryString}`
      : "/reviews/pending";

    const response = await apiClient.get<Review[]>(url);
    return response as PaginatedResponse<Review>;
  },

  // Get review analytics for realtor
  getReviewAnalytics: async (): Promise<{
    totalReviews: number;
    averageRating: number;
    ratingDistribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
    recentReviews: Review[];
    responseRate: number;
    responsesGiven: number;
  }> => {
    const response = await apiClient.get<{
      totalReviews: number;
      averageRating: number;
      ratingDistribution: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
      };
      recentReviews: Review[];
      responseRate: number;
      responsesGiven: number;
    }>(`/reviews/analytics`);
    return response.data;
  },

  // Respond to a review (realtor only)
  respondToReview: async (
    reviewId: string,
    comment: string
  ): Promise<ReviewResponse> => {
    const response = await apiClient.post<ReviewResponse>(
      `/reviews/${reviewId}/respond`,
      { comment }
    );
    return response.data;
  },

  // Upload photos for review
  uploadReviewPhotos: async (
    photos: File[]
  ): Promise<Array<{ url: string; caption?: string }>> => {
    const formData = new FormData();
    photos.forEach((photo) => {
      formData.append("photos", photo);
    });

    const response = await apiClient.post<{
      photos: Array<{ url: string; caption?: string }>;
    }>("/reviews/upload-photos", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.photos;
  },
};
