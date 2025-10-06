"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/notifications/useToast";
import { socketService } from "@/services/socket";
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

  // Initialize socket connection and handle real-time notifications
  useEffect(() => {
    if (user && token) {
      // Connect to socket
      socketService.connect(token, user.id, user.role);

      // Handle incoming notifications
      const unsubscribeNotification = socketService.onNotification(
        (notification: NotificationSocketData) => {
          // Show toast notification based on type and priority
          const toastOptions = {
            onClick: () => {
              // Handle notification click - could navigate to related page
              console.log("Notification clicked:", notification);
            },
            duration: getNotificationDuration(notification.priority),
          };

          switch (notification.type) {
            case "BOOKING_CONFIRMED":
              success("Booking Confirmed", notification.message, toastOptions);
              break;
            case "BOOKING_CANCELLED":
              warning("Booking Cancelled", notification.message, toastOptions);
              break;
            case "BOOKING_COMPLETED":
              success("Booking Completed", notification.message, toastOptions);
              break;
            case "PAYMENT_SUCCESSFUL":
              success("Payment Successful", notification.message, toastOptions);
              break;
            case "PAYMENT_FAILED":
              error("Payment Failed", notification.message, toastOptions);
              break;
            case "PAYMENT_REFUNDED":
              info("Payment Refunded", notification.message, toastOptions);
              break;
            case "REVIEW_RECEIVED":
              success("New Review", notification.message, toastOptions);
              break;
            case "REVIEW_RESPONSE":
              info("Review Response", notification.message, toastOptions);
              break;
            case "CAC_APPROVED":
              success("CAC Approved", notification.message, toastOptions);
              break;
            case "CAC_REJECTED":
              error("CAC Rejected", notification.message, toastOptions);
              break;
            case "SYSTEM_MAINTENANCE":
              warning("System Maintenance", notification.message, toastOptions);
              break;
            case "MARKETING":
              info("Update", notification.message, toastOptions);
              break;
            default:
              info(notification.title, notification.message, toastOptions);
              break;
          }
        }
      );

      // Handle connection status changes
      const unsubscribeConnection = socketService.onConnection(() => {
        console.log("Connected to real-time notifications");
      });

      const unsubscribeDisconnection = socketService.onDisconnection(() => {
        console.log("Disconnected from real-time notifications");
      });

      return () => {
        unsubscribeNotification();
        unsubscribeConnection();
        unsubscribeDisconnection();
      };
    } else {
      // Disconnect socket when user logs out
      socketService.disconnect();
    }
  }, [user, token, success, error, warning, info]);

  // Clean up socket connection on unmount
  useEffect(() => {
    return () => {
      socketService.disconnect();
    };
  }, []);

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
