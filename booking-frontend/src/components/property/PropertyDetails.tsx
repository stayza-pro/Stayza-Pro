"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Property } from "../../types";
import { Button, Card } from "../ui";

interface PropertyDetailsProps {
  property: Property;
  onBookNow?: () => void;
  onFavorite?: () => void;
  isFavorited?: boolean;
  className?: string;
}

export const PropertyDetails: React.FC<PropertyDetailsProps> = ({
  property,
  onBookNow,
  onFavorite,
  isFavorited = false,
  className = "",
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getRatingDisplay = () => {
    if (!property.averageRating || !property.reviewCount) {
      return <span className="text-gray-500">New property</span>;
    }

    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <svg
            className="w-5 h-5 text-yellow-400 fill-current"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.518 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <span className="font-semibold text-gray-900">
            {property.averageRating.toFixed(1)}
          </span>
        </div>
        <span className="text-gray-600">
          ({property.reviewCount} review{property.reviewCount !== 1 ? "s" : ""})
        </span>
      </div>
    );
  };

  return (
    <div className={`max-w-7xl mx-auto ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-w-16 aspect-h-10 rounded-lg overflow-hidden">
              {property.images && property.images.length > 0 ? (
                <Image
                  src={property.images[selectedImageIndex]}
                  alt={property.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-96 bg-gray-200 flex items-center justify-center rounded-lg">
                  <svg
                    className="w-16 h-16 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}

              {/* Image Navigation */}
              {property.images && property.images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSelectedImageIndex(
                        selectedImageIndex > 0
                          ? selectedImageIndex - 1
                          : property.images.length - 1
                      )
                    }
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-md transition-all"
                  >
                    <svg
                      className="w-5 h-5 text-gray-800"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      setSelectedImageIndex(
                        selectedImageIndex < property.images.length - 1
                          ? selectedImageIndex + 1
                          : 0
                      )
                    }
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-md transition-all"
                  >
                    <svg
                      className="w-5 h-5 text-gray-800"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {property.images && property.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {property.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? "border-blue-500"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${property.title} - Image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Property Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {property.title}
                  </h1>
                  <div className="flex items-center text-gray-600 space-x-4">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>
                        {property.city}, {property.state}, {property.country}
                      </span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <span className="capitalize">
                      {property.type.toLowerCase().replace("_", " ")}
                    </span>
                  </div>
                </div>

                <button
                  onClick={onFavorite}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg
                    className={`w-6 h-6 ${
                      isFavorited
                        ? "text-red-500 fill-current"
                        : "text-gray-400"
                    }`}
                    fill={isFavorited ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex items-center justify-between">
                {getRatingDisplay()}
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatPrice(property.pricePerNight, property.currency)}
                  </div>
                  <div className="text-gray-600">per night</div>
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="flex items-center space-x-6 py-4 border-y border-gray-200">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="text-gray-900 font-medium">
                  {property.maxGuests} guests
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z"
                  />
                </svg>
                <span className="text-gray-900 font-medium">
                  {property.bedrooms} bedroom
                  {property.bedrooms !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                  />
                </svg>
                <span className="text-gray-900 font-medium">
                  {property.bathrooms} bathroom
                  {property.bathrooms !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                About this place
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {property.description}
              </p>
            </div>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Amenities
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Booking Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {formatPrice(property.pricePerNight, property.currency)}
                  </div>
                  <div className="text-gray-600">per night</div>
                </div>

                {getRatingDisplay()}

                <Button
                  variant="primary"
                  size="lg"
                  onClick={onBookNow}
                  className="w-full"
                >
                  Book Now
                </Button>

                <div className="text-center text-sm text-gray-600">
                  You won't be charged yet
                </div>

                {/* Host Info */}
                <div className="border-t pt-4">
                  <div className="flex items-center space-x-3">
                    {property.host.avatar ? (
                      <Image
                        src={property.host.avatar}
                        alt={`${property.host.firstName} ${property.host.lastName}`}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white font-medium text-lg">
                          {property.host.firstName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        Hosted by {property.host.firstName}{" "}
                        {property.host.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Joined {new Date(property.createdAt).getFullYear()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
