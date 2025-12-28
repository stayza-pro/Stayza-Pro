// API Integration Service for Realtor Registration
import React from "react";
import { toast } from "react-hot-toast";
import { normalizeSubdomain } from "./schema";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  code?: string;
}

export interface RegistrationResponse {
  id: string;
  email: string;
  subdomain: string;
  status: "pending_verification" | "active" | "suspended";
  createdAt: string;
  user: any;
  realtor: any;
  accessToken: string;
  refreshToken: string;
}

export interface RegistrationApiResponse {
  success: boolean;
  message: string;
  data: RegistrationResponse;
  redirectUrls: {
    success: string;
    verification: string;
    dashboard: string;
  };
}

export interface SubdomainCheckResponse {
  available: boolean;
  suggestions?: string[];
  premium?: boolean;
  message?: string;
}

export interface EmailVerificationResponse {
  isValid: boolean;
  type: "business" | "personal" | "temporary" | "invalid";
  confidence: number;
  suggestions?: string[];
  domain: {
    reputation: "high" | "medium" | "low";
    category: "business" | "education" | "government" | "free" | "temporary";
  };
}

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";
const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;

class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Helper function to create fetch with timeout and retry
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number = MAX_RETRIES
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    // Don't set Content-Type for FormData requests (let browser handle it)
    const isFormData = options.body instanceof FormData;
    const headers: HeadersInit = {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(408, "TIMEOUT", "Request timeout");
    }

    if (
      retries > 0 &&
      (!navigator.onLine || (error as any).code === "NETWORK_ERROR")
    ) {
      // Wait before retry with exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, (MAX_RETRIES - retries + 1) * 1000)
      );
      return fetchWithRetry(url, options, retries - 1);
    }

    throw error;
  }
}

// Helper function to handle API responses
async function handleApiResponse<T>(
  response: Response
): Promise<ApiResponse<T>> {
  let data: any;

  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new ApiError(500, "PARSE_ERROR", "Failed to parse server response");
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.code || "API_ERROR",
      data.message || "An error occurred",
      data.errors
    );
  }

  return {
    success: true,
    data: data.data || data,
    message: data.message,
  };
}

