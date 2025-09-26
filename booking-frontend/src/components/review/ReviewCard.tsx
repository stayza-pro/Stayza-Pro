"use client";

import React, { useState } from "react";
import { Card } from "../ui";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Flag,
  MoreHorizontal,
  User,
} from "lucide-react";
import { Review, User as UserType } from "../../types";

interface ReviewCardProps {
  review: Review;
  currentUser?: UserType;
  onLike?: (reviewId: string) => void;
  onDislike?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
  onDelete?: (reviewId: string) => void;
  showPropertyName?: boolean;
  showGuestName?: boolean;
  className?: string;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  currentUser,
  onLike,
  onDislike,
  onReport,
  onDelete,
  showPropertyName = false,
  showGuestName = true,
  className = "",
}) => {
  const [showFullComment, setShowFullComment] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingLabel = (rating: number): string => {
    const labels = {
      5: "Excellent",
      4: "Good",
      3: "Average",
      2: "Poor",
      1: "Terrible",
    };
    return labels[rating as keyof typeof labels] || "Unrated";
  };

  const canDeleteReview =
    currentUser &&
    (currentUser.id === review.guest.id ||
      currentUser.role === "ADMIN" ||
      (currentUser.role === "HOST" &&
        review.property?.hostId === currentUser.id));

  const truncateComment = (
    comment: string,
    maxLength: number = 200
  ): string => {
    if (comment.length <= maxLength) return comment;
    return comment.substring(0, maxLength) + "...";
  };

  const handleActionClick = (action: string) => {
    switch (action) {
      case "like":
        onLike?.(review.id);
        break;
      case "dislike":
        onDislike?.(review.id);
        break;
      case "report":
        onReport?.(review.id);
        break;
      case "delete":
        if (window.confirm("Are you sure you want to delete this review?")) {
          onDelete?.(review.id);
        }
        break;
    }
    setShowActions(false);
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            {/* Guest Avatar */}
            <div className="flex-shrink-0">
              {showGuestName ? (
                <img
                  src={review.guest.avatar || "/default-avatar.png"}
                  alt={`${review.guest.firstName} ${review.guest.lastName}`}
                  className="w-12 h-12 object-cover rounded-full"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-500" />
                </div>
              )}
            </div>

            {/* Review Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {showGuestName
                    ? `${review.guest.firstName} ${review.guest.lastName}`
                    : "Anonymous Guest"}
                </h3>
                <div className="flex items-center space-x-2">
                  {renderStars(review.rating)}
                  <span className="text-sm font-medium text-gray-900">
                    {review.rating}.0
                  </span>
                  <span className="text-sm text-gray-500">
                    ({getRatingLabel(review.rating)})
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 mt-1">
                <p className="text-sm text-gray-600">
                  {formatDate(review.createdAt)}
                </p>

                {review.isVerified && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Verified Stay
                  </span>
                )}
              </div>

              {/* Property Name (if shown) */}
              {showPropertyName && review.property && (
                <p className="text-sm text-gray-600 mt-1">
                  Stayed at{" "}
                  <span className="font-medium">{review.property.title}</span>
                </p>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>

            {showActions && (
              <div className="absolute right-0 top-10 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  {onReport && (
                    <button
                      onClick={() => handleActionClick("report")}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <Flag className="h-4 w-4 mr-3" />
                      Report Review
                    </button>
                  )}

                  {canDeleteReview && onDelete && (
                    <button
                      onClick={() => handleActionClick("delete")}
                      className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      Delete Review
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Review Comment */}
        <div className="space-y-3">
          <div className="text-gray-700 leading-relaxed">
            {review.comment ? (
              showFullComment || review.comment.length <= 200 ? (
                <p>{review.comment}</p>
              ) : (
                <div>
                  <p>{truncateComment(review.comment)}</p>
                  <button
                    onClick={() => setShowFullComment(true)}
                    className="text-blue-600 hover:underline text-sm mt-2"
                  >
                    Read more
                  </button>
                </div>
              )
            ) : (
              <p className="text-gray-500 italic">No comment provided</p>
            )}

            {showFullComment &&
              review.comment &&
              review.comment.length > 200 && (
                <button
                  onClick={() => setShowFullComment(false)}
                  className="text-blue-600 hover:underline text-sm mt-2"
                >
                  Show less
                </button>
              )}
          </div>
        </div>

        {/* Host Response */}
        {review.hostResponse && (
          <div className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 rounded-r">
            <div className="flex items-start space-x-3">
              <img
                src={review.property?.host?.avatar || "/default-avatar.png"}
                alt="Host"
                className="w-8 h-8 object-cover rounded-full flex-shrink-0"
              />

              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Response from Host
                  </h4>
                  <span className="text-xs text-gray-500">
                    {formatDate(review.hostResponse.createdAt)}
                  </span>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed">
                  {review.hostResponse.comment}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Review Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            {/* Like/Dislike */}
            {onLike && onDislike && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleActionClick("like")}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${
                    review.userLiked
                      ? "bg-green-100 text-green-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>{review.likesCount || 0}</span>
                </button>

                <button
                  onClick={() => handleActionClick("dislike")}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${
                    review.userDisliked
                      ? "bg-red-100 text-red-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span>{review.dislikesCount || 0}</span>
                </button>
              </div>
            )}
          </div>

          {/* Review Stats */}
          <div className="text-sm text-gray-500">
            {(review.helpfulCount ?? 0) > 0 && (
              <span>{review.helpfulCount} found this helpful</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
