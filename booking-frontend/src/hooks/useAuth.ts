import { useQuery, useMutation, useQueryClient } from "react-query";
import { authService, serviceUtils } from "../services";
import { useAuthStore } from "../store";
import { User, LoginCredentials, RegisterData } from "../types";

// Query keys
export const authKeys = {
  profile: ["auth", "profile"] as const,
  user: (id: string) => ["auth", "user", id] as const,
};

// Queries
export const useProfile = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery(authKeys.profile, authService.getProfile, {
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount: number, error: unknown) => {
      // Don't retry on 401 errors
      if (serviceUtils.isAuthError(error)) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// Mutations
export const useLogin = () => {
  const { login } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation(
    async (credentials: LoginCredentials) => {
      await login(credentials.email, credentials.password);
    },
    {
      onSuccess: () => {
        // Invalidate and refetch user profile
        queryClient.invalidateQueries(authKeys.profile);
      },
      onError: (error: unknown) => {
        console.error("Login error:", error);
      },
    }
  );
};

export const useRegister = () => {
  const { register } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation(
    async (userData: RegisterData) => {
      await register(userData);
    },
    {
      onSuccess: () => {
        // Invalidate and refetch user profile
        queryClient.invalidateQueries(authKeys.profile);
      },
      onError: (error: unknown) => {
        console.error("Registration error:", error);
      },
    }
  );
};

export const useLogout = () => {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation(logout, {
    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear();
    },
    onError: (error: unknown) => {
      console.error("Logout error:", error);
      // Even if logout fails on server, clear client-side data
      queryClient.clear();
    },
  });
};

export const useUpdateProfile = () => {
  const { updateProfile } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation((userData: Partial<User>) => updateProfile(userData), {
    onSuccess: (updatedUser: User) => {
      // Update cached profile data
      queryClient.setQueryData(authKeys.profile, updatedUser);
    },
    onError: (error: unknown) => {
      console.error("Profile update error:", error);
    },
  });
};

export const useChangePassword = () => {
  return useMutation(authService.changePassword, {
    onError: (error: unknown) => {
      console.error("Change password error:", error);
    },
  });
};

export const useRequestPasswordReset = () => {
  return useMutation(authService.requestPasswordReset, {
    onError: (error: unknown) => {
      console.error("Password reset request error:", error);
    },
  });
};

export const useResetPassword = () => {
  return useMutation(authService.resetPassword, {
    onError: (error: unknown) => {
      console.error("Password reset error:", error);
    },
  });
};

export const useVerifyEmail = () => {
  const queryClient = useQueryClient();

  return useMutation(authService.verifyEmail, {
    onSuccess: () => {
      // Refetch profile to update verification status
      queryClient.invalidateQueries(authKeys.profile);
    },
    onError: (error: unknown) => {
      console.error("Email verification error:", error);
    },
  });
};

export const useResendVerificationEmail = () => {
  return useMutation(authService.resendVerificationEmail, {
    onError: (error: unknown) => {
      console.error("Resend verification error:", error);
    },
  });
};
