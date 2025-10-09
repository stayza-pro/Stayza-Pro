"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Globe, Check, AlertCircle, Info } from "lucide-react";
import {
  parsePhoneNumber,
  isValidPhoneNumber,
  getCountries,
  getCountryCallingCode,
} from "libphonenumber-js";

interface CountryOption {
  code: string;
  name: string;
  callingCode: string;
  flag: string;
}

interface PhoneNumberFormatterProps {
  value: string;
  onChange: (value: string, isValid: boolean, formattedValue: string) => void;
  placeholder?: string;
  defaultCountry?: string;
  autoFormat?: boolean;
  showValidation?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export const PhoneNumberFormatter: React.FC<PhoneNumberFormatterProps> = ({
  value,
  onChange,
  placeholder = "Enter phone number",
  defaultCountry = "US",
  autoFormat = true,
  showValidation = true,
  disabled = false,
  error,
  className = "",
}) => {
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formattedValue, setFormattedValue] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  // Get all countries with calling codes
  const countries: CountryOption[] = useMemo(() => {
    return getCountries()
      .map((countryCode) => ({
        code: countryCode,
        name: getCountryName(countryCode),
        callingCode: `+${getCountryCallingCode(countryCode)}`,
        flag: getFlagEmoji(countryCode),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!searchTerm) return countries;

    const search = searchTerm.toLowerCase();
    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(search) ||
        country.code.toLowerCase().includes(search) ||
        country.callingCode.includes(search)
    );
  }, [countries, searchTerm]);

  // Format and validate phone number
  const formatPhoneNumber = useCallback(
    (phoneNumber: string, countryCode: string) => {
      try {
        if (!phoneNumber.trim()) {
          setFormattedValue("");
          setIsValid(false);
          setValidationMessage("");
          return;
        }

        // Parse the phone number
        const parsed = parsePhoneNumber(phoneNumber, countryCode as any);

        if (parsed) {
          const formatted = autoFormat
            ? parsed.formatInternational()
            : phoneNumber;
          const valid = parsed.isValid();

          setFormattedValue(formatted);
          setIsValid(valid);

          if (valid) {
            setValidationMessage(`Valid ${getCountryName(countryCode)} number`);
          } else {
            setValidationMessage("Invalid phone number format");
          }

          onChange(phoneNumber, valid, formatted);
        } else {
          // Try to validate without parsing
          const valid = isValidPhoneNumber(phoneNumber, countryCode as any);
          setFormattedValue(phoneNumber);
          setIsValid(valid);
          setValidationMessage(
            valid ? "Valid phone number" : "Invalid phone number format"
          );
          onChange(phoneNumber, valid, phoneNumber);
        }
      } catch (error) {
        setFormattedValue(phoneNumber);
        setIsValid(false);
        setValidationMessage("Unable to validate phone number");
        onChange(phoneNumber, false, phoneNumber);
      }
    },
    [autoFormat, onChange]
  );

  // Update formatting when value or country changes
  useEffect(() => {
    formatPhoneNumber(value, selectedCountry);
  }, [value, selectedCountry, formatPhoneNumber]);

  // Auto-detect country from phone number
  useEffect(() => {
    if (value && value.startsWith("+")) {
      try {
        const parsed = parsePhoneNumber(value);
        if (parsed && parsed.country && parsed.country !== selectedCountry) {
          setSelectedCountry(parsed.country);
        }
      } catch (error) {
        // Ignore parsing errors for auto-detection
      }
    }
  }, [value, selectedCountry]);

  const handleCountrySelect = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setShowCountryDropdown(false);
    setSearchTerm("");

    // If there's a current value, reformat it for the new country
    if (value) {
      formatPhoneNumber(value, countryCode);
    }
  };

  const selectedCountryInfo = countries.find((c) => c.code === selectedCountry);

