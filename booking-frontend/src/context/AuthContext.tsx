"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
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
