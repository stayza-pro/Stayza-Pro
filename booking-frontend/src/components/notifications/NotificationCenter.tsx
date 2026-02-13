"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  X,
  Trash2,
  Check,
  CheckCheck,
  Loader2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useNotifications } from "@/hooks/notifications/useNotifications";
import { Notification } from "@/types/notifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    error,
    hasMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredNotifications =
    filter === "unread"
      ? (Array.isArray(notifications) ? notifications : []).filter(
          (n) => !n.isRead
        )
      : Array.isArray(notifications)
      ? notifications
      : [];

  const handleMarkAsRead = async (
    notification: Notification,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
  };

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

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

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-lg transition-colors duration-200",
          "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
          isOpen && "bg-gray-100"
        )}
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="h-5 w-5 text-gray-600" />

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}

        {/* Connection Status Indicator */}
        <div className="absolute -bottom-1 -right-1">
          {isConnected ? (
            <Wifi className="h-3 w-3 text-green-500" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-500" />
          )}
        </div>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex mt-2 space-x-1">
              <button
                onClick={() => setFilter("all")}
                className={cn(
                  "px-3 py-1 text-sm rounded-md transition-colors",
                  filter === "all"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={cn(
                  "px-3 py-1 text-sm rounded-md transition-colors",
                  filter === "unread"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Actions */}
            {unreadCount > 0 && (
              <div className="flex mt-2">
                <button
                  onClick={markAllAsRead}
                  disabled={isLoading}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark all read
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {error && (
              <div className="p-4 text-sm text-red-600 bg-red-50">{error}</div>
            )}

            {isLoading && notifications.length === 0 && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            )}

            {filteredNotifications.length === 0 && !isLoading && (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">
                  {filter === "unread"
                    ? "No unread notifications"
                    : "No notifications yet"}
                </p>
              </div>
            )}

            {/* Notification List */}
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "relative p-4 border-l-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer",
                  getPriorityColor(notification.priority),
                  !notification.isRead && "bg-blue-50"
                )}
                onClick={() =>
                  handleMarkAsRead(notification, {} as React.MouseEvent)
                }
              >
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 text-lg">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4
                          className={cn(
                            "text-sm font-medium text-gray-900 truncate",
                            !notification.isRead && "font-semibold"
                          )}
                        >
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(
                            new Date(notification.createdAt),
                            { addSuffix: true }
                          )}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-1 ml-2">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => handleMarkAsRead(notification, e)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(notification.id, e)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete notification"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.isRead && (
                      <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && filteredNotifications.length > 0 && (
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="w-full text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      Loading...
                    </>
                  ) : (
                    "Load more notifications"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
