import { useState, useEffect } from "react";
import { NotificationPreferences } from "@/types/notifications";

export function useNotificationPreferences() {
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("accessToken");
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";

      const response = await fetch(`${API_URL}/notifications/preferences`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch notification preferences");
      }

      const data = await response.json();
      setPreferences(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      // Set default preferences if fetch fails
      setPreferences({
        id: "default",
        userId: "",
        emailEnabled: true,
        emailBookingUpdates: true,
        emailPaymentUpdates: true,
        emailReviews: true,
        emailMarketing: false,
        emailSystemAlerts: true,
        pushEnabled: true,
        pushBookingUpdates: true,
        pushPaymentUpdates: true,
        pushReviews: true,
        pushSystemAlerts: true,
        smsEnabled: false,
        smsBookingUpdates: false,
        smsPaymentUpdates: false,
        smsSystemAlerts: false,
        digestFrequency: "daily",
        quietHoursStart: "22:00",
        quietHoursEnd: "08:00",
        timezone: "UTC",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (
    updates: Partial<NotificationPreferences>
  ) => {
    try {
      const token = localStorage.getItem("accessToken");
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";

      const response = await fetch(`${API_URL}/notifications/preferences`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update notification preferences");
      }

      const data = await response.json();
      setPreferences(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  };

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    refetch: fetchPreferences,
  };
}
