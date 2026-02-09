"use client";

import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";
import { SOCKET_BASE_URL } from "@/services/socket";

interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  priority: string;
  createdAt: Date;
}

export function useSocketNotifications(
  token: string | null,
  userId: string | null,
) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token || !userId) {
      return;
    }

    // Connect to Socket.IO server
    const socketInstance = io(SOCKET_BASE_URL, {
      auth: { token },
      path: "/socket.io",
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    // Connection events
    socketInstance.on("connect", () => {
      setIsConnected(true);
      // Request unread count on connect
      socketInstance.emit("get_unread_count");
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      setIsConnected(false);
    });

    // Notification events
    socketInstance.on("notification", (notification: NotificationData) => {
      // Add to notifications list
      setNotifications((prev) => [notification, ...prev]);

      // Show toast notification
      if (
        notification.priority === "urgent" ||
        notification.priority === "high"
      ) {
        toast.error(`${notification.title}: ${notification.message}`, {
          duration: notification.priority === "urgent" ? 10000 : 7000,
        });
      } else {
        toast.success(`${notification.title}: ${notification.message}`, {
          duration: 5000,
        });
      }
    });

    socketInstance.on("unread_count", (count: number) => {
      setUnreadCount(count);
    });

    socketInstance.on("notification_history", (data: any) => {
      setNotifications(data.notifications);
    });

    // Cleanup on unmount
    return () => {
      socketInstance.off("connect");
      socketInstance.off("disconnect");
      socketInstance.off("connect_error");
      socketInstance.off("notification");
      socketInstance.off("unread_count");
      socketInstance.off("notification_history");
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [token, userId]);

  const markAsRead = (notificationId: string) => {
    if (socket) {
      socket.emit("mark_notification_read", notificationId);
    }
  };

  const markAllAsRead = () => {
    if (socket) {
      socket.emit("mark_all_read");
    }
  };

  const getUnreadCount = () => {
    if (socket) {
      socket.emit("get_unread_count");
    }
  };

  const getNotificationHistory = (page: number = 1, limit: number = 20) => {
    if (socket) {
      socket.emit("get_notification_history", { page, limit });
    }
  };

  return {
    socket,
    isConnected,
    unreadCount,
    notifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    getNotificationHistory,
  };
}
