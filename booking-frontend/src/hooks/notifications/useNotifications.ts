import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { socketService } from "@/services/socket";
import { notificationApiService } from "@/services/notifications";
import {
  Notification,
  NotificationSocketData,
  PaginatedNotifications,
  NotificationPreferences,
  NotificationStats,
} from "@/types/notifications";

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  hasMore: boolean;

  // Actions
  loadNotifications: (
    page?: number,
    limit?: number,
    unreadOnly?: boolean
  ) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  // Initialize socket connection
  useEffect(() => {
    if (user && token) {
      socketService.connect(token, user.id, user.role);
    }

    return () => {
      if (!user) {
        socketService.disconnect();
      }
    };
  }, [user, token]);

  // Handle socket connection status
  useEffect(() => {
    const unsubscribeConnection = socketService.onConnection(() => {
      setIsConnected(true);
      setError(null);
    });

    const unsubscribeDisconnection = socketService.onDisconnection(() => {
      setIsConnected(false);
    });

    setIsConnected(socketService.isSocketConnected());

    return () => {
      unsubscribeConnection();
      unsubscribeDisconnection();
    };
  }, []);

  // Handle real-time notifications
  useEffect(() => {
    const unsubscribeNotification = socketService.onNotification(
      (notification: NotificationSocketData) => {
        // Add new notification to the top of the list
        setNotifications((prev) => [
          {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            priority: notification.priority,
            isRead: false,
            createdAt: notification.createdAt.toISOString(),
            bookingId: notification.bookingId,
            propertyId: notification.propertyId,
            paymentId: notification.paymentId,
            reviewId: notification.reviewId,
          },
          ...prev,
        ]);

        // Update unread count
        setUnreadCount((prev) => prev + 1);
      }
    );

    const unsubscribeUnreadCount = socketService.onUnreadCountUpdate(
      (count: number) => {
        setUnreadCount(count);
      }
    );

    return () => {
      unsubscribeNotification();
      unsubscribeUnreadCount();
    };
  }, []);

  // Load notifications from API
  const loadNotifications = useCallback(
    async (page = 1, limit = 20, unreadOnly = false): Promise<void> => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);

        const data = await notificationApiService.getNotifications({
          page,
          limit,
          unreadOnly,
        });

        if (page === 1) {
          setNotifications(data.notifications);
        } else {
          setNotifications((prev) => [...prev, ...data.notifications]);
        }

        setUnreadCount(data.unreadCount);
        setCurrentPage(page);
        setTotalPages(data.pagination.totalPages);
        setHasMore(data.pagination.hasNext);
      } catch (err: any) {
        setError(err.message || "Failed to load notifications");
        console.error("Error loading notifications:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: string): Promise<void> => {
      try {
        await notificationApiService.markAsRead(notificationId);

        // Update local state
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        );

        // Update unread count
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // Emit socket event
        socketService.markNotificationAsRead(notificationId);
      } catch (err: any) {
        setError(err.message || "Failed to mark notification as read");
        console.error("Error marking notification as read:", err);
      }
    },
    []
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<void> => {
    try {
      await notificationApiService.markAllAsRead();

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);

      // Emit socket event
      socketService.markAllAsRead();
    } catch (err: any) {
      setError(err.message || "Failed to mark all notifications as read");
      console.error("Error marking all notifications as read:", err);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId: string): Promise<void> => {
      try {
        await notificationApiService.deleteNotification(notificationId);

        // Update local state
        const wasUnread =
          notifications.find((n) => n.id === notificationId)?.isRead === false;
        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== notificationId)
        );

        if (wasUnread) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (err: any) {
        setError(err.message || "Failed to delete notification");
        console.error("Error deleting notification:", err);
      }
    },
    [notifications]
  );

  // Refresh unread count
  const refreshUnreadCount = useCallback(async (): Promise<void> => {
    try {
      const count = await notificationApiService.getUnreadCount();
      setUnreadCount(count);
      socketService.getUnreadCount();
    } catch (err: any) {
      console.error("Error refreshing unread count:", err);
    }
  }, []);

  // Load more notifications (pagination)
  const loadMore = useCallback(async (): Promise<void> => {
    if (hasMore && !isLoading) {
      await loadNotifications(currentPage + 1);
    }
  }, [hasMore, isLoading, currentPage, loadNotifications]);

  // Load initial notifications
  useEffect(() => {
    if (user) {
      loadNotifications();
      refreshUnreadCount();
    }
  }, [user, loadNotifications, refreshUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    error,
    hasMore,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshUnreadCount,
    loadMore,
  };
}
