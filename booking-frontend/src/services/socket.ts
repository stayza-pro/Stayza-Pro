import { io, Socket } from "socket.io-client";
import { NotificationSocketData } from "@/types/notifications";
import toast from "react-hot-toast";

const resolveSocketBaseUrl = (): string => {
  const rawUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5050";

  // API URLs often end with /api; Socket.IO should connect at the host root.
  return rawUrl.replace(/\/api\/?$/i, "");
};

export const SOCKET_BASE_URL = resolveSocketBaseUrl();

export interface MessageUpdatedEvent {
  messageId: string;
  bookingId?: string | null;
  propertyId?: string | null;
  senderId: string;
  recipientId: string;
  emittedAt: string;
}

export class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private manualDisconnect = false;

  // Event listeners
  private onNotificationCallbacks: ((
    notification: NotificationSocketData,
  ) => void)[] = [];
  private onUnreadCountCallbacks: ((count: number) => void)[] = [];
  private onMessageUpdatedCallbacks: ((payload: MessageUpdatedEvent) => void)[] =
    [];
  private onConnectionCallbacks: (() => void)[] = [];
  private onDisconnectionCallbacks: (() => void)[] = [];

  connect(token: string, userId: string, role: string): void {
    if (!token || !userId) {
      return;
    }

    if (this.socket?.connected) {
      return;
    }

    // Ensure stale instances do not keep listeners/reconnect loops alive.
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.manualDisconnect = false;

    this.socket = io(SOCKET_BASE_URL, {
      auth: {
        token,
        userId,
        role,
      },
      path: "/socket.io",
      transports: ["polling", "websocket"],
      reconnection: false,
      autoConnect: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on("connect", () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.onConnectionCallbacks.forEach((callback) => callback());
    });

    this.socket.on("disconnect", (reason) => {
      this.isConnected = false;
      this.onDisconnectionCallbacks.forEach((callback) => callback());

      // Don't reconnect on intentional or server-forced disconnects.
      if (
        reason === "io server disconnect" ||
        reason === "io client disconnect" ||
        this.manualDisconnect
      ) {
        return;
      }

      this.handleReconnection();
    });

    this.socket.on("connect_error", (error) => {
      const message = String(error?.message || "").toLowerCase();

      // Auth errors need user/session action, not reconnect loops.
      if (
        message.includes("authentication error") ||
        message.includes("invalid token")
      ) {
        return;
      }

      this.handleReconnection();
    });

    // Notification events
    this.socket.on("notification", (notification: NotificationSocketData) => {
      // Show toast notification
      this.showToastNotification(notification);

      // Call registered callbacks
      this.onNotificationCallbacks.forEach((callback) =>
        callback(notification),
      );
    });

    this.socket.on("unread_count", (count: number) => {
      this.onUnreadCountCallbacks.forEach((callback) => callback(count));
    });

    this.socket.on("message:updated", (payload: MessageUpdatedEvent) => {
      this.onMessageUpdatedCallbacks.forEach((callback) => callback(payload));
    });

    this.socket.on(
      "notification_history",
      (notifications: NotificationSocketData[]) => {},
    );
  }

  private handleReconnection(): void {
    if (!this.socket || this.manualDisconnect) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      toast.error("Connection lost. Please refresh the page.");
      return;
    }

    setTimeout(
      () => {
        this.reconnectAttempts++;

        this.socket?.connect();
      },
      Math.pow(2, this.reconnectAttempts) * 1000,
    ); // Exponential backoff
  }

  private showToastNotification(notification: NotificationSocketData): void {
    const options = {
      duration:
        notification.priority === "urgent"
          ? 10000
          : notification.priority === "high"
            ? 6000
            : 4000,
      position: "top-right" as const,
    };

    // Toasts are now handled by useRealTimeUpdates hook to avoid duplicates
    // Uncomment below if you need toast notifications at socket level

    // switch (notification.priority) {
    //   case "urgent":
    //     toast.error(`${notification.title}: ${notification.message}`, options);
    //     break;
    //   case "high":
    //     toast.success(
    //       `${notification.title}: ${notification.message}`,
    //       options
    //     );
    //     break;
    //   default:
    //     toast(`${notification.title}: ${notification.message}`, options);
    //     break;
    // }
  }

  // Socket actions
  markNotificationAsRead(notificationId: string): void {
    this.socket?.emit("mark_notification_read", notificationId);
  }

  markAllAsRead(): void {
    this.socket?.emit("mark_all_read");
  }

  getUnreadCount(): void {
    this.socket?.emit("get_unread_count");
  }

  getNotificationHistory(page = 1, limit = 20): void {
    this.socket?.emit("get_notification_history", { page, limit });
  }

  // Event subscription methods
  onNotification(
    callback: (notification: NotificationSocketData) => void,
  ): () => void {
    this.onNotificationCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.onNotificationCallbacks.indexOf(callback);
      if (index > -1) {
        this.onNotificationCallbacks.splice(index, 1);
      }
    };
  }

  onUnreadCountUpdate(callback: (count: number) => void): () => void {
    this.onUnreadCountCallbacks.push(callback);

    return () => {
      const index = this.onUnreadCountCallbacks.indexOf(callback);
      if (index > -1) {
        this.onUnreadCountCallbacks.splice(index, 1);
      }
    };
  }

  onMessageUpdated(
    callback: (payload: MessageUpdatedEvent) => void,
  ): () => void {
    this.onMessageUpdatedCallbacks.push(callback);

    return () => {
      const index = this.onMessageUpdatedCallbacks.indexOf(callback);
      if (index > -1) {
        this.onMessageUpdatedCallbacks.splice(index, 1);
      }
    };
  }

  onConnection(callback: () => void): () => void {
    this.onConnectionCallbacks.push(callback);

    return () => {
      const index = this.onConnectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.onConnectionCallbacks.splice(index, 1);
      }
    };
  }

  onDisconnection(callback: () => void): () => void {
    this.onDisconnectionCallbacks.push(callback);

    return () => {
      const index = this.onDisconnectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.onDisconnectionCallbacks.splice(index, 1);
      }
    };
  }

  // Connection management
  disconnect(): void {
    if (this.socket) {
      this.manualDisconnect = true;
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  reconnect(): void {
    if (this.socket) {
      this.socket.connect();
    }
  }
}

// Export singleton instance
export const socketService = new SocketService();
