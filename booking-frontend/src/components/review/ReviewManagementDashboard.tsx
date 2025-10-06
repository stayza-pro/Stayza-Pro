"use client";

import React, { useState, useEffect } from "react";
import { Card, Button } from "../ui";
import { ReviewCard } from "./ReviewCard";
import {
  Star,
  MessageSquare,
  TrendingUp,
  Filter,
  ChevronDown,
  BarChart3,
  Users,
  ThumbsUp,
} from "lucide-react";
import { Review } from "../../types";
import { reviewService } from "../../services/reviews";

interface ReviewAnalytics {
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
}

export const ReviewManagementDashboard: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [analytics, setAnalytics] = useState<ReviewAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "responded" | "pending">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "rating">(
    "newest"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [responding, setResponding] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  useEffect(() => {
    loadData();
  }, [currentPage, filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reviewsResponse, analyticsResponse] = await Promise.all([
        reviewService.getRealtorReviews({
          page: currentPage,
          limit: 10,
        }),
        reviewService.getReviewAnalytics(),
      ]);

      let filteredReviews = reviewsResponse.data || [];

      // Apply filters
      if (filter === "responded") {
        filteredReviews = filteredReviews.filter(
          (review) => review.hostResponse
        );
      } else if (filter === "pending") {
        filteredReviews = filteredReviews.filter(
          (review) => !review.hostResponse
        );
      }

      // Apply sorting
      filteredReviews.sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          case "oldest":
            return (
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          case "rating":
            return b.rating - a.rating;
          default:
            return 0;
        }
      });

      setReviews(filteredReviews);
      setAnalytics(analyticsResponse);
    } catch (error) {
      console.error("Failed to load review data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToReview = async (reviewId: string) => {
    if (!responseText.trim()) {
      alert("Please enter a response");
      return;
    }

    try {
      await reviewService.respondToReview(reviewId, responseText);
      setResponding(null);
      setResponseText("");
      loadData(); // Refresh data
    } catch (error) {
      console.error("Failed to respond to review:", error);
      alert("Failed to respond to review. Please try again.");
    }
  };

  const renderRatingDistribution = () => {
    if (!analytics) return null;

    const total = analytics.totalReviews;
    const maxCount = Math.max(...Object.values(analytics.ratingDistribution));

    return (
      <div className="space-y-3">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count =
            analytics.ratingDistribution[
              rating as keyof typeof analytics.ratingDistribution
            ];
          const percentage = total > 0 ? (count / total) * 100 : 0;
          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div key={rating} className="flex items-center space-x-3">
              <span className="text-sm font-medium w-8">{rating} ★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                <div
                  className="bg-yellow-400 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-12 text-right">
                {count} ({percentage.toFixed(0)}%)
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading && !analytics) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Review Management
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor and respond to guest reviews for your properties
          </p>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Reviews */}
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.totalReviews}
                </p>
                <p className="text-sm text-gray-600">Total Reviews</p>
              </div>
            </div>
          </Card>

          {/* Average Rating */}
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.averageRating.toFixed(1)}
                  </p>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(analytics.averageRating)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600">Average Rating</p>
              </div>
            </div>
          </Card>

          {/* Response Rate */}
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <ThumbsUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.responseRate}%
                </p>
                <p className="text-sm text-gray-600">Response Rate</p>
              </div>
            </div>
          </Card>

          {/* Pending Responses */}
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.totalReviews - analytics.responsesGiven}
                </p>
                <p className="text-sm text-gray-600">Pending Responses</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Rating Distribution */}
      {analytics && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Rating Distribution
            </h2>
          </div>
          {renderRatingDistribution()}
        </Card>
      )}

      {/* Filters and Controls */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "All Reviews" },
              { value: "pending", label: "Pending Response" },
              { value: "responded", label: "Responded" },
            ].map((option) => (
              <Button
                key={option.value}
                variant={filter === option.value ? "primary" : "outline"}
                size="sm"
                onClick={() => setFilter(option.value as any)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <div className="ml-auto flex items-center space-x-2">
            <span className="text-sm text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="rating">Highest Rating</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Reviews Found
            </h3>
            <p className="text-gray-600">
              {filter === "pending"
                ? "All reviews have been responded to!"
                : "No reviews match the current filter."}
            </p>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="p-6">
              <ReviewCard
                review={review}
                showPropertyName={true}
                showGuestName={true}
              />

              {/* Response Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                {review.hostResponse ? (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">
                          Your Response
                        </h4>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {review.hostResponse.comment}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Responded on{" "}
                          {new Date(
                            review.hostResponse.createdAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {responding === review.id ? (
                      <div className="space-y-4">
                        <textarea
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows={3}
                          placeholder="Write a professional response to this review..."
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          maxLength={500}
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            {responseText.length}/500 characters
                          </span>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setResponding(null);
                                setResponseText("");
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleRespondToReview(review.id)}
                              disabled={!responseText.trim()}
                            >
                              Send Response
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setResponding(review.id)}
                        className="w-full sm:w-auto"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Respond to Review
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
