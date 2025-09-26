"use client";

import React from "react";
import { Star } from "lucide-react";

interface RatingDisplayProps {
  rating: number;
  reviewCount?: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg" | "xl";
  showNumber?: boolean;
  showReviewCount?: boolean;
  showLabel?: boolean;
  interactive?: boolean;
  distribution?: Record<number, number>;
  className?: string;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({
  rating,
  reviewCount = 0,
  maxRating = 5,
  size = "md",
  showNumber = true,
  showReviewCount = true,
  showLabel = false,
  interactive = false,
  distribution,
  className = "",
}) => {
  const sizeClasses = {
    sm: {
      star: "h-3 w-3",
      text: "text-sm",
      number: "text-sm",
      label: "text-xs",
    },
    md: {
      star: "h-4 w-4",
      text: "text-base",
      number: "text-base",
      label: "text-sm",
    },
    lg: {
      star: "h-5 w-5",
      text: "text-lg",
      number: "text-lg",
      label: "text-base",
    },
    xl: {
      star: "h-6 w-6",
      text: "text-xl",
      number: "text-xl",
      label: "text-lg",
    },
  };

  const classes = sizeClasses[size];

  const getRatingLabel = (rating: number): string => {
    if (rating >= 4.5) return "Excellent";
    if (rating >= 4.0) return "Good";
    if (rating >= 3.0) return "Average";
    if (rating >= 2.0) return "Poor";
    return "Terrible";
  };

  const renderStars = () => {
    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: maxRating }, (_, index) => {
          const starNumber = index + 1;
          const isFilled = starNumber <= Math.floor(rating);
          const isHalfFilled =
            starNumber === Math.ceil(rating) && rating % 1 !== 0;

          return (
            <div key={starNumber} className="relative">
              <Star
                className={`${classes.star} transition-colors ${
                  isFilled ? "text-yellow-400 fill-current" : "text-gray-300"
                } ${interactive ? "cursor-pointer hover:scale-110" : ""}`}
              />
              {isHalfFilled && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${(rating % 1) * 100}%` }}
                >
                  <Star
                    className={`${classes.star} text-yellow-400 fill-current`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderDistribution = () => {
    if (!distribution) return null;

    const total = Object.values(distribution).reduce(
      (sum, count) => sum + count,
      0
    );

    return (
      <div className="space-y-2 mt-4">
        <h4 className={`font-medium text-gray-900 ${classes.text}`}>
          Rating Breakdown
        </h4>
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution[star] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;

          return (
            <div key={star} className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 w-12">
                <span className={`${classes.label} text-gray-700`}>{star}</span>
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
              </div>

              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className={`${classes.label} text-gray-600 w-8 text-right`}>
                {count}
              </div>

              <div className={`${classes.label} text-gray-500 w-12 text-right`}>
                {percentage.toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`inline-flex flex-col ${className}`}>
      {/* Main Rating Display */}
      <div className="flex items-center space-x-2">
        {renderStars()}

        {showNumber && (
          <div className="flex items-center space-x-1">
            <span className={`font-semibold text-gray-900 ${classes.number}`}>
              {rating.toFixed(1)}
            </span>
            <span className={`text-gray-600 ${classes.label}`}>
              / {maxRating}
            </span>
          </div>
        )}

        {showReviewCount && reviewCount > 0 && (
          <span className={`text-gray-600 ${classes.text}`}>
            ({reviewCount.toLocaleString()} review{reviewCount !== 1 ? "s" : ""}
            )
          </span>
        )}

        {showLabel && (
          <span className={`text-gray-700 font-medium ${classes.text}`}>
            {getRatingLabel(rating)}
          </span>
        )}
      </div>

      {/* Rating Distribution */}
      {distribution && renderDistribution()}
    </div>
  );
};

// Compact version for inline display
interface CompactRatingProps {
  rating: number;
  reviewCount?: number;
  className?: string;
}

export const CompactRating: React.FC<CompactRatingProps> = ({
  rating,
  reviewCount,
  className = "",
}) => {
  return (
    <div className={`inline-flex items-center space-x-1 ${className}`}>
      <Star className="h-4 w-4 text-yellow-400 fill-current" />
      <span className="text-sm font-medium text-gray-900">
        {rating.toFixed(1)}
      </span>
      {reviewCount !== undefined && (
        <span className="text-sm text-gray-600">({reviewCount})</span>
      )}
    </div>
  );
};

// Interactive rating selector for forms
interface RatingSelectProps {
  value: number;
  onChange: (rating: number) => void;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
}

export const RatingSelect: React.FC<RatingSelectProps> = ({
  value,
  onChange,
  maxRating = 5,
  size = "md",
  disabled = false,
  required = false,
  error,
  className = "",
}) => {
  const [hoveredRating, setHoveredRating] = React.useState(0);

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const starSize = sizeClasses[size];
  const displayRating = hoveredRating || value;

  const ratingLabels = {
    1: "Terrible",
    2: "Poor",
    3: "Average",
    4: "Good",
    5: "Excellent",
  };

  return (
    <div className={className}>
      <div className="flex items-center space-x-1">
        {Array.from({ length: maxRating }, (_, index) => {
          const starNumber = index + 1;
          const isFilled = starNumber <= displayRating;

          return (
            <button
              key={starNumber}
              type="button"
              disabled={disabled}
              onClick={() => onChange(starNumber)}
              onMouseEnter={() => setHoveredRating(starNumber)}
              onMouseLeave={() => setHoveredRating(0)}
              className={`transition-all duration-150 ${
                disabled
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer hover:scale-110"
              } focus:outline-none focus:ring-2 focus:ring-blue-500 rounded`}
              aria-label={`Rate ${starNumber} star${
                starNumber !== 1 ? "s" : ""
              }`}
            >
              <Star
                className={`${starSize} transition-colors ${
                  isFilled
                    ? "text-yellow-400 fill-current"
                    : "text-gray-300 hover:text-yellow-200"
                }`}
              />
            </button>
          );
        })}

        {required && <span className="text-red-500 ml-1">*</span>}
      </div>

      {/* Rating Label */}
      {displayRating > 0 && (
        <div className="mt-2 text-center">
          <span className="text-sm font-medium text-gray-900">
            {ratingLabels[displayRating as keyof typeof ratingLabels]}
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};
