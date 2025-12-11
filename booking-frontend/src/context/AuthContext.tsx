"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "../store/authStore";

interface AuthContextType {
  user: any;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const {
    checkAuth,
    setLoading,
    user,
    accessToken,
    isAuthenticated,
    isLoading,
  } = useAuthStore();

  const [hasHydrated, setHasHydrated] = useState(false);

  // Wait for Zustand to rehydrate from localStorage
  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
      console.log("✅ AuthStore hydration complete");
    });

    // If already hydrated (in case the listener is set after hydration)
    if (useAuthStore.persist.hasHydrated()) {
      setHasHydrated(true);
      console.log("✅ AuthStore was already hydrated");
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Only run checkAuth after store has been hydrated
    if (!hasHydrated) {
      console.log("⏳ Waiting for AuthStore hydration...");
      return;
    }

    // Initialize auth state
    const initAuth = async () => {
      console.log("🔍 Initializing auth after hydration...");

      try {
        await checkAuth();
      } catch (error) {
        console.error("Failed to initialize auth:", error);
      } finally {
        // The checkAuth method now handles setting isLoading to false
        // so we don't need to call setLoading(false) here
      }
    };

    initAuth();
  }, [hasHydrated, checkAuth, setLoading]);

  const contextValue: AuthContextType = {
    user,
    token: accessToken,
    isAuthenticated,
    isLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <Toaster position="top-center" reverseOrder={false} />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
