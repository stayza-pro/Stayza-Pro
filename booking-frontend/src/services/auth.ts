import { apiClient, ApiResponse } from "./api";
import {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  RefreshTokenResponse,
} from "../types";

export const authService = {
  // Register new user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/register", data);

    // Store tokens
    if (response.data.accessToken) {
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
    }

    return response.data;
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      "/auth/login",
      credentials
    );

    // Store tokens
    if (response.data.accessToken) {
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
    }

    return response.data;
  },

  // Logout user
  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem("refreshToken");

    try {
      if (refreshToken) {
        await apiClient.post("/auth/logout", { refreshToken });
      }
    } finally {
      // Always clear local storage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  },

  // Refresh access token
  refreshToken: async (): Promise<RefreshTokenResponse> => {
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await apiClient.post<RefreshTokenResponse>(
      "/auth/refresh",
      {
        refreshToken,
      }
    );

    // Update stored token
    if (response.data.accessToken) {
      localStorage.setItem("accessToken", response.data.accessToken);
    }

    return response.data;
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>("/auth/profile");
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.patch<User>("/auth/profile", data);
    return response.data;
  },

  // Change password
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    await apiClient.patch("/auth/change-password", data);
  },

  // Request password reset
  requestPasswordReset: async (email: string): Promise<void> => {
    await apiClient.post("/auth/forgot-password", { email });
  },

  // Reset password with token
  resetPassword: async (data: {
    token: string;
    password: string;
  }): Promise<void> => {
    await apiClient.post("/auth/reset-password", data);
  },

  // Verify email
  verifyEmail: async (token: string): Promise<void> => {
    await apiClient.post("/auth/verify-email", { token });
  },

  // Resend verification email
  resendVerificationEmail: async (): Promise<void> => {
    await apiClient.post("/auth/resend-verification");
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem("accessToken");
  },

  // Get access token
  getAccessToken: (): string | null => {
    return localStorage.getItem("accessToken");
  },

  // Get refresh token
  getRefreshToken: (): string | null => {
    return localStorage.getItem("refreshToken");
  },
};
