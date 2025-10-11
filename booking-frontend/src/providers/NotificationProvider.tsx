"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/notifications/useToast";
import { ToastContainer } from "@/components/notifications/Toast";
import { NotificationSocketData } from "@/types/notifications";

interface NotificationContextType {
  // Add any shared notification state or methods here if needed
}

const NotificationContext = createContext<NotificationContextType>({});

export function useNotificationContext() {
  return useContext(NotificationContext);
}

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user, token } = useAuth();
  const { toasts, removeToast, success, error, warning, info } = useToast();
  const socketServiceRef = useRef<any>(null);

  // Initialize socket connection and handle real-time notifications
  useEffect(() => {
    // TODO: Re-enable socket.io notifications once bundling issue is resolved
    console.log(
      "Socket.io notifications temporarily disabled to fix bundling issue"
    );

    // For now, just show a test notification on auth
    if (user && token) {
      console.log(
        "User authenticated, notifications would be enabled for:",
        user.id
      );
    }
  }, [user, token]);

  const value: NotificationContextType = {
    // Add any shared notification state or methods here
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Toast notifications container */}
      <ToastContainer
        toasts={toasts}
        onRemoveToast={removeToast}
        position="top-right"
      />
    </NotificationContext.Provider>
  );
}

function getNotificationDuration(priority: string): number {
  switch (priority) {
    case "urgent":
      return 10000; // 10 seconds
    case "high":
      return 7000; // 7 seconds
    default:
      return 5000; // 5 seconds
  }
}
