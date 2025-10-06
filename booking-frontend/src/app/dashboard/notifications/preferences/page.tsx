import React from "react";
import { NotificationPreferencesPage } from "@/components/notifications/NotificationPreferencesPage";

export const dynamic = "force-dynamic";

export default function NotificationPreferences() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NotificationPreferencesPage />
    </div>
  );
}
