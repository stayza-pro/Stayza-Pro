// Helper hook to get current user from auth store
// Uses a mounted guard to prevent Zustand persist hydration mismatches (React errors #418, #423, #425)
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store";

export const useCurrentUser = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR / initial client render, return neutral state so it matches what the server rendered.
  // This prevents hydration mismatches caused by Zustand's persist middleware rehydrating from localStorage.
  if (!mounted) {
    return { user: null, isAuthenticated: false, isLoading: true };
  }

  return { user, isAuthenticated, isLoading };
};
