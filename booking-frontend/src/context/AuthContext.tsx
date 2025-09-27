"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "../store/authStore";

interface AuthContextType {
  // This context will use the Zustand store
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth, setLoading } = useAuthStore();

  useEffect(() => {
    // Initialize auth state
    const initAuth = () => {
      setLoading(true);

      try {
        checkAuth();
      } catch (error) {
        console.error("Failed to initialize auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [checkAuth, setLoading]);

  return (
    <AuthContext.Provider value={{}}>
      {children}
      <Toaster position="top-center" reverseOrder={false} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
