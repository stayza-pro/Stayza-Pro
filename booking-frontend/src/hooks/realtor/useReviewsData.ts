import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { propertyService } from "@/services";

/**
 * Hook to fetch and manage guest reviews
 * - Ratings, feedback, flagged reviews
 * - Structured data for the Reviews page
 */

export interface Review {
  id: string;
  propertyId: string;
  propertyTitle: string;
  guestId: string;
  guestName: string;
  guestAvatar?: string;
  rating: number; // 1-5
  comment: string;
  photos?: string[];
  createdAt: string;
  isFlagged: boolean;
  hasResponse: boolean;
  response?: {
    text: string;
    createdAt: string;
  };
}

export interface ReviewsStats {
  totalReviews: number;
  averageRating: number;
  ratingBreakdown: {
    "5": number;
    "4": number;
    "3": number;
    "2": number;
    "1": number;
  };
  flaggedCount: number;
  pendingResponseCount: number;
}

interface UseReviewsDataParams {
  propertyId?: string; // Optional: filter by specific property
  page?: number;
  limit?: number;
  autoFetch?: boolean;
}

interface UseReviewsDataReturn {
  reviews: Review[];
  stats: ReviewsStats | null;
  total: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  respondToReview: (reviewId: string, response: string) => Promise<boolean>;
  flagReview: (reviewId: string) => Promise<boolean>;
  unflagReview: (reviewId: string) => Promise<boolean>;
}

export function useReviewsData(
  params: UseReviewsDataParams = {}
): UseReviewsDataReturn {
  const { propertyId, page = 1, limit = 20, autoFetch = true } = params;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewsStats | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(page);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [hasPrev, setHasPrev] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { accessToken, user } = useAuthStore();

  const fetchReviews = useCallback(async () => {
    if (!accessToken || !user) {
      setIsLoading(false);
      setError("Not authenticated");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";

      // If propertyId is provided, fetch reviews for that property
      // Otherwise, fetch all reviews for the realtor's properties
      const endpoint = propertyId
        ? `${baseUrl}/api/properties/${propertyId}/reviews?page=${currentPage}&limit=${limit}`
        : `${baseUrl}/api/realtors/reviews?page=${currentPage}&limit=${limit}`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Transform reviews data
        const transformedReviews: Review[] = (result.data.reviews || []).map(
          (review: any) => ({
            id: review.id,
            propertyId: review.propertyId,
            propertyTitle: review.property?.title || "Property",
            guestId: review.guestId,
            guestName:
              `${review.guest?.firstName || ""} ${
                review.guest?.lastName || ""
              }`.trim() || "Guest",
            guestAvatar: review.guest?.profilePicture,
            rating: review.rating,
            comment: review.comment,
            photos: review.photos || [],
            createdAt: review.createdAt,
            isFlagged: review.isFlagged || false,
            hasResponse: !!review.response,
            response: review.response
              ? {
                  text: review.response,
                  createdAt: review.responseCreatedAt,
                }
              : undefined,
          })
        );

        setReviews(transformedReviews);
        setTotal(result.data.pagination?.total || transformedReviews.length);
        setTotalPages(result.data.pagination?.totalPages || 1);
        setHasNext(result.data.pagination?.hasNext || false);
        setHasPrev(result.data.pagination?.hasPrev || false);

        // Calculate stats
        if (result.data.stats) {
          setStats(result.data.stats);
        } else {
          // Calculate stats from reviews
          const ratingBreakdown = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
          transformedReviews.forEach((review) => {
            ratingBreakdown[
              review.rating.toString() as keyof typeof ratingBreakdown
            ]++;
          });

          const totalRatings = transformedReviews.reduce(
            (sum, review) => sum + review.rating,
            0
          );

          setStats({
            totalReviews: transformedReviews.length,
            averageRating:
              transformedReviews.length > 0
                ? totalRatings / transformedReviews.length
                : 0,
            ratingBreakdown,
            flaggedCount: transformedReviews.filter((r) => r.isFlagged).length,
            pendingResponseCount: transformedReviews.filter(
              (r) => !r.hasResponse
            ).length,
          });
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load reviews";
      setError(errorMessage);
      console.error("Error fetching reviews:", err);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, user, propertyId, currentPage, limit]);

  useEffect(() => {
    if (autoFetch) {
      fetchReviews();
    }
  }, [fetchReviews, autoFetch]);

  const setPage = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  const respondToReview = useCallback(
    async (reviewId: string, response: string): Promise<boolean> => {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

        const result = await fetch(
          `${baseUrl}/api/reviews/${reviewId}/respond`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ response }),
          }
        );

        if (result.ok) {
          await fetchReviews(); // Refresh reviews after response
          return true;
        }
        return false;
      } catch (err) {
        console.error("Error responding to review:", err);
        return false;
      }
    },
    [accessToken, fetchReviews]
  );

  const flagReview = useCallback(
    async (reviewId: string): Promise<boolean> => {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

        const result = await fetch(`${baseUrl}/api/reviews/${reviewId}/flag`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (result.ok) {
          await fetchReviews(); // Refresh reviews after flagging
          return true;
        }
        return false;
      } catch (err) {
        console.error("Error flagging review:", err);
        return false;
      }
    },
    [accessToken, fetchReviews]
  );

  const unflagReview = useCallback(
    async (reviewId: string): Promise<boolean> => {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

        const result = await fetch(
          `${baseUrl}/api/reviews/${reviewId}/unflag`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (result.ok) {
          await fetchReviews(); // Refresh reviews after unflagging
          return true;
        }
        return false;
      } catch (err) {
        console.error("Error unflagging review:", err);
        return false;
      }
    },
    [accessToken, fetchReviews]
  );

  return {
    reviews,
    stats,
    total,
    currentPage,
    totalPages,
    hasNext,
    hasPrev,
    isLoading,
    error,
    refetch: fetchReviews,
    setPage,
    respondToReview,
    flagReview,
    unflagReview,
  };
}
