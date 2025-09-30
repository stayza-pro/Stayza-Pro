"use client";

import React, { useEffect, useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { RealtorRegistrationFormData } from "./schema";

interface ConditionalLogicProps {
  formMethods: UseFormReturn<RealtorRegistrationFormData>;
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

interface BusinessSuggestion {
  websiteDomain: string;
  businessHours: string;
  suggestedColors: string[];
  marketingTips: string[];
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
  const [businessSuggestion, setBusinessSuggestion] =
    useState<BusinessSuggestion | null>(null);

  // Watch key fields for conditional logic
  const businessEmail = watch("businessEmail");
  const agencyName = watch("agencyName");
  const businessAddress = watch("businessAddress");
  const primaryColor = watch("primaryColor");

  // Smart business type detection based on company name
  const detectBusinessType = useCallback((companyName: string) => {
    if (!companyName) return null;

    const name = companyName.toLowerCase();

    // Real estate keywords
    const realEstateKeywords = [
      "real estate",
      "realty",
      "properties",
      "homes",
      "housing",
      "estate",
      "property",
      "land",
      "residential",
      "commercial",
    ];

    // Luxury keywords
    const luxuryKeywords = [
      "luxury",
      "premium",
      "elite",
      "exclusive",
      "boutique",
      "platinum",
      "gold",
      "diamond",
      "prestige",
      "signature",
    ];

    // Commercial keywords
    const commercialKeywords = [
      "commercial",
      "office",
      "retail",
      "industrial",
      "warehouse",
      "business",
      "corporate",
      "development",
      "investment",
    ];

    if (luxuryKeywords.some((keyword) => name.includes(keyword))) {
      return "luxury";
    } else if (commercialKeywords.some((keyword) => name.includes(keyword))) {
      return "commercial";
    } else if (realEstateKeywords.some((keyword) => name.includes(keyword))) {
      return "residential";
    }

    return null;
  }, []);

  // Smart domain extraction from business email
  const extractDomainInfo = useCallback((email: string) => {
    if (!email || !email.includes("@")) return null;

    const domain = email.split("@")[1].toLowerCase();

    // Skip common email providers
    const commonProviders = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "icloud.com",
      "aol.com",
      "live.com",
      "msn.com",
    ];

    if (commonProviders.includes(domain)) return null;

    // Extract potential company name from domain
    const domainParts = domain.split(".");
    const companyPart = domainParts[0];

    // Clean up domain to suggest company name
    const suggestions = {
      websiteDomain: `www.${domain}`,
      potentialCompanyName: companyPart
        .split(/[-_]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    };

    return suggestions;
  }, []);

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

  // Generate business-specific suggestions
  const generateBusinessSuggestions = useCallback(
    (businessType: string, companyName: string) => {
      const suggestions: Record<string, Partial<BusinessSuggestion>> = {
        luxury: {
          suggestedColors: ["#000000", "#FFD700", "#C0C0C0", "#800080"],
          businessHours: "10:00 AM - 7:00 PM",
          marketingTips: [
            "Focus on high-quality property photography",
            "Emphasize exclusive locations and amenities",
            "Target affluent demographics in marketing",
          ],
        },
        commercial: {
          suggestedColors: ["#003366", "#0066CC", "#333333", "#00AA44"],
          businessHours: "9:00 AM - 6:00 PM",
          marketingTips: [
            "Highlight ROI and investment potential",
            "Network with business owners and investors",
            "Focus on location analytics and market data",
          ],
        },
        residential: {
          suggestedColors: ["#2E8B57", "#4682B4", "#CD853F", "#6B8E23"],
          businessHours: "9:00 AM - 8:00 PM",
          marketingTips: [
            "Emphasize family-friendly features",
            "Showcase neighborhood amenities",
            "Use warm, welcoming imagery",
          ],
        },
      };

      const baseUrl = companyName
        ? `www.${companyName.toLowerCase().replace(/\s+/g, "")}.com`
        : "";

      return {
        websiteDomain: baseUrl,
        ...suggestions[businessType],
      } as BusinessSuggestion;
    },
    []
  );

  // Apply conditional logic based on plan
  useEffect(() => {
    // Plan-based logic can be implemented when plan-specific features are added to schema
    console.log(`Plan selected: ${plan}`);
  }, [plan]);

  // Smart auto-completion for business email
  useEffect(() => {
    if (businessEmail && !agencyName) {
      const domainInfo = extractDomainInfo(businessEmail);
      if (domainInfo?.potentialCompanyName) {
        // Suggest agency name based on email domain
        setValue("agencyName", domainInfo.potentialCompanyName);
        // Set website in socials object
        const currentSocials = getValues("socials") || {};
        setValue("socials", {
          ...currentSocials,
          website: domainInfo.websiteDomain,
        });
      }
    }
  }, [businessEmail, agencyName, extractDomainInfo, setValue, getValues]);

  // Smart business type detection based on agency name
  useEffect(() => {
    if (agencyName) {
      const detectedType = detectBusinessType(agencyName);
      if (detectedType) {
        // Store business type in tagline or use for UI suggestions only
        console.log(
          `Detected business type: ${detectedType} for agency: ${agencyName}`
        );
        // Could set tagline with business type suggestion
        if (!getValues("tagline")) {
          const taglines = {
            luxury: "Luxury Properties & Exclusive Estates",
            commercial: "Commercial Real Estate Solutions",
            residential: "Your Home, Our Priority",
          };
          setValue(
            "tagline",
            taglines[detectedType as keyof typeof taglines] || ""
          );
        }
      }
    }
  }, [agencyName, detectBusinessType, setValue, getValues]);

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

  // Business suggestions based on agency name
  useEffect(() => {
    if (agencyName) {
      const businessType = detectBusinessType(agencyName);
      if (businessType) {
        const suggestions = generateBusinessSuggestions(
          businessType,
          agencyName
        );
        setBusinessSuggestion(suggestions);

        // Auto-apply website domain if not set
        const currentSocials = getValues("socials") || {};
        if (!currentSocials.website && suggestions.websiteDomain) {
          setValue("socials", {
            ...currentSocials,
            website: suggestions.websiteDomain,
          });
        }
      }
    }
  }, [
    agencyName,
    generateBusinessSuggestions,
    setValue,
    getValues,
    detectBusinessType,
  ]);

  // Color harmony suggestions
  useEffect(() => {
    if (primaryColor && agencyName && businessSuggestion?.suggestedColors) {
      // Find complementary colors based on business type and primary color
      const suggestedSecondary = businessSuggestion.suggestedColors.filter(
        (color) => color !== primaryColor
      )[0];

      if (suggestedSecondary && !getValues("accentColor")) {
        setValue("accentColor", suggestedSecondary);
      }
    }
  }, [primaryColor, agencyName, businessSuggestion, setValue, getValues]);

  // Conditional validation rules
  const getConditionalValidation = useCallback(() => {
    const validations: Record<string, any> = {};

    // Plan-based validations
    if (plan === "premium" || plan === "professional") {
      validations.tagline = {
        required: "Business tagline is required for this plan",
      };
    }

    // Agency name based validations
    const agencyName = getValues("agencyName");
    const businessType = agencyName ? detectBusinessType(agencyName) : null;
    if (businessType === "luxury") {
      validations.tagline = {
        required: "Please specify your luxury market focus in tagline",
      };
    }

    return validations;
  }, [plan, getValues, detectBusinessType]);

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

  // Render business suggestions
  const renderBusinessSuggestions = () => {
    if (!businessSuggestion) return null;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Smart Suggestions</h4>

        {businessSuggestion.marketingTips && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-800">Marketing Tips:</p>
            <ul className="text-sm text-blue-700 space-y-1">
              {businessSuggestion.marketingTips.map((tip, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {businessSuggestion.suggestedColors && (
          <div className="mt-3">
            <p className="text-sm font-medium text-blue-800 mb-2">
              Suggested Colors:
            </p>
            <div className="flex space-x-2">
              {businessSuggestion.suggestedColors
                .slice(0, 4)
                .map((color, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setValue("primaryColor", color)}
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={`Apply ${color}`}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // This component primarily provides logic, minimal rendering
  return (
    <>
      {/* Location Suggestions */}
      {currentStep === 2 && renderLocationSuggestions()}

      {/* Business Suggestions */}
      {(currentStep === 1 || currentStep === 4) && renderBusinessSuggestions()}
    </>
  );
}

export default ConditionalLogic;
