import { useQuery, useMutation, useQueryClient } from "react-query";
import { authService } from "../services";
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
    retry: (failureCount: number, error: any) => {
      // Don't retry on 401 errors
      if (error?.response?.status === 401) {
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
      onError: (error: any) => {
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
      onError: (error: any) => {
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
    onError: (error: any) => {
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
    onSuccess: (updatedUser: any) => {
      // Update cached profile data
      queryClient.setQueryData(authKeys.profile, updatedUser);
    },
    onError: (error: any) => {
      console.error("Profile update error:", error);
    },
  });
};

export const useChangePassword = () => {
  return useMutation(authService.changePassword, {
    onError: (error: any) => {
      console.error("Change password error:", error);
    },
  });
};

export const useRequestPasswordReset = () => {
  return useMutation(authService.requestPasswordReset, {
    onError: (error: any) => {
      console.error("Password reset request error:", error);
    },
  });
};

export const useResetPassword = () => {
  return useMutation(authService.resetPassword, {
    onError: (error: any) => {
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
    onError: (error: any) => {
      console.error("Email verification error:", error);
    },
  });
};

export const useResendVerificationEmail = () => {
  return useMutation(authService.resendVerificationEmail, {
    onError: (error: any) => {
      console.error("Resend verification error:", error);
    },
  });
};
