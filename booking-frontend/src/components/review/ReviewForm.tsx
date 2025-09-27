"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button, Card, Loading } from "../ui";
import { Star, MessageSquare, AlertCircle, CheckCircle } from "lucide-react";
import { ReviewFormData, Booking } from "../../types";

interface ReviewFormProps {
  booking: Booking;
  onSubmit: (data: ReviewFormData) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  booking,
  onSubmit,
  isLoading = false,
  className = "",
}) => {
  const [formData, setFormData] = useState<Partial<ReviewFormData>>({
    bookingId: booking.id,
    rating: 0,
    comment: "",
  });

  const [hoveredRating, setHoveredRating] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ratingLabels = {
    1: "Terrible",
    2: "Poor",
    3: "Average",
    4: "Good",
    5: "Excellent",
  };

  const ratingDescriptions = {
    1: "Had major issues with this booking",
    2: "Below expectations, several problems",
    3: "Met basic expectations",
    4: "Good experience with minor issues",
    5: "Outstanding experience, exceeded expectations",
  };

  const handleRatingClick = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }));

    // Clear rating error
    if (errors.rating) {
      setErrors((prev) => ({ ...prev, rating: "" }));
    }
  };

  const handleCommentChange = (comment: string) => {
    setFormData((prev) => ({ ...prev, comment }));

    // Clear comment error
    if (errors.comment) {
      setErrors((prev) => ({ ...prev, comment: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
      newErrors.rating = "Please select a rating";
    }

    if (!formData.comment || formData.comment.trim().length < 10) {
      newErrors.comment = "Please provide a review with at least 10 characters";
    }

    if (formData.comment && formData.comment.length > 1000) {
      newErrors.comment = "Review cannot exceed 1000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData as ReviewFormData);
    } catch (error) {
      console.error("Review submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const currentRating = hoveredRating || formData.rating || 0;

  return (
    <div className={`max-w-2xl mx-auto space-y-6 ${className}`}>
      {/* Booking Summary */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          How was your stay?
        </h2>

        <div className="flex items-start space-x-4">
          <Image
            src={booking.property.images[0] || "/placeholder-image.jpg"}
            alt={booking.property.title}
            width={64}
            height={64}
            className="w-16 h-16 object-cover rounded-lg"
            unoptimized
          />

          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-1">
              {booking.property.title}
            </h3>
            <p className="text-gray-600 text-sm mb-2">
              {booking.property.city}, {booking.property.country}
            </p>
            <p className="text-gray-600 text-sm">
              {formatDate(booking.checkInDate)} -{" "}
              {formatDate(booking.checkOutDate)}
            </p>
          </div>
        </div>
      </Card>

      {/* Review Form */}
      <form onSubmit={handleSubmit}>
        <Card className="p-6">
          <div className="space-y-6">
            {/* Rating Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Overall Rating *
              </label>

              <div className="flex items-center space-x-2 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    disabled={isLoading || isSubmitting}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        star <= currentRating
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300 hover:text-yellow-200"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {currentRating > 0 && (
                <div className="text-center">
                  <div className="text-lg font-medium text-gray-900">
                    {ratingLabels[currentRating as keyof typeof ratingLabels]}
                  </div>
                  <div className="text-sm text-gray-600">
                    {
                      ratingDescriptions[
                        currentRating as keyof typeof ratingDescriptions
                      ]
                    }
                  </div>
                </div>
              )}

              {errors.rating && (
                <p className="text-red-500 text-sm mt-2">{errors.rating}</p>
              )}
            </div>

            {/* Comment Section */}
            <div>
              <label
                htmlFor="comment"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Share your experience *
              </label>
              <div className="relative">
                <MessageSquare className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                <textarea
                  id="comment"
                  value={formData.comment || ""}
                  onChange={(e) => handleCommentChange(e.target.value)}
                  rows={5}
                  placeholder="Tell future guests about your experience. What did you like most? Any suggestions for improvement?"
                  disabled={isLoading || isSubmitting}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    errors.comment ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>

              <div className="flex justify-between items-center mt-2">
                <div>
                  {errors.comment && (
                    <p className="text-red-500 text-sm">{errors.comment}</p>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {formData.comment?.length || 0}/1000
                </p>
              </div>
            </div>

            {/* Review Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    Review Guidelines
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Be honest and fair in your assessment</li>
                    <li>• Focus on your actual experience during the stay</li>
                    <li>• Be respectful in your language and tone</li>
                    <li>• Avoid sharing personal information</li>
                    <li>
                      • Reviews help other travelers make informed decisions
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Terms Notice */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-700">
                    By submitting this review, you confirm that it reflects your
                    genuine experience and agree to our{" "}
                    <a href="#" className="text-blue-600 hover:underline">
                      Review Policy
                    </a>
                    . Reviews may be moderated and published publicly to help
                    other travelers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            disabled={isLoading || isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={isLoading || isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <Loading size="sm" />
                <span className="ml-2">Submitting...</span>
              </div>
            ) : (
              "Submit Review"
            )}
          </Button>
        </div>
      </form>

      {/* Host Information */}
      <Card className="p-6 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          About Your Host
        </h3>

        <div className="flex items-center space-x-4">
          <Image
            src={booking.property.host.avatar || "/default-avatar.png"}
            alt={`${booking.property.host.firstName} ${booking.property.host.lastName}`}
            width={48}
            height={48}
            className="w-12 h-12 object-cover rounded-full"
            unoptimized
          />

          <div>
            <h4 className="font-medium text-gray-900">
              {booking.property.host.firstName} {booking.property.host.lastName}
            </h4>
            <p className="text-gray-600 text-sm">Property Host</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-3">
          Your review will be visible to {booking.property.host.firstName} and
          can help them improve their hosting experience. Please be constructive
          in your feedback.
        </p>
      </Card>
    </div>
  );
};
