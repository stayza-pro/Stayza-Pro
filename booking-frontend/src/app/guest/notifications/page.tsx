"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  Bell,
  Calendar,
  Check,
  Loader2,
  Star,
  Wallet,
  X,
} from "lucide-react";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import NotificationStatsCards from "@/components/notifications/NotificationStatsCards";
import { notificationApiService } from "@/services/notifications";
import { Notification, NotificationStats } from "@/types/notifications";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { useAlert } from "@/context/AlertContext";

type FilterType = "all" | "unread" | "BOOKING" | "REVIEW" | "PAYMENT";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

export default function GuestNotificationsPage() {
  const { brandColor } = useRealtorBranding();
  const { showError, showSuccess } = useAlert();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [stats, setStats] = React.useState<NotificationStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadingStats, setLoadingStats] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<FilterType>("all");
  const [unreadCount, setUnreadCount] = React.useState(0);

  const fetchNotifications = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { limit?: number; unreadOnly?: boolean; type?: string } = {
        limit: 50,
      };
      if (filter === "unread") params.unreadOnly = true;
      if (filter !== "all" && filter !== "unread") params.type = filter;

      const response = await notificationApiService.getNotifications(params);
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Failed to load notifications."));
    } finally {
      setLoading(false);
    }
  }, [filter]);

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
    void fetchStats();
  }, [fetchNotifications, fetchStats]);

  const refreshAll = async () => {
    await fetchNotifications();
    await fetchStats();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationApiService.markAsRead(notificationId);
      await refreshAll();
    } catch (markError) {
      showError(getErrorMessage(markError, "Failed to mark as read."));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApiService.markAllAsRead();
      await refreshAll();
      showSuccess("All notifications marked as read.");
    } catch (markAllError) {
      showError(getErrorMessage(markAllError, "Failed to mark all as read."));
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationApiService.deleteNotification(notificationId);
      await refreshAll();
      showSuccess("Notification removed.");
    } catch (deleteError) {
      showError(getErrorMessage(deleteError, "Failed to delete notification."));
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes("BOOKING")) return <Calendar className="h-5 w-5" style={{ color: brandColor }} />;
    if (type.includes("REVIEW")) return <Star className="h-5 w-5 text-yellow-600" />;
    if (type.includes("PAYMENT")) return <Wallet className="h-5 w-5 text-green-600" />;
    return <Bell className="h-5 w-5 text-gray-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <GuestHeader currentPage="notifications" />

      <div className="mx-auto max-w-[1440px] px-6 py-8 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-600">
              Keep up with booking, payment, and review updates.
            </p>
          </div>
          <button
            onClick={() => void handleMarkAllAsRead()}
            disabled={unreadCount === 0}
            className="rounded-lg px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            style={{ color: brandColor }}
          >
            Mark all as read
          </button>
        </div>

        <div className="mb-6">
          <NotificationStatsCards
            stats={stats}
            loading={loadingStats}
            accentColor={brandColor}
          />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { key: "all", label: "All" },
            { key: "unread", label: `Unread (${unreadCount})` },
            { key: "BOOKING", label: "Bookings" },
            { key: "REVIEW", label: "Reviews" },
            { key: "PAYMENT", label: "Payments" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key as FilterType)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                filter === item.key
                  ? "border-transparent text-white"
                  : "border-gray-300 text-gray-600"
              }`}
              style={filter === item.key ? { backgroundColor: brandColor } : {}}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
            <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-gray-400" />
            <p className="text-sm text-gray-600">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
            <Bell className="mx-auto mb-3 h-10 w-10 text-gray-400" />
            <p className="font-semibold text-gray-900">No notifications found</p>
            <p className="text-sm text-gray-600">
              You are all caught up for this filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start gap-4 p-4"
                style={
                  !notification.isRead
                    ? { backgroundColor: `${brandColor}10` }
                    : undefined
                }
              >
                <div className="rounded-lg bg-gray-100 p-2">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        {notification.createdAt
                          ? formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })
                          : "Just now"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.isRead && (
                        <button
                          type="button"
                          onClick={() => void handleMarkAsRead(notification.id)}
                          className="rounded-md p-1.5"
                          style={{
                            color: brandColor,
                            backgroundColor: `${brandColor}15`,
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleDelete(notification.id)}
                        className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && notifications.length > 0 && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
            <AlertCircle className="mr-1 inline h-4 w-4" />
            Notification list auto-refreshes when this page regains focus.
          </div>
        )}
      </div>
    </div>
  );
}
