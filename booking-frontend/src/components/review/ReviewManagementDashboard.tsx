"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { BarChart3, Eye, EyeOff, Filter, MessageSquare, Star } from "lucide-react";
import { Card, Button } from "@/components/ui";
import { ReviewCard } from "@/components/review/ReviewCard";
import { Review } from "@/types";
import { reviewService } from "@/services/reviews";

type FilterType = "all" | "responded" | "pending";
type SortType = "newest" | "oldest" | "rating";
type DashboardScope = "realtor" | "admin";

interface ReviewAnalytics {
  totalReviews: number;
  averageRating: number;
  responseRate: number;
  responsesGiven: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ReviewManagementDashboardProps {
  scope?: DashboardScope;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

const calculateAnalytics = (reviews: Review[]): ReviewAnalytics => {
  if (reviews.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      responseRate: 0,
      responsesGiven: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const responsesGiven = reviews.filter((review) => Boolean(review.hostResponse)).length;
  const ratingDistribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  reviews.forEach((review) => {
    const rating = Number(review.rating);
    if (rating >= 1 && rating <= 5) {
      ratingDistribution[rating as 1 | 2 | 3 | 4 | 5] += 1;
    }
  });

  const totalRating = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);

  return {
    totalReviews: reviews.length,
    averageRating: totalRating / reviews.length,
    responseRate: Math.round((responsesGiven / reviews.length) * 100),
    responsesGiven,
    ratingDistribution,
  };
};

const applyFilterAndSort = (
  reviews: Review[],
  filter: FilterType,
  sortBy: SortType,
): Review[] => {
  let list = [...reviews];

  if (filter === "responded") {
    list = list.filter((review) => Boolean(review.hostResponse));
  }
  if (filter === "pending") {
    list = list.filter((review) => !review.hostResponse);
  }

  list.sort((left, right) => {
    if (sortBy === "rating") {
      return Number(right.rating || 0) - Number(left.rating || 0);
    }
    const leftDate = new Date(left.createdAt).getTime();
    const rightDate = new Date(right.createdAt).getTime();
    if (sortBy === "oldest") {
      return leftDate - rightDate;
    }
    return rightDate - leftDate;
  });

  return list;
};

export const ReviewManagementDashboard: React.FC<ReviewManagementDashboardProps> = ({
  scope = "realtor",
}) => {
  const [rawReviews, setRawReviews] = useState<Review[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [analytics, setAnalytics] = useState<ReviewAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [responding, setResponding] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});

  const filteredReviews = useMemo(
    () => applyFilterAndSort(rawReviews, filter, sortBy),
    [filter, rawReviews, sortBy],
  );

  useEffect(() => {
    setReviews(filteredReviews);
  }, [filteredReviews]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        if (scope === "admin") {
          const reviewsResponse = await reviewService.getAllReviews({
            page: currentPage,
            limit: 50,
          } as any);
          const loadedReviews = Array.isArray(reviewsResponse?.data)
            ? reviewsResponse.data
            : [];
          setRawReviews(loadedReviews);
          setAnalytics(calculateAnalytics(loadedReviews));
          return;
        }

        const [reviewsResponse, analyticsResponse] = await Promise.all([
          reviewService.getRealtorReviews({
            page: currentPage,
            limit: 50,
          } as any),
          reviewService.getReviewAnalytics(),
        ]);

        const loadedReviews = Array.isArray(reviewsResponse?.data)
          ? reviewsResponse.data
          : [];
        setRawReviews(loadedReviews);
        setAnalytics({
          totalReviews: analyticsResponse.totalReviews || loadedReviews.length,
          averageRating: Number(analyticsResponse.averageRating || 0),
          responseRate: Number(analyticsResponse.responseRate || 0),
          responsesGiven: Number(analyticsResponse.responsesGiven || 0),
          ratingDistribution: analyticsResponse.ratingDistribution || {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0,
          },
        });
      } catch (error) {
        toast.error(
          getErrorMessage(error, "Failed to load review management data."),
        );
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [currentPage, scope]);

  const updateReview = (reviewId: string, updater: (review: Review) => Review) => {
    setRawReviews((prev) =>
      prev.map((review) => (review.id === reviewId ? updater(review) : review)),
    );
  };

  const setLoadingAction = (reviewId: string, action: string | null) => {
    setActionLoading((prev) => {
      if (!action) {
        const { [reviewId]: _ignored, ...rest } = prev;
        return rest;
      }
      return { ...prev, [reviewId]: action };
    });
  };

  const refreshAnalytics = () => {
    setAnalytics(calculateAnalytics(rawReviews));
  };

  useEffect(() => {
    if (scope === "admin") {
      refreshAnalytics();
    }
  }, [rawReviews, scope]);

  const handleRespondToReview = async (reviewId: string) => {
    if (!responseText.trim()) {
      toast.error("Enter a response before submitting.");
      return;
    }

    try {
      setLoadingAction(reviewId, "respond");
      await reviewService.respondToReview(reviewId, responseText.trim());
      toast.success("Response posted.");
      setResponding(null);
      setResponseText("");
      setCurrentPage(1);
      const refreshed = await reviewService.getRealtorReviews({
        page: 1,
        limit: 50,
      } as any);
      setRawReviews(Array.isArray(refreshed?.data) ? refreshed.data : []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to submit response."));
    } finally {
      setLoadingAction(reviewId, null);
    }
  };

  const handleVisibilityToggle = async (review: Review) => {
    const nextVisible = review.isVisible === false;
    updateReview(review.id, (current) => ({ ...current, isVisible: nextVisible }));

    try {
      setLoadingAction(review.id, "visibility");
      if (scope === "admin") {
        await reviewService.moderateReview(
          review.id,
          nextVisible,
          nextVisible ? "Approved by admin moderation" : "Hidden by admin moderation",
        );
      } else {
        await reviewService.toggleReviewVisibility(review.id, nextVisible);
      }
      toast.success(
        nextVisible ? "Review is now visible." : "Review has been hidden.",
      );
    } catch (error) {
      updateReview(review.id, (current) => ({
        ...current,
        isVisible: review.isVisible,
      }));
      toast.error(getErrorMessage(error, "Failed to update review visibility."));
    } finally {
      setLoadingAction(review.id, null);
    }
  };

  const handleHelpfulToggle = async (review: Review) => {
    try {
      setLoadingAction(review.id, "helpful");
      const result = await reviewService.markAsHelpful(review.id);
      updateReview(review.id, (current) => ({
        ...current,
        helpfulCount: result.helpfulCount,
      }));
      toast.success(result.isHelpful ? "Marked as helpful." : "Helpful mark removed.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update helpful state."));
    } finally {
      setLoadingAction(review.id, null);
    }
  };

  const handleReportReview = async (reviewId: string) => {
    try {
      setLoadingAction(reviewId, "report");
      await reviewService.reportReview(reviewId, {
        reason: "Flagged from moderation dashboard",
      });
      toast.success("Review reported.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to report review."));
    } finally {
      setLoadingAction(reviewId, null);
    }
  };

