"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Shield,
  AlertTriangle,
  CheckCircle,
  X,
  Info,
  Clock,
  Building,
  Globe,
  Zap,
  Loader2,
} from "lucide-react";

interface ValidationResult {
  isValid: boolean;
  type: "business" | "personal" | "temporary" | "invalid";
  confidence: number; // 0-100
  domain: {
    name: string;
    isBusinessDomain: boolean;
    isFreeProvider: boolean;
    isTemporary: boolean;
    hasValidMX: boolean;
    reputation: "good" | "suspicious" | "bad";
  };
  suggestions?: string[];
  warnings?: string[];
  errors?: string[];
}

interface BusinessEmailValidatorProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (result: ValidationResult) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

// Common free email providers
const FREE_EMAIL_PROVIDERS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "live.com",
  "msn.com",
  "yahoo.co.uk",
  "gmail.co.uk",
  "hotmail.co.uk",
  "yahoo.ca",
  "yahoo.com.au",
  "gmx.com",
  "web.de",
  "mail.ru",
  "yandex.ru",
  "protonmail.com",
  "tutanota.com",
  "zoho.com",
  "fastmail.com",
  "hey.com",
]);

// Known temporary/disposable email providers
const TEMP_EMAIL_PROVIDERS = new Set([
  "10minutemail.com",
  "tempmail.org",
  "guerrillamail.com",
  "mailinator.com",
  "temp-mail.org",
  "throwaway.email",
  "getnada.com",
  "maildrop.cc",
  "sharklasers.com",
  "guerrillamail.info",
  "guerrillamail.biz",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "pokemail.net",
  "spam4.me",
  "mailtemp.info",
  "tempinbox.com",
  "emailondeck.com",
  "fakeinbox.com",
  "yopmail.com",
  "mailcatch.com",
  "mohmal.com",
  "emailfake.com",
  "tempail.com",
  "dispostable.com",
  "throwawaymail.com",
  "tempemail.net",
  "jetable.org",
  "trashmail.com",
]);

// Business domain patterns (heuristics)
const BUSINESS_DOMAIN_INDICATORS = [
  /^[a-z0-9-]+\.com$/i,
  /^[a-z0-9-]+\.co\.uk$/i,
  /^[a-z0-9-]+\.org$/i,
  /^[a-z0-9-]+\.net$/i,
  /^[a-z0-9-]+\.biz$/i,
  /^[a-z0-9-]+\.inc$/i,
  /^[a-z0-9-]+\.ltd$/i,
  /^[a-z0-9-]+\.llc$/i,
];

// Email regex for thorough validation
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Domain validation
const validateDomain = async (
  domain: string
): Promise<Partial<ValidationResult["domain"]>> => {
  const normalizedDomain = domain.toLowerCase().trim();

  return {
    name: normalizedDomain,
    isFreeProvider: FREE_EMAIL_PROVIDERS.has(normalizedDomain),
    isTemporary: TEMP_EMAIL_PROVIDERS.has(normalizedDomain),
    isBusinessDomain:
      !FREE_EMAIL_PROVIDERS.has(normalizedDomain) &&
      !TEMP_EMAIL_PROVIDERS.has(normalizedDomain) &&
      BUSINESS_DOMAIN_INDICATORS.some((pattern) =>
        pattern.test(normalizedDomain)
      ),
    hasValidMX: true, // In a real app, this would involve DNS lookup
    reputation: FREE_EMAIL_PROVIDERS.has(normalizedDomain)
      ? "good"
      : TEMP_EMAIL_PROVIDERS.has(normalizedDomain)
      ? "bad"
      : "good",
  };
};

// Generate email suggestions
const generateSuggestions = (
  email: string,
  domain: ValidationResult["domain"]
): string[] => {
  const [localPart] = email.split("@");
  const suggestions: string[] = [];

  // Remove business email suggestions - accept all valid emails

  if (domain.isTemporary) {
    suggestions.push(
      `${localPart}@gmail.com`,
      `${localPart}@outlook.com`,
      `${localPart}@yourcompany.com`
    );
  }

  // Common typo corrections
  const typoCorrections: Record<string, string> = {
    "gmial.com": "gmail.com",
    "gmai.com": "gmail.com",
    "yahooo.com": "yahoo.com",
    "hotmial.com": "hotmail.com",
    "outlok.com": "outlook.com",
    "outloo.com": "outlook.com",
  };

  const correction = typoCorrections[domain.name];
  if (correction) {
    suggestions.unshift(`${localPart}@${correction}`);
  }

  return [...new Set(suggestions)].slice(0, 3);
};

