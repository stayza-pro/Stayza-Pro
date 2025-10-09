import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Globe, Check, AlertCircle, ChevronDown } from "lucide-react";
import {
  parsePhoneNumber,
  isValidPhoneNumber,
  getCountries,
  getCountryCallingCode,
  AsYouType,
  CountryCode,
} from "libphonenumber-js";
import { cn } from "@/utils/cn";

interface Country {
  code: string;
  name: string;
  callingCode: string;
  flag: string;
}

interface PhoneNumberFormatterProps {
  value: string;
  onChange: (value: string, formattedValue: string, isValid: boolean) => void;
  onCountryChange?: (country: Country) => void;
  defaultCountry?: string;
  placeholder?: string;
  className?: string;
  showValidation?: boolean;
  showCountrySelector?: boolean;
  preferredCountries?: string[];
  disabled?: boolean;
  error?: string;
}

export const PhoneNumberFormatter: React.FC<PhoneNumberFormatterProps> = ({
  value,
  onChange,
  onCountryChange,
  defaultCountry = "US",
  placeholder,
  className,
  showValidation = true,
  showCountrySelector = true,
  preferredCountries = ["US", "CA", "GB", "AU", "DE", "FR"],
  disabled = false,
  error,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isValid, setIsValid] = useState(false);
  const [formattedValue, setFormattedValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Get country information
  const countries: Country[] = useMemo(() => {
    const countryList = getCountries().map((countryCode) => {
      const callingCode = getCountryCallingCode(countryCode);
      return {
        code: countryCode,
        name: getCountryName(countryCode),
        callingCode: `+${callingCode}`,
        flag: getCountryFlag(countryCode),
      };
    });

    // Sort with preferred countries first
    const preferred = countryList.filter((c) =>
      preferredCountries.includes(c.code)
    );
    const others = countryList.filter(
      (c) => !preferredCountries.includes(c.code)
    );

    return [...preferred, ...others];
  }, [preferredCountries]);

  // Get country name from code
  function getCountryName(countryCode: string): string {
    const names: Record<string, string> = {
      US: "United States",
      CA: "Canada",
      GB: "United Kingdom",
      AU: "Australia",
      DE: "Germany",
      FR: "France",
      IN: "India",
      JP: "Japan",
      CN: "China",
      BR: "Brazil",
      MX: "Mexico",
      AR: "Argentina",
      IT: "Italy",
      ES: "Spain",
      RU: "Russia",
      KR: "South Korea",
      NL: "Netherlands",
      SE: "Sweden",
      NO: "Norway",
      DK: "Denmark",
      FI: "Finland",
      PL: "Poland",
      BE: "Belgium",
      AT: "Austria",
      CH: "Switzerland",
      IE: "Ireland",
      NZ: "New Zealand",
      ZA: "South Africa",
      SG: "Singapore",
      HK: "Hong Kong",
      TH: "Thailand",
      MY: "Malaysia",
      PH: "Philippines",
      ID: "Indonesia",
      VN: "Vietnam",
      AE: "United Arab Emirates",
      SA: "Saudi Arabia",
      EG: "Egypt",
      NG: "Nigeria",
      KE: "Kenya",
      GH: "Ghana",
      // Add more as needed
    };

    return names[countryCode] || countryCode;
  }

  // Get country flag emoji
  function getCountryFlag(countryCode: string): string {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }

  // Initialize default country
  useEffect(() => {
    const defaultCountryInfo = countries.find((c) => c.code === defaultCountry);
    if (defaultCountryInfo && !selectedCountry) {
      setSelectedCountry(defaultCountryInfo);
    }
  }, [countries, defaultCountry, selectedCountry]);

  // Format phone number as user types
  const formatPhoneNumber = useCallback(
    (input: string, countryCode?: string) => {
      if (!input.trim()) {
        return { formatted: "", isValid: false, parsed: null };
      }

      try {
        // Use AsYouType formatter for real-time formatting
        const asYouType = new AsYouType(countryCode as CountryCode);
        const formatted = asYouType.input(input);

        // Parse the complete number for validation
        const parsed = parsePhoneNumber(input, countryCode as CountryCode);
        const isValidNumber = parsed ? parsed.isValid() : false;

        return {
          formatted,
          isValid: isValidNumber,
          parsed,
        };
      } catch (error) {
        console.error("Phone formatting error:", error);
        return { formatted: input, isValid: false, parsed: null };
      }
    },
    []
  );

  // Handle input change
  const handleInputChange = (newValue: string) => {
    // Allow only numbers, spaces, hyphens, parentheses, and plus sign
    const cleanValue = newValue.replace(/[^\d\s\-\(\)\+]/g, "");

    setInputValue(cleanValue);

    const result = formatPhoneNumber(cleanValue, selectedCountry?.code);
    setFormattedValue(result.formatted);
    setIsValid(result.isValid);

    // Notify parent component
    onChange(cleanValue, result.formatted, result.isValid);

    // Auto-detect country from international format
    if (cleanValue.startsWith("+") && result.parsed) {
      const detectedCountry = countries.find(
        (c) => c.callingCode === `+${result.parsed!.countryCallingCode}`
      );

      if (detectedCountry && detectedCountry.code !== selectedCountry?.code) {
        setSelectedCountry(detectedCountry);
        onCountryChange?.(detectedCountry);
      }
    }
  };

  // Handle country selection
  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
    setSearchTerm("");
    onCountryChange?.(country);

    // Reformat existing number with new country
    if (inputValue) {
      const result = formatPhoneNumber(inputValue, country.code);
      setFormattedValue(result.formatted);
      setIsValid(result.isValid);
      onChange(inputValue, result.formatted, result.isValid);
    }
  };

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!searchTerm) return countries;

    const term = searchTerm.toLowerCase();
    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(term) ||
        country.code.toLowerCase().includes(term) ||
        country.callingCode.includes(term)
    );
  }, [countries, searchTerm]);

  // Update internal state when external value changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
      const result = formatPhoneNumber(value, selectedCountry?.code);
      setFormattedValue(result.formatted);
      setIsValid(result.isValid);
    }
  }, [value, formatPhoneNumber, selectedCountry?.code, inputValue]);

  const getValidationIcon = () => {
    if (!showValidation || !inputValue.trim()) return null;

    if (isValid) {
      return <Check className="h-4 w-4 text-green-500" />;
    } else {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getValidationMessage = () => {
    if (!showValidation || !inputValue.trim()) return null;

    if (error) return error;

    if (isValid) return "Valid phone number";
    if (inputValue.trim()) return "Please enter a valid phone number";

    return null;
  };

  return (
    <div className={cn("relative", className)}>
      {/* Main Input Container */}
      <div
        className={cn(
          "flex border-2 rounded-lg transition-all",
          "focus-within:ring-2 focus-within:ring-blue-500/20",
          {
            "border-gray-200 focus-within:border-blue-500": !error && !isValid,
            "border-green-300 focus-within:border-green-500":
              isValid && inputValue.trim(),
            "border-red-300 focus-within:border-red-500":
              error || (inputValue.trim() && !isValid),
            "bg-gray-50": disabled,
          }
        )}
      >
        {/* Country Selector */}
        {showCountrySelector && selectedCountry && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              disabled={disabled}
              className={cn(
                "flex items-center gap-2 px-3 py-2 border-r border-gray-200",
                "hover:bg-gray-50 transition-colors min-w-0 disabled:cursor-not-allowed",
                showCountryDropdown && "bg-blue-50"
              )}
            >
              <span className="text-lg">{selectedCountry.flag}</span>
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                {selectedCountry.callingCode}
              </span>
              <ChevronDown
                className={cn(
                  "h-3 w-3 text-gray-400 transition-transform",
                  showCountryDropdown && "rotate-180"
                )}
              />
            </button>

            {/* Country Dropdown */}
            <AnimatePresence>
              {showCountryDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-full left-0 z-50 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
                >
                  {/* Search Input */}
                  <div className="p-3 border-b border-gray-200">
                    <input
                      type="text"
                      placeholder="Search countries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  {/* Countries List */}
                  <div className="max-h-64 overflow-y-auto">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => handleCountrySelect(country)}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                        >
                          <span className="text-lg">{country.flag}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate">
                              {country.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {country.callingCode}
                            </div>
                          </div>
                          {country.code === selectedCountry?.code && (
                            <Check className="h-4 w-4 text-blue-600" />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-sm text-gray-500">
                        No countries found
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Phone Number Input */}
        <input
          type="tel"
          value={formattedValue || inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder || `Enter phone number...`}
          disabled={disabled}
          className={cn(
            "flex-1 px-3 py-2 text-sm bg-transparent outline-none disabled:cursor-not-allowed",
            "placeholder:text-gray-400"
          )}
        />

        {/* Validation Icon */}
        {getValidationIcon() && (
          <div className="flex items-center px-3">{getValidationIcon()}</div>
        )}
      </div>

      {/* Validation Message */}
      <AnimatePresence>
        {getValidationMessage() && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className={cn("mt-1 text-xs flex items-center gap-1", {
              "text-green-600": isValid && !error,
              "text-red-600": error || (!isValid && inputValue.trim()),
              "text-gray-500": !inputValue.trim() && !error,
            })}
          >
            {error && <AlertCircle className="h-3 w-3" />}
            {isValid && !error && <Check className="h-3 w-3" />}
            {getValidationMessage()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside handler */}
      {showCountryDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowCountryDropdown(false)}
        />
      )}
    </div>
  );
};

// Hook for easier integration
export const usePhoneNumberFormatter = (defaultCountry = "US") => {
  const [phoneData, setPhoneData] = useState({
    raw: "",
    formatted: "",
    isValid: false,
    country: null as Country | null,
  });

  const handlePhoneChange = useCallback(
    (raw: string, formatted: string, isValid: boolean) => {
      setPhoneData((prev) => ({ ...prev, raw, formatted, isValid }));
    },
    []
  );

  const handleCountryChange = useCallback((country: Country) => {
    setPhoneData((prev) => ({ ...prev, country }));
  }, []);

  const reset = useCallback(() => {
    setPhoneData({
      raw: "",
      formatted: "",
      isValid: false,
      country: null,
    });
  }, []);

  return {
    phoneData,
    handlePhoneChange,
    handleCountryChange,
    reset,
  };
};

export default PhoneNumberFormatter;
