"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, MapPin, Building2, Globe } from "lucide-react";

interface SmartSuggestion {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  confidence?: number;
  metadata?: Record<string, any>;
}

interface SmartInputProps {
  label: string;
  value: string;
  onChange: (value: string, metadata?: Record<string, any>) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  suggestionsEndpoint?: string;
  suggestionType?: "location" | "business" | "email" | "website" | "custom";
  minCharsForSuggestions?: number;
  maxSuggestions?: number;
  customSuggestions?: SmartSuggestion[];
  onSuggestionSelect?: (suggestion: SmartSuggestion) => void;
}

export function SmartInput({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  disabled = false,
  required = false,
  error,
  className = "",
  suggestionType = "custom",
  minCharsForSuggestions = 2,
  maxSuggestions = 5,
  customSuggestions = [],
  onSuggestionSelect,
}: SmartInputProps) {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Built-in suggestion generators based on type
  const generateSuggestions = useCallback(
    async (inputValue: string): Promise<SmartSuggestion[]> => {
      if (!inputValue || inputValue.length < minCharsForSuggestions) {
        return [];
      }

      const query = inputValue.toLowerCase();

      switch (suggestionType) {
        case "location":
          // Mock location suggestions - in real app would use Google Places API
          const locations = [
            {
              value: "Lagos, Lagos State, Nigeria",
              label: "Lagos",
              description: "Lagos State, Nigeria",
              metadata: {
                country: "Nigeria",
                state: "Lagos State",
                city: "Lagos",
                currency: "NGN",
              },
            },
            {
              value: "Abuja, FCT, Nigeria",
              label: "Abuja",
              description: "Federal Capital Territory, Nigeria",
              metadata: {
                country: "Nigeria",
                state: "FCT",
                city: "Abuja",
                currency: "NGN",
              },
            },
            {
              value: "Port Harcourt, Rivers State, Nigeria",
              label: "Port Harcourt",
              description: "Rivers State, Nigeria",
              metadata: {
                country: "Nigeria",
                state: "Rivers State",
                city: "Port Harcourt",
                currency: "NGN",
              },
            },
            {
              value: "New York, NY, USA",
              label: "New York",
              description: "New York, United States",
              metadata: {
                country: "USA",
                state: "New York",
                city: "New York",
                currency: "USD",
              },
            },
            {
              value: "London, England, UK",
              label: "London",
              description: "England, United Kingdom",
              metadata: {
                country: "UK",
                state: "England",
                city: "London",
                currency: "GBP",
              },
            },
            {
              value: "Toronto, Ontario, Canada",
              label: "Toronto",
              description: "Ontario, Canada",
              metadata: {
                country: "Canada",
                state: "Ontario",
                city: "Toronto",
                currency: "CAD",
              },
            },
          ];
          return locations
            .filter(
              (loc) =>
                loc.label.toLowerCase().includes(query) ||
                loc.description.toLowerCase().includes(query)
            )
            .slice(0, maxSuggestions)
            .map((loc) => ({
              ...loc,
              icon: <MapPin className="w-4 h-4 text-blue-500" />,
              confidence: loc.label.toLowerCase().startsWith(query) ? 0.9 : 0.6,
            }));

        case "business":
          // Business type suggestions
          const businessTypes = [
            {
              value: "residential",
              label: "Residential Real Estate",
              description: "Family homes, condos, apartments",
            },
            {
              value: "commercial",
              label: "Commercial Real Estate",
              description: "Office buildings, retail spaces, warehouses",
            },
            {
              value: "luxury",
              label: "Luxury Properties",
              description: "High-end residential and commercial properties",
            },
            {
              value: "investment",
              label: "Investment Properties",
              description: "Rental properties and investment opportunities",
            },
            {
              value: "development",
              label: "Property Development",
              description: "New construction and development projects",
            },
            {
              value: "property_management",
              label: "Property Management",
              description: "Managing rental and commercial properties",
            },
          ];
          return businessTypes
            .filter(
              (type) =>
                type.label.toLowerCase().includes(query) ||
                type.description.toLowerCase().includes(query)
            )
            .slice(0, maxSuggestions)
            .map((type) => ({
              ...type,
              icon: <Building2 className="w-4 h-4 text-green-500" />,
              confidence: type.label.toLowerCase().includes(query) ? 0.8 : 0.5,
            }));

        case "website":
          // Website suggestions based on company name
          if (query.length < 3) return [];
          const cleanName = query.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
          const suggestions = [
            {
              value: `www.${cleanName}.com`,
              label: `${cleanName}.com`,
              description: "Professional .com domain",
            },
            {
              value: `www.${cleanName}realty.com`,
              label: `${cleanName}realty.com`,
              description: "Real estate focused domain",
            },
            {
              value: `www.${cleanName}properties.com`,
              label: `${cleanName}properties.com`,
              description: "Property-focused domain",
            },
            {
              value: `www.${cleanName}homes.com`,
              label: `${cleanName}homes.com`,
              description: "Home sales domain",
            },
          ];
          return suggestions.slice(0, maxSuggestions).map((site) => ({
            ...site,
            icon: <Globe className="w-4 h-4 text-purple-500" />,
            confidence: 0.7,
          }));

        case "email":
          // Email domain suggestions
          const emailPart = query.split("@")[0];
          const domainPart = query.split("@")[1] || "";

          if (!query.includes("@") || domainPart.length < 1) {
            return [];
          }

          const emailDomains = [
            "gmail.com",
            "outlook.com",
            "yahoo.com",
            "hotmail.com",
            "company.com",
            "realty.com",
            "properties.com",
          ];

          return emailDomains
            .filter((domain) => domain.includes(domainPart))
            .slice(0, maxSuggestions)
            .map((domain) => ({
              value: `${emailPart}@${domain}`,
              label: `${emailPart}@${domain}`,
              description: `${domain} email address`,
              confidence: domain === "gmail.com" ? 0.9 : 0.6,
            }));

        default:
          return customSuggestions
            .filter(
              (suggestion) =>
                suggestion.label.toLowerCase().includes(query) ||
                suggestion.value.toLowerCase().includes(query)
            )
            .slice(0, maxSuggestions);
      }
    },
    [suggestionType, minCharsForSuggestions, maxSuggestions, customSuggestions]
  );

  // Fetch suggestions when input changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!value || value.length < minCharsForSuggestions) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const newSuggestions = await generateSuggestions(value);
        setSuggestions(newSuggestions);
        setShowSuggestions(newSuggestions.length > 0);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [value, generateSuggestions, minCharsForSuggestions]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showSuggestions || suggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            handleSuggestionClick(suggestions[selectedIndex]);
          }
          break;
        case "Escape":
          setShowSuggestions(false);
          setSelectedIndex(-1);
          break;
      }
    },
    [showSuggestions, suggestions, selectedIndex]
  );

  // Handle suggestion selection
  const handleSuggestionClick = useCallback(
    (suggestion: SmartSuggestion) => {
      onChange(suggestion.value, suggestion.metadata);
      onSuggestionSelect?.(suggestion);
      setShowSuggestions(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    },
    [onChange, onSuggestionSelect]
  );

  // Handle input focus
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle input blur
  const handleBlur = () => {
    // Delay hiding suggestions to allow clicking
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
      onBlur?.();
    }, 150);
  };

  return (
    <div className={`relative ${className}`}>
      <label
        htmlFor={label}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            w-full px-3 py-2 border rounded-md 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500
            ${error ? "border-red-500" : "border-gray-300"}
            ${showSuggestions ? "rounded-b-none" : ""}
          `}
        />

        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
          </div>
        )}

        {showSuggestions && !isLoading && (
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        )}
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full bg-white border border-gray-300 border-t-0 rounded-b-md shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className={`
                  w-full text-left px-3 py-3 hover:bg-blue-50 border-b border-gray-100 
                  last:border-b-0 flex items-start space-x-3 transition-colors
                  ${index === selectedIndex ? "bg-blue-50 border-blue-200" : ""}
                `}
                whileHover={{ backgroundColor: "rgb(239 246 255)" }}
              >
                {suggestion.icon && (
                  <div className="flex-shrink-0 mt-0.5">{suggestion.icon}</div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.label}
                    </p>
                    {suggestion.confidence && (
                      <span className="text-xs text-gray-500 ml-2">
                        {Math.round(suggestion.confidence * 100)}%
                      </span>
                    )}
                  </div>
                  {suggestion.description && (
                    <p className="text-xs text-gray-600 truncate mt-1">
                      {suggestion.description}
                    </p>
                  )}
                </div>

                {index === selectedIndex && (
                  <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-sm mt-1"
          role="alert"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

export default SmartInput;
