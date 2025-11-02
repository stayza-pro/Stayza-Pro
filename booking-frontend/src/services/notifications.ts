import axios from "axios";
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

class NotificationApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem("accessToken");
    return {
      Authorization: `Bearer ${token}`,
    };
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
        `${API_BASE_URL}/api/notifications?${queryParams}`,
        { headers: this.getAuthHeaders() }
      );

      return response.data.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  // Get unread count
  async getUnreadCount(): Promise<number> {
    try {
      const response = await axios.get<UnreadCountResponse>(
        `${API_BASE_URL}/api/notifications/unread-count`,
        { headers: this.getAuthHeaders() }
      );

      return response.data.data.unreadCount;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<Notification> {
    try {
      const response = await axios.put<NotificationResponse>(
        `${API_BASE_URL}/api/notifications/${notificationId}/read`,
        {},
        { headers: this.getAuthHeaders() }
      );

      return response.data.data;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    try {
      await axios.put(
        `${API_BASE_URL}/api/notifications/mark-all-read`,
        {},
        { headers: this.getAuthHeaders() }
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/notifications/${notificationId}`,
        {
          headers: this.getAuthHeaders(),
        }
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  }

  // Get notification preferences
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await axios.get<NotificationPreferencesResponse>(
        `${API_BASE_URL}/api/notifications/preferences`,
        { headers: this.getAuthHeaders() }
      );

      return response.data.data;
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      throw error;
    }
  }

  // Update notification preferences
  async updatePreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      const response = await axios.put<NotificationPreferencesResponse>(
        `${API_BASE_URL}/api/notifications/preferences`,
        preferences,
        { headers: this.getAuthHeaders() }
      );

      return response.data.data;
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      throw error;
    }
  }

  // Get notification statistics
  async getStats(): Promise<NotificationStats> {
    try {
      const response = await axios.get<NotificationStatsResponse>(
        `${API_BASE_URL}/api/notifications/stats`,
        { headers: this.getAuthHeaders() }
      );

      return response.data.data;
    } catch (error) {
      console.error("Error fetching notification stats:", error);
      throw error;
    }
  }
}

export const notificationApiService = new NotificationApiService();