// API Service Class
export class RealtorRegistrationApi {
  // Check subdomain availability
  static async checkSubdomain(
    subdomain: string
  ): Promise<ApiResponse<SubdomainCheckResponse>> {
    try {
      // Normalize subdomain before sending to API
      const normalizedSubdomain = normalizeSubdomain(subdomain);
      const response = await fetchWithRetry(
        `${API_BASE_URL}/realtors/subdomain/check?subdomain=${encodeURIComponent(
          normalizedSubdomain
        )}`,
        {
          method: "GET",
        }
      );

      return handleApiResponse<SubdomainCheckResponse>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        500,
        "NETWORK_ERROR",
        "Failed to check subdomain availability"
      );
    }
  }

  // Validate business email
  static async validateEmail(
    email: string
  ): Promise<ApiResponse<EmailVerificationResponse>> {
    try {
      const response = await fetchWithRetry(
        `${API_BASE_URL}/realtors/email/validate`,
        {
          method: "POST",
          body: JSON.stringify({ email }),
        }
      );

      return handleApiResponse<EmailVerificationResponse>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "NETWORK_ERROR", "Failed to validate email");
    }
  }

  // Upload logo file
  static async uploadLogo(
    file: File
  ): Promise<ApiResponse<{ url: string; id: string }>> {
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await fetchWithRetry(
        `${API_BASE_URL}/realtors/upload-temp-logo`,
        {
          method: "POST",
          body: formData,
          headers: {}, // Don't set Content-Type for FormData
        }
      );

      return handleApiResponse<{ url: string; id: string }>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "UPLOAD_ERROR", "Failed to upload logo");
    }
  }

  // Upload CAC certificate file
  static async uploadCacCertificate(
    file: File
  ): Promise<ApiResponse<{ url: string; id: string }>> {
    try {
      const formData = new FormData();
      formData.append("cacCertificate", file);

      const response = await fetchWithRetry(
        `${API_BASE_URL}/realtors/upload-temp-cac`,
        {
          method: "POST",
          body: formData,
          headers: {}, // Don't set Content-Type for FormData
        }
      );

      return handleApiResponse<{ url: string; id: string }>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        500,
        "UPLOAD_ERROR",
        "Failed to upload CAC certificate"
      );
    }
  }

  // Register realtor
  static async registerRealtor(
    data: any
  ): Promise<ApiResponse<RegistrationApiResponse>> {
    try {
      // Prepare registration data
      const registrationData = {
        ...data,
        // Convert File objects to URLs if they exist
        logo: data.logo instanceof File ? undefined : data.logo, // Logo should be uploaded separately
        registrationSource: "web_form",
        userAgent: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: navigator.language,
      };

      const response = await fetchWithRetry(
        `${API_BASE_URL}/realtors/register`,
        {
          method: "POST",
          body: JSON.stringify(registrationData),
        }
      );

      return handleApiResponse<RegistrationApiResponse>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        500,
        "REGISTRATION_ERROR",
        "Failed to register realtor"
      );
    }
  }

  // Register realtor with full response handling
  static async registerRealtorWithFullResponse(
    data: any
  ): Promise<RegistrationApiResponse> {
    try {
      // Prepare registration data
      const registrationData = {
        ...data,
        // Convert File objects to URLs if they exist
        logo: data.logo instanceof File ? undefined : data.logo, // Logo should be uploaded separately
        registrationSource: "web_form",
        userAgent: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: navigator.language,
      };

      // Make direct fetch to preserve full response structure
      const response = await fetchWithRetry(
        `${API_BASE_URL}/realtors/register`,
        {
          method: "POST",
          body: JSON.stringify(registrationData),
        }
      );

      let responseData: any;
      try {
        const text = await response.text();
        responseData = text ? JSON.parse(text) : {};
      } catch (error) {
        throw new ApiError(
          500,
          "PARSE_ERROR",
          "Failed to parse server response"
        );
      }

      if (!response.ok) {
        throw new ApiError(
          response.status,
          responseData.code || "API_ERROR",
          responseData.message || "An error occurred",
          responseData.errors
        );
      }

      // Debug logging
      console.log("🔍 Raw backend response:", responseData);
      console.log("🔍 Response has data:", !!responseData.data);
      console.log("🔍 Response has redirectUrls:", !!responseData.redirectUrls);
      console.log("🔍 Response data email:", responseData.data?.email);

      // Return the complete backend response which includes both data and redirectUrls
      return responseData as RegistrationApiResponse;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        500,
        "REGISTRATION_ERROR",
        "Failed to register realtor"
      );
    }
  }

  // Send verification email
  static async sendVerificationEmail(
    email: string
  ): Promise<ApiResponse<{ sent: boolean }>> {
    try {
      const response = await fetchWithRetry(
        `${API_BASE_URL}/auth/resend-verification`,
        {
          method: "POST",
          body: JSON.stringify({ email, type: "realtor" }),
        }
      );

      return handleApiResponse<{ sent: boolean }>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        500,
        "EMAIL_ERROR",
        "Failed to send verification email"
      );
    }
  }

  // Report analytics data
  static async reportAnalytics(
    data: any
  ): Promise<ApiResponse<{ received: boolean }>> {
    try {
      const response = await fetchWithRetry(
        `${API_BASE_URL}/analytics/events`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );

      return handleApiResponse<{ received: boolean }>(response);
    } catch (error) {
      // Analytics failures should not break the user experience
      console.warn("Failed to report analytics:", error);
      return { success: true, data: { received: false } };
    }
  }

  // Report errors
  static async reportError(
    errorData: any
  ): Promise<ApiResponse<{ reported: boolean }>> {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/errors/report`, {
        method: "POST",
        body: JSON.stringify({
          ...errorData,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });

      return handleApiResponse<{ reported: boolean }>(response);
    } catch (error) {
      // Error reporting failures should not break the user experience
      console.warn("Failed to report error:", error);
      return { success: true, data: { reported: false } };
    }
  }

  // Health check
  static async healthCheck(): Promise<
    ApiResponse<{ status: string; timestamp: string }>
  > {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/health`, {
        method: "GET",
      });

      return handleApiResponse<{ status: string; timestamp: string }>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "HEALTH_ERROR", "Service unavailable");
    }
  }
}

// Utility functions for handling API errors in components
export function handleApiError(error: unknown, context?: string): string {
  let message = "An unexpected error occurred";

  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        message = error.errors
          ? Object.values(error.errors).flat().join(", ")
          : error.message || "Invalid request data";
        break;
      case 401:
        message = "Authentication required";
        break;
      case 403:
        message = "Access denied";
        break;
      case 404:
        message = "Resource not found";
        break;
      case 409:
        message = error.message || "Conflict with existing data";
        break;
      case 422:
        message = error.errors
          ? Object.values(error.errors).flat().join(", ")
          : error.message || "Validation failed";
        break;
      case 429:
        message = "Too many requests. Please wait before trying again.";
        break;
      case 500:
        message = "Server error. Please try again later.";
        break;
      case 503:
        message = "Service temporarily unavailable";
        break;
      case 408:
        message = "Request timeout. Please check your connection.";
        break;
      default:
        message = error.message || "Network error occurred";
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  if (context) {
    message = `${context}: ${message}`;
  }

  return message;
}

// Hook for API loading states
export function useApiState() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const execute = async <T>(
    apiCall: () => Promise<ApiResponse<T>>,
    onSuccess?: (data: T) => void,
    onError?: (error: string) => void
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiCall();
      if (response.success && response.data) {
        onSuccess?.(response.data);
        return response.data;
      } else {
        const errorMsg = response.message || "Operation failed";
        setError(errorMsg);
        onError?.(errorMsg);
        return null;
      }
    } catch (err) {
      const errorMsg = handleApiError(err);
      setError(errorMsg);
      onError?.(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setIsLoading(false);
  };

  return { isLoading, error, execute, reset };
}

export { ApiError };
