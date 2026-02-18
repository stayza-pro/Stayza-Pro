"use client";

import React from "react";
import { Bell, Calendar, CreditCard, Star } from "lucide-react";
import { NotificationStats } from "@/types/notifications";

interface NotificationStatsCardsProps {
  stats: NotificationStats | null;
  loading?: boolean;
  accentColor?: string;
}

const safeCount = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function NotificationStatsCards({
  stats,
  loading = false,
  accentColor = "#2563eb",
}: NotificationStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    );
  }

  const typeDistribution = stats?.typeDistribution || ({} as Record<string, number>);
  const bookingCount =
    safeCount(typeDistribution.BOOKING_CONFIRMED) +
    safeCount(typeDistribution.BOOKING_CANCELLED) +
    safeCount(typeDistribution.BOOKING_COMPLETED);
  const paymentCount =
    safeCount(typeDistribution.PAYMENT_SUCCESSFUL) +
    safeCount(typeDistribution.PAYMENT_FAILED) +
    safeCount(typeDistribution.PAYMENT_REFUNDED);
  const reviewCount =
    safeCount(typeDistribution.REVIEW_RECEIVED) +
    safeCount(typeDistribution.REVIEW_RESPONSE);

  const cards = [
    {
      label: "Total Notifications",
      value: safeCount(stats?.totalCount),
      icon: Bell,
    },
    {
      label: "Unread",
      value: safeCount(stats?.unreadCount),
      icon: Calendar,
    },
    {
      label: "Payment Alerts",
      value: paymentCount,
      icon: CreditCard,
    },
    {
      label: "Review Alerts",
      value: reviewCount || bookingCount,
      icon: Star,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {card.label}
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {card.value.toLocaleString("en-NG")}
                </p>
              </div>
              <div
                className="rounded-lg p-2"
                style={{ backgroundColor: `${accentColor}18` }}
              >
                <Icon className="h-5 w-5" style={{ color: accentColor }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
