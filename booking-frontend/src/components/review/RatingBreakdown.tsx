"use client";

import React from "react";
import { Star } from "lucide-react";
import { Review } from "../../types";

interface RatingBreakdownProps {
  review?: Review;
  ratings?: {
    overall?: number;
    cleanliness?: number;
    communication?: number;
    checkIn?: number;
    accuracy?: number;
    location?: number;
    value?: number;
  };
  showLabels?: boolean;
  size?: "small" | "medium" | "large";
  className?: string;
}

export const RatingBreakdown: React.FC<RatingBreakdownProps> = ({
  review,
  ratings,
  showLabels = true,
  size = "medium",
  className = "",
}) => {
  // Extract ratings from review or use provided ratings
  const ratingData = ratings || {
    overall: review?.rating,
    cleanliness: review?.cleanlinessRating,
    communication: review?.communicationRating,
    checkIn: review?.checkInRating,
    accuracy: review?.accuracyRating,
    location: review?.locationRating,
    value: review?.valueRating,
  };

  const ratingCategories = [
    {
      key: "overall",
      label: "Overall Experience",
      icon: "⭐",
      value: ratingData.overall,
      description: "Overall rating of the stay",
    },
    {
      key: "cleanliness",
      label: "Cleanliness",
      icon: "🧹",
      value: ratingData.cleanliness,
      description: "How clean was the property",
    },
    {
      key: "communication",
      label: "Communication",
      icon: "💬",
      value: ratingData.communication,
      description: "Host responsiveness and clarity",
    },
    {
      key: "checkIn",
      label: "Check-in Process",
      icon: "🔑",
      value: ratingData.checkIn,
      description: "Ease of check-in experience",
    },
    {
      key: "accuracy",
      label: "Listing Accuracy",
      icon: "✅",
      value: ratingData.accuracy,
      description: "How accurate was the listing",
    },
    {
      key: "location",
      label: "Location",
      icon: "📍",
      value: ratingData.location,
      description: "Neighborhood and area quality",
    },
    {
      key: "value",
      label: "Value for Money",
      icon: "💰",
      value: ratingData.value,
      description: "Price relative to quality",
    },
  ];

  const getStarSize = () => {
    switch (size) {
      case "small":
        return "w-3 h-3";
      case "large":
        return "w-6 h-6";
      default:
        return "w-4 h-4";
    }
  };

  const getTextSize = () => {
    switch (size) {
      case "small":
        return "text-xs";
      case "large":
        return "text-base";
      default:
        return "text-sm";
    }
  };

  const renderStars = (rating: number | undefined) => {
    if (rating === undefined || rating === null) return null;

    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${getStarSize()} ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingText = (rating: number | undefined) => {
    if (rating === undefined || rating === null) return "Not rated";

    const labels = {
      5: "Excellent",
      4: "Good",
      3: "Average",
      2: "Poor",
      1: "Terrible",
    };

    return `${rating}.0 - ${labels[rating as keyof typeof labels]}`;
  };

  const getAverageDetailedRating = () => {
    const detailedRatings = [
      ratingData.cleanliness,
      ratingData.communication,
      ratingData.checkIn,
      ratingData.accuracy,
      ratingData.location,
      ratingData.value,
    ].filter((rating) => rating !== undefined && rating !== null) as number[];

    if (detailedRatings.length === 0) return null;

    return (
      detailedRatings.reduce((sum, rating) => sum + rating, 0) /
      detailedRatings.length
    );
  };

  const averageDetailed = getAverageDetailedRating();
  const hasDetailedRatings = ratingCategories
    .slice(1)
    .some((category) => category.value !== undefined);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Rating - Always show if available */}
      {ratingData.overall && (
        <div className="pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⭐</span>
              <div>
                <h3
                  className={`font-semibold text-gray-900 ${
                    size === "large" ? "text-lg" : "text-base"
                  }`}
                >
                  Overall Rating
                </h3>
                {showLabels && (
                  <p className={`text-gray-600 ${getTextSize()}`}>
                    {getRatingText(ratingData.overall)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {renderStars(ratingData.overall)}
              <span className={`font-semibold text-gray-900 ${getTextSize()}`}>
                {ratingData.overall}.0
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Ratings */}
      {hasDetailedRatings && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h4
              className={`font-medium text-gray-900 ${
                size === "large" ? "text-base" : "text-sm"
              }`}
            >
              Detailed Ratings
            </h4>
            {averageDetailed && (
              <div className="flex items-center space-x-2 text-gray-600">
                <span className={getTextSize()}>
                  Avg: {averageDetailed.toFixed(1)}
                </span>
                {renderStars(Math.round(averageDetailed))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {ratingCategories.slice(1).map((category) => {
              if (category.value === undefined) return null;

              return (
                <div
                  key={category.key}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <span
                      className={size === "large" ? "text-lg" : "text-base"}
                    >
                      {category.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span
                        className={`font-medium text-gray-900 ${getTextSize()}`}
                      >
                        {category.label}
                      </span>
                      {showLabels && size !== "small" && (
                        <p
                          className={`text-gray-500 ${
                            size === "large" ? "text-sm" : "text-xs"
                          }`}
                        >
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span
                      className={`text-gray-900 font-medium ${getTextSize()}`}
                    >
                      {category.value}.0
                    </span>
                    {renderStars(category.value)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No ratings message */}
      {!ratingData.overall && !hasDetailedRatings && (
        <div className="text-center py-8 text-gray-500">
          <Star className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className={getTextSize()}>No ratings available</p>
        </div>
      )}
    </div>
  );
};
