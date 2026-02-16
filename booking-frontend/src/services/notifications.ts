import axios from "axios";
import { getCookie } from "@/utils/cookies";
import {
  Notification,
  NotificationPreferences,
  NotificationStats,
  PaginatedNotifications,
  NotificationsListResponse,
  NotificationPreferencesResponse,
  NotificationStatsResponse,
  UnreadCountResponse,
  NotificationResponse,
} from "@/types/notifications";

const normalizeApiUrl = (value: string) => {
  const trimmed = value.replace(/\/+$/, "");
  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
};

const API_BASE_URL = normalizeApiUrl(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api",
);

class NotificationApiService {
  private getAuthHeaders() {
    let token: string | null = null;

    if (typeof window !== "undefined") {
      token = localStorage.getItem("accessToken");
      if (!token) {
        token = getCookie("accessToken");
        if (token) {
          localStorage.setItem("accessToken", token);
        }
      }
    }

    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Get paginated notifications
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: string;
  }): Promise<PaginatedNotifications> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set("page", params.page.toString());
      if (params?.limit) queryParams.set("limit", params.limit.toString());
      if (params?.unreadOnly)
        queryParams.set("unreadOnly", params.unreadOnly.toString());
      if (params?.type) queryParams.set("type", params.type);

      const response = await axios.get<NotificationsListResponse>(
        `${API_BASE_URL}/notifications?${queryParams}`,
        { headers: this.getAuthHeaders() },
      );

      const payload = response.data as unknown;

      // Preferred shape: { data: PaginatedNotifications }
      const wrapped = payload as { data?: Partial<PaginatedNotifications> };
      const direct = payload as Partial<PaginatedNotifications>;
      const source =
        wrapped?.data && typeof wrapped.data === "object"
          ? wrapped.data
          : direct;

      const safeNotifications = Array.isArray(source?.notifications)
        ? source.notifications
        : [];

      const safeUnreadCount =
        typeof source?.unreadCount === "number" ? source.unreadCount : 0;

      const rawPagination: Partial<PaginatedNotifications["pagination"]> =
        source?.pagination && typeof source.pagination === "object"
          ? source.pagination
          : {};

      return {
        notifications: safeNotifications,
        unreadCount: safeUnreadCount,
        pagination: {
          currentPage:
            typeof rawPagination.currentPage === "number"
              ? rawPagination.currentPage
              : params?.page || 1,
          totalPages:
            typeof rawPagination.totalPages === "number"
              ? rawPagination.totalPages
              : params?.page || 1,
          totalItems:
            typeof rawPagination.totalItems === "number"
              ? rawPagination.totalItems
              : safeNotifications.length,
          hasNext: Boolean(rawPagination.hasNext),
          hasPrev: Boolean(rawPagination.hasPrev),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Get unread count
  async getUnreadCount(): Promise<number> {
    try {
      const response = await axios.get<UnreadCountResponse>(
        `${API_BASE_URL}/notifications/unread-count`,
        { headers: this.getAuthHeaders() },
      );

      return response.data.data.unreadCount;
    } catch (error) {
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<Notification> {
    try {
      const response = await axios.patch<NotificationResponse>(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {},
        { headers: this.getAuthHeaders() },
      );

      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    try {
      await axios.patch(
        `${API_BASE_URL}/notifications/read-all`,
        {},
        { headers: this.getAuthHeaders() },
      );
    } catch (error) {
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/notifications/${notificationId}`, {
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      throw error;
    }
  }

  // Get notification statistics
  async getStats(): Promise<NotificationStats> {
    try {
      const response = await axios.get<NotificationStatsResponse>(
        `${API_BASE_URL}/notifications/stats`,
        { headers: this.getAuthHeaders() },
      );

      return response.data.data;
    } catch (error) {
      throw error;
    }
  }
}

export const notificationApiService = new NotificationApiService();
