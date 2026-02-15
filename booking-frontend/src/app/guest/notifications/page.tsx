"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Bell,
  Calendar,
  Check,
  Heart,
  MessageSquare,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { notificationApiService } from "@/services/notifications";
import type { Notification } from "@/types/notifications";
import toast from "react-hot-toast";

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
  FAVORITE: Heart,
};

function getIconColor(
  type: string,
  colors: { primary: string; secondary?: string; accent?: string },
) {
  if (type.includes("BOOKING")) return colors.accent || colors.primary;
  if (type.includes("PAYMENT")) return colors.primary;
  if (type.includes("REVIEW")) return colors.secondary || colors.primary;
  if (type.includes("MARKETING") || type.includes("MESSAGE"))
    return colors.primary;
  return "#6b7280";
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) return "Just now";
  if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
  if (diffInHours < 48) return "Yesterday";

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getActionUrl(notification: Notification) {
  if (notification.bookingId) return `/guest/booking/${notification.bookingId}`;
  if (notification.propertyId)
    return `/guest/browse?propertyId=${notification.propertyId}`;
  return null;
}

export default function GuestNotificationsPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useCurrentUser();
  const {
    brandColor: primaryColor,
    secondaryColor,
    accentColor,
  } = useRealtorBranding();
  const [authChecked, setAuthChecked] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  useEffect(() => {
    if (!isAuthLoading && (isAuthenticated || !authChecked)) {
      setAuthChecked(true);
    }
  }, [isAuthLoading, isAuthenticated, authChecked]);

  useEffect(() => {
    if (authChecked && !isAuthLoading && !isAuthenticated) {
      window.location.href = "/guest/login?returnTo=/guest/notifications";
    }
  }, [authChecked, isAuthLoading, isAuthenticated]);

  useEffect(() => {
    if (!authChecked || isAuthLoading) return;

    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const loadNotifications = async () => {
      try {
        setIsLoading(true);
        const response = await notificationApiService.getNotifications({
          page: 1,
          limit: 50,
        });

        setNotifications(
          Array.isArray(response.notifications) ? response.notifications : [],
        );
      } catch {
        toast.error("Failed to load notifications");
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, [isAuthenticated, isAuthLoading, authChecked]);

  const markAsRead = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification,
      ),
    );

    try {
      await notificationApiService.markAsRead(notificationId);
    } catch {
      toast.error("Failed to update notification");
    }
  };

  const markAllAsRead = async () => {
    try {
      setIsMarkingAll(true);
      await notificationApiService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true })),
      );
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    } finally {
      setIsMarkingAll(false);
    }
  };

  if (!authChecked || isAuthLoading) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex flex-col"
        style={{ colorScheme: "light" }}
      >
        <GuestHeader currentPage="notifications" />
        <div className="max-w-[900px] mx-auto px-6 py-12 flex-1 w-full">
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-1/3 rounded bg-gray-200 mb-8" />
            <div className="h-24 rounded-2xl bg-gray-200" />
            <div className="h-24 rounded-2xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-20 md:pb-8 bg-gray-50 flex flex-col"
      style={{ colorScheme: "light" }}
    >
      <GuestHeader currentPage="notifications" />

      <div className="max-w-[900px] mx-auto px-6 py-12 flex-1 w-full">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="font-semibold mb-2 text-[36px] text-gray-900">
              Notifications
            </h1>
            <p className="text-gray-600">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                : "You're all caught up!"}
            </p>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={markAllAsRead}
              disabled={isMarkingAll}
            >
              <Check className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-3"
              style={{ borderBottomColor: primaryColor }}
            />
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const Icon = TYPE_ICON_MAP[notification.type] || Bell;
              const actionUrl = getActionUrl(notification);

              const content = (
                <div
                  className={`flex gap-4 p-6 rounded-2xl border border-gray-200 transition-all hover:shadow-md ${
                    !notification.isRead ? "bg-[#EEF5FF]" : "bg-white"
                  }`}
                  onClick={() => {
                    if (!notification.isRead) {
                      void markAsRead(notification.id);
                    }
                  }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-white">
                    <Icon
                      className="w-6 h-6"
                      style={{
                        color: getIconColor(notification.type, {
                          primary: primaryColor,
                          secondary: secondaryColor,
                          accent: accentColor,
                        }),
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
                          style={{
                            backgroundColor: accentColor || primaryColor,
                          }}
                        />
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      {notification.message}
                    </p>
                    <span className="text-xs text-gray-500">
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>
                </div>
              );

              return actionUrl ? (
                <Link key={notification.id} href={actionUrl}>
                  {content}
                </Link>
              ) : (
                <div key={notification.id}>{content}</div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              No notifications
            </h3>
            <p className="text-gray-600">
              You&apos;re all caught up! We&apos;ll notify you of any updates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
