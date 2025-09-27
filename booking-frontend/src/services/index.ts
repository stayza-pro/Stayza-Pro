// Export all services
export { authService } from "./auth";
export { propertyService } from "./properties";
export { bookingService } from "./bookings";
export { paymentService } from "./payments";
export { reviewService } from "./reviews";
export { realtorService } from "./realtors";

// Export API client and types
export { apiClient, type ApiResponse, type PaginatedResponse } from "./api";
export type {
  StripePaymentIntentRequest,
  StripePaymentIntentResponse,
  PaystackInitializationRequest,
  PaystackInitializationResponse,
  PaystackVerificationRequest,
  PaystackVerificationResponse,
} from "./payments";

// Utility functions for services
type QueryPrimitive = string | number | boolean | Date;
type QueryValue = QueryPrimitive | null | undefined | QueryPrimitive[];

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

interface ErrorResponseShape {
  data?: {
    message?: string;
    errors?: unknown[];
  };
  status?: number;
}

interface ErrorShape {
  response?: ErrorResponseShape;
  request?: unknown;
  message?: string;
}

const isErrorShape = (error: unknown): error is ErrorShape => {
  return isRecord(error);
};

export const serviceUtils = {
  // Format date for API
  formatDateForAPI: (date: Date): string => {
    return date.toISOString().split("T")[0];
  },

  // Build query string from object
  buildQueryString: (params: Record<string, QueryValue>): string => {
    const searchParams = new URLSearchParams();

    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value)) {
          const serialized = value
            .map((item) =>
              item instanceof Date
                ? item.toISOString().split("T")[0]
                : String(item)
            )
            .join(",");
          searchParams.append(key, serialized);
        } else if (value instanceof Date) {
          searchParams.append(key, value.toISOString().split("T")[0]);
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    return searchParams.toString();
  },

  // Handle file upload
  createFormData: (files: File[], fieldName = "files"): FormData => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append(fieldName, file);
    });
    return formData;
  },

  // Extract error message from API response
  extractErrorMessage: (error: unknown): string => {
    if (isErrorShape(error)) {
      const data = error.response?.data;
      if (isRecord(data)) {
        if (typeof data.message === "string" && data.message.trim().length) {
          return data.message;
        }
        const [firstError] = Array.isArray(data.errors) ? data.errors : [];
        if (typeof firstError === "string" && firstError.trim().length) {
          return firstError;
        }
      }
      if (typeof error.message === "string" && error.message.trim().length) {
        return error.message;
      }
    }

    if (error instanceof Error && error.message.trim().length) {
      return error.message;
    }
    return "An unexpected error occurred";
  },

  // Check if error is a network error
  isNetworkError: (error: unknown): boolean => {
    return isErrorShape(error) && !error.response && !!error.request;
  },

  // Check if error is an authentication error
  isAuthError: (error: unknown): boolean => {
    return isErrorShape(error) && error.response?.status === 401;
  },

  // Check if error is a permission error
  isPermissionError: (error: unknown): boolean => {
    return isErrorShape(error) && error.response?.status === 403;
  },

  // Check if error is a validation error
  isValidationError: (error: unknown): boolean => {
    return isErrorShape(error) && error.response?.status === 400;
  },

  // Check if error is a not found error
  isNotFoundError: (error: unknown): boolean => {
    return isErrorShape(error) && error.response?.status === 404;
  },
};
