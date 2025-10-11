"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle,
  X,
  Zap,
  Clock,
  AlertCircle,
  Shield,
  Loader2,
  Bug,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "react-hot-toast";

// Error types
type ErrorType =
  | "network"
  | "validation"
  | "authentication"
  | "server"
  | "timeout"
  | "rate-limit"
  | "unknown";

type ErrorSeverity = "low" | "medium" | "high" | "critical";

interface ErrorDetails {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  title: string;
  message: string;
  details?: string;
  retryable: boolean;
  retryCount: number;
  maxRetries: number;
  timestamp: Date;
  context?: Record<string, any>;
  suggestions?: string[];
  helpUrl?: string;
  reportable: boolean;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryOn: ErrorType[];
}

interface ErrorHandlerProps {
  onRetry?: (errorId: string) => Promise<void>;
  onReport?: (error: ErrorDetails) => void;
  onDismiss?: (errorId: string) => void;
  retryConfig?: Partial<RetryConfig>;
  showNetworkStatus?: boolean;
  className?: string;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryOn: ["network", "server", "timeout"],
};

// Error messages and suggestions
const ERROR_MESSAGES: Record<
  ErrorType,
  {
    title: string;
    defaultMessage: string;
    suggestions: string[];
    helpUrl?: string;
  }
> = {
  network: {
    title: "Connection Problem",
    defaultMessage:
      "Unable to connect to the server. Please check your internet connection.",
    suggestions: [
      "Check your internet connection",
      "Try refreshing the page",
      "Disable any VPN or proxy",
      "Check if your firewall is blocking the connection",
    ],
    helpUrl: "/help/connection-issues",
  },
  validation: {
    title: "Validation Error",
    defaultMessage: "Some information provided is not valid.",
    suggestions: [
      "Review the form fields highlighted in red",
      "Ensure all required fields are filled",
      "Check the format of email addresses and phone numbers",
      "Remove any special characters that may not be allowed",
    ],
  },
  authentication: {
    title: "Authentication Required",
    defaultMessage: "You need to sign in to continue.",
    suggestions: [
      "Sign in with your account",
      "Check if your session has expired",
      "Clear browser cookies and try again",
      "Contact support if you continue to have issues",
    ],
    helpUrl: "/help/authentication",
  },
  server: {
    title: "Server Error",
    defaultMessage:
      "Our servers are experiencing issues. Please try again later.",
    suggestions: [
      "Wait a few minutes and try again",
      "Refresh the page",
      "Check our status page for known issues",
      "Contact support if the problem persists",
    ],
    helpUrl: "/help/server-errors",
  },
  timeout: {
    title: "Request Timeout",
    defaultMessage: "The request took too long to complete.",
    suggestions: [
      "Check your internet connection speed",
      "Try again with a faster connection",
      "Reduce the size of files being uploaded",
      "Contact support if timeouts persist",
    ],
  },
  "rate-limit": {
    title: "Too Many Requests",
    defaultMessage:
      "You've made too many requests. Please wait before trying again.",
    suggestions: [
      "Wait a few minutes before trying again",
      "Avoid rapid successive requests",
      "Contact support if you need higher limits",
      "Check if you have multiple tabs open",
    ],
  },
  unknown: {
    title: "Unexpected Error",
    defaultMessage: "An unexpected error occurred.",
    suggestions: [
      "Refresh the page and try again",
      "Clear your browser cache",
      "Try using a different browser",
      "Contact support with details about what you were doing",
    ],
  },
};

