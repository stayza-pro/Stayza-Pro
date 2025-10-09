import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "../types";
import { authService, serviceUtils } from "../services";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserToken: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<User>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.login({ email, password });

          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: unknown) {
          const message = serviceUtils.extractErrorMessage(error);
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: message || "Login failed",
          });
          throw error;
        }
      },

      register: async (userData) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.register(userData);

          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: unknown) {
          const message = serviceUtils.extractErrorMessage(error);
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: message || "Registration failed",
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          // Even if logout fails on server, clear local state
          console.error("Logout error:", error);
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      refreshUserToken: async () => {
        try {
          const { refreshToken } = get();
          if (!refreshToken) {
            throw new Error("No refresh token available");
          }

          const response = await authService.refreshToken();

          set({
            accessToken: response.accessToken,
          });
        } catch (error: unknown) {
          // If refresh fails, logout user
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            error: "Session expired. Please login again.",
          });
          throw error;
        }
      },

      updateProfile: async (userData) => {
        try {
          set({ isLoading: true, error: null });

          const updatedUser = await authService.updateProfile(userData);

          set({
            user: updatedUser,
            isLoading: false,
            error: null,
          });
          return updatedUser;
        } catch (error: unknown) {
          const message = serviceUtils.extractErrorMessage(error);
          set({
            isLoading: false,
            error: message || "Profile update failed",
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      checkAuth: async () => {
        const state = get();
        const token = state.accessToken || authService.getAccessToken();
        const refreshToken =
          state.refreshToken || authService.getRefreshToken();

        if (!token && !refreshToken) {
          // No tokens available, user is not authenticated
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }

        try {
          set({ isLoading: true });

          // Try to get user profile with current token
          const user = await authService.getProfile();

          set({
            user,
            accessToken: token,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          // If profile fetch fails, try to refresh token
          if (refreshToken && error?.response?.status === 401) {
            try {
              await get().refreshUserToken();
              // After successful refresh, try to get profile again
              const user = await authService.getProfile();
              const newState = get();
              set({
                user,
                accessToken: newState.accessToken,
                refreshToken: newState.refreshToken,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
            } catch (refreshError) {
              // Refresh failed, clear auth state
              console.error("Token refresh failed:", refreshError);
              set({
                user: null,
                accessToken: null,
                refreshToken: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
              });
              // Clear tokens from localStorage
              localStorage.removeItem("accessToken");
              localStorage.removeItem("refreshToken");
            }
          } else {
            // Token is invalid and no refresh token, clear state
            console.error("Auth check failed:", error);
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
            // Clear tokens from localStorage
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
          }
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
