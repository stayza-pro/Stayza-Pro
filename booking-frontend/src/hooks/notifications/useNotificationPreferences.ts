import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { notificationApiService } from "@/services/notifications";
import { NotificationPreferences } from "@/types/notifications";

interface UseNotificationPreferencesReturn {
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  error: string | null;
  updatePreferences: (
    updates: Partial<NotificationPreferences>
  ) => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

export function useNotificationPreferences(): UseNotificationPreferencesReturn {
  const { user } = useAuth();
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPreferences = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await notificationApiService.getPreferences();
      setPreferences(data);
    } catch (err: any) {
      setError(err.message || "Failed to load notification preferences");
      console.error("Error loading notification preferences:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updatePreferences = useCallback(
    async (updates: Partial<NotificationPreferences>): Promise<void> => {
      if (!user || !preferences) return;

      try {
        setIsLoading(true);
        setError(null);

        const updatedPreferences =
          await notificationApiService.updatePreferences(updates);
        setPreferences(updatedPreferences);
      } catch (err: any) {
        setError(err.message || "Failed to update notification preferences");
        console.error("Error updating notification preferences:", err);
        throw err; // Re-throw so components can handle the error
      } finally {
        setIsLoading(false);
      }
    },
    [user, preferences]
  );

  // Load preferences on mount
  useEffect(() => {
    if (user) {
      refreshPreferences();
    }
  }, [user, refreshPreferences]);

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    refreshPreferences,
  };
}