  const handleFlagForAdmin = async (reviewId: string) => {
    try {
      setLoadingAction(reviewId, "flag");
      await reviewService.flagReviewForAdmin(
        reviewId,
        "Needs admin moderation review",
      );
      toast.success("Review flagged for admin.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to flag review."));
    } finally {
      setLoadingAction(reviewId, null);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 rounded bg-gray-200" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="h-28 rounded-lg bg-gray-200" />
            <div className="h-28 rounded-lg bg-gray-200" />
            <div className="h-28 rounded-lg bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  const title =
    scope === "admin" ? "Admin Review Moderation" : "Review Management";
  const subtitle =
    scope === "admin"
      ? "Moderate guest feedback across the platform."
      : "Monitor and respond to reviews for your listings.";

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="mt-1 text-gray-600">{subtitle}</p>
      </div>

      {analytics && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="p-5">
            <p className="text-sm text-gray-600">Total Reviews</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {analytics.totalReviews}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-gray-600">Average Rating</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {analytics.averageRating.toFixed(1)}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-gray-600">Visible Reviews</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {reviews.filter((review) => review.isVisible !== false).length}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-gray-600">Response Rate</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {analytics.responseRate}%
            </p>
          </Card>
        </div>
      )}

      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Filter className="h-4 w-4" />
            Filters
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All" },
              { key: "pending", label: "Pending Response" },
              { key: "responded", label: "Responded" },
            ].map((item) => (
              <Button
                key={item.key}
                size="sm"
                variant={filter === item.key ? "primary" : "outline"}
                onClick={() => setFilter(item.key as FilterType)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div className="md:ml-auto">
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortType)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="rating">Highest Rating</option>
            </select>
          </div>
        </div>
      </Card>

      {reviews.length === 0 ? (
        <Card className="p-10 text-center">
          <MessageSquare className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <p className="font-semibold text-gray-900">No reviews found</p>
          <p className="text-sm text-gray-600">
            Try changing your filter or sort options.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="p-5">
              <ReviewCard
                review={review}
                showPropertyName
                showGuestName
              />

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-4">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                    review.isVisible === false
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {review.isVisible === false ? "Hidden" : "Visible"}
                </span>
                <span className="text-xs text-gray-500">
                  Helpful: {Number(review.helpfulCount || 0)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  loading={actionLoading[review.id] === "visibility"}
                  onClick={() => handleVisibilityToggle(review)}
                >
                  {review.isVisible === false ? (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Show Review
                    </>
                  ) : (
                    <>
                      <EyeOff className="mr-2 h-4 w-4" />
                      Hide Review
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  loading={actionLoading[review.id] === "helpful"}
                  onClick={() => handleHelpfulToggle(review)}
                >
                  <Star className="mr-2 h-4 w-4" />
                  Toggle Helpful
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  loading={actionLoading[review.id] === "report"}
                  onClick={() => handleReportReview(review.id)}
                >
                  Report
                </Button>
                {scope === "realtor" && (
                  <Button
                    size="sm"
                    variant="outline"
                    loading={actionLoading[review.id] === "flag"}
                    onClick={() => handleFlagForAdmin(review.id)}
                  >
                    Flag For Admin
                  </Button>
                )}
              </div>

              {scope === "realtor" && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  {review.hostResponse ? (
                    <div className="rounded-lg bg-blue-50 p-3">
                      <p className="text-sm font-semibold text-gray-900">
                        Your Response
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        {review.hostResponse.comment}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {responding === review.id ? (
                        <>
                          <textarea
                            value={responseText}
                            onChange={(event) => setResponseText(event.target.value)}
                            rows={3}
                            maxLength={500}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            placeholder="Write a professional response..."
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {responseText.length}/500
                            </span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setResponding(null);
                                  setResponseText("");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                loading={actionLoading[review.id] === "respond"}
                                onClick={() => void handleRespondToReview(review.id)}
                              >
                                Send Response
                              </Button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setResponding(review.id)}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Respond To Review
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCurrentPage((prev) => Math.max(1, prev + 1))}
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Load More
        </Button>
      </div>
    </div>
  );
};
