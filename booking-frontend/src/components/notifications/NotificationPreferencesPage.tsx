"use client";

import React, { useState } from "react";
import {
  Save,
  Loader2,
  Mail,
  Smartphone,
  MessageSquare,
  Clock,
  Globe,
} from "lucide-react";
import { useNotificationPreferences } from "@/hooks/notifications/useNotificationPreferences";
import { NotificationPreferences } from "@/types/notifications";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface NotificationPreferencesPageProps {
  className?: string;
}

export function NotificationPreferencesPage({
  className,
}: NotificationPreferencesPageProps) {
  const { preferences, isLoading, error, updatePreferences } =
    useNotificationPreferences();
  const [isSaving, setIsSaving] = useState(false);

  if (!preferences) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const handleToggle = async (
    field: keyof NotificationPreferences,
    value: boolean
  ) => {
    try {
      await updatePreferences({ [field]: value });
      toast.success("Preferences updated successfully");
    } catch (error) {
      toast.error("Failed to update preferences");
    }
  };

  const handleTimeChange = async (
    field: keyof NotificationPreferences,
    value: string
  ) => {
    try {
      await updatePreferences({ [field]: value });
      toast.success("Preferences updated successfully");
    } catch (error) {
      toast.error("Failed to update preferences");
    }
  };

  const handleSelectChange = async (
    field: keyof NotificationPreferences,
    value: string
  ) => {
    try {
      await updatePreferences({ [field]: value });
      toast.success("Preferences updated successfully");
    } catch (error) {
      toast.error("Failed to update preferences");
    }
  };

  const ToggleSwitch = ({
    checked,
    onChange,
    disabled = false,
  }: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        checked ? "bg-blue-600" : "bg-gray-200",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );

  const PreferenceRow = ({
    icon: Icon,
    title,
    description,
    children,
  }: {
    icon: React.ElementType;
    title: string;
    description: string;
    children: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-start space-x-3">
        <Icon className="h-5 w-5 text-gray-400 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-gray-900">{title}</h4>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );

  return (
    <div className={cn("max-w-4xl mx-auto p-6 space-y-8", className)}>
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">
            Notification Preferences
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Customize how and when you receive notifications
          </p>
        </div>

        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="p-6 space-y-8">
          {/* Email Notifications */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <Mail className="h-5 w-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">
                Email Notifications
              </h2>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
              <PreferenceRow
                icon={Mail}
                title="Email Notifications"
                description="Receive notifications via email"
              >
                <ToggleSwitch
                  checked={preferences.emailEnabled}
                  onChange={(checked) => handleToggle("emailEnabled", checked)}
                  disabled={isLoading}
                />
              </PreferenceRow>

              <div
                className={cn(
                  "space-y-1 transition-opacity",
                  !preferences.emailEnabled && "opacity-50"
                )}
              >
                <PreferenceRow
                  icon={Mail}
                  title="Booking Updates"
                  description="Confirmations, cancellations, and status changes"
                >
                  <ToggleSwitch
                    checked={preferences.emailBookingUpdates}
                    onChange={(checked) =>
                      handleToggle("emailBookingUpdates", checked)
                    }
                    disabled={isLoading || !preferences.emailEnabled}
                  />
                </PreferenceRow>

                <PreferenceRow
                  icon={Mail}
                  title="Payment Updates"
                  description="Payment confirmations and receipts"
                >
                  <ToggleSwitch
                    checked={preferences.emailPaymentUpdates}
                    onChange={(checked) =>
                      handleToggle("emailPaymentUpdates", checked)
                    }
                    disabled={isLoading || !preferences.emailEnabled}
                  />
                </PreferenceRow>

                <PreferenceRow
                  icon={Mail}
                  title="Reviews"
                  description="New reviews and responses"
                >
                  <ToggleSwitch
                    checked={preferences.emailReviews}
                    onChange={(checked) =>
                      handleToggle("emailReviews", checked)
                    }
                    disabled={isLoading || !preferences.emailEnabled}
                  />
                </PreferenceRow>

                <PreferenceRow
                  icon={Mail}
                  title="Marketing"
                  description="Promotional offers and updates"
                >
                  <ToggleSwitch
                    checked={preferences.emailMarketing}
                    onChange={(checked) =>
                      handleToggle("emailMarketing", checked)
                    }
                    disabled={isLoading || !preferences.emailEnabled}
                  />
                </PreferenceRow>

                <PreferenceRow
                  icon={Mail}
                  title="System Alerts"
                  description="Important system updates and maintenance"
                >
                  <ToggleSwitch
                    checked={preferences.emailSystemAlerts}
                    onChange={(checked) =>
                      handleToggle("emailSystemAlerts", checked)
                    }
                    disabled={isLoading || !preferences.emailEnabled}
                  />
                </PreferenceRow>
              </div>
            </div>
          </section>

          {/* Push Notifications */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <Smartphone className="h-5 w-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">
                Push Notifications
              </h2>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
              <PreferenceRow
                icon={Smartphone}
                title="Push Notifications"
                description="Receive real-time browser notifications"
              >
                <ToggleSwitch
                  checked={preferences.pushEnabled}
                  onChange={(checked) => handleToggle("pushEnabled", checked)}
                  disabled={isLoading}
                />
              </PreferenceRow>

              <div
                className={cn(
                  "space-y-1 transition-opacity",
                  !preferences.pushEnabled && "opacity-50"
                )}
              >
                <PreferenceRow
                  icon={Smartphone}
                  title="Booking Updates"
                  description="Real-time booking notifications"
                >
                  <ToggleSwitch
                    checked={preferences.pushBookingUpdates}
                    onChange={(checked) =>
                      handleToggle("pushBookingUpdates", checked)
                    }
                    disabled={isLoading || !preferences.pushEnabled}
                  />
                </PreferenceRow>

                <PreferenceRow
                  icon={Smartphone}
                  title="Payment Updates"
                  description="Instant payment notifications"
                >
                  <ToggleSwitch
                    checked={preferences.pushPaymentUpdates}
                    onChange={(checked) =>
                      handleToggle("pushPaymentUpdates", checked)
                    }
                    disabled={isLoading || !preferences.pushEnabled}
                  />
                </PreferenceRow>

                <PreferenceRow
                  icon={Smartphone}
                  title="Reviews"
                  description="New review notifications"
                >
                  <ToggleSwitch
                    checked={preferences.pushReviews}
                    onChange={(checked) => handleToggle("pushReviews", checked)}
                    disabled={isLoading || !preferences.pushEnabled}
                  />
                </PreferenceRow>

                <PreferenceRow
                  icon={Smartphone}
                  title="System Alerts"
                  description="Critical system notifications"
                >
                  <ToggleSwitch
                    checked={preferences.pushSystemAlerts}
                    onChange={(checked) =>
                      handleToggle("pushSystemAlerts", checked)
                    }
                    disabled={isLoading || !preferences.pushEnabled}
                  />
                </PreferenceRow>
              </div>
            </div>
          </section>

          {/* SMS Notifications */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <MessageSquare className="h-5 w-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">
                SMS Notifications
              </h2>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
              <PreferenceRow
                icon={MessageSquare}
                title="SMS Notifications"
                description="Receive notifications via SMS"
              >
                <ToggleSwitch
                  checked={preferences.smsEnabled}
                  onChange={(checked) => handleToggle("smsEnabled", checked)}
                  disabled={isLoading}
                />
              </PreferenceRow>

              <div
                className={cn(
                  "space-y-1 transition-opacity",
                  !preferences.smsEnabled && "opacity-50"
                )}
              >
                <PreferenceRow
                  icon={MessageSquare}
                  title="Booking Updates"
                  description="Important booking changes only"
                >
                  <ToggleSwitch
                    checked={preferences.smsBookingUpdates}
                    onChange={(checked) =>
                      handleToggle("smsBookingUpdates", checked)
                    }
                    disabled={isLoading || !preferences.smsEnabled}
                  />
                </PreferenceRow>

                <PreferenceRow
                  icon={MessageSquare}
                  title="Payment Updates"
                  description="Payment confirmations and failures"
                >
                  <ToggleSwitch
                    checked={preferences.smsPaymentUpdates}
                    onChange={(checked) =>
                      handleToggle("smsPaymentUpdates", checked)
                    }
                    disabled={isLoading || !preferences.smsEnabled}
                  />
                </PreferenceRow>

                <PreferenceRow
                  icon={MessageSquare}
                  title="System Alerts"
                  description="Critical system notifications only"
                >
                  <ToggleSwitch
                    checked={preferences.smsSystemAlerts}
                    onChange={(checked) =>
                      handleToggle("smsSystemAlerts", checked)
                    }
                    disabled={isLoading || !preferences.smsEnabled}
                  />
                </PreferenceRow>
              </div>
            </div>
          </section>

          {/* General Settings */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="h-5 w-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">
                General Settings
              </h2>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    Digest Frequency
                  </h4>
                  <p className="text-sm text-gray-500">
                    How often to receive summary emails
                  </p>
                </div>
                <select
                  value={preferences.digestFrequency}
                  onChange={(e) =>
                    handleSelectChange("digestFrequency", e.target.value)
                  }
                  disabled={isLoading}
                  className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="never">Never</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quiet Hours Start
                  </label>
                  <input
                    type="time"
                    value={preferences.quietHoursStart}
                    onChange={(e) =>
                      handleTimeChange("quietHoursStart", e.target.value)
                    }
                    disabled={isLoading}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quiet Hours End
                  </label>
                  <input
                    type="time"
                    value={preferences.quietHoursEnd}
                    onChange={(e) =>
                      handleTimeChange("quietHoursEnd", e.target.value)
                    }
                    disabled={isLoading}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Timezone
                </label>
                <select
                  value={preferences.timezone}
                  onChange={(e) =>
                    handleSelectChange("timezone", e.target.value)
                  }
                  disabled={isLoading}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                  <option value="Australia/Sydney">Sydney</option>
                </select>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
