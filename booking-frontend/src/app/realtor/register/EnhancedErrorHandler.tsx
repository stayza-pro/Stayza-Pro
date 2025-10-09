"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Info,
  Lightbulb,
  ExternalLink,
  Copy,
  X,
} from "lucide-react";
import { FieldError, FieldErrors } from "react-hook-form";
import { ZodError } from "zod";

type ErrorSeverity = "error" | "warning" | "info" | "success";
type ErrorCategory =
  | "validation"
  | "network"
  | "server"
  | "security"
  | "business";

interface EnhancedError {
  id: string;
  field?: string;
  message: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  suggestion?: string;
  action?: {
    label: string;
    handler: () => void;
  };
  dismissible?: boolean;
  helpUrl?: string;
  context?: Record<string, any>;
}

interface EnhancedErrorHandlerProps {
  errors: FieldErrors;
  globalErrors?: EnhancedError[];
  onRetry?: () => void;
  onClearErrors?: () => void;
  className?: string;
}

export const EnhancedErrorHandler: React.FC<EnhancedErrorHandlerProps> = ({
  errors,
  globalErrors = [],
  onRetry,
  onClearErrors,
  className = "",
}) => {
  const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(
    new Set()
  );
  const [copiedErrorId, setCopiedErrorId] = useState<string | null>(null);

  // Convert field errors to enhanced errors
  const fieldErrors: EnhancedError[] = errors
    ? Object.entries(errors).map(([field, error]) => {
        // Safely handle different error types
        const errorMessage =
          typeof error?.message === "string"
            ? error.message
            : error && typeof error === "object" && "message" in error
            ? String(error.message)
            : "Invalid value";

        return {
          id: `field-${field}`,
          field,
          message: errorMessage,
          severity: "error" as ErrorSeverity,
          category: "validation" as ErrorCategory,
          suggestion: getFieldSuggestion(field, errorMessage),
          dismissible: false,
        };
      })
    : [];

  // Combine all errors
  const allErrors = [...fieldErrors, ...globalErrors].filter(
    (error) => !dismissedErrors.has(error.id)
  );

  const handleDismiss = (errorId: string) => {
    setDismissedErrors((prev) => new Set([...prev, errorId]));
  };

  const handleCopyError = async (error: EnhancedError) => {
    const errorInfo = `Field: ${error.field || "Global"}\nMessage: ${
      error.message
    }\nSuggestion: ${error.suggestion || "None"}`;

    try {
      await navigator.clipboard.writeText(errorInfo);
      setCopiedErrorId(error.id);
      setTimeout(() => setCopiedErrorId(null), 2000);
    } catch (err) {
      console.error("Failed to copy error info:", err);
    }
  };

  const getErrorIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getErrorTheme = (severity: ErrorSeverity) => {
    switch (severity) {
      case "error":
        return {
          bg: "bg-red-50 border-red-200",
          text: "text-red-800",
          button: "text-red-600 hover:text-red-800",
        };
      case "warning":
        return {
          bg: "bg-yellow-50 border-yellow-200",
          text: "text-yellow-800",
          button: "text-yellow-600 hover:text-yellow-800",
        };
      case "info":
        return {
          bg: "bg-blue-50 border-blue-200",
          text: "text-blue-800",
          button: "text-blue-600 hover:text-blue-800",
        };
      case "success":
        return {
          bg: "bg-green-50 border-green-200",
          text: "text-green-800",
          button: "text-green-600 hover:text-green-800",
        };
      default:
        return {
          bg: "bg-gray-50 border-gray-200",
          text: "text-gray-800",
          button: "text-gray-600 hover:text-gray-800",
        };
    }
  };

  if (allErrors.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      <AnimatePresence>
        {allErrors.map((error) => {
          const theme = getErrorTheme(error.severity);

          return (
            <motion.div
              key={error.id}
              initial={{ opacity: 0, scale: 0.95, height: 0 }}
              animate={{ opacity: 1, scale: 1, height: "auto" }}
              exit={{ opacity: 0, scale: 0.95, height: 0 }}
              className={`p-4 border rounded-lg ${theme.bg} ${theme.text}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 pt-0.5">
                  {getErrorIcon(error.severity)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {error.field && (
                        <p className="text-sm font-medium mb-1">
                          {formatFieldName(error.field)}
                        </p>
                      )}
                      <p className="text-sm">{error.message}</p>

                      {error.suggestion && (
                        <div className="mt-2 flex items-start space-x-2">
                          <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <p className="text-sm opacity-90">
                            {error.suggestion}
                          </p>
                        </div>
                      )}

                      {error.context && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer opacity-75 hover:opacity-100">
                            Technical Details
                          </summary>
                          <pre className="text-xs mt-1 p-2 bg-black bg-opacity-10 rounded overflow-x-auto">
                            {JSON.stringify(error.context, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-3">
                      <button
                        onClick={() => handleCopyError(error)}
                        className={`p-1 rounded hover:bg-black hover:bg-opacity-10 transition-colors ${theme.button}`}
                        title="Copy error details"
                      >
                        {copiedErrorId === error.id ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      {error.dismissible && (
                        <button
                          onClick={() => handleDismiss(error.id)}
                          className={`p-1 rounded hover:bg-black hover:bg-opacity-10 transition-colors ${theme.button}`}
                          title="Dismiss error"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 mt-3">
                    {error.action && (
                      <button
                        onClick={error.action.handler}
                        className={`text-sm font-medium underline hover:no-underline ${theme.button}`}
                      >
                        {error.action.label}
                      </button>
                    )}

                    {error.helpUrl && (
                      <a
                        href={error.helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-sm font-medium underline hover:no-underline flex items-center space-x-1 ${theme.button}`}
                      >
                        <span>Learn more</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {onRetry && error.category === "network" && (
                      <button
                        onClick={onRetry}
                        className={`text-sm font-medium underline hover:no-underline flex items-center space-x-1 ${theme.button}`}
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Global error actions */}
      {allErrors.length > 1 && onClearErrors && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center pt-2"
        >
          <button
            onClick={onClearErrors}
            className="text-sm text-gray-600 hover:text-gray-800 underline hover:no-underline"
          >
            Clear all errors
          </button>
        </motion.div>
      )}
    </div>
  );
};

// Helper functions
function getErrorMessage(error: FieldError | undefined): string {
  if (!error) return "Unknown error";

  if (typeof error.message === "string") {
    return error.message;
  }

  if (error.type) {
    return getDefaultErrorMessage(error.type);
  }

  return "Invalid value";
}

function getDefaultErrorMessage(type: string): string {
  const errorMessages: Record<string, string> = {
    required: "This field is required",
    min: "Value is too small",
    max: "Value is too large",
    minLength: "Text is too short",
    maxLength: "Text is too long",
    pattern: "Invalid format",
    businessEmail: "Please enter a valid email address",
    url: "Please enter a valid URL",
    date: "Please enter a valid date",
    number: "Please enter a valid number",
  };

  return errorMessages[type] || "Invalid value";
}

function getFieldSuggestion(
  field: string,
  message: string
): string | undefined {
  const suggestions: Record<string, string> = {
    businessEmail:
      "Make sure your email includes @ and a valid domain (e.g., user@example.com)",
    password:
      "Use at least 8 characters with a mix of letters, numbers, and symbols",
    phone:
      "Include your country code and use only numbers and common separators",
    website: "Start with http:// or https:// and include a valid domain name",
    businessName: "Use your official business name as registered",
    licenseNumber:
      "Enter your license number exactly as it appears on your license",
    yearsExperience: "Enter a number between 0 and 50",
    zipCode: "Use the standard postal code format for your country",
    socialMedia:
      "Enter the full URL to your profile (e.g., https://linkedin.com/in/yourname)",
  };

  return suggestions[field];
}

function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/_/g, " ");
}

// Error factory functions for common scenarios
export const createNetworkError = (
  message: string,
  retryHandler?: () => void
): EnhancedError => ({
  id: `network-${Date.now()}`,
  message,
  severity: "error",
  category: "network",
  suggestion: "Check your internet connection and try again",
  action: retryHandler ? { label: "Retry", handler: retryHandler } : undefined,
  dismissible: true,
});

export const createValidationError = (
  field: string,
  message: string
): EnhancedError => ({
  id: `validation-${field}-${Date.now()}`,
  field,
  message,
  severity: "error",
  category: "validation",
  suggestion: getFieldSuggestion(field, message),
  dismissible: false,
});

export const createBusinessError = (
  message: string,
  suggestion?: string
): EnhancedError => ({
  id: `business-${Date.now()}`,
  message,
  severity: "warning",
  category: "business",
  suggestion,
  dismissible: true,
});

export const createSecurityError = (
  message: string,
  helpUrl?: string
): EnhancedError => ({
  id: `security-${Date.now()}`,
  message,
  severity: "error",
  category: "security",
  suggestion: "Please review your input for security compliance",
  helpUrl,
  dismissible: false,
});

export const createSuccessMessage = (message: string): EnhancedError => ({
  id: `success-${Date.now()}`,
  message,
  severity: "success",
  category: "validation",
  dismissible: true,
});

export default EnhancedErrorHandler;