  return (
    <div className={`relative ${className}`}>
      {/* Input Container */}
      <div
        className={`relative flex rounded-lg border transition-colors ${
          error
            ? "border-red-300 focus-within:border-red-500"
            : isValid && value
            ? "border-green-300 focus-within:border-green-500"
            : "border-gray-300 focus-within:border-blue-500"
        } ${disabled ? "bg-gray-50" : "bg-white"}`}
      >
        {/* Country Selector */}
        <button
          type="button"
          onClick={() =>
            !disabled && setShowCountryDropdown(!showCountryDropdown)
          }
          disabled={disabled}
          className={`flex items-center space-x-2 px-3 py-2 border-r border-gray-300 bg-gray-50 rounded-l-lg hover:bg-gray-100 transition-colors ${
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          }`}
        >
          <span className="text-lg">{selectedCountryInfo?.flag || "🌍"}</span>
          <span className="text-sm font-medium text-gray-700">
            {selectedCountryInfo?.callingCode || "+1"}
          </span>
        </button>

        {/* Phone Input */}
        <div className="flex-1 relative">
          <input
            type="tel"
            value={autoFormat ? formattedValue : value}
            onChange={(e) => onChange(e.target.value, isValid, formattedValue)}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-3 py-2 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500 ${
              disabled ? "cursor-not-allowed" : ""
            }`}
          />

          {/* Validation Icon */}
          {showValidation && value && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isValid ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Validation Message */}
      {showValidation && validationMessage && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-1 text-xs flex items-center space-x-1 ${
            isValid ? "text-green-600" : "text-red-600"
          }`}
        >
          <Info className="w-3 h-3" />
          <span>{validationMessage}</span>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-xs text-red-600 flex items-center space-x-1"
        >
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Country Dropdown */}
      <AnimatePresence>
        {showCountryDropdown && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowCountryDropdown(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden"
            >
              {/* Search */}
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search countries..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Countries List */}
              <div className="max-h-40 overflow-y-auto">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => handleCountrySelect(country.code)}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors ${
                        selectedCountry === country.code
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700"
                      }`}
                    >
                      <span className="text-lg">{country.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">
                            {country.name}
                          </span>
                          <span className="text-sm text-gray-500 ml-2">
                            {country.callingCode}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-6 text-center text-gray-500">
                    <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No countries found</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Format Examples */}
      {!value && selectedCountryInfo && (
        <div className="mt-2 text-xs text-gray-500">
          <p>Example: {getPhoneExample(selectedCountry)}</p>
        </div>
      )}
    </div>
  );
};

// Helper functions
function getCountryName(countryCode: string): string {
  const countryNames: Record<string, string> = {
    US: "United States",
    CA: "Canada",
    GB: "United Kingdom",
    AU: "Australia",
    DE: "Germany",
    FR: "France",
    IT: "Italy",
    ES: "Spain",
    JP: "Japan",
    CN: "China",
    IN: "India",
    BR: "Brazil",
    MX: "Mexico",
    RU: "Russia",
    KR: "South Korea",
    NL: "Netherlands",
    SE: "Sweden",
    NO: "Norway",
    DK: "Denmark",
    FI: "Finland",
    // Add more as needed
  };

  return countryNames[countryCode] || countryCode;
}

function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}

function getPhoneExample(countryCode: string): string {
  const examples: Record<string, string> = {
    US: "+1 (555) 123-4567",
    CA: "+1 (416) 123-4567",
    GB: "+44 20 7123 4567",
    AU: "+61 2 1234 5678",
    DE: "+49 30 12345678",
    FR: "+33 1 23 45 67 89",
    IT: "+39 06 1234 5678",
    ES: "+34 91 123 45 67",
    JP: "+81 3-1234-5678",
    CN: "+86 138 0013 8000",
    IN: "+91 98765 43210",
    BR: "+55 11 91234-5678",
    MX: "+52 55 1234 5678",
    RU: "+7 495 123-45-67",
    KR: "+82 2-123-4567",
    NL: "+31 20 123 4567",
    SE: "+46 8 123 456 78",
    NO: "+47 22 12 34 56",
    DK: "+45 32 12 34 56",
    FI: "+358 9 1234 567",
  };

  return (
    examples[countryCode] || `+${getCountryCallingCode(countryCode as any)} ...`
  );
}

export default PhoneNumberFormatter;