export function BusinessEmailValidator({
  value,
  onChange,
  onValidationChange,
  placeholder = "your.email@company.com",
  required = false,
  className = "",
  disabled = false,
}: BusinessEmailValidatorProps) {
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Debounced validation
  const validateEmail = useCallback(
    async (email: string): Promise<ValidationResult> => {
      if (!email.trim()) {
        return {
          isValid: false,
          type: "invalid",
          confidence: 0,
          domain: {
            name: "",
            isBusinessDomain: false,
            isFreeProvider: false,
            isTemporary: false,
            hasValidMX: false,
            reputation: "good",
          },
        };
      }

      // Basic format validation
      if (!EMAIL_REGEX.test(email)) {
        return {
          isValid: false,
          type: "invalid",
          confidence: 0,
          domain: {
            name: "",
            isBusinessDomain: false,
            isFreeProvider: false,
            isTemporary: false,
            hasValidMX: false,
            reputation: "bad",
          },
          errors: ["Invalid email format"],
          suggestions: generateSuggestions(email, {
            name: "",
            isBusinessDomain: false,
            isFreeProvider: false,
            isTemporary: false,
            hasValidMX: false,
            reputation: "bad",
          }),
        };
      }

      const [localPart, domainPart] = email.split("@");

      // Validate local part
      if (localPart.length > 64) {
        return {
          isValid: false,
          type: "invalid",
          confidence: 0,
          domain: {
            name: domainPart || "",
            isBusinessDomain: false,
            isFreeProvider: false,
            isTemporary: false,
            hasValidMX: false,
            reputation: "bad",
          },
          errors: ["Email address is too long"],
        };
      }

      if (!domainPart) {
        return {
          isValid: false,
          type: "invalid",
          confidence: 0,
          domain: {
            name: "",
            isBusinessDomain: false,
            isFreeProvider: false,
            isTemporary: false,
            hasValidMX: false,
            reputation: "bad",
          },
          errors: ["Missing domain"],
        };
      }

      // Validate domain
      const domainInfo = await validateDomain(domainPart);

      let type: ValidationResult["type"] = "invalid";
      let confidence = 0;
      const warnings: string[] = [];
      const errors: string[] = [];
      let isValid = true;

      // Determine email type and confidence - simplified to accept all valid emails
      if (domainInfo.isTemporary) {
        type = "temporary";
        confidence = 0;
        isValid = false;
        errors.push("Temporary/disposable email addresses are not allowed");
      } else {
        // Accept all non-temporary emails as valid
        type = "business"; // Treat all emails as valid business emails
        confidence = 95; // High confidence for any valid, non-temporary email
      }

      // Additional validation checks
      if (domainInfo.reputation === "bad") {
        confidence = Math.min(confidence, 20);
        warnings.push("This domain has a poor reputation");
      }

      if (!domainInfo.hasValidMX) {
        confidence = Math.min(confidence, 30);
        warnings.push("Domain may not be configured to receive emails");
      }

      // Check for common patterns that suggest non-business use
      const personalPatterns = [
        /^(test|demo|sample|example)@/i,
        /^(admin|info|contact|support|sales)@.*\.(com|org|net)$/i,
        /\+.*@/, // Plus addressing often used for personal emails
      ];

      if (personalPatterns.some((pattern) => pattern.test(email))) {
        confidence = Math.min(confidence, 60);
        warnings.push("Email pattern suggests personal or test use");
      }

      const result: ValidationResult = {
        isValid,
        type,
        confidence,
        domain: domainInfo as ValidationResult["domain"],
        ...(warnings.length > 0 && { warnings }),
        ...(errors.length > 0 && { errors }),
      };

      // Generate suggestions only for invalid/temporary emails
      if (!isValid) {
        result.suggestions = generateSuggestions(
          email,
          domainInfo as ValidationResult["domain"]
        );
      }

      return result;
    },
    []
  );

  // Handle validation with debouncing
  useEffect(() => {
    if (!value.trim()) {
      setValidationResult(null);
      setIsValidating(false);
      return;
    }

    setIsValidating(true);
    const timeoutId = setTimeout(async () => {
      try {
        const result = await validateEmail(value);
        setValidationResult(result);
        setShowSuggestions(
          result.suggestions ? result.suggestions.length > 0 : false
        );

        if (onValidationChange) {
          onValidationChange(result);
        }
      } catch (error) {
        console.error("Email validation error:", error);
        const errorResult: ValidationResult = {
          isValid: false,
          type: "invalid",
          confidence: 0,
          domain: {
            name: "",
            isBusinessDomain: false,
            isFreeProvider: false,
            isTemporary: false,
            hasValidMX: false,
            reputation: "bad",
          },
          errors: ["Validation failed. Please check your internet connection."],
        };
        setValidationResult(errorResult);
        if (onValidationChange) {
          onValidationChange(errorResult);
        }
      } finally {
        setIsValidating(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [value, validateEmail, onValidationChange]);

  // Get validation icon and color
  const getValidationStatus = () => {
    if (isValidating) {
      return {
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        color: "text-blue-500",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      };
    }

    if (!validationResult) {
      return {
        icon: <Mail className="w-4 h-4" />,
        color: "text-gray-400",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
      };
    }

    switch (validationResult.type) {
      case "business":
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        };
      case "personal":
        return {
          icon: <Info className="w-4 h-4" />,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
        };
      case "temporary":
        return {
          icon: <X className="w-4 h-4" />,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        };
      default:
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        };
    }
  };

  const status = getValidationStatus();

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600 bg-green-100";
    if (confidence >= 60) return "text-yellow-600 bg-yellow-100";
    if (confidence >= 40) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <div className={`relative ${className}`}>
      {/* Email Input */}
      <div className="relative">
        <input
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`
            w-full px-4 py-3 pr-12 text-sm border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${status.borderColor}
            ${validationResult?.isValid === false ? "border-red-300" : ""}
          `}
          aria-describedby={
            validationResult?.errors?.length ||
            validationResult?.warnings?.length
              ? "email-feedback"
              : undefined
          }
          aria-invalid={validationResult?.isValid === false}
        />

        {/* Status Icon */}
        <div
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${status.color}`}
        >
          {status.icon}
        </div>
      </div>

      {/* Validation Feedback */}
      <AnimatePresence>
        {validationResult && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2"
            id="email-feedback"
          >
            {/* Status Info */}
            <div
              className={`flex items-center justify-between p-3 rounded-lg ${status.bgColor} ${status.borderColor} border`}
            >
              <div className="flex items-center space-x-2">
                <div className={status.color}>{status.icon}</div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      {validationResult.type === "business" && "Valid Email"}
                      {validationResult.type === "personal" && "Valid Email"}
                      {validationResult.type === "temporary" &&
                        "Temporary Email"}
                      {validationResult.type === "invalid" && "Invalid Email"}
                    </span>
                    {validationResult.confidence > 0 && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getConfidenceColor(
                          validationResult.confidence
                        )}`}
                      >
                        {validationResult.confidence}% confidence
                      </span>
                    )}
                  </div>

                  {/* Domain Info */}
                  {validationResult.domain.name && (
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600">
                      <span>Domain: {validationResult.domain.name}</span>
                      {validationResult.domain.isFreeProvider && (
                        <span className="flex items-center">
                          <Globe className="w-3 h-3 mr-1" />
                          Free Provider
                        </span>
                      )}
                      {validationResult.domain.isBusinessDomain && (
                        <span className="flex items-center">
                          <Building className="w-3 h-3 mr-1" />
                          Business Domain
                        </span>
                      )}
                      {validationResult.domain.isTemporary && (
                        <span className="flex items-center text-red-600">
                          <Clock className="w-3 h-3 mr-1" />
                          Temporary
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {validationResult.type === "business" && (
                <Shield className="w-5 h-5 text-green-600" />
              )}
            </div>

            {/* Errors */}
            {validationResult.errors && validationResult.errors.length > 0 && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800">
                      Issues Found
                    </h4>
                    <ul className="mt-1 text-sm text-red-700 space-y-1">
                      {validationResult.errors.map((error, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-1 h-1 bg-red-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Warnings - Removed to simplify validation */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions */}
      <AnimatePresence>
        {showSuggestions && validationResult?.suggestions && isFocused && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
          >
            <div className="p-2">
              <div className="text-xs font-medium text-gray-700 mb-2 px-2">
                <Zap className="w-3 h-3 inline mr-1" />
                Suggestions
              </div>
              <div className="space-y-1">
                {validationResult.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-blue-50 focus:outline-none focus:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3 h-3 text-gray-400" />
                      <span>{suggestion}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
