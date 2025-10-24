"use client";

import React, { useState } from "react";
import {
  CreditCard,
  Save,
  Info,
  DollarSign,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import {
  PlatformSetting,
  updatePayoutThreshold,
  toggleAutoPayout,
} from "@/services/settingsService";

interface PayoutSettingsProps {
  settings: PlatformSetting[];
  onUpdate: (key: string, value: any) => void;
  onSaveSuccess: (message: string) => void;
  onSaveError: (error: string) => void;
}

const PayoutSettings: React.FC<PayoutSettingsProps> = ({
  settings,
  onUpdate,
  onSaveSuccess,
  onSaveError,
}) => {
  const [saving, setSaving] = useState<string | null>(null);

  // Get payout settings
  const thresholdSetting = settings.find((s) => s.key === "payout_threshold");
  const autoPayoutSetting = settings.find(
    (s) => s.key === "auto_payout_enabled"
  );

  const currentThreshold = thresholdSetting
    ? Number(thresholdSetting.value)
    : 10000;
  const currentAutoPayout = autoPayoutSetting
    ? Boolean(autoPayoutSetting.value)
    : true;

  const [payoutThreshold, setPayoutThreshold] = useState(currentThreshold);
  const [autoPayoutEnabled, setAutoPayoutEnabled] = useState(currentAutoPayout);

  const handleThresholdChange = (value: number) => {
    setPayoutThreshold(value);
    onUpdate("payout_threshold", value);
  };

  const handleAutoPayoutToggle = (enabled: boolean) => {
    setAutoPayoutEnabled(enabled);
    onUpdate("auto_payout_enabled", enabled);
  };

  const handleSaveThreshold = async () => {
    try {
      setSaving("threshold");
      await updatePayoutThreshold(payoutThreshold);
      onSaveSuccess(
        `Payout threshold updated to ₦${payoutThreshold.toLocaleString()}`
      );
    } catch (error: any) {
      onSaveError(error.message);
    } finally {
      setSaving(null);
    }
  };

  const handleSaveAutoPayout = async () => {
    try {
      setSaving("autopayout");
      await toggleAutoPayout(autoPayoutEnabled);
      onSaveSuccess(
        `Auto payout ${autoPayoutEnabled ? "enabled" : "disabled"}`
      );
    } catch (error: any) {
      onSaveError(error.message);
    } finally {
      setSaving(null);
    }
  };

  // Calculate some example scenarios
  const exampleEarnings = [5000, 15000, 25000, 50000];

  return (
    <div className="space-y-6">
      {/* Payout Threshold Setting */}
      <div className="bg-green-50 rounded-lg p-6 border border-green-200">
        <div className="flex items-center mb-4">
          <DollarSign className="h-6 w-6 text-green-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Minimum Payout Threshold
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Minimum amount realtors must earn before requesting a payout
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Threshold Input */}
          <div>
            <label
              htmlFor="payout-threshold"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Threshold Amount (₦)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                ₦
              </span>
              <input
                type="number"
                id="payout-threshold"
                min="1000"
                max="100000"
                step="1000"
                value={payoutThreshold}
                onChange={(e) => handleThresholdChange(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-semibold"
                placeholder="10000"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Amount must be between ₦1,000 and ₦100,000
            </p>

            {/* Save Button */}
            <button
              onClick={handleSaveThreshold}
              disabled={
                saving === "threshold" || payoutThreshold === currentThreshold
              }
              className="mt-4 w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {saving === "threshold" ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Threshold
                </>
              )}
            </button>
          </div>

          {/* Example Scenarios */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <CreditCard className="h-4 w-4 mr-2 text-green-600" />
              Payout Eligibility Examples
            </h4>

            <div className="space-y-2">
              {exampleEarnings.map((amount) => (
                <div
                  key={amount}
                  className={`flex justify-between items-center p-2 rounded text-sm ${
                    amount >= payoutThreshold
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-50 text-gray-500"
                  }`}
                >
                  <span>₦{amount.toLocaleString()} earnings</span>
                  <span
                    className={`font-medium ${
                      amount >= payoutThreshold
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {amount >= payoutThreshold
                      ? "✓ Eligible"
                      : "✗ Not eligible"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Auto Payout Setting */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <CreditCard className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Automatic Payout Processing
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Automatically process payouts when realtors reach the threshold
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={() => handleAutoPayoutToggle(!autoPayoutEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              autoPayoutEnabled ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                autoPayoutEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div
              className={`p-4 rounded-lg border-2 ${
                autoPayoutEnabled
                  ? "border-green-200 bg-green-50"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <div className="flex items-center mb-2">
                {autoPayoutEnabled ? (
                  <>
                    <ToggleRight className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-800">
                      Auto Payout Enabled
                    </span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-5 w-5 text-amber-600 mr-2" />
                    <span className="font-medium text-amber-800">
                      Auto Payout Disabled
                    </span>
                  </>
                )}
              </div>
              <p
                className={`text-sm ${
                  autoPayoutEnabled ? "text-green-700" : "text-amber-700"
                }`}
              >
                {autoPayoutEnabled
                  ? "Payouts are processed automatically when realtors reach the threshold amount."
                  : "Payouts must be manually processed by administrators after review."}
              </p>
            </div>

            <button
              onClick={handleSaveAutoPayout}
              disabled={
                saving === "autopayout" ||
                autoPayoutEnabled === currentAutoPayout
              }
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {saving === "autopayout" ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Auto Payout
                </>
              )}
            </button>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Processing Impact
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                <div>
                  <p className="font-medium text-gray-700">
                    Automatic Processing
                  </p>
                  <p className="text-gray-600">
                    Faster payments, less admin overhead
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 mr-3"></div>
                <div>
                  <p className="font-medium text-gray-700">Manual Processing</p>
                  <p className="text-gray-600">
                    More control, review before payout
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Threshold Setting Info */}
        {thresholdSetting && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Threshold Information
                </h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>
                    <strong>Current Value:</strong> ₦
                    {Number(thresholdSetting.value).toLocaleString()}
                  </p>
                  <p>
                    <strong>Last Updated:</strong>{" "}
                    {new Date(thresholdSetting.updatedAt).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Updated By:</strong>{" "}
                    {thresholdSetting.updatedByUser.firstName}{" "}
                    {thresholdSetting.updatedByUser.lastName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Auto Payout Setting Info */}
        {autoPayoutSetting && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Auto Payout Information
                </h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>
                    <strong>Current Value:</strong>{" "}
                    {autoPayoutSetting.value ? "Enabled" : "Disabled"}
                  </p>
                  <p>
                    <strong>Last Updated:</strong>{" "}
                    {new Date(autoPayoutSetting.updatedAt).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Updated By:</strong>{" "}
                    {autoPayoutSetting.updatedByUser.firstName}{" "}
                    {autoPayoutSetting.updatedByUser.lastName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Important Notes */}
      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-amber-600 mr-3 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-amber-800 mb-2">
              Important Notes
            </h4>
            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
              <li>
                Payout threshold changes affect all future payout requests
              </li>
              <li>
                Existing pending payouts are not affected by threshold changes
              </li>
              <li>
                Auto payout requires sufficient platform balance to process
                payments
              </li>
              <li>
                Manual processing allows for fraud review and compliance checks
              </li>
              <li>All payout changes are logged and auditable</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayoutSettings;
