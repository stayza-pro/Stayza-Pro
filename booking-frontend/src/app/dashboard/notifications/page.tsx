import React from "react";
import { NotificationList } from "@/components/notifications/NotificationList";

export const dynamic = "force-dynamic";

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NotificationList />
    </div>
  );
}
