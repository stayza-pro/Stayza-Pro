"use client";

import React, { useState, useEffect } from "react";
import { ReviewCard } from "./ReviewCard";
import { Button, Loading } from "../ui";
import { Filter, Star, Search } from "lucide-react";
import { Review, User, PaginationInfo } from "../../types";

interface ReviewListProps {
  reviews: Review[];
  totalReviews?: number;
  averageRating?: number;
  currentUser?: User;
  isLoading?: boolean;
  pagination?: PaginationInfo;
  showPropertyName?: boolean;
  showGuestName?: boolean;
  showFilters?: boolean;
  showSorting?: boolean;
  onLoadMore?: () => void;
  onLike?: (reviewId: string) => void;
  onDislike?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
  onDelete?: (reviewId: string) => void;
  onFilterChange?: (filters: ReviewFilters) => void;
  onSortChange?: (sort: ReviewSort) => void;
  className?: string;
}

interface ReviewFilters {
  rating?: number;
  dateRange?: string;
  verified?: boolean;
  hasResponse?: boolean;
  searchTerm?: string;
}

interface ReviewSort {
  field: "createdAt" | "rating" | "helpful";
  order: "asc" | "desc";
}

export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  totalReviews = 0,
  averageRating = 0,
  currentUser,
  isLoading = false,
  pagination,
  showPropertyName = false,
  showGuestName = true,
  showFilters = true,
  showSorting = true,
  onLoadMore,
  onLike,
  onDislike,
  onReport,
  onDelete,
  onFilterChange,
  onSortChange,
  className = "",
}) => {
  const [filters, setFilters] = useState<ReviewFilters>({});
  const [sort, setSort] = useState<ReviewSort>({
    field: "createdAt",
    order: "desc",
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Handle filter changes
  useEffect(() => {
    const delayedFilter = setTimeout(() => {
      const updatedFilters = { ...filters, searchTerm };
      onFilterChange?.(updatedFilters);
    }, 300);

    return () => clearTimeout(delayedFilter);
  }, [filters, searchTerm, onFilterChange]);

  // Handle sort changes
  useEffect(() => {
    onSortChange?.(sort);
  }, [sort, onSortChange]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= Math.floor(rating)
                ? "text-yellow-400 fill-current"
                : star <= rating
                ? "text-yellow-400 fill-current opacity-50"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  const handleRatingFilter = (rating: number) => {
    setFilters((prev) => ({
      ...prev,
      rating: prev.rating === rating ? undefined : rating,
    }));
  };

  const handleFilterChange = (key: keyof ReviewFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
  };

  const ratingDistribution = getRatingDistribution();
  const hasActiveFilters = Object.values(filters).some(Boolean) || searchTerm;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Reviews Summary */}
      {totalReviews > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {totalReviews} Review{totalReviews !== 1 ? "s" : ""}
              </h2>
              <div className="flex items-center space-x-3 mt-2">
                {renderStars(averageRating)}
                <span className="text-xl font-semibold text-gray-900">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-gray-600">out of 5</span>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div
                  key={rating}
                  className="flex items-center space-x-2 text-sm"
                >
                  <span className="w-8 text-right">{rating}</span>
                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{
                        width: `${
                          totalReviews > 0
                            ? (ratingDistribution[
                                rating as keyof typeof ratingDistribution
                              ] /
                                totalReviews) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-gray-600">
                    {
                      ratingDistribution[
                        rating as keyof typeof ratingDistribution
                      ]
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md border ${
                  hasActiveFilters
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                    Active
                  </span>
                )}
              </button>

              {showSorting && (
                <select
                  value={`${sort.field}-${sort.order}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split("-");
                    setSort({
                      field: field as ReviewSort["field"],
                      order: order as ReviewSort["order"],
                    });
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="rating-desc">Highest Rated</option>
                  <option value="rating-asc">Lowest Rated</option>
                  <option value="helpful-desc">Most Helpful</option>
                </select>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
          </div>

          {/* Filter Panel */}
          {showFilterPanel && (
            <div className="border-t border-gray-200 pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleRatingFilter(rating)}
                        className={`flex items-center space-x-2 w-full px-2 py-1 rounded text-sm ${
                          filters.rating === rating
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {renderStars(rating)}
                        <span>& up</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range
                  </label>
                  <select
                    value={filters.dateRange || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        "dateRange",
                        e.target.value || undefined
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Time</option>
                    <option value="week">Past Week</option>
                    <option value="month">Past Month</option>
                    <option value="3months">Past 3 Months</option>
                    <option value="year">Past Year</option>
                  </select>
                </div>

                {/* Verified Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.verified || false}
                      onChange={(e) =>
                        handleFilterChange(
                          "verified",
                          e.target.checked || undefined
                        )
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Verified stays only
                    </span>
                  </label>
                </div>

                {/* Host Response Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Host Response
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.hasResponse || false}
                      onChange={(e) =>
                        handleFilterChange(
                          "hasResponse",
                          e.target.checked || undefined
                        )
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Has host response
                    </span>
                  </label>
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="flex justify-end">
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading && reviews.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loading size="lg" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No reviews yet
            </h3>
            <p className="text-gray-600">
              {hasActiveFilters
                ? "No reviews match your current filters. Try adjusting your search criteria."
                : "Be the first to leave a review for this property."}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                currentUser={currentUser}
                showPropertyName={showPropertyName}
                showGuestName={showGuestName}
                onLike={onLike}
                onDislike={onDislike}
                onReport={onReport}
                onDelete={onDelete}
              />
            ))}

            {/* Load More */}
            {pagination && pagination.hasMore && (
              <div className="flex justify-center py-6">
                <Button
                  variant="outline"
                  onClick={onLoadMore}
                  loading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Load More Reviews"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Results Info */}
      {reviews.length > 0 && pagination && (
        <div className="text-center text-sm text-gray-600 py-4">
          Showing {reviews.length} of {pagination.total} reviews
        </div>
      )}
    </div>
  );
};
