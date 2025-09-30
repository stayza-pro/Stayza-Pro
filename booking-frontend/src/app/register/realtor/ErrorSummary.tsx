import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/utils/cn";

interface FieldError {
  field: string;
  message: string;
  step?: number;
  stepName?: string;
}

interface ErrorSummaryProps {
  errors: Record<string, string | { message?: string; [key: string]: any }>;
  currentStep: number;
  stepNames: string[];
  onFieldFocus?: (fieldName: string, step?: number) => void;
  onStepChange?: (step: number) => void;
  className?: string;
  showStepBreakdown?: boolean;
  collapsible?: boolean;
  maxVisible?: number;
  position?: "top" | "bottom" | "inline";
}

export const ErrorSummary: React.FC<ErrorSummaryProps> = ({
  errors,
  currentStep,
  stepNames,
  onFieldFocus,
  onStepChange,
  className,
  showStepBreakdown = true,
  collapsible = true,
  maxVisible = 5,
  position = "top",
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  const fieldErrors: FieldError[] = Object.entries(errors).map(
    ([field, error]) => {
      // Handle different error formats
      let message: string;
      if (typeof error === "string") {
        message = error;
      } else if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        error.message
      ) {
        message = String(error.message);
      } else {
        message = "Invalid input";
      }

      return {
        field,
        message,
        step: getFieldStep(field),
        stepName:
          getFieldStep(field) !== undefined
            ? stepNames[getFieldStep(field)!]
            : undefined,
      };
    }
  );

  const errorsByStep = groupErrorsByStep(fieldErrors);
  const totalErrors = fieldErrors.length;
  const visibleErrors = isExpanded
    ? fieldErrors
    : fieldErrors.slice(0, maxVisible);

  useEffect(() => {
    setIsVisible(totalErrors > 0);
  }, [totalErrors]);

  function getFieldStep(fieldName: string): number | undefined {
    // Map field names to steps based on form structure
    const stepMapping: Record<string, number> = {
      // Step 0: Account
      businessEmail: 0,
      password: 0,
      confirmPassword: 0,
      acceptTerms: 0,

      // Step 1: Business
      businessName: 1,
      businessType: 1,
      phoneNumber: 1,
      address: 1,
      city: 1,
      state: 1,
      zipCode: 1,
      country: 1,
      businessDescription: 1,

      // Step 2: Branding
      "brandColors.primary": 2,
      "brandColors.secondary": 2,
      logo: 2,
      tagline: 2,
      subdomain: 2,

      // Step 3: Social
      whatsappType: 3,
      whatsappNumber: 3,
      "socials.facebook": 3,
      "socials.instagram": 3,
      "socials.twitter": 3,
      "socials.linkedin": 3,

      // Step 4: Review (no fields, just confirmation)
    };

    return stepMapping[fieldName];
  }

  function groupErrorsByStep(
    errors: FieldError[]
  ): Record<number, FieldError[]> {
    return errors.reduce((acc, error) => {
      const step = error.step ?? -1;
      if (!acc[step]) acc[step] = [];
      acc[step].push(error);
      return acc;
    }, {} as Record<number, FieldError[]>);
  }

  const handleFieldClick = (error: FieldError) => {
    // Navigate to the step containing the field
    if (error.step !== undefined && error.step !== currentStep) {
      onStepChange?.(error.step);
    }

    // Focus the field after a brief delay to allow step navigation
    setTimeout(
      () => {
        onFieldFocus?.(error.field, error.step);
      },
      error.step !== currentStep ? 300 : 0
    );
  };

  const formatFieldName = (fieldName: string): string => {
    return fieldName
      .replace(/([A-Z])/g, " $1")
      .replace(/\./g, " > ")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const getErrorIcon = (step?: number) => {
    if (step === currentStep) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    return <ExternalLink className="h-3 w-3 text-gray-400" />;
  };

  if (!isVisible) return null;

  const containerClasses = cn(
    "bg-red-50 border border-red-200 rounded-lg overflow-hidden",
    {
      "fixed top-4 left-4 right-4 z-40 max-w-md mx-auto": position === "top",
      "fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto":
        position === "bottom",
      "mb-6": position === "inline",
    },
    className
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{
          opacity: 0,
          y: position === "bottom" ? 20 : -20,
          scale: 0.95,
        }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: position === "bottom" ? 20 : -20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={containerClasses}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-red-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-800">
              {totalErrors} Error{totalErrors > 1 ? "s" : ""} Found
            </h3>
          </div>

          <div className="flex items-center gap-1">
            {collapsible && totalErrors > maxVisible && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-red-200 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-red-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-red-600" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Error List */}
        <div className="max-h-64 overflow-y-auto">
          {showStepBreakdown ? (
            // Group by steps
            <div className="divide-y divide-red-200">
              {Object.entries(errorsByStep)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([stepStr, stepErrors]) => {
                  const step = Number(stepStr);
                  const stepName = step >= 0 ? stepNames[step] : "General";

                  return (
                    <div key={step} className="p-3">
                      <div className="text-sm font-medium text-red-700 mb-2 flex items-center gap-2">
                        {step >= 0 && (
                          <span className="w-5 h-5 bg-red-200 text-red-800 rounded-full text-xs flex items-center justify-center font-bold">
                            {step + 1}
                          </span>
                        )}
                        {stepName}
                        <span className="text-red-500">
                          ({stepErrors.length})
                        </span>
                      </div>

                      <div className="space-y-2">
                        {stepErrors.map((error, index) => (
                          <motion.button
                            key={`${error.field}-${index}`}
                            onClick={() => handleFieldClick(error)}
                            className="w-full text-left p-2 bg-white rounded border border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors group"
                            whileHover={{ x: 2 }}
                          >
                            <div className="flex items-start gap-2">
                              {getErrorIcon(error.step)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 group-hover:text-red-700">
                                  {formatFieldName(error.field)}
                                </p>
                                <p className="text-xs text-red-600 mt-0.5">
                                  {error.message}
                                </p>
                              </div>
                              {error.step !== currentStep && (
                                <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-red-500 flex-shrink-0 mt-0.5" />
                              )}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            // Simple list
            <div className="p-3 space-y-2">
              {visibleErrors.map((error, index) => (
                <motion.button
                  key={`${error.field}-${index}`}
                  onClick={() => handleFieldClick(error)}
                  className="w-full text-left p-2 bg-white rounded border border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors group"
                  whileHover={{ x: 2 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-start gap-2">
                    {getErrorIcon(error.step)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-red-700">
                        {formatFieldName(error.field)}
                        {error.stepName && (
                          <span className="text-gray-500 text-xs ml-2">
                            in {error.stepName}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-red-600 mt-0.5">
                        {error.message}
                      </p>
                    </div>
                    {error.step !== currentStep && (
                      <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {/* Show More/Less */}
          {collapsible && totalErrors > maxVisible && (
            <div className="p-3 pt-0">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-center py-2 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                {isExpanded
                  ? `Show Less (${totalErrors - maxVisible} hidden)`
                  : `Show ${totalErrors - maxVisible} More Error${
                      totalErrors - maxVisible > 1 ? "s" : ""
                    }`}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Hook for managing error summary
export const useErrorSummary = (
  errors: Record<string, string>,
  formRef?: React.RefObject<HTMLFormElement>
) => {
  const focusField = (fieldName: string) => {
    if (!formRef?.current) return;

    // Try to find the field by name, id, or data attribute
    const selectors = [
      `[name="${fieldName}"]`,
      `#${fieldName}`,
      `[data-field="${fieldName}"]`,
      `[data-testid="${fieldName}"]`,
    ];

    for (const selector of selectors) {
      const element = formRef.current.querySelector(selector) as HTMLElement;
      if (element) {
        element.focus();
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        break;
      }
    }
  };

  return { focusField };
};

export default ErrorSummary;
