import { useEffect, useState } from "react";
import { socketService } from "@/services/socket";
import { useAuth } from "@/context/AuthContext";
import { NotificationSocketData } from "@/types/notifications";
import toast from "react-hot-toast";

interface RealTimeUpdate {
  type: "booking" | "payment" | "review" | "property" | "message";
  data: any;
  timestamp: Date;
}

export function useRealTimeUpdates() {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentUpdates, setRecentUpdates] = useState<RealTimeUpdate[]>([]);
  const [latestNotification, setLatestNotification] =
    useState<NotificationSocketData | null>(null);

  // Track shown notifications to prevent duplicates
  const [shownNotifications, setShownNotifications] = useState<Set<string>>(
    new Set()
  );

  // Clear old shown notifications after 5 minutes to prevent memory leak
  useEffect(() => {
    const interval = setInterval(() => {
      setShownNotifications(new Set());
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user && token) {
      // Connect to WebSocket
      socketService.connect(token, user.id, user.role);

      // Set up connection listeners
      const unsubscribeConnection = socketService.onConnection(() => {
        
        setIsConnected(true);
        // Connection toast disabled to prevent spam
      });

      const unsubscribeDisconnection = socketService.onDisconnection(() => {
        
        setIsConnected(false);
      });

      // Set up notification listener
      const unsubscribeNotification = socketService.onNotification(
        (notification: NotificationSocketData) => {
          // Check if we've already shown this notification
          if (shownNotifications.has(notification.id)) {
            return; // Skip duplicate
          }

          // Mark as shown
          setShownNotifications((prev) => new Set(prev).add(notification.id));

          setLatestNotification(notification);

          // Add to recent updates
          const update: RealTimeUpdate = {
            type: notification.type.includes("booking")
              ? "booking"
              : notification.type.includes("payment")
              ? "payment"
              : notification.type.includes("review")
              ? "review"
              : notification.type.includes("property")
              ? "property"
              : "message",
            data: notification,
            timestamp: new Date(),
          };

          setRecentUpdates((prev) => [update, ...prev].slice(0, 10));

          // All toast notifications disabled - check NotificationCenter bell icon for notifications
          
        }
      );

      // Set up unread count listener
      const unsubscribeUnreadCount = socketService.onUnreadCountUpdate(
        (count: number) => {
          setUnreadCount(count);
        }
      );

      // Request initial unread count
      socketService.getUnreadCount();

      // Cleanup on unmount
      return () => {
        unsubscribeConnection();
        unsubscribeDisconnection();
        unsubscribeNotification();
        unsubscribeUnreadCount();
        socketService.disconnect();
      };
    }
  }, [user, token]);

  return {
    isConnected,
    unreadCount,
    recentUpdates,
    latestNotification,
    markAsRead: (notificationId: string) =>
      socketService.markNotificationAsRead(notificationId),
    markAllAsRead: () => socketService.markAllAsRead(),
    refreshUnreadCount: () => socketService.getUnreadCount(),
  };
}
