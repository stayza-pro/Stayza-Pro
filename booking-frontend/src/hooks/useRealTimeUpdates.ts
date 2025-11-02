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

  useEffect(() => {
    if (user && token) {
      // Connect to WebSocket
      socketService.connect(token, user.id, user.role);

      // Set up connection listeners
      const unsubscribeConnection = socketService.onConnection(() => {
        console.log("✅ Real-time connection established");
        setIsConnected(true);
        toast.success("Connected to real-time updates", {
          duration: 2000,
          icon: "🔄",
        });
      });

      const unsubscribeDisconnection = socketService.onDisconnection(() => {
        console.log("❌ Real-time connection lost");
        setIsConnected(false);
      });

      // Set up notification listener
      const unsubscribeNotification = socketService.onNotification(
        (notification: NotificationSocketData) => {
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

          // Show different notifications based on type
          switch (update.type) {
            case "booking":
              toast(notification.message, {
                duration: 5000,
                icon: "📅",
                style: {
                  maxWidth: "500px",
                },
              });
              break;

            case "payment":
              toast.success(notification.message, {
                duration: 6000,
                icon: "💰",
                style: {
                  maxWidth: "500px",
                },
              });
              break;

            case "review":
              toast(notification.message, {
                duration: 5000,
                icon: "⭐",
                style: {
                  maxWidth: "500px",
                },
              });
              break;

            default:
              toast(notification.message, {
                icon: "🔔",
                duration: 4000,
              });
          }
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
