"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, Camera, X } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useQuery } from "react-query";
import { bookingService, reviewService } from "@/services";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { Button, Card } from "@/components/ui";

interface DetailedRatings {
  cleanliness: number;
  communication: number;
  checkIn: number;
  accuracy: number;
  location: number;
  value: number;
}

function StarInput({
  value,
  onChange,
  size = "lg",
  accentColor,
}: {
  value: number;
  onChange: (value: number) => void;
  size?: "sm" | "lg";
  accentColor: string;
}) {
  const [hoverValue, setHoverValue] = useState(0);
  const iconSize = size === "lg" ? 36 : 20;

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= (hoverValue || value);
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            className="p-0 bg-transparent border-0 cursor-pointer"
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              size={iconSize}
              style={{
                fill: active ? accentColor : "transparent",
                color: active ? accentColor : "#d1d5db",
                transition: "all 0.2s",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function WriteReviewPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const { brandColor: primaryColor, accentColor } = useRealtorBranding();

  const [authChecked, setAuthChecked] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailedRatings, setDetailedRatings] = useState<DetailedRatings>({
    cleanliness: 0,
    communication: 0,
    checkIn: 0,
    accuracy: 0,
    location: 0,
    value: 0,
  });

  React.useEffect(() => {
    if (!isLoading && (isAuthenticated || !authChecked)) {
      setAuthChecked(true);
    }
  }, [isLoading, isAuthenticated, authChecked]);

  React.useEffect(() => {
    if (authChecked && !isLoading && !isAuthenticated) {
      router.push(`/guest/login?returnTo=/guest/bookings/${bookingId}/review`);
    }
  }, [authChecked, isLoading, isAuthenticated, router, bookingId]);

  const { data: booking, isLoading: bookingLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => bookingService.getBooking(bookingId),
    enabled: !!user && !!bookingId,
  });

  const commentCount = useMemo(() => comment.trim().length, [comment]);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (photos.length + files.length > 5) {
      toast.error("You can upload up to 5 photos");
      return;
    }
    setPhotos((prev) => [...prev, ...files]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (rating === 0) {
      toast.error("Please provide an overall rating");
      return;
    }

    if (comment.trim().length < 50) {
      toast.error("Please write at least 50 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      await reviewService.createReview({
        bookingId,
        rating,
        comment: comment.trim(),
        cleanlinessRating: detailedRatings.cleanliness,
        communicationRating: detailedRatings.communication,
        checkInRating: detailedRatings.checkIn,
        accuracyRating: detailedRatings.accuracy,
        locationRating: detailedRatings.location,
        valueRating: detailedRatings.value,
      });

      toast.success("Review submitted successfully!");
      router.push(`/guest/bookings/${bookingId}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to submit review. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!authChecked || isLoading || bookingLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <GuestHeader
          currentPage="bookings"
          searchPlaceholder="Search your bookings..."
        />
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-1/3 rounded bg-gray-200" />
            <div className="h-56 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <GuestHeader
          currentPage="bookings"
          searchPlaceholder="Search your bookings..."
        />
        <div className="max-w-4xl mx-auto px-6 py-12 flex-1">
          <Card className="p-8 text-center bg-white border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Booking Not Found
            </h2>
            <Link href="/guest/bookings">
              <Button>Back to Bookings</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <GuestHeader
        currentPage="bookings"
        searchPlaceholder="Search your bookings..."
      />

      <main className="max-w-4xl mx-auto w-full px-6 py-10 flex-1">
        <Link
          href={`/guest/bookings/${bookingId}`}
          className="inline-flex items-center gap-2 text-gray-600 mb-6 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>

        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Write a Review
        </h1>
        <p className="text-gray-600 mb-8">
          Share your experience with {booking.property?.title}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 bg-white border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Overall Rating *
            </h2>
            <div className="flex flex-col items-center gap-3">
              <StarInput
                value={rating}
                onChange={setRating}
                size="lg"
                accentColor={accentColor || primaryColor}
              />
              <p className="text-sm text-gray-600">
                {rating === 0 && "Click to rate"}
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Detailed Ratings
            </h2>
            <div className="space-y-4">
              {[
                { key: "cleanliness", label: "Cleanliness" },
                { key: "communication", label: "Communication" },
                { key: "checkIn", label: "Check-in" },
                { key: "accuracy", label: "Accuracy" },
                { key: "location", label: "Location" },
                { key: "value", label: "Value" },
              ].map(({ key, label }) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {label}
                  </span>
                  <StarInput
                    value={detailedRatings[key as keyof DetailedRatings]}
                    onChange={(value) =>
                      setDetailedRatings((prev) => ({ ...prev, [key]: value }))
                    }
                    size="sm"
                    accentColor={accentColor || primaryColor}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-white border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Your Review *
            </h2>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={6}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:outline-none text-sm"
              placeholder="Tell others about your experience at this property. What did you like? What could be improved?"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              Minimum 50 characters ({commentCount}/50)
            </p>
          </Card>

          <Card className="p-6 bg-white border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Add Photos (Optional)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload photos of your stay to help others. Maximum 5 photos.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {photos.map((photo, index) => (
                <div
                  key={`${photo.name}-${index}`}
                  className="relative aspect-square rounded-xl overflow-hidden border border-gray-200"
                >
                  <Image
                    src={URL.createObjectURL(photo)}
                    alt={`Uploaded ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {photos.length < 5 && (
              <label
                htmlFor="photo-upload"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50"
              >
                <Camera className="w-4 h-4" />
                Upload Photos
              </label>
            )}
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="h-12 px-8 rounded-xl text-white"
              style={{ backgroundColor: accentColor || primaryColor }}
              loading={isSubmitting}
            >
              Submit Review
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
