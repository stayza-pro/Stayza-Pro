"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Star, Upload, X, ArrowLeft, Camera } from "lucide-react";
import Image from "next/image";
import { Footer } from "@/components/guest/sections";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { Card, Button, Input } from "@/components/ui";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { useQuery } from "react-query";
import { bookingService, reviewService } from "@/services";
import toast from "react-hot-toast";

export default function WriteReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const {
    brandColor: primaryColor, // 60% - Primary brand color for backgrounds and dominant elements
    secondaryColor, // 30% - Secondary color for text, labels, and borders
    accentColor, // 10% - Accent color for CTAs, highlights, and interactive elements
    realtorName,
    logoUrl,
    tagline,
    description,
  } = useRealtorBranding();
  const bookingId = params.id as string;
  const [authChecked, setAuthChecked] = useState(false);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [detailedRatings, setDetailedRatings] = useState({
    cleanliness: 0,
    communication: 0,
    checkIn: 0,
    accuracy: 0,
    location: 0,
    value: 0,
  });

  // Fetch booking details
  const { data: booking, isLoading: bookingLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => bookingService.getBooking(bookingId),
    enabled: !!user && !!bookingId,
  });

  // Mark auth as checked once we've gotten a result
  React.useEffect(() => {
    if (!isLoading && (isAuthenticated || !authChecked)) {
      setAuthChecked(true);
    }
  }, [isLoading, isAuthenticated, authChecked]);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (authChecked && !isLoading && !isAuthenticated) {
      router.push(`/guest/login?returnTo=/guest/bookings/${bookingId}/review`);
    }
  }, [isLoading, isAuthenticated, authChecked, router, bookingId]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 5) {
      alert("You can upload up to 5 photos");
      return;
    }
    setPhotos([...photos, ...files]);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      alert("Please provide an overall rating");
      return;
    }

    if (!comment.trim()) {
      alert("Please write a review");
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
    } catch (error: any) {
      toast.error(
        error.message || "Failed to submit review. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({
    value,
    onChange,
    size = "large",
  }: {
    value: number;
    onChange: (rating: number) => void;
    size?: "small" | "large";
  }) => {
    const [hover, setHover] = useState(0);
    const starSizeNum = size === "large" ? 40 : 24;

    return (
      <div style={{ display: "flex", gap: "0.25rem" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            style={{
              outline: "none",
              cursor: "pointer",
              background: "none",
              border: "none",
              padding: 0,
            }}
          >
            <Star
              size={starSizeNum}
              style={{
                fill: star <= (hover || value) ? accentColor : "transparent", // 10% - Accent for active stars
                color:
                  star <= (hover || value)
                    ? accentColor
                    : `${secondaryColor}30`, // 30% - Secondary for inactive
                transition: "all 0.2s",
              }}
            />
          </button>
        ))}
      </div>
    );
  };

  if (!authChecked || isLoading || bookingLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: `linear-gradient(135deg, ${primaryColor}08 0%, ${primaryColor}03 100%)`, // 60% - Subtle primary background
        }}
      >
        <GuestHeader
          currentPage="bookings"
          searchPlaceholder="Search your bookings..."
        />
        <div
          style={{
            maxWidth: "48rem",
            margin: "0 auto",
            padding: "1rem 1rem 3rem",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            <div
              style={{
                height: "16rem",
                background: `${secondaryColor}10`, // 30% - Secondary for loading state
                borderRadius: "0.5rem",
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            ></div>
          </div>
        </div>
        <Footer
          realtorName={realtorName}
          tagline={tagline}
          logo={logoUrl}
          description={description}
          primaryColor={primaryColor}
        />
      </div>
    );
  }

  if (!booking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: `linear-gradient(135deg, ${primaryColor}08 0%, ${primaryColor}03 100%)`, // 60% - Subtle primary background
        }}
      >
        <GuestHeader
          currentPage="bookings"
          searchPlaceholder="Search your bookings..."
        />
        <div
          style={{
            maxWidth: "48rem",
            margin: "0 auto",
            padding: "1rem 1rem 3rem",
          }}
        >
          <Card className="p-4 sm:p-8 text-center !bg-white">
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: secondaryColor, // 30% - Secondary for heading
                marginBottom: "0.5rem",
              }}
            >
              Booking Not Found
            </h2>
            <Button onClick={() => router.push("/guest/bookings")}>
              Back to Bookings
            </Button>
          </Card>
        </div>
        <Footer
          realtorName={realtorName}
          tagline={tagline}
          logo={logoUrl}
          description={description}
          primaryColor={primaryColor}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${primaryColor}08 0%, ${primaryColor}03 100%)`, // 60% - Subtle primary background
      }}
    >
      <GuestHeader
        currentPage="bookings"
        searchPlaceholder="Search your bookings..."
      />

      <main
        style={{
          maxWidth: "48rem",
          margin: "0 auto",
          padding: "1rem 1rem 2rem",
        }}
      >
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          style={{
            display: "flex",
            alignItems: "center",
            color: `${secondaryColor}90`, // 30% - Secondary for back button
            background: "none",
            border: "none",
            cursor: "pointer",
            marginBottom: "1.5rem",
            fontSize: "0.9375rem",
            padding: "0.5rem 0",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = secondaryColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = `${secondaryColor}90`;
          }}
        >
          <ArrowLeft size={20} style={{ marginRight: "0.5rem" }} />
          Back
        </button>

        <h1
          style={{
            fontSize: "1.875rem",
            fontWeight: 700,
            color: secondaryColor, // 30% - Secondary for main heading
            marginBottom: "0.5rem",
          }}
        >
          Write a Review
        </h1>
        <p
          style={{
            color: `${secondaryColor}90`, // 30% - Secondary with opacity
            marginBottom: "2rem",
            fontSize: "0.9375rem",
          }}
        >
          Share your experience with {booking.property?.title}
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* Overall Rating */}
          <Card className="p-6 !bg-white">
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: secondaryColor, // 30% - Secondary for section heading
                marginBottom: "1rem",
              }}
            >
              Overall Rating *
            </h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <StarRating value={rating} onChange={setRating} />
              <p
                style={{
                  marginTop: "0.5rem",
                  color: `${secondaryColor}90`,
                  fontSize: "0.9375rem",
                }}
              >
                {rating === 0 && "Click to rate"}
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            </div>
          </Card>

          {/* Detailed Ratings */}
          <Card className="p-6 !bg-white">
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: secondaryColor, // 30% - Secondary for section heading
                marginBottom: "1rem",
              }}
            >
              Detailed Ratings
            </h2>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
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
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      color: secondaryColor, // 30% - Secondary for labels
                      fontWeight: 500,
                      fontSize: "0.9375rem",
                    }}
                  >
                    {label}
                  </span>
                  <StarRating
                    value={detailedRatings[key as keyof typeof detailedRatings]}
                    onChange={(value) =>
                      setDetailedRatings((prev) => ({ ...prev, [key]: value }))
                    }
                    size="small"
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Written Review */}
          <Card className="p-6 !bg-white">
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: secondaryColor, // 30% - Secondary for section heading
                marginBottom: "1rem",
              }}
            >
              Your Review *
            </h2>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={6}
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                border: `1.5px solid ${secondaryColor}30`, // 30% - Secondary for border
                borderRadius: "0.75rem",
                fontSize: "0.9375rem",
                outline: "none",
                transition: "all 0.2s",
                resize: "vertical",
                fontFamily: "inherit",
              }}
              placeholder="Tell others about your experience at this property. What did you like? What could be improved?"
              required
              onFocus={(e) => {
                e.target.style.borderColor = secondaryColor; // 30% - Secondary on focus
                e.target.style.boxShadow = `0 0 0 3px ${secondaryColor}15`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = `${secondaryColor}30`;
                e.target.style.boxShadow = "none";
              }}
            />
            <p
              style={{
                fontSize: "0.875rem",
                color: `${secondaryColor}80`, // 30% - Secondary for helper text
                marginTop: "0.5rem",
              }}
            >
              Minimum 50 characters ({comment.length}/50)
            </p>
          </Card>

          {/* Photo Upload */}
          <Card className="p-6 !bg-white">
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: secondaryColor, // 30% - Secondary for section heading
                marginBottom: "1rem",
              }}
            >
              Add Photos (Optional)
            </h2>
            <p
              style={{
                color: `${secondaryColor}90`, // 30% - Secondary for description
                marginBottom: "1rem",
                fontSize: "0.9375rem",
              }}
            >
              Upload photos of your stay to help others. Maximum 5 photos.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              {photos.map((photo, index) => (
                <div
                  key={index}
                  style={{ position: "relative", aspectRatio: "1" }}
                >
                  <Image
                    src={URL.createObjectURL(photo)}
                    alt={`Photo ${index + 1}`}
                    fill
                    style={{ objectFit: "cover", borderRadius: "0.75rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    style={{
                      position: "absolute",
                      top: "0.5rem",
                      right: "0.5rem",
                      background: "#ef4444",
                      color: "white",
                      borderRadius: "50%",
                      padding: "0.25rem",
                      border: "none",
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#dc2626";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#ef4444";
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}

              {photos.length < 5 && (
                <label
                  style={{
                    aspectRatio: "1",
                    border: `2px dashed ${secondaryColor}40`, // 30% - Secondary for border
                    borderRadius: "0.75rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = accentColor; // 10% - Accent on hover
                    e.currentTarget.style.backgroundColor = `${accentColor}10`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${secondaryColor}40`;
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Camera
                    size={32}
                    style={{
                      color: `${secondaryColor}60`,
                      marginBottom: "0.5rem",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.875rem",
                      color: `${secondaryColor}90`,
                    }}
                  >
                    Add Photo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: "none" }}
                    multiple
                  />
                </label>
              )}
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex space-x-3">
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || rating === 0 || comment.length < 50}
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
            <Button
              type="button"
              onClick={() => router.back()}
              variant="outline"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </main>

      <Footer
        realtorName={realtorName}
        tagline={tagline}
        logo={logoUrl}
        description={description}
        primaryColor={primaryColor}
      />
    </div>
  );
}
