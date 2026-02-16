import { apiClient } from "./api";
import {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  RefreshTokenResponse,
  ApiResponse,
} from "../types";

export interface PasswordlessRegisterPayload {
  email: string;
  firstName: string;
  lastName: string;
  role?: "GUEST";
  realtorId?: string;
  referralSource?: string;
}

export interface PasswordlessOtpPayload {
  email: string;
  otp: string;
}

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
    

    // Clear any existing tokens to avoid interference
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    const response = await apiClient.post<AuthResponse>(
      "/auth/login",
      credentials
    );

    

    // Store tokens with cross-domain support
    if (response.data.accessToken) {
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);

      // Set cross-domain cookies for realtor subdomains
      try {
        const domain =
          window.location.hostname === "localhost"
            ? "localhost"
            : ".stayza.pro";
        document.cookie = `accessToken=${response.data.accessToken}; domain=${domain}; path=/; Secure; SameSite=None`;
        document.cookie = `refreshToken=${response.data.refreshToken}; domain=${domain}; path=/; Secure; SameSite=None`;
        
      } catch (cookieError) {
        
      }
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
    const response = await apiClient.get<{ user: User }>("/auth/me");

    // apiClient.get already returns the backend response: { success, message, data: { user } }
    // So response.data contains { user: {...} }
    if (!response.data?.user) {
      
      throw new Error("Invalid profile response format");
    }
    return response.data.user;
  },

  // Update user profile (accepts both JSON and FormData for avatar upload)
  updateProfile: async (data: Partial<User> | FormData): Promise<User> => {
    const config =
      data instanceof FormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : {};

    const response = await apiClient.put<User>("/auth/profile", data, config);
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
  verifyEmail: async (payload: string | { token: string; email: string }): Promise<void> => {
    const token = typeof payload === "string" ? payload : payload.token;
    const email = typeof payload === "string" ? "" : payload.email;

    if (!email) {
      throw new Error("Email is required for verification");
    }

    const query = new URLSearchParams({ token, email }).toString();
    await apiClient.get(`/auth/verify-email?${query}`);
  },

  // Resend verification email
  resendVerificationEmail: async (email: string): Promise<void> => {
    await apiClient.post("/auth/resend-verification", { email });
  },

  // Request OTP for passwordless login
  requestOtp: async (email: string): Promise<{ email: string; expiresIn: string }> => {
    const response = await apiClient.post<{ email: string; expiresIn: string }>(
      "/auth/request-otp",
      { email, type: "login" }
    );
    return response.data;
  },

  // Register new guest with passwordless flow
  registerPasswordless: async (
    data: PasswordlessRegisterPayload
  ): Promise<{ email: string; expiresIn: string }> => {
    const response = await apiClient.post<{ email: string; expiresIn: string }>(
      "/auth/register-passwordless",
      {
        ...data,
        role: "GUEST",
      }
    );
    return response.data;
  },

  // Verify registration OTP
  verifyRegistrationOtp: async (data: PasswordlessOtpPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      "/auth/verify-registration",
      data
    );

    if (response.data.accessToken) {
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
    }

    return response.data;
  },

  // Verify login OTP
  verifyLoginOtp: async (data: PasswordlessOtpPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/verify-login", data);

    if (response.data.accessToken) {
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
    }

    return response.data;
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

  // Delete account
  deleteAccount: async (data: {
    password: string;
    reason?: string;
  }): Promise<void> => {
    await apiClient.delete("/auth/delete-account", { data });

    // Clear tokens after successful deletion
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },
};