export function EnhancedErrorHandler({
  onRetry,
  onReport,
  onDismiss,
  retryConfig = {},
  showNetworkStatus = true,
  className = "",
}: ErrorHandlerProps) {
  const [errors, setErrors] = useState<Map<string, ErrorDetails>>(new Map());
  const [isOnline, setIsOnline] = useState(true);
  const [retryingErrors, setRetryingErrors] = useState<Set<string>>(new Set());
  const [networkQuality, setNetworkQuality] = useState<
    "good" | "slow" | "poor"
  >("good");

  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  const retryTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const networkTest = useRef<HTMLImageElement | null>(null);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Connection restored");
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error("Connection lost");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Test network quality - simplified to avoid image loading issues
    const testNetworkQuality = () => {
      if (!navigator.onLine) {
        setNetworkQuality("poor");
        return;
      }

      // Use connection API if available, otherwise assume good quality
      if ("connection" in navigator && (navigator as any).connection) {
        const conn = (navigator as any).connection;
        if (conn.effectiveType === "slow-2g" || conn.effectiveType === "2g") {
          setNetworkQuality("poor");
        } else if (conn.effectiveType === "3g") {
          setNetworkQuality("slow");
        } else {
          setNetworkQuality("good");
        }
      } else {
        setNetworkQuality("good");
      }
    };

    testNetworkQuality();
    const qualityInterval = setInterval(testNetworkQuality, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(qualityInterval);
    };
  }, []);

  // Auto-retry mechanism
  const scheduleRetry = useCallback(
    (error: ErrorDetails, delay: number) => {
      const timeoutId = setTimeout(async () => {
        if (!onRetry) return;

        setRetryingErrors((prev) => new Set([...prev, error.id]));

        try {
          await onRetry(error.id);
          // If successful, remove error
          setErrors((prev) => {
            const newErrors = new Map(prev);
            newErrors.delete(error.id);
            return newErrors;
          });
          toast.success("Operation completed successfully");
        } catch (retryError) {
          // Increment retry count and potentially schedule another retry
          const updatedError = {
            ...error,
            retryCount: error.retryCount + 1,
            timestamp: new Date(),
          };

          if (updatedError.retryCount < updatedError.maxRetries) {
            const nextDelay = Math.min(
              delay * config.backoffMultiplier,
              config.maxDelay
            );
            scheduleRetry(updatedError, nextDelay);
          } else {
            // Max retries reached
            updatedError.retryable = false;
            toast.error("All retry attempts failed");
          }

          setErrors((prev) => new Map(prev).set(error.id, updatedError));
        } finally {
          setRetryingErrors((prev) => {
            const newSet = new Set(prev);
            newSet.delete(error.id);
            return newSet;
          });
        }
      }, delay);

      retryTimeouts.current.set(error.id, timeoutId);
    },
    [onRetry, config.backoffMultiplier, config.maxDelay]
  );

  // Add new error
  const addError = useCallback(
    (type: ErrorType, message?: string, details?: Partial<ErrorDetails>) => {
      const errorInfo = ERROR_MESSAGES[type];
      const errorId = `error_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const error: ErrorDetails = {
        id: errorId,
        type,
        severity: "medium",
        title: errorInfo.title,
        message: message || errorInfo.defaultMessage,
        retryable: config.retryOn.includes(type),
        retryCount: 0,
        maxRetries: config.maxRetries,
        timestamp: new Date(),
        suggestions: errorInfo.suggestions,
        helpUrl: errorInfo.helpUrl,
        reportable: true,
        ...details,
      };

      setErrors((prev) => new Map(prev).set(errorId, error));

      // Auto-retry if configured
      if (error.retryable && onRetry) {
        scheduleRetry(error, config.baseDelay);
      }

      // Show toast notification
      const toastMessage = `${error.title}: ${error.message}`;
      switch (error.severity) {
        case "critical":
          toast.error(toastMessage, { duration: 6000 });
          break;
        case "high":
          toast.error(toastMessage);
          break;
        case "medium":
          toast(toastMessage, { icon: "⚠️" });
          break;
        case "low":
          toast(toastMessage, { icon: "ℹ️", duration: 3000 });
          break;
      }

      return errorId;
    },
    [config, onRetry, scheduleRetry]
  );

  // Manual retry
  const handleRetry = useCallback(
    async (errorId: string) => {
      const error = errors.get(errorId);
      if (!error || !onRetry) return;

      setRetryingErrors((prev) => new Set([...prev, errorId]));

      try {
        await onRetry(errorId);
        setErrors((prev) => {
          const newErrors = new Map(prev);
          newErrors.delete(errorId);
          return newErrors;
        });
        toast.success("Retry successful");
      } catch (retryError) {
        toast.error("Retry failed");
        console.error("Retry error:", retryError);
      } finally {
        setRetryingErrors((prev) => {
          const newSet = new Set(prev);
          newSet.delete(errorId);
          return newSet;
        });
      }
    },
    [errors, onRetry]
  );

  // Dismiss error
  const handleDismiss = useCallback(
    (errorId: string) => {
      // Clear any pending retry
      const timeoutId = retryTimeouts.current.get(errorId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        retryTimeouts.current.delete(errorId);
      }

      setErrors((prev) => {
        const newErrors = new Map(prev);
        newErrors.delete(errorId);
        return newErrors;
      });

      if (onDismiss) {
        onDismiss(errorId);
      }
    },
    [onDismiss]
  );

  // Report error
  const handleReport = useCallback(
    (error: ErrorDetails) => {
      if (onReport) {
        onReport(error);
        toast.success("Error report sent");
      }
    },
    [onReport]
  );

  // Get error icon
  const getErrorIcon = (error: ErrorDetails) => {
    switch (error.type) {
      case "network":
        return <WifiOff className="w-5 h-5" />;
      case "validation":
        return <AlertTriangle className="w-5 h-5" />;
      case "authentication":
        return <Shield className="w-5 h-5" />;
      case "server":
        return <AlertCircle className="w-5 h-5" />;
      case "timeout":
        return <Clock className="w-5 h-5" />;
      case "rate-limit":
        return <Zap className="w-5 h-5" />;
      default:
        return <Bug className="w-5 h-5" />;
    }
  };

  // Get error color classes
  const getErrorColors = (error: ErrorDetails) => {
    switch (error.severity) {
      case "critical":
        return {
          bg: "bg-red-100 border-red-300",
          text: "text-red-900",
          icon: "text-red-600",
          button: "text-red-700 hover:text-red-900",
        };
      case "high":
        return {
          bg: "bg-red-50 border-red-200",
          text: "text-red-800",
          icon: "text-red-500",
          button: "text-red-600 hover:text-red-800",
        };
      case "medium":
        return {
          bg: "bg-yellow-50 border-yellow-200",
          text: "text-yellow-800",
          icon: "text-yellow-600",
          button: "text-yellow-700 hover:text-yellow-900",
        };
      case "low":
        return {
          bg: "bg-blue-50 border-blue-200",
          text: "text-blue-800",
          icon: "text-blue-600",
          button: "text-blue-700 hover:text-blue-900",
        };
    }
  };

  // Get network status
  const getNetworkStatus = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff className="w-4 h-4" />,
        color: "text-red-600",
        status: "Offline",
      };
    }

    switch (networkQuality) {
      case "good":
        return {
          icon: <Wifi className="w-4 h-4" />,
          color: "text-green-600",
          status: "Good Connection",
        };
      case "slow":
        return {
          icon: <Wifi className="w-4 h-4" />,
          color: "text-yellow-600",
          status: "Slow Connection",
        };
      case "poor":
        return {
          icon: <WifiOff className="w-4 h-4" />,
          color: "text-red-600",
          status: "Poor Connection",
        };
    }
  };

  const networkStatus = getNetworkStatus();
  const errorArray = Array.from(errors.values()).sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  // Expose addError function globally for use in other components
  useEffect(() => {
    (window as any).addError = addError;
    return () => {
      delete (window as any).addError;
    };
  }, [addError]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 w-96 max-h-screen overflow-y-auto ${className}`}
    >
      {/* Network Status */}
      {showNetworkStatus && (
        <div
          className={`mb-2 p-2 bg-white border rounded-lg shadow-sm ${networkStatus.color}`}
        >
          <div className="flex items-center space-x-2 text-sm">
            {networkStatus.icon}
            <span>{networkStatus.status}</span>
          </div>
        </div>
      )}

      {/* Error Messages */}
      <AnimatePresence>
        {errorArray.map((error) => {
          const colors = getErrorColors(error);
          const isRetrying = retryingErrors.has(error.id);

          return (
            <motion.div
              key={error.id}
              initial={{ opacity: 0, x: 300, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className={`mb-3 p-4 border rounded-lg shadow-lg bg-white ${colors.bg}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={colors.icon}>{getErrorIcon(error)}</div>
                  <h4 className={`font-medium ${colors.text}`}>
                    {error.title}
                  </h4>
                </div>

                <button
                  onClick={() => handleDismiss(error.id)}
                  className={`${colors.button} hover:bg-black hover:bg-opacity-10 rounded p-1 transition-colors`}
                  aria-label="Dismiss error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message */}
              <p className={`text-sm mb-3 ${colors.text}`}>{error.message}</p>

              {/* Details */}
              {error.details && (
                <details className={`text-xs mb-3 ${colors.text}`}>
                  <summary className="cursor-pointer font-medium">
                    Technical Details
                  </summary>
                  <pre className="mt-1 p-2 bg-black bg-opacity-5 rounded overflow-x-auto">
                    {error.details}
                  </pre>
                </details>
              )}

              {/* Suggestions */}
              {error.suggestions && error.suggestions.length > 0 && (
                <div className="mb-3">
                  <h5 className={`text-xs font-medium mb-1 ${colors.text}`}>
                    Try these solutions:
                  </h5>
                  <ul className={`text-xs space-y-1 ${colors.text}`}>
                    {error.suggestions.slice(0, 3).map((suggestion, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-1 h-1 bg-current rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {error.retryable && (
                    <button
                      onClick={() => handleRetry(error.id)}
                      disabled={isRetrying}
                      className={`
                        flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded
                        ${
                          isRetrying
                            ? "opacity-50 cursor-not-allowed"
                            : colors.button
                        }
                        bg-white border transition-colors
                      `}
                    >
                      {isRetrying ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                      <span>{isRetrying ? "Retrying..." : "Retry"}</span>
                    </button>
                  )}

                  {error.helpUrl && (
                    <a
                      href={error.helpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`
                        flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded
                        ${colors.button} bg-white border transition-colors
                      `}
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>Help</span>
                      <ExternalLink className="w-2 h-2" />
                    </a>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {error.reportable && onReport && (
                    <button
                      onClick={() => handleReport(error)}
                      className={`text-xs ${colors.button} hover:underline`}
                    >
                      Report
                    </button>
                  )}

                  <span className={`text-xs ${colors.text} opacity-75`}>
                    {error.retryCount > 0 &&
                      `${error.retryCount}/${error.maxRetries} retries`}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
