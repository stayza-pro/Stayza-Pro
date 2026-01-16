import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { toast } from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors and token refresh
interface RetryableAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableAxiosRequestConfig;

    // Don't try to refresh tokens for login/register requests
    const isAuthRequest =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;

      try {
        

        // Try to get refresh token from authStore first, then localStorage
        let refreshToken: string | null = null;

        if (typeof window !== "undefined") {
          const { useAuthStore } = await import("@/store/authStore");
          const storeRefreshToken = useAuthStore.getState().refreshToken;
          refreshToken =
            storeRefreshToken || localStorage.getItem("refreshToken");
          
        } else {
          refreshToken = localStorage.getItem("refreshToken");
        }

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem("accessToken", accessToken);

        // Also update authStore with new access token
        if (typeof window !== "undefined") {
          const { useAuthStore } = await import("@/store/authStore");
          useAuthStore.setState({ accessToken });
        }

        

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and update auth store
        
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        // Update auth store to reflect logout state
        if (typeof window !== "undefined") {
          // Clear cookies as well
          import("@/utils/cookies").then(({ deleteCookie }) => {
            deleteCookie("accessToken");
            deleteCookie("refreshToken");
          });

          // Dynamically import to avoid SSR issues
          import("@/store/authStore").then(({ useAuthStore }) => {
            useAuthStore.setState({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
              error: "Session expired. Please login again.",
            });
          });
        }

        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const message =
      (typeof error.response?.data === "object" &&
      error.response?.data !== null &&
      "message" in error.response.data
        ? String((error.response.data as { message?: string }).message)
        : undefined) ||
      error.message ||
      "An error occurred";

    // Don't show toast for certain errors
    const silentErrors = [400, 401, 403, 404];
    if (
      error.response?.status &&
      !silentErrors.includes(error.response.status)
    ) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Generic API methods
export const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> =>
    api.get(url, config).then((res) => res.data),

  post: <T, TData = unknown>(
    url: string,
    data?: TData,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> =>
    api.post(url, data, config).then((res) => res.data),

  put: <T, TData = unknown>(
    url: string,
    data?: TData,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> =>
    api.put(url, data, config).then((res) => res.data),

  patch: <T, TData = unknown>(
    url: string,
    data?: TData,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> =>
    api.patch(url, data, config).then((res) => res.data),

  delete: <T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => api.delete(url, config).then((res) => res.data),
};

export default api;
