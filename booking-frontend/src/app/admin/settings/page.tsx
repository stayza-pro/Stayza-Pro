"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  DollarSign,
  CreditCard,
  Calendar,
  Home,
} from "lucide-react";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
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
      icon: DollarSign,
      description: "Platform commission rates and fee structure",
      color: "bg-green-500",
    },
    {
      key: "payout",
      label: "Payouts",
      icon: CreditCard,
      description: "Payout thresholds and processing settings",
      color: "bg-blue-500",
    },
    {
      key: "booking",
      label: "Bookings",
      icon: Calendar,
      description: "Booking rules and cancellation policies",
      color: "bg-purple-500",
    },
    {
      key: "property",
      label: "Properties",
      icon: Home,
      description: "Property listing rules and limitations",
      color: "bg-orange-500",
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
    const commissionSettings = [
      ...categorySettings,
      ...(settings.payout || []).filter(
        (setting) => setting.key === "finance.withdrawal_fee.v1"
      ),
    ];

    switch (activeTab) {
      case "commission":
        return (
          <CommissionSettings
            settings={commissionSettings}
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
    <>
      <AdminNavigation />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Settings className="h-8 w-8 text-blue-600" />
                  Platform Settings
                </h1>
                <p className="text-gray-600 mt-2">
                  Configure platform-wide settings and parameters
                </p>
              </div>
              {hasUnsavedChanges && (
                <div className="flex items-center text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span className="font-medium">Unsaved changes</span>
                </div>
              )}
            </div>

            {/* Status Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span>{success}</span>
              </div>
            )}

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = activeTab === category.key;
                return (
                  <button
                    key={category.key}
                    onClick={() => setActiveTab(category.key)}
                    className={`p-6 rounded-xl border-2 text-left transition-all ${
                      isActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-3 rounded-lg ${category.color}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3
                        className={`font-semibold ${
                          isActive ? "text-blue-900" : "text-gray-900"
                        }`}
                      >
                        {category.label}
                      </h3>
                    </div>
                    <p
                      className={`text-sm ${
                        isActive ? "text-blue-700" : "text-gray-600"
                      }`}
                    >
                      {category.description}
                    </p>
                    {settings[category.key]?.length > 0 && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          {settings[category.key].length} settings
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Category Tabs */}
              <div className="border-b border-gray-200">
                <nav
                  className="flex space-x-8 px-6"
                  aria-label="Settings Categories"
                >
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
                      <category.icon className="mr-2 h-4 w-4" />
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
                  {(() => {
                    const category = categories.find(
                      (cat) => cat.key === activeTab
                    );
                    const Icon = category?.icon;
                    return Icon ? (
                      <Icon className="h-6 w-6 mr-3 text-gray-700" />
                    ) : null;
                  })()}
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">
                      {categories.find((cat) => cat.key === activeTab)?.label}{" "}
                      Settings
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {
                        categories.find((cat) => cat.key === activeTab)
                          ?.description
                      }
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
                Changes to platform settings may affect all users and
                transactions.{" "}
                <strong>Please review carefully before saving.</strong>
              </p>
              <p className="mt-1">
                All setting changes are logged for audit purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;
