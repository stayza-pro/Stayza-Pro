"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedDateInput, Button, Input } from "../ui";

interface PropertySearchProps {
  onSearch?: (searchParams: {
    location: string;
    checkIn?: Date;
    checkOut?: Date;
    guests?: number;
  }) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const PropertySearch: React.FC<PropertySearchProps> = ({
  onSearch,
  className = "",
  size = "md",
}) => {
  const router = useRouter();
  const [searchData, setSearchData] = useState({
    location: "",
    checkIn: "",
    checkOut: "",
    guests: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setSearchData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const searchParams = {
      location: searchData.location.trim(),
      checkIn: searchData.checkIn ? new Date(searchData.checkIn) : undefined,
      checkOut: searchData.checkOut ? new Date(searchData.checkOut) : undefined,
      guests: searchData.guests ? parseInt(searchData.guests) : undefined,
    };

    if (onSearch) {
      onSearch(searchParams);
    } else {
      // Navigate to properties page with search params
      const params = new URLSearchParams();
      if (searchParams.location) params.set("location", searchParams.location);
      if (searchParams.checkIn)
        params.set("checkIn", searchParams.checkIn.toISOString().split("T")[0]);
      if (searchParams.checkOut)
        params.set(
          "checkOut",
          searchParams.checkOut.toISOString().split("T")[0]
        );
      if (searchParams.guests)
        params.set("guests", searchParams.guests.toString());

      router.push(`/properties?${params.toString()}`);
    }
  };

  const containerClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const buttonSizes = {
    sm: "sm",
    md: "md",
    lg: "lg",
  } as const;

  return (
    <div
      className={`bg-white rounded-lg shadow-lg ${containerClasses[size]} ${className}`}
    >
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Location */}
          <div className="lg:col-span-1">
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Where
            </label>
            <Input
              id="location"
              type="text"
              placeholder="Search destinations"
              value={searchData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              required
            />
          </div>

          {/* Check-in */}
          <div>
            <AnimatedDateInput
              label="Check-in"
              value={searchData.checkIn}
              onChange={(value) => handleInputChange("checkIn", value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Check-out */}
          <div>
            <AnimatedDateInput
              label="Check-out"
              value={searchData.checkOut}
              onChange={(value) => handleInputChange("checkOut", value)}
              min={searchData.checkIn || new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Guests */}
          <div>
            <label
              htmlFor="guests"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Guests
            </label>
            <select
              id="guests"
              value={searchData.guests}
              onChange={(e) => handleInputChange("guests", e.target.value)}
              className={`w-full px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                size === "sm"
                  ? "py-1.5 text-sm"
                  : size === "lg"
                  ? "py-3 text-base"
                  : "py-2 text-sm"
              }`}
            >
              <option value="">Guests</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num}>
                  {num} guest{num > 1 ? "s" : ""}
                </option>
              ))}
              <option value="10+">10+ guests</option>
            </select>
          </div>
        </div>

        {/* Search Button */}
        <div className="flex justify-center lg:justify-end">
          <Button
            type="submit"
            variant="primary"
            size={buttonSizes[size]}
            className="w-full lg:w-auto px-8"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Search Properties
          </Button>
        </div>
      </form>
    </div>
  );
};
