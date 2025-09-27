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
export const serviceUtils = {
  // Format date for API
  formatDateForAPI: (date: Date): string => {
    return date.toISOString().split("T")[0];
  },

  // Build query string from object
  buildQueryString: (params: Record<string, any>): string => {
    const searchParams = new URLSearchParams();

    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value)) {
          searchParams.append(key, value.join(","));
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
  extractErrorMessage: (error: any): string => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.errors?.[0]) {
      return error.response.data.errors[0];
    }
    if (error.message) {
      return error.message;
    }
    return "An unexpected error occurred";
  },

  // Check if error is a network error
  isNetworkError: (error: any): boolean => {
    return !error.response && error.request;
  },

  // Check if error is an authentication error
  isAuthError: (error: any): boolean => {
    return error.response?.status === 401;
  },

  // Check if error is a permission error
  isPermissionError: (error: any): boolean => {
    return error.response?.status === 403;
  },

  // Check if error is a validation error
  isValidationError: (error: any): boolean => {
    return error.response?.status === 400;
  },

  // Check if error is a not found error
  isNotFoundError: (error: any): boolean => {
    return error.response?.status === 404;
  },
};
