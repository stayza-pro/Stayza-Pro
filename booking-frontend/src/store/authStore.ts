import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "../types";
import { authService, serviceUtils } from "../services";
import { setCookie, getCookie, deleteCookie } from "../utils/cookies";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<any>;
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
  autoLogin: (
    tokens: { accessToken: string; refreshToken: string },
    user: User
  ) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true, // Start as true to prevent flash of unauthenticated content
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          console.log("🔐 Attempting login for:", email);
          const response = await authService.login({ email, password });

          console.log("✅ Login response received:", {
            user: response.user?.email,
            role: response.user?.role,
            hasRedirectUrl: !!(response as any).redirectUrl,
            redirectUrl: (response as any).redirectUrl,
          });

          // Set cookies for cross-subdomain access
          if (typeof window !== "undefined") {
            setCookie("accessToken", response.accessToken, 7);
            setCookie("refreshToken", response.refreshToken, 30);
          }

          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Return response data for navigation handling
          return response;
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
          // Clear cookies for cross-subdomain logout
          if (typeof window !== "undefined") {
            deleteCookie("accessToken");
            deleteCookie("refreshToken");
          }

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

      autoLogin: (
        tokens: { accessToken: string; refreshToken: string },
        user: User
      ) => {
        console.log("🔐 Auto-login: Setting user and tokens in auth store");

        // Set tokens in localStorage
        localStorage.setItem("accessToken", tokens.accessToken);
        localStorage.setItem("refreshToken", tokens.refreshToken);

        // Set cookies for cross-subdomain access
        setCookie("accessToken", tokens.accessToken, 7); // 7 days
        setCookie("refreshToken", tokens.refreshToken, 30); // 30 days

        // Update auth state
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        console.log("✅ Auto-login: User authenticated successfully", {
          userId: user.id,
          email: user.email,
          role: user.role,
        });
      },

      checkAuth: async () => {
        console.log("🔍 AuthStore: Starting checkAuth...");
        const state = get();
        let token = state.accessToken || authService.getAccessToken();
        let refreshToken = state.refreshToken || authService.getRefreshToken();

        console.log("🔍 AuthStore: Initial token check", {
          hasStateToken: !!state.accessToken,
          hasServiceToken: !!authService.getAccessToken(),
          hasStateRefresh: !!state.refreshToken,
          hasServiceRefresh: !!authService.getRefreshToken(),
          hasStateUser: !!state.user,
          isAuthenticated: state.isAuthenticated,
        });

        // If we already have a valid user and tokens from persistence, just verify
        if (state.user && state.accessToken && state.isAuthenticated) {
          console.log(
            "✅ AuthStore: User already authenticated from persisted state"
          );

          // Set loading to false immediately for persisted state
          set({ isLoading: false });

          try {
            // Verify the token is still valid in the background
            const user = await authService.getProfile();
            set({
              user,
            });
            console.log("✅ AuthStore: Token validated successfully");
            return;
          } catch (error: any) {
            console.warn(
              "⚠️ AuthStore: Token validation failed, will attempt refresh"
            );
            // Don't clear auth yet, try to refresh first
            // Continue to refresh logic below if we have a refresh token
            if (!state.refreshToken) {
              // No refresh token, clear state
              set({
                user: null,
                accessToken: null,
                refreshToken: null,
                isAuthenticated: false,
                isLoading: false,
              });
              return;
            }
            // Will continue to refresh logic below
          }
        }

        // Fallback to cookies if localStorage doesn't have tokens (cross-subdomain case)
        if (typeof window !== "undefined" && (!token || !refreshToken)) {
          console.log("🍪 AuthStore: Checking cookies for tokens...");
          const cookieToken = getCookie("accessToken");
          const cookieRefresh = getCookie("refreshToken");

          console.log("🍪 AuthStore: Cookie token check", {
            hasCookieToken: !!cookieToken,
            hasCookieRefresh: !!cookieRefresh,
          });

          if (cookieToken) token = cookieToken;
          if (cookieRefresh) refreshToken = cookieRefresh;

          // Also update localStorage for this subdomain
          if (cookieToken) {
            localStorage.setItem("accessToken", cookieToken);
            console.log(
              "💾 AuthStore: Restored access token to localStorage from cookie"
            );
          }
          if (cookieRefresh) {
            localStorage.setItem("refreshToken", cookieRefresh);
            console.log(
              "💾 AuthStore: Restored refresh token to localStorage from cookie"
            );
          }

          // Update state with tokens from cookies
          if (cookieToken || cookieRefresh) {
            set({
              accessToken: token,
              refreshToken: refreshToken,
            });
          }
        }

        if (!token && !refreshToken) {
          // No tokens available, user is not authenticated
          console.log("❌ AuthStore: No tokens found, user not authenticated");
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

          console.log("✅ AuthStore: User authenticated successfully");
        } catch (error: any) {
          // If profile fetch fails, try to refresh token
          if (refreshToken && error?.response?.status === 401) {
            try {
              console.log("🔄 AuthStore: Access token expired, refreshing...");
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
              console.log(
                "✅ AuthStore: Token refreshed and user authenticated"
              );
            } catch (refreshError) {
              // Refresh failed, clear auth state
              console.error("❌ Token refresh failed:", refreshError);
              set({
                user: null,
                accessToken: null,
                refreshToken: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
              });
              // Clear tokens from localStorage and cookies
              localStorage.removeItem("accessToken");
              localStorage.removeItem("refreshToken");
              if (typeof window !== "undefined") {
                deleteCookie("accessToken");
                deleteCookie("refreshToken");
              }
            }
          } else {
            // Token is invalid and no refresh token, clear state
            console.error("❌ Auth check failed:", error);
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
            // Clear tokens from localStorage and cookies
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            if (typeof window !== "undefined") {
              deleteCookie("accessToken");
              deleteCookie("refreshToken");
            }
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
