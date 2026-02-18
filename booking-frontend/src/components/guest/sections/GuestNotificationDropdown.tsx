"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Calendar,
  MessageSquare,
  Star,
  AlertCircle,
  Check,
} from "lucide-react";
import { notificationApiService } from "@/services/notifications";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Notification } from "@/types/notifications";

interface GuestNotificationDropdownProps {
  primaryColor: string;
}

const TYPE_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  BOOKING_CONFIRMED: Calendar,
  BOOKING_CANCELLED: Calendar,
  BOOKING_COMPLETED: Calendar,
  PAYMENT_SUCCESSFUL: AlertCircle,
  PAYMENT_FAILED: AlertCircle,
  PAYMENT_REFUNDED: AlertCircle,
  REVIEW_RECEIVED: Star,
  REVIEW_RESPONSE: Star,
  SYSTEM_MAINTENANCE: AlertCircle,
  MARKETING: MessageSquare,
};

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) return "Just now";
  if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
  if (diffInHours < 48) return "Yesterday";

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getActionUrl(notification: Notification) {
  if (notification.bookingId)
    return `/guest/bookings/${notification.bookingId}`;
  if (notification.propertyId)
    return `/guest/browse/${notification.propertyId}`;
  return "/guest/notifications";
}

export function GuestNotificationDropdown({
  primaryColor,
}: GuestNotificationDropdownProps) {
  const { isAuthenticated } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUnreadCount = async () => {
      try {
        const count = await notificationApiService.getUnreadCount();
        setUnreadCount(count);
      } catch {}
    };

    fetchUnreadCount();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        const response = await notificationApiService.getNotifications({
          page: 1,
          limit: 8,
        });
        setNotifications(
          Array.isArray(response.notifications) ? response.notifications : [],
        );
        setUnreadCount(response.unreadCount || 0);
      } catch {
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [isOpen, isAuthenticated]);

  const markAsRead = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification,
      ),
    );
    setUnreadCount((prev) => Math.max(prev - 1, 0));

    try {
      await notificationApiService.markAsRead(notificationId);
    } catch {}
  };

  const markAllAsRead = async () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true })),
    );
    setUnreadCount(0);

    try {
      await notificationApiService.markAllAsRead();
    } catch {}
  };

  const hasUnread = useMemo(() => unreadCount > 0, [unreadCount]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-2 rounded-lg transition-all relative"
        style={{ color: primaryColor }}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {hasUnread && (
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{ backgroundColor: primaryColor }}
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[90vw] bg-white rounded-xl shadow-xl border border-gray-200 z-[70] overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Notifications</h4>
            {hasUnread && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-medium hover:underline"
                style={{ color: primaryColor }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-sm text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const Icon = TYPE_ICON_MAP[notification.type] || Bell;
                  const actionUrl = getActionUrl(notification);
                  return (
                    <Link
                      key={notification.id}
                      href={actionUrl}
                      onClick={() => {
                        if (!notification.isRead) {
                          void markAsRead(notification.id);
                        }
                        setIsOpen(false);
                      }}
                      className={`block px-4 py-3 hover:bg-gray-50 ${
                        !notification.isRead ? "bg-[#EEF5FF]" : "bg-white"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                          <Icon
                            className="w-4 h-4"
                            style={{ color: primaryColor }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-medium text-sm text-gray-900 line-clamp-1">
                              {notification.title}
                            </div>
                            {!notification.isRead ? (
                              <Check className="w-3.5 h-3.5 mt-0.5 text-gray-400" />
                            ) : null}
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-1">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-4 py-2 border-t border-gray-200">
            <Link
              href="/guest/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium hover:underline"
              style={{ color: primaryColor }}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
