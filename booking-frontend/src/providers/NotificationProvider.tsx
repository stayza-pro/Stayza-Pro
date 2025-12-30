"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/notifications/useToast";
import { ToastContainer } from "@/components/notifications/Toast";
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
  const { toasts, removeToast, success, error, warning, info } = useToast();
  const socketServiceRef = useRef<any>(null);
  const [shownNotificationIds, setShownNotificationIds] = useState<Set<string>>(
    new Set()
  );

  // Clear shown notification IDs every 5 minutes to prevent memory leak
  useEffect(() => {
    const interval = setInterval(() => {
      setShownNotificationIds(new Set());
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Initialize socket connection and handle real-time notifications
  useEffect(() => {
    let socketService: any = null;

    const initializeSocket = async () => {
      // Only enable Socket.IO notifications for admins, disabled for guests and realtors
      if (user && token && user.role === "ADMIN") {
        try {
          // Dynamic import to avoid SSR bundling issues
          const { SocketService } = await import("@/services/socket");
          socketService = new SocketService();

          // Connect to socket server
          socketService.connect(token, user.id, user.role);

          // Listen for notifications
          socketService.onNotification(
            (notification: NotificationSocketData) => {
              // Prevent duplicate notifications
              if (shownNotificationIds.has(notification.id)) {
                console.log(
                  "Skipping duplicate notification:",
                  notification.id
                );
                return;
              }

              // Mark as shown
              setShownNotificationIds((prev) =>
                new Set(prev).add(notification.id)
              );

              // Show appropriate toast based on notification priority
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
            }
          );

          socketServiceRef.current = socketService;
          console.log("Socket.IO notifications enabled for user:", user.id);
        } catch (err) {
          console.error("Failed to initialize socket service:", err);
        }
      }
    };

    initializeSocket();

    // Cleanup on unmount or auth change
    return () => {
      if (socketServiceRef.current) {
        socketServiceRef.current.disconnect();
        socketServiceRef.current = null;
      }
    };
  }, [user, token, success, error, warning, info, shownNotificationIds]);

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
