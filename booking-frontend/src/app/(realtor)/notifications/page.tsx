"use client";

import React from "react";
import { useAlert } from "@/context/AlertContext";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { notificationApiService } from "@/services/notifications";
import NotificationStatsCards from "@/components/notifications/NotificationStatsCards";
import { type Notification, type NotificationStats } from "@/types/notifications";
import {
  Bell,
  Check,
  Calendar,
  Star,
  X,
  Loader2,
  AlertCircle,
  Wallet,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type FilterType = "all" | "unread" | "BOOKING" | "REVIEW" | "PAYMENT";

type NotificationQueryParams = {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: string;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response
      ?.data?.message === "string"
  ) {
    return (error as { response?: { data?: { message?: string } } }).response
      ?.data?.message as string;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};

export default function NotificationsPage() {
  const { brandColor } = useRealtorBranding();
  const { showSuccess, showError } = useAlert();

  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<FilterType>("all");
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [stats, setStats] = React.useState<NotificationStats | null>(null);
  const [loadingStats, setLoadingStats] = React.useState(true);

  const fetchNotifications = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: NotificationQueryParams = { limit: 50 };
      if (filter === "unread") params.unreadOnly = true;
      if (filter !== "all" && filter !== "unread") params.type = filter;

      const response = await notificationApiService.getNotifications(params);
      setNotifications(response.notifications || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load notifications"));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchUnreadCount = React.useCallback(async () => {
    try {
      const count = await notificationApiService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Keep UI responsive even if unread count fails.
    }
  }, []);

  const fetchStats = React.useCallback(async () => {
    try {
      setLoadingStats(true);
      const summary = await notificationApiService.getStats();
      setStats(summary);
    } catch {
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchNotifications();
    void fetchUnreadCount();
    void fetchStats();
  }, [fetchNotifications, fetchUnreadCount, fetchStats]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationApiService.markAsRead(notificationId);
      await fetchNotifications();
      await fetchUnreadCount();
      await fetchStats();
    } catch (err) {
      showError(getErrorMessage(err, "Failed to mark as read"));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApiService.markAllAsRead();
      await fetchNotifications();
      await fetchUnreadCount();
      await fetchStats();
      showSuccess("All notifications marked as read!");
    } catch (err) {
      showError(getErrorMessage(err, "Failed to mark all as read"));
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationApiService.deleteNotification(notificationId);
      await fetchNotifications();
      await fetchStats();
      showSuccess("Notification deleted!");
    } catch (err) {
      showError(getErrorMessage(err, "Failed to delete notification"));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "BOOKING":
      case "BOOKING_CONFIRMED":
      case "BOOKING_CANCELLED":
      case "BOOKING_COMPLETED":
        return <Calendar className="w-5 h-5" style={{ color: brandColor }} />;
      case "REVIEW":
      case "REVIEW_RECEIVED":
      case "REVIEW_RESPONSE":
        return <Star className="w-5 h-5 text-yellow-600" />;
      case "PAYMENT":
      case "PAYMENT_SUCCESSFUL":
      case "PAYMENT_FAILED":
      case "PAYMENT_REFUNDED":
        return <Wallet className="w-5 h-5 text-green-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
                <p className="text-gray-600 mt-1">
                  Stay updated on your property activity
                </p>
              </div>
              <button
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className="px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ color: brandColor }}
              >
                Mark all as read
              </button>
            </div>
          </div>

          <div className="mb-6">
            <NotificationStatsCards
              stats={stats}
              loading={loadingStats}
              accentColor={brandColor}
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {[
                  { key: "all", label: "All" },
                  { key: "unread", label: "Unread", count: unreadCount },
                  { key: "BOOKING", label: "Bookings" },
                  { key: "REVIEW", label: "Reviews" },
                  { key: "PAYMENT", label: "Payments" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as FilterType)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      filter === tab.key
                        ? "text-gray-700 hover:text-gray-700 hover:border-gray-300"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                    style={
                      filter === tab.key
                        ? { borderBottomColor: brandColor, color: brandColor }
                        : {}
                    }
                  >
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span
                        className="ml-2 px-2 py-0.5 rounded-full text-xs"
                        style={{
                          backgroundColor: `${brandColor}20`,
                          color: brandColor,
                        }}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {loading && (
              <div className="p-12">
                <div className="text-center">
                  <Loader2
                    className="w-12 h-12 animate-spin mx-auto mb-4"
                    style={{ color: brandColor }}
                  />
                  <p className="text-gray-600">Loading notifications...</p>
                </div>
              </div>
            )}

            {error && !loading && (
              <div className="p-8">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Error Loading Notifications
                  </h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={() => void fetchNotifications()}
                    className="px-4 py-2 text-white rounded-lg text-sm"
                    style={{ backgroundColor: brandColor }}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div className="p-12">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <Bell className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Notifications
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {filter === "all"
                      ? "You'll receive notifications about new bookings, reviews, payments, and other important updates here."
                      : `No ${filter.toLowerCase()} notifications found.`}
                  </p>
                </div>
              </div>
            )}

            {!loading && !error && notifications.length > 0 && (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                    style={
                      !notification.isRead
                        ? { backgroundColor: `${brandColor}10` }
                        : {}
                    }
                  >
                    <div className="flex items-start space-x-4">
                      <div
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: !notification.isRead
                            ? `${brandColor}20`
                            : "#f3f4f6",
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p
                              className={`text-sm font-medium text-gray-900 ${
                                !notification.isRead ? "font-semibold" : ""
                              }`}
                            >
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {notification.createdAt
                                ? formatDistanceToNow(new Date(notification.createdAt), {
                                    addSuffix: true,
                                  })
                                : "Just now"}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            {!notification.isRead && (
                              <button
                                onClick={() => void handleMarkAsRead(notification.id)}
                                className="p-2 rounded-lg transition-colors"
                                style={{
                                  color: brandColor,
                                  backgroundColor: `${brandColor}10`,
                                }}
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => void handleDelete(notification.id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
