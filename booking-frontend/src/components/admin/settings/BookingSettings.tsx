"use client";

import React, { useState } from "react";
import { Calendar, Save, Info, Clock, AlertTriangle } from "lucide-react";
import { PlatformSetting, updateSetting } from "@/services/settingsService";

interface BookingSettingsProps {
  settings: PlatformSetting[];
  onUpdate: (key: string, value: any) => void;
  onSaveSuccess: (message: string) => void;
  onSaveError: (error: string) => void;
}

const BookingSettings: React.FC<BookingSettingsProps> = ({
  settings,
  onUpdate,
  onSaveSuccess,
  onSaveError,
}) => {
  const [saving, setSaving] = useState(false);
  
  // Get booking settings
  const cancellationSetting = settings.find(s => s.key === "booking_cancellation_window");
  const currentWindow = cancellationSetting ? Number(cancellationSetting.value) : 24;
  
  const [cancellationWindow, setCancellationWindow] = useState(currentWindow);

  const handleWindowChange = (value: number) => {
    setCancellationWindow(value);
    onUpdate("booking_cancellation_window", value);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSetting("booking_cancellation_window", {
        value: cancellationWindow,
        description: `Hours before check-in when free cancellation ends (${cancellationWindow} hours)`,
      });
      onSaveSuccess(`Cancellation window updated to ${cancellationWindow} hours`);
    } catch (error: any) {
      onSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Calculate example scenarios
  const exampleCheckIns = [
    { hours: 6, label: "6 hours from now" },
    { hours: 12, label: "12 hours from now" },
    { hours: 24, label: "Tomorrow" },
    { hours: 48, label: "2 days from now" },
    { hours: 72, label: "3 days from now" },
  ];

  return (
    <div className="space-y-6">
      {/* Cancellation Window Setting */}
      <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
        <div className="flex items-center mb-4">
          <Clock className="h-6 w-6 text-orange-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Free Cancellation Window</h3>
            <p className="text-sm text-gray-600 mt-1">
              Hours before check-in when guests can cancel without penalty
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Window Input */}
          <div>
            <label htmlFor="cancellation-window" className="block text-sm font-medium text-gray-700 mb-2">
              Cancellation Window (Hours)
            </label>
            <div className="relative">
              <input
                type="number"
                id="cancellation-window"
                min="1"
                max="168"
                step="1"
                value={cancellationWindow}
                onChange={(e) => handleWindowChange(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg font-semibold"
                placeholder="24"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">hrs</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Window must be between 1 and 168 hours (7 days)
            </p>

            {/* Common Presets */}
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Quick Presets:</p>
              <div className="flex flex-wrap gap-2">
                {[6, 12, 24, 48, 72].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => handleWindowChange(hours)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      cancellationWindow === hours
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-orange-300 hover:text-orange-600'
                    }`}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || cancellationWindow === currentWindow}
              className="mt-4 w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
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

          {/* Example Scenarios */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-orange-600" />
              Cancellation Examples
            </h4>
            <p className="text-xs text-gray-500 mb-3">
              Current time: Now | Window: {cancellationWindow} hours
            </p>
            
            <div className="space-y-2">
              {exampleCheckIns.map(({ hours, label }) => (
                <div 
                  key={hours}
                  className={`flex justify-between items-center p-2 rounded text-sm ${
                    hours > cancellationWindow 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  <span>Check-in: {label}</span>
                  <span className={`font-medium ${
                    hours > cancellationWindow 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {hours > cancellationWindow ? '✓ Free cancel' : '✗ No refund'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Policy Impact */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Policy Impact Analysis</h3>
            <p className="text-sm text-gray-600 mt-1">
              How your cancellation window affects bookings and revenue
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stricter Policy (Lower Hours) */}
          <div className={`p-4 rounded-lg border-2 ${
            cancellationWindow <= 12 
              ? 'border-red-200 bg-red-50' 
              : 'border-gray-200 bg-white'
          }`}>
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="font-medium text-gray-900">Strict Policy (≤12h)</span>
            </div>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Higher revenue protection</li>
              <li>• Lower booking conversion</li>
              <li>• More customer complaints</li>
              <li>• Reduced flexibility</li>
            </ul>
          </div>

          {/* Balanced Policy (12-48 Hours) */}
          <div className={`p-4 rounded-lg border-2 ${
            cancellationWindow > 12 && cancellationWindow <= 48
              ? 'border-green-200 bg-green-50' 
              : 'border-gray-200 bg-white'
          }`}>
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="font-medium text-gray-900">Balanced (12-48h)</span>
            </div>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Good conversion rates</li>
              <li>• Reasonable revenue protection</li>
              <li>• Customer satisfaction</li>
              <li>• Industry standard</li>
            </ul>
          </div>

          {/* Flexible Policy (>48 Hours) */}
          <div className={`p-4 rounded-lg border-2 ${
            cancellationWindow > 48
              ? 'border-blue-200 bg-blue-50' 
              : 'border-gray-200 bg-white'
          }`}>
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="font-medium text-gray-900">Flexible (&gt;48h)</span>
            </div>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• High booking conversion</li>
              <li>• Excellent customer experience</li>
              <li>• Higher cancellation risk</li>
              <li>• Revenue uncertainty</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Setting Information */}
      {cancellationSetting && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Setting Information</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Current Value:</strong> {Number(cancellationSetting.value)} hours</p>
                <p><strong>Last Updated:</strong> {new Date(cancellationSetting.updatedAt).toLocaleDateString()}</p>
                <p><strong>Updated By:</strong> {cancellationSetting.updatedByUser.firstName} {cancellationSetting.updatedByUser.lastName}</p>
                {cancellationSetting.description && (
                  <p><strong>Description:</strong> {cancellationSetting.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Important Notes */}
      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-amber-600 mr-3 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-amber-800 mb-2">Important Notes</h4>
            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
              <li>Cancellation window applies to all new bookings immediately</li>
              <li>Existing bookings retain their original cancellation terms</li>
              <li>Changes may affect customer booking behavior and conversion rates</li>
              <li>Consider local market standards when setting cancellation policies</li>
              <li>Stricter policies may require more customer service support</li>
              <li>All policy changes are logged for compliance and audit purposes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSettings;