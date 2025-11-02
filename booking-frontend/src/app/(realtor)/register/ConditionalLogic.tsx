"use client";

import React, { useEffect, useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { RealtorRegistrationFormData } from "./schema";

interface ConditionalLogicProps {
  formMethods: UseFormReturn<RealtorRegistrationFormData, any>;
  currentStep: number;
  plan: string;
}

interface LocationSuggestion {
  city: string;
  state: string;
  country: string;
  timeZone: string;
  currency: string;
}

export function ConditionalLogic({
  formMethods,
  currentStep,
  plan,
}: ConditionalLogicProps) {
  const { watch, setValue, getValues } = formMethods;
  const [locationSuggestions, setLocationSuggestions] = useState<
    LocationSuggestion[]
  >([]);

  // Watch key fields for conditional logic
  const businessAddress = watch("businessAddress");

  // Get location suggestions based on partial input
  const getLocationSuggestions = useCallback(
    async (city: string, state?: string) => {
      if (!city || city.length < 2) return;

      try {
        // Mock location API call - in real app would use Google Places or similar
        const mockSuggestions: LocationSuggestion[] = [
          {
            city: "Lagos",
            state: "Lagos State",
            country: "Nigeria",
            timeZone: "Africa/Lagos",
            currency: "NGN",
          },
          {
            city: "Abuja",
            state: "Federal Capital Territory",
            country: "Nigeria",
            timeZone: "Africa/Lagos",
            currency: "NGN",
          },
          {
            city: "New York",
            state: "New York",
            country: "United States",
            timeZone: "America/New_York",
            currency: "USD",
          },
          {
            city: "London",
            state: "England",
            country: "United Kingdom",
            timeZone: "Europe/London",
            currency: "GBP",
          },
        ].filter(
          (loc) =>
            loc.city.toLowerCase().includes(city.toLowerCase()) ||
            (state && loc.state.toLowerCase().includes(state.toLowerCase()))
        );

        setLocationSuggestions(mockSuggestions);
      } catch (error) {
        console.error("Error fetching location suggestions:", error);
      }
    },
    []
  );

  // Location-based suggestions
  useEffect(() => {
    if (businessAddress && businessAddress.length >= 2) {
      // Extract city from business address for suggestions
      const addressParts = businessAddress.split(",");
      const cityPart = addressParts[0]?.trim();
      if (cityPart) {
        getLocationSuggestions(cityPart);
      }
    }
  }, [businessAddress, getLocationSuggestions]);

  // Auto-populate location details
  const applyLocationSuggestion = useCallback(
    (suggestion: LocationSuggestion) => {
      // Update business address with full location
      const fullAddress = `${suggestion.city}, ${suggestion.state}, ${suggestion.country}`;
      setValue("businessAddress", fullAddress);
      setLocationSuggestions([]); // Clear suggestions after selection
    },
    [setValue]
  );

  // Render location suggestions
  const renderLocationSuggestions = () => {
    if (locationSuggestions.length === 0) return null;

    return (
      <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1">
        {locationSuggestions.map((suggestion, index) => (
          <button
            key={index}
            type="button"
            onClick={() => applyLocationSuggestion(suggestion)}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
          >
            <div className="font-medium">
              {suggestion.city}, {suggestion.state}
            </div>
            <div className="text-sm text-gray-500">{suggestion.country}</div>
          </button>
        ))}
      </div>
    );
  };

  // This component primarily provides logic, minimal rendering
  return (
    <>
      {/* Location Suggestions */}
      {currentStep === 2 && renderLocationSuggestions()}
    </>
  );
}

export default ConditionalLogic;
