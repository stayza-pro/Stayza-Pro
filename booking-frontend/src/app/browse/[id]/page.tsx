"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  Users,
  Bed,
  Bath,
  Star,
  Heart,
  Share2,
  Wifi,
  Car,
  Waves,
  Dumbbell,
  Wind,
  Tv,
  UtensilsCrossed,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from "lucide-react";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { Footer } from "@/components/guest/sections";
import { Card, Button } from "@/components/ui";
import { useProperty } from "@/hooks/useProperties";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { favoritesService } from "@/services";
import toast from "react-hot-toast";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { PropertyAmenity } from "@/types";

const amenityIcons: Record<PropertyAmenity, any> = {
  WIFI: Wifi,
  PARKING: Car,
  POOL: Waves,
  GYM: Dumbbell,
  AC: Wind,
  TV: Tv,
  KITCHEN: UtensilsCrossed,
  WASHING_MACHINE: null,
  BALCONY: null,
  PET_FRIENDLY: null,
  SMOKING_ALLOWED: null,
  WHEELCHAIR_ACCESSIBLE: null,
  FIREPLACE: null,
  HOT_TUB: null,
  BBQ: null,
  GARDEN: null,
  SECURITY: null,
  CONCIERGE: null,
  ELEVATOR: null,
  HEATING: null,
  DISHWASHER: null,
  MICROWAVE: null,
  COFFEE_MAKER: null,
  IRON: null,
  HAIR_DRYER: null,
  TOWELS: null,
  LINENS: null,
  SHAMPOO: null,
  SOAP: null,
};

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  const { user } = useCurrentUser();

  // Get realtor branding
  const {
    brandColor: primaryColor, // 60% - Primary color for backgrounds and dominant elements
    secondaryColor, // 30% - Secondary color for text and borders
    accentColor, // 10% - Accent color for CTAs and highlights
    realtorName,
    logoUrl,
    tagline,
    description,
  } = useRealtorBranding();

  const { data: property, isLoading, error } = useProperty(propertyId);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showCheckInCalendar, setShowCheckInCalendar] = useState(false);
  const [showCheckOutCalendar, setShowCheckOutCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);

  // Debug: Log property data
  React.useEffect(() => {
    if (property) {
      console.log("Property data:", property);
      console.log("Property images:", property.images);
    }
  }, [property]);

  // Fetch unavailable dates from backend
  React.useEffect(() => {
    const fetchUnavailableDates = async () => {
      if (!propertyId) return;

      try {
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";
        const response = await fetch(
          `${API_URL}/bookings/properties/${propertyId}/calendar?months=6`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.calendar) {
            // Extract dates that are not available
            const bookedDates = result.data.calendar
              .filter((day: any) => !day.available)
              .map((day: any) => day.date);
            setUnavailableDates(bookedDates);
            console.log("📅 Loaded unavailable dates:", bookedDates.length);
          }
        }
      } catch (error) {
        console.error("Error fetching unavailable dates:", error);
      }
    };

    fetchUnavailableDates();
  }, [propertyId]);

  // Check if property is favorited
  React.useEffect(() => {
    const checkFavorite = async () => {
      if (user && propertyId) {
        try {
          const favorited = await favoritesService.checkFavorite(propertyId);
          setIsFavorited(favorited.data.isFavorited);
        } catch (error) {
          console.error("Error checking favorite status:", error);
        }
      }
    };
    checkFavorite();
  }, [user, propertyId]);

  // Close calendars when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".calendar-wrapper")) {
        setShowCheckInCalendar(false);
        setShowCheckOutCalendar(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate nights and total
  const calculateBooking = () => {
    if (!checkIn || !checkOut || !property) {
      return { nights: 0, total: 0 };
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    const total = nights * property.pricePerNight;

    return { nights, total };
  };

  const { nights, total } = calculateBooking();

  const handleBookNow = () => {
    if (!user) {
      router.push(`/guest/login?redirect=/browse/${propertyId}`);
      return;
    }

    if (!checkIn || !checkOut) {
      alert("Please select check-in and check-out dates");
      return;
    }

    router.push(
      `/booking/${propertyId}/checkout?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`
    );
  };

  const handleFavorite = async () => {
    if (!user) {
      router.push(`/guest/login?redirect=/browse/${propertyId}`);
      return;
    }

    try {
      if (isFavorited) {
        await favoritesService.removeFavorite(propertyId);
        toast.success("Removed from favorites");
      } else {
        await favoritesService.addFavorite({ propertyId });
        toast.success("Added to favorites");
      }
      setIsFavorited(!isFavorited);
    } catch (error: any) {
      console.error("Error toggling favorite:", error);
      toast.error(error.message || "Failed to update favorites");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property?.title,
          text: property?.description,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled or share failed
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const nextImage = () => {
    if (property?.images && property.images.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === (property.images?.length ?? 1) - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (property?.images && property.images.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === 0 ? (property.images?.length ?? 1) - 1 : prev - 1
      );
    }
  };

  // Calendar helper functions
  const formatDateToString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "Select date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = formatDateToString(date);
    // Disable dates before tomorrow (including today) and dates that are already booked
    return date < tomorrow || unavailableDates.includes(dateString);
  };

  const handleDateClick = (
    e: React.MouseEvent,
    date: Date,
    isCheckIn: boolean
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const dateString = formatDateToString(date);
    console.log("Date clicked:", dateString, "isCheckIn:", isCheckIn);

    if (isCheckIn) {
      console.log("Setting check-in to:", dateString);
      setCheckIn(dateString);
      setShowCheckInCalendar(false);
      if (checkOut && new Date(dateString) >= new Date(checkOut)) {
        setCheckOut("");
      }
      setTimeout(() => setShowCheckOutCalendar(true), 100);
    } else {
      console.log("Setting check-out to:", dateString);
      setCheckOut(dateString);
      setShowCheckOutCalendar(false);
    }
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const prevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const renderCalendar = (isCheckIn: boolean) => {
    const { daysInMonth, startingDayOfWeek, year, month } =
      getDaysInMonth(currentMonth);
    const days = [];
    const monthName = currentMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = formatDateToString(date);
      const isDisabled = isDateDisabled(date);
      const isSelected = isCheckIn
        ? dateString === checkIn
        : dateString === checkOut;
      const isInRange =
        !isCheckIn &&
        checkIn &&
        dateString > checkIn &&
        checkOut &&
        dateString < checkOut;
      const isCheckInDate = !isCheckIn && dateString === checkIn;
      const isCheckOutDate = !isCheckIn && dateString === checkOut;

      days.push(
        <button
          key={day}
          type="button"
          onClick={(e) => {
            if (
              !isDisabled &&
              !(!isCheckIn && checkIn && dateString <= checkIn)
            ) {
              handleDateClick(e, date, isCheckIn);
            }
          }}
          disabled={
            isDisabled ||
            Boolean(!isCheckIn && checkIn && dateString <= checkIn)
          }
          className={`h-10 rounded-lg font-medium text-sm transition-all ${
            isDisabled || (!isCheckIn && checkIn && dateString <= checkIn)
              ? "text-gray-300 cursor-not-allowed"
              : isSelected
              ? "text-white shadow-md"
              : isInRange || isCheckInDate || isCheckOutDate
              ? "bg-opacity-10 text-gray-900"
              : "text-gray-700 hover:bg-gray-100"
          }`}
          style={
            isSelected
              ? { backgroundColor: accentColor }
              : isInRange || isCheckInDate || isCheckOutDate
              ? { backgroundColor: `${accentColor}20` }
              : undefined
          }
        >
          {day}
        </button>
      );
    }

    return (
      <div className="r z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft
              className="h-5 w-5"
              style={{ color: secondaryColor }}
            />
          </button>
          <span className="font-semibold text-gray-900">{monthName}</span>
          <button
            type="button"
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight
              className="h-5 w-5"
              style={{ color: secondaryColor }}
            />
          </button>
        </div>

        {/* Day Labels */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div
              key={day}
              className="h-10 flex items-center justify-center text-xs font-semibold text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">{days}</div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Property not found
      </div>
    );
  }

  if (!property) {
    return null;
  }

  const formatPrice = (price: number) => {
    // Round to 2 decimal places to avoid floating point issues
    const roundedPrice = Math.round(Number(price) * 100) / 100;
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: property.currency || "NGN",
      minimumFractionDigits: 0,
    }).format(roundedPrice);
  };

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col"
      style={{ colorScheme: "light" }}
    >
      <GuestHeader
        currentPage="browse"
        searchPlaceholder="Search location..."
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center hover:opacity-80 mb-6 transition-all"
          style={{ color: secondaryColor }}
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to search
        </button>

        {/* Image Gallery */}
        <div className="mb-8">
          <div className="relative h-96 md:h-[500px] rounded-lg overflow-hidden bg-gray-200">
            {property.images && property.images.length > 0 ? (
              <>
                <img
                  src={property.images[selectedImageIndex]?.url || ""}
                  alt={property.title}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    console.error(
                      "Image failed to load:",
                      property.images?.[selectedImageIndex]?.url
                    );
                    e.currentTarget.src =
                      "https://via.placeholder.com/800x600?text=Image+Not+Found";
                  }}
                />
                {property.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                    >
                      <ChevronLeft className="h-6 w-6 text-gray-800" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                    >
                      <ChevronRight className="h-6 w-6 text-gray-800" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                      {selectedImageIndex + 1} / {property.images.length}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">No images available</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex space-x-2">
              <button
                onClick={handleShare}
                className="bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
              >
                <Share2 className="h-5 w-5 text-gray-800" />
              </button>
              <button
                onClick={handleFavorite}
                className="bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
              >
                <Heart
                  className={`h-5 w-5 ${
                    isFavorited ? "fill-red-500 text-red-500" : "text-gray-800"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Thumbnail Gallery */}
          {property.images && property.images.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {property.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImageIndex === index
                      ? "ring-2"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={
                    selectedImageIndex === index
                      ? {
                          borderColor: primaryColor,
                          boxShadow: `0 0 0 2px ${primaryColor}33`,
                        }
                      : undefined
                  }
                >
                  <img
                    src={image.url}
                    alt={`${property.title} - ${index + 1}`}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Header */}
            <Card
              className="p-6 border border-gray-200 !bg-white shadow-sm"
              style={{ backgroundColor: "#ffffff", color: "#111827" }}
            >
              <h1
                className="text-3xl font-bold mb-2"
                style={{ color: secondaryColor }}
              >
                {property.title}
              </h1>

              <div
                className="flex flex-wrap items-center gap-4 mb-4"
                style={{ color: `${secondaryColor}99` }}
              >
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>
                    {property.city}, {property.state}, {property.country}
                  </span>
                </div>

                {property.averageRating && (
                  <div className="flex items-center">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
                    <span
                      className="font-semibold"
                      style={{ color: secondaryColor }}
                    >
                      {property.averageRating.toFixed(1)}
                    </span>
                    <span className="ml-1">
                      ({property.reviewCount || 0} reviews)
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-gray-700">
                <div className="flex items-center">
                  <Users
                    className="h-5 w-5 mr-2"
                    style={{ color: secondaryColor }}
                  />
                  <span>{property.maxGuests} guests</span>
                </div>
                <div className="flex items-center">
                  <Bed
                    className="h-5 w-5 mr-2"
                    style={{ color: secondaryColor }}
                  />
                  <span>{property.bedrooms} bedrooms</span>
                </div>
                <div className="flex items-center">
                  <Bath
                    className="h-5 w-5 mr-2"
                    style={{ color: secondaryColor }}
                  />
                  <span>{property.bathrooms} bathrooms</span>
                </div>
              </div>
            </Card>

            {/* Description */}
            <Card
              className="p-6 border border-gray-200 !bg-white shadow-sm"
              style={{ backgroundColor: "#ffffff", color: "#111827" }}
            >
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: secondaryColor }}
              >
                About this property
              </h2>
              <p className="text-gray-700 whitespace-pre-line">
                {property.description}
              </p>
            </Card>

            {/* Amenities */}
            <Card
              className="p-6 border border-gray-200 !bg-white shadow-sm"
              style={{ backgroundColor: "#ffffff", color: "#111827" }}
            >
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: secondaryColor }}
              >
                Amenities
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.amenities?.map((amenity) => {
                  const Icon = amenityIcons[amenity] || Check;
                  return (
                    <div
                      key={amenity}
                      className="flex items-center text-gray-700"
                    >
                      <Icon
                        className="h-5 w-5 mr-2"
                        style={{ color: accentColor }}
                      />
                      <span>{amenity.replace(/_/g, " ").toLowerCase()}</span>
                    </div>
                  );
                })}
                {property.customAmenities?.map((amenity, index) => (
                  <div
                    key={`custom-${index}`}
                    className="flex items-center text-gray-700"
                  >
                    <Check
                      className="h-5 w-5 mr-2"
                      style={{ color: accentColor }}
                    />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* House Rules */}
            {property.houseRules && property.houseRules.length > 0 && (
              <Card
                className="p-6 border border-gray-200 !bg-white shadow-sm"
                style={{ backgroundColor: "#ffffff", color: "#111827" }}
              >
                <h2
                  className="text-xl font-semibold mb-4"
                  style={{ color: secondaryColor }}
                >
                  House Rules
                </h2>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-700">
                    <Calendar
                      className="h-5 w-5 mr-2"
                      style={{ color: secondaryColor }}
                    />
                    <span>Check-in: {property.checkInTime}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Calendar
                      className="h-5 w-5 mr-2"
                      style={{ color: secondaryColor }}
                    />
                    <span>Check-out: {property.checkOutTime}</span>
                  </div>
                  {property.houseRules.map((rule, index) => (
                    <div key={index} className="flex items-start text-gray-700">
                      <Check className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-gray-400" />
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Location */}
            <Card
              className="p-6 border border-gray-200 !bg-white shadow-sm"
              style={{ backgroundColor: "#ffffff", color: "#111827" }}
            >
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: secondaryColor }}
              >
                Location
              </h2>
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <MapPin
                      className="h-12 w-12 mx-auto mb-2"
                      style={{ color: `${secondaryColor}60` }}
                    />
                    <p className="text-gray-600">{property.address}</p>
                    <p className="text-gray-500 text-sm">
                      {property.city}, {property.state}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Reviews Section */}
            <Card
              className="p-6 border border-gray-200 !bg-white shadow-sm"
              style={{ backgroundColor: "#ffffff", color: "#111827" }}
            >
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: secondaryColor }}
              >
                Reviews
                {property.reviewCount && property.reviewCount > 0 && (
                  <span className="text-gray-500 ml-2 font-normal">
                    ({property.reviewCount})
                  </span>
                )}
              </h2>

              {property.reviews && property.reviews.length > 0 ? (
                <div className="space-y-6">
                  {property.reviews.slice(0, 5).map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-gray-200 pb-6 last:border-0"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {review.author?.avatar ? (
                            <img
                              src={review.author.avatar}
                              alt={`${review.author.firstName} ${review.author.lastName}`}
                              className="w-10 h-10 rounded-full object-cover"
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                              {review.author?.firstName?.[0]}
                              {review.author?.lastName?.[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">
                              {review.author?.firstName}{" "}
                              {review.author?.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="font-semibold">{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-gray-500 text-center py-8">
                    No reviews yet.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-blue-800">
                      Reviews can only be submitted after completing a stay at
                      this property.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Booking Widget Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card
                className="p-6 border border-gray-200 !bg-white shadow-sm"
                style={{ backgroundColor: "#ffffff", color: "#111827" }}
              >
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span
                      className="text-3xl font-bold"
                      style={{ color: accentColor }}
                    >
                      {formatPrice(property.pricePerNight)}
                    </span>
                    <span className="text-gray-600 ml-2">/ night</span>
                  </div>

                  {/* Optional Fees Display */}
                  {(property.cleaningFee || property.securityDeposit) && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        Additional Charges:
                      </p>
                      <div className="space-y-1 text-sm text-gray-600">
                        {property.cleaningFee && (
                          <div className="flex justify-between">
                            <span>Cleaning fee:</span>
                            <span className="font-medium">
                              {formatPrice(property.cleaningFee)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Service fee:</span>
                          <span className="font-medium">2% of charge</span>
                        </div>
                        {property.securityDeposit && (
                          <div className="flex justify-between">
                            <span>Security deposit:</span>
                            <span className="font-medium">
                              {formatPrice(Math.round(property.securityDeposit * 100) / 100)}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2 italic">
                        {property.securityDeposit
                          ? "Service fee and cleaning fee are nonrefundable. Security deposit is refundable after checkout."
                          : "Service fee and cleaning fee are nonrefundable."}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Check-in Date */}
                  <div className="relative calendar-wrapper">
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: secondaryColor }}
                    >
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Check-in
                    </label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(
                          "Check-in button clicked, current state:",
                          showCheckInCalendar
                        );
                        setShowCheckInCalendar(!showCheckInCalendar);
                        setShowCheckOutCalendar(false);
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-left hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{
                        borderColor: showCheckInCalendar
                          ? accentColor
                          : undefined,
                        boxShadow: showCheckInCalendar
                          ? `0 0 0 3px ${accentColor}20`
                          : undefined,
                      }}
                    >
                      <span
                        className={
                          checkIn
                            ? "text-gray-900 font-medium"
                            : "text-gray-400"
                        }
                      >
                        {formatDateForDisplay(checkIn)}
                      </span>
                    </button>
                    {showCheckInCalendar && renderCalendar(true)}
                  </div>

                  {/* Check-out Date */}
                  <div className="relative calendar-wrapper">
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: secondaryColor }}
                    >
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Check-out
                    </label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(
                          "Check-out button clicked, checkIn:",
                          checkIn
                        );
                        if (!checkIn) {
                          setShowCheckInCalendar(true);
                          return;
                        }
                        setShowCheckOutCalendar(!showCheckOutCalendar);
                        setShowCheckInCalendar(false);
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-left hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{
                        borderColor: showCheckOutCalendar
                          ? accentColor
                          : undefined,
                        boxShadow: showCheckOutCalendar
                          ? `0 0 0 3px ${accentColor}20`
                          : undefined,
                      }}
                    >
                      <span
                        className={
                          checkOut
                            ? "text-gray-900 font-medium"
                            : "text-gray-400"
                        }
                      >
                        {formatDateForDisplay(checkOut)}
                      </span>
                    </button>
                    {showCheckOutCalendar && renderCalendar(false)}
                  </div>

                  {/* Guests */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: secondaryColor }}
                    >
                      <Users className="h-4 w-4 inline mr-1" />
                      Guests
                    </label>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 hover:border-gray-300 transition-colors font-medium text-gray-900"
                    >
                      {Array.from(
                        { length: property.maxGuests },
                        (_, i) => i + 1
                      ).map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? "guest" : "guests"}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Breakdown */}
                  {nights > 0 && (
                    <div className="border-t border-gray-200 pt-4 space-y-2">
                      <div className="flex justify-between text-gray-700">
                        <span>
                          {formatPrice(property.pricePerNight)} × {nights}{" "}
                          {nights === 1 ? "night" : "nights"}
                        </span>
                        <span>
                          {formatPrice(Number(property.pricePerNight) * nights)}
                        </span>
                      </div>
                      {property.cleaningFee && (
                        <div className="flex justify-between text-gray-700 text-sm">
                          <span>Cleaning fee</span>
                          <span>{formatPrice(property.cleaningFee)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-700 text-sm">
                        <span>Service fee (2%)</span>
                        <span>
                          {formatPrice(
                            (Number(property.pricePerNight) * nights +
                              Number(property.cleaningFee || 0)) *
                              0.02
                          )}
                        </span>
                      </div>
                      {property.securityDeposit && (
                        <div className="flex justify-between text-gray-700 text-sm">
                          <span>Security deposit</span>
                          <span>{formatPrice(property.securityDeposit)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-gray-900 text-lg border-t border-gray-200 pt-2">
                        <span>Total</span>
                        <span>
                          {formatPrice(
                            Number(property.pricePerNight) * nights +
                              Number(property.cleaningFee || 0) +
                              (Number(property.pricePerNight) * nights +
                                Number(property.cleaningFee || 0)) *
                                0.02 +
                              Number(property.securityDeposit || 0)
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Book Button */}
                  <button
                    onClick={handleBookNow}
                    disabled={!checkIn || !checkOut}
                    className="w-full px-6 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: accentColor }}
                  >
                    {user ? "Book Now" : "Login to Book"}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    You won't be charged yet
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer
        realtorName={realtorName}
        tagline={tagline}
        logo={logoUrl}
        description={description}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        accentColor={accentColor}
      />
    </div>
  );
}
