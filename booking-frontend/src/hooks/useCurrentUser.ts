// Helper hook to get current user from auth store
import { useAuthStore } from "@/store";

export const useCurrentUser = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  return { user, isAuthenticated, isLoading };
};
