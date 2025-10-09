import { io, Socket } from "socket.io-client";
import { NotificationSocketData } from "@/types/notifications";
import toast from "react-hot-toast";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5050";

export class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Event listeners
  private onNotificationCallbacks: ((
    notification: NotificationSocketData
  ) => void)[] = [];
  private onUnreadCountCallbacks: ((count: number) => void)[] = [];
  private onConnectionCallbacks: (() => void)[] = [];
  private onDisconnectionCallbacks: (() => void)[] = [];

  connect(token: string, userId: string, role: string): void {
    if (this.socket?.connected) {
      console.log("Socket already connected");
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
        userId,
        role,
      },
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on("connect", () => {
      console.log("Connected to notification server");
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.onConnectionCallbacks.forEach((callback) => callback());
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Disconnected from notification server:", reason);
      this.isConnected = false;
      this.onDisconnectionCallbacks.forEach((callback) => callback());

      // Auto-reconnect logic
      if (reason === "io server disconnect") {
        // Server initiated disconnect, don't reconnect automatically
        return;
      }

      this.handleReconnection();
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      this.handleReconnection();
    });

    // Notification events
    this.socket.on("notification", (notification: NotificationSocketData) => {
      console.log("New notification received:", notification);

      // Show toast notification
      this.showToastNotification(notification);

      // Call registered callbacks
      this.onNotificationCallbacks.forEach((callback) =>
        callback(notification)
      );
    });

    this.socket.on("unread_count", (count: number) => {
      console.log("Unread count updated:", count);
      this.onUnreadCountCallbacks.forEach((callback) => callback(count));
    });

    this.socket.on(
      "notification_history",
      (notifications: NotificationSocketData[]) => {
        console.log("Notification history received:", notifications);
      }
    );
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("Max reconnection attempts reached");
      toast.error("Connection lost. Please refresh the page.");
      return;
    }

    setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Reconnection attempt ${this.reconnectAttempts}`);
      this.socket?.connect();
    }, Math.pow(2, this.reconnectAttempts) * 1000); // Exponential backoff
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

    switch (notification.priority) {
      case "urgent":
        toast.error(`${notification.title}: ${notification.message}`, options);
        break;
      case "high":
        toast.success(
          `${notification.title}: ${notification.message}`,
          options
        );
        break;
      default:
        toast(`${notification.title}: ${notification.message}`, options);
        break;
    }
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
    callback: (notification: NotificationSocketData) => void
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
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
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
