"use client";

import React, { useState, useRef } from "react";
import { Button, Card } from "../ui";
import { Star, Upload, X, Camera, MessageSquare } from "lucide-react";
import { ReviewFormData } from "../../types";
import { reviewService } from "../../services/reviews";

interface ReviewFormProps {
  bookingId: string;
  propertyTitle?: string;
  onSubmit?: (data: ReviewFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  bookingId,
  propertyTitle = "this property",
  onSubmit,
  onCancel,
  isLoading = false,
  className = "",
}) => {
  const [formData, setFormData] = useState<ReviewFormData>({
    bookingId,
    rating: 0,
    comment: "",
    cleanlinessRating: 0,
    communicationRating: 0,
    checkInRating: 0,
    accuracyRating: 0,
    locationRating: 0,
    valueRating: 0,
    photos: [],
  });

  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ratingCategories = [
    {
      key: "cleanlinessRating" as keyof ReviewFormData,
      label: "Cleanliness",
      icon: "🧹",
    },
    {
      key: "communicationRating" as keyof ReviewFormData,
      label: "Communication",
      icon: "💬",
    },
    {
      key: "checkInRating" as keyof ReviewFormData,
      label: "Check-in",
      icon: "🔑",
    },
    {
      key: "accuracyRating" as keyof ReviewFormData,
      label: "Accuracy",
      icon: "✅",
    },
    {
      key: "locationRating" as keyof ReviewFormData,
      label: "Location",
      icon: "📍",
    },
    { key: "valueRating" as keyof ReviewFormData, label: "Value", icon: "💰" },
  ];

  const handleRatingChange = (field: keyof ReviewFormData, rating: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: rating,
    }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      const isValidType = file.type.startsWith("image/");
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setPhotoUploadError(
        "Some files were skipped. Only images under 5MB are allowed."
      );
    } else {
      setPhotoUploadError(null);
    }

    // Limit to 5 photos total
    const currentCount = uploadedPhotos.length;
    const remainingSlots = 5 - currentCount;
    const filesToAdd = validFiles.slice(0, remainingSlots);

    setUploadedPhotos((prev) => [...prev, ...filesToAdd]);
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoUploadError(null);
  };

  const renderStarRating = (
    value: number,
    onChange: (rating: number) => void,
    size: "small" | "large" = "small"
  ) => {
    const starSize = size === "large" ? "w-8 h-8" : "w-5 h-5";

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`${starSize} text-gray-300 hover:text-yellow-400 focus:outline-none transition-colors`}
          >
            <Star
              className={`w-full h-full ${
                star <= value ? "text-yellow-400 fill-current" : ""
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.rating === 0) {
      alert("Please provide an overall rating");
      return;
    }

    if (!formData.comment?.trim()) {
      alert("Please write a comment about your experience");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload photos first if any
      let photoUrls: Array<{ url: string; caption?: string }> = [];

      if (uploadedPhotos.length > 0) {
        photoUrls = await reviewService.uploadReviewPhotos(uploadedPhotos);
      }

      const reviewData: ReviewFormData = {
        ...formData,
        photos: photoUrls,
      };

      if (onSubmit) {
        await onSubmit(reviewData);
      } else {
        await reviewService.createReview(reviewData);
      }

      // Reset form
      setFormData({
        bookingId,
        rating: 0,
        comment: "",
        cleanlinessRating: 0,
        communicationRating: 0,
        checkInRating: 0,
        accuracyRating: 0,
        locationRating: 0,
        valueRating: 0,
        photos: [],
      });
      setUploadedPhotos([]);
    } catch (error) {
      console.error("Failed to submit review:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
      <Card className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Review Your Stay
          </h1>
          <p className="text-gray-600">
            Share your experience at {propertyTitle} to help other travelers
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Overall Rating */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Overall Rating
            </h3>
            <div className="flex items-center space-x-4">
              {renderStarRating(
                formData.rating,
                (rating) => handleRatingChange("rating", rating),
                "large"
              )}
              <span className="text-gray-600">
                {formData.rating > 0 && (
                  <>
                    {formData.rating}.0{" "}
                    {formData.rating === 5
                      ? "(Excellent)"
                      : formData.rating === 4
                      ? "(Good)"
                      : formData.rating === 3
                      ? "(Average)"
                      : formData.rating === 2
                      ? "(Poor)"
                      : "(Terrible)"}
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Detailed Ratings */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Detailed Ratings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ratingCategories.map((category) => (
                <div key={category.key} className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    <span className="text-lg">{category.icon}</span>
                    <span>{category.label}</span>
                  </label>
                  {renderStarRating(
                    (formData[category.key] as number) ?? 0,
                    (rating) => handleRatingChange(category.key, rating)
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-4">
            <label
              htmlFor="comment"
              className="flex items-center space-x-2 text-lg font-semibold text-gray-900"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Your Review</span>
            </label>
            <textarea
              id="comment"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Tell future guests about your experience. What did you love? What could be improved?"
              value={formData.comment}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, comment: e.target.value }))
              }
              maxLength={1000}
            />
            <div className="text-right text-sm text-gray-500">
              {formData.comment?.length ?? 0}/1000 characters
            </div>
          </div>

          {/* Photo Upload */}
          <div className="space-y-4">
            <label className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
              <Camera className="w-5 h-5" />
              <span>Add Photos</span>
              <span className="text-sm font-normal text-gray-500">
                (Optional, up to 5 photos)
              </span>
            </label>

            <div className="space-y-4">
              {/* Upload Button */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadedPhotos.length >= 5}
                  className="w-full sm:w-auto"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadedPhotos.length === 0
                    ? "Add Photos"
                    : `Add More Photos (${uploadedPhotos.length}/5)`}
                </Button>

                {photoUploadError && (
                  <p className="mt-2 text-sm text-red-600">
                    {photoUploadError}
                  </p>
                )}
              </div>

              {/* Photo Previews */}
              {uploadedPhotos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {uploadedPhotos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="w-full sm:w-auto"
              disabled={isSubmitting || isLoading || formData.rating === 0}
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
