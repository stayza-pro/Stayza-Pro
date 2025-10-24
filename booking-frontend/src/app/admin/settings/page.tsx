"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { getAllSettings, GroupedSettings } from "@/services/settingsService";
import CommissionSettings from "@/components/admin/settings/CommissionSettings";
import PayoutSettings from "@/components/admin/settings/PayoutSettings";
import BookingSettings from "@/components/admin/settings/BookingSettings";
import PropertySettings from "@/components/admin/settings/PropertySettings";

interface SettingsPageProps {}

const SettingsPage: React.FC<SettingsPageProps> = () => {
  const [settings, setSettings] = useState<GroupedSettings>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("commission");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Available setting categories
  const categories = [
    {
      key: "commission",
      label: "Commission",
      icon: "💰",
      description: "Platform commission rates and fee structure",
    },
    {
      key: "payout",
      label: "Payouts",
      icon: "💳",
      description: "Payout thresholds and processing settings",
    },
    {
      key: "booking",
      label: "Bookings",
      icon: "📅",
      description: "Booking rules and cancellation policies",
    },
    {
      key: "property",
      label: "Properties",
      icon: "🏠",
      description: "Property listing rules and limitations",
    },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllSettings();
      if (
        response &&
        response.success &&
        response.data &&
        response.data.settings
      ) {
        setSettings(response.data.settings);
      } else {
        setSettings({});
        setError("Invalid response format from settings API");
      }
    } catch (error: any) {
      setError(error.message);
      setSettings({}); // Set empty settings object on error
    } finally {
      setLoading(false);
    }
  };

  const handleSettingUpdate = (key: string, value: any) => {
    setHasUnsavedChanges(true);
    // Update the local state immediately for better UX
    setSettings((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((category) => {
        const settingIndex = updated[category].findIndex(
          (setting) => setting.key === key
        );
        if (settingIndex !== -1) {
          updated[category][settingIndex] = {
            ...updated[category][settingIndex],
            value: value,
          };
        }
      });
      return updated;
    });
  };

  const handleSaveSuccess = (message: string) => {
    setSuccess(message);
    setHasUnsavedChanges(false);
    setTimeout(() => setSuccess(null), 3000);
    // Refresh settings to get latest data
    fetchSettings();
  };

  const handleSaveError = (error: string) => {
    setError(error);
    setTimeout(() => setError(null), 5000);
  };

  const renderCategoryContent = () => {
    const categorySettings = settings[activeTab] || [];

    switch (activeTab) {
      case "commission":
        return (
          <CommissionSettings
            settings={categorySettings}
            onUpdate={handleSettingUpdate}
            onSaveSuccess={handleSaveSuccess}
            onSaveError={handleSaveError}
          />
        );
      case "payout":
        return (
          <PayoutSettings
            settings={categorySettings}
            onUpdate={handleSettingUpdate}
            onSaveSuccess={handleSaveSuccess}
            onSaveError={handleSaveError}
          />
        );
      case "booking":
        return (
          <BookingSettings
            settings={categorySettings}
            onUpdate={handleSettingUpdate}
            onSaveSuccess={handleSaveSuccess}
            onSaveError={handleSaveError}
          />
        );
      case "property":
        return (
          <PropertySettings
            settings={categorySettings}
            onUpdate={handleSettingUpdate}
            onSaveSuccess={handleSaveSuccess}
            onSaveError={handleSaveError}
          />
        );
      default:
        return (
          <div className="text-center py-8 text-gray-500">
            Select a category to view settings
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Settings className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Platform Settings
              </h1>
              <p className="text-gray-600 mt-1">
                Configure platform-wide settings and parameters
              </p>
            </div>
          </div>
          {hasUnsavedChanges && (
            <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-1 rounded-lg">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Unsaved changes</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          <span>{success}</span>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Category Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Settings Categories">
            {categories.map((category) => (
              <button
                key={category.key}
                onClick={() => setActiveTab(category.key)}
                className={`
                  flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === category.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                <span className="mr-2 text-lg">{category.icon}</span>
                {category.label}
                {settings[category.key]?.length && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {settings[category.key].length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Category Description */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center">
            <span className="text-2xl mr-3">
              {categories.find((cat) => cat.key === activeTab)?.icon}
            </span>
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                {categories.find((cat) => cat.key === activeTab)?.label}{" "}
                Settings
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {categories.find((cat) => cat.key === activeTab)?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Category Content */}
        <div className="p-6">{renderCategoryContent()}</div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          Changes to platform settings may affect all users and transactions.{" "}
          <strong>Please review carefully before saving.</strong>
        </p>
        <p className="mt-1">
          All setting changes are logged for audit purposes.
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;
