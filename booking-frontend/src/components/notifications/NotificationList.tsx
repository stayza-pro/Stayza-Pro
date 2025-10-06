"use client";

import React, { useState, useEffect } from "react";
import { Bell, Trash2, Check, CheckCheck, Filter, Loader2 } from "lucide-react";
import { useNotifications } from "@/hooks/notifications/useNotifications";
import { Notification, NotificationType } from "@/types/notifications";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

interface NotificationListProps {
  className?: string;
}

export function NotificationList({ className }: NotificationListProps) {
  const [filter, setFilter] = useState<
    "all" | "unread" | NotificationType | ""
  >("all");
  const [showFilters, setShowFilters] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    hasMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
    loadNotifications,
  } = useNotifications();

  // Reload notifications when filter changes
  useEffect(() => {
    const unreadOnly = filter === "unread";
    const typeFilter =
      filter !== "all" && filter !== "unread" ? filter : undefined;

    loadNotifications(1, 20, unreadOnly);
  }, [filter, loadNotifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "BOOKING_CONFIRMED":
      case "BOOKING_COMPLETED":
        return "🏠";
      case "BOOKING_CANCELLED":
        return "❌";
      case "PAYMENT_SUCCESSFUL":
        return "💰";
      case "PAYMENT_FAILED":
        return "❗";
      case "REVIEW_RECEIVED":
      case "REVIEW_RESPONSE":
        return "⭐";
      case "CAC_APPROVED":
        return "✅";
      case "CAC_REJECTED":
        return "❌";
      case "SYSTEM_MAINTENANCE":
        return "🔧";
      case "MARKETING":
        return "📢";
      default:
        return "🔔";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "border-l-red-500 bg-red-50";
      case "high":
        return "border-l-orange-500 bg-orange-50";
      default:
        return "border-l-blue-500 bg-blue-50";
    }
  };

  const getTypeLabel = (type: NotificationType) => {
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const notificationTypes: NotificationType[] = [
    "BOOKING_CONFIRMED",
    "BOOKING_CANCELLED",
    "BOOKING_COMPLETED",
    "PAYMENT_SUCCESSFUL",
    "PAYMENT_FAILED",
    "PAYMENT_REFUNDED",
    "REVIEW_RECEIVED",
    "REVIEW_RESPONSE",
    "CAC_APPROVED",
    "CAC_REJECTED",
    "SYSTEM_MAINTENANCE",
    "MARKETING",
  ];

  const handleMarkAsRead = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
  };

  const handleDelete = async (notificationId: string) => {
    await deleteNotification(notificationId);
  };

  return (
    <div className={cn("max-w-4xl mx-auto p-6", className)}>
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Bell className="h-6 w-6 mr-2" />
                Notifications
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${
                      unreadCount !== 1 ? "s" : ""
                    }`
                  : "All caught up!"}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </button>

              {/* Mark All Read Button */}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={isLoading}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark All Read
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                    filter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                  )}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("unread")}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                    filter === "unread"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                  )}
                >
                  Unread ({unreadCount})
                </button>

                {notificationTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilter(filter === type ? "all" : type)}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                      filter === type
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                    )}
                  >
                    {getTypeLabel(type)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="divide-y divide-gray-200">
          {error && (
            <div className="p-6 text-sm text-red-600 bg-red-50">{error}</div>
          )}

          {isLoading && notifications.length === 0 && (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          )}

          {notifications.length === 0 && !isLoading && (
            <div className="p-12 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No notifications
              </h3>
              <p className="text-gray-500">
                {filter === "unread"
                  ? "You don't have any unread notifications."
                  : "You don't have any notifications yet."}
              </p>
            </div>
          )}

          {/* Notification List */}
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "relative p-6 border-l-4 hover:bg-gray-50 transition-colors",
                getPriorityColor(notification.priority),
                !notification.isRead && "bg-blue-50"
              )}
            >
              <div className="flex items-start space-x-4">
                {/* Icon */}
                <div className="flex-shrink-0 text-2xl">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3
                        className={cn(
                          "text-base font-medium text-gray-900",
                          !notification.isRead && "font-semibold"
                        )}
                      >
                        {notification.title}
                      </h3>
                      <p className="text-gray-600 mt-1">
                        {notification.message}
                      </p>

                      {/* Related Info */}
                      {notification.booking && (
                        <div className="mt-2 text-sm text-gray-500">
                          <span className="font-medium">Property:</span>{" "}
                          {notification.booking.property.title}
                        </div>
                      )}

                      {notification.payment && (
                        <div className="mt-2 text-sm text-gray-500">
                          <span className="font-medium">Amount:</span>{" "}
                          {notification.payment.currency}{" "}
                          {notification.payment.amount}
                        </div>
                      )}

                      <div className="flex items-center mt-3 text-sm text-gray-400">
                        <span>
                          {format(
                            new Date(notification.createdAt),
                            "MMM d, yyyy h:mm a"
                          )}
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          {formatDistanceToNow(
                            new Date(notification.createdAt),
                            { addSuffix: true }
                          )}
                        </span>
                        <span className="mx-2">•</span>
                        <span className="capitalize">
                          {notification.priority} priority
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-md hover:bg-blue-50"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-md hover:bg-red-50"
                        title="Delete notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Unread Indicator */}
                  {!notification.isRead && (
                    <div className="absolute top-6 right-6 w-3 h-3 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {hasMore && notifications.length > 0 && (
            <div className="p-6 border-t border-gray-200 text-center">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  "Load More Notifications"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
