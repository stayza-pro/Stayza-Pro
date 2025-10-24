"use client";

import React, { useState } from "react";
import { Percent, Save, Info, TrendingUp } from "lucide-react";
import {
  PlatformSetting,
  updateCommissionRate,
} from "@/services/settingsService";

interface CommissionSettingsProps {
  settings: PlatformSetting[];
  onUpdate: (key: string, value: any) => void;
  onSaveSuccess: (message: string) => void;
  onSaveError: (error: string) => void;
}

const CommissionSettings: React.FC<CommissionSettingsProps> = ({
  settings,
  onUpdate,
  onSaveSuccess,
  onSaveError,
}) => {
  const [saving, setSaving] = useState(false);

  // Get commission rate setting
  const commissionSetting = settings.find((s) => s.key === "commission_rate");
  const currentRate = commissionSetting
    ? Number(commissionSetting.value)
    : 0.07;
  const [commissionRate, setCommissionRate] = useState(currentRate);

  // Calculate preview values
  const previewBookingAmount = 50000; // ₦50,000 sample booking
  const commissionAmount = previewBookingAmount * commissionRate;
  const realtorAmount = previewBookingAmount - commissionAmount;

  const handleCommissionRateChange = (value: number) => {
    setCommissionRate(value);
    onUpdate("commission_rate", value);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateCommissionRate(commissionRate);
      onSaveSuccess(
        `Commission rate updated to ${(commissionRate * 100).toFixed(1)}%`
      );
    } catch (error: any) {
      onSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Commission Rate Setting */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center mb-4">
          <Percent className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Platform Commission Rate
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Percentage of each successful booking that goes to the platform
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rate Input */}
          <div>
            <label
              htmlFor="commission-rate"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Commission Rate (%)
            </label>
            <div className="relative">
              <input
                type="number"
                id="commission-rate"
                min="1"
                max="15"
                step="0.1"
                value={(commissionRate * 100).toFixed(1)}
                onChange={(e) =>
                  handleCommissionRateChange(Number(e.target.value) / 100)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
                placeholder="7.0"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                %
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Rate must be between 1% and 15%
            </p>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || commissionRate === currentRate}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>

          {/* Live Preview */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
              Live Preview
            </h4>
            <div className="text-xs text-gray-500 mb-3">
              Example booking: ₦{previewBookingAmount.toLocaleString()}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                <span className="text-sm text-gray-600">
                  Platform Commission ({(commissionRate * 100).toFixed(1)}%)
                </span>
                <span className="font-medium text-blue-600">
                  ₦{commissionAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                <span className="text-sm text-gray-600">Realtor Earnings</span>
                <span className="font-medium text-green-600">
                  ₦{realtorAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Rate History & Info */}
      {commissionSetting && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Setting Information
              </h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>
                  <strong>Current Value:</strong>{" "}
                  {(Number(commissionSetting.value) * 100).toFixed(1)}%
                </p>
                <p>
                  <strong>Last Updated:</strong>{" "}
                  {new Date(commissionSetting.updatedAt).toLocaleDateString()}
                </p>
                <p>
                  <strong>Updated By:</strong>{" "}
                  {commissionSetting.updatedByUser.firstName}{" "}
                  {commissionSetting.updatedByUser.lastName}
                </p>
                {commissionSetting.description && (
                  <p>
                    <strong>Description:</strong>{" "}
                    {commissionSetting.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Impact Information */}
      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-amber-600 mr-3 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-amber-800 mb-2">
              Important Notes
            </h4>
            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
              <li>
                Commission rate changes affect all new bookings immediately
              </li>
              <li>
                Existing active bookings maintain their original commission rate
              </li>
              <li>
                Lower rates increase realtor earnings but reduce platform
                revenue
              </li>
              <li>
                Higher rates may impact competitiveness with other platforms
              </li>
              <li>All changes are logged and auditable for compliance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommissionSettings;
