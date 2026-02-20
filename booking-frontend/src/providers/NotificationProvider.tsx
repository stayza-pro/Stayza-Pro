"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/notifications/useToast";
import { ToastContainer } from "@/components/notifications/Toast";
import { socketService } from "@/services/socket";
import {
  NotificationSocketData,
  NotificationPriority,
} from "@/types/notifications";

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
  const { toasts, removeToast, error, info } = useToast();
  // Persist shown notification IDs in sessionStorage so toasts don't re-fire on page refresh.
  // On mount, seed the Set from any IDs already recorded this session.
  const shownNotificationIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("shownNotificationIds");
      if (stored) {
        const parsed: string[] = JSON.parse(stored);
        parsed.forEach((id) => shownNotificationIdsRef.current.add(id));
      }
    } catch {
      // sessionStorage unavailable — proceed without persistence
    }
  }, []);

  const trackShownId = (id: string) => {
    shownNotificationIdsRef.current.add(id);
    try {
      const stored = sessionStorage.getItem("shownNotificationIds");
      const existing: string[] = stored ? JSON.parse(stored) : [];
      if (!existing.includes(id)) {
        // Keep at most 200 IDs to avoid unbounded growth
        const updated = [id, ...existing].slice(0, 200);
        sessionStorage.setItem("shownNotificationIds", JSON.stringify(updated));
      }
    } catch {
      // ignore
    }
  };

  // Initialize socket connection and handle real-time notifications
  useEffect(() => {
    if (!user || !token) {
      return;
    }

    socketService.connect(token, user.id, user.role);

    const unsubscribeNotification = socketService.onNotification(
      (notification: NotificationSocketData) => {
        if (shownNotificationIdsRef.current.has(notification.id)) {
          return;
        }

        trackShownId(notification.id);
        const duration = getNotificationDuration(notification.priority);

        switch (notification.priority) {
          case "high":
          case "urgent":
            error(notification.title, notification.message, { duration });
            break;
          case "normal":
          default:
            info(notification.title, notification.message, { duration });
        }
      },
    );

    return () => {
      unsubscribeNotification();
      socketService.disconnect();
    };
  }, [user?.id, user?.role, token, error, info]);

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

function getNotificationDuration(priority: NotificationPriority): number {
  switch (priority) {
    case "urgent":
      return 10000; // 10 seconds
    case "high":
      return 7000; // 7 seconds
    default:
      return 5000; // 5 seconds
  }
}
