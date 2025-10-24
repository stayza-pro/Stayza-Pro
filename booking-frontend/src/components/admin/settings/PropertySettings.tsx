"use client";

import React, { useState } from "react";
import { Home, Save, Info, Image, Grid } from "lucide-react";
import { PlatformSetting, updateSetting } from "@/services/settingsService";

interface PropertySettingsProps {
  settings: PlatformSetting[];
  onUpdate: (key: string, value: any) => void;
  onSaveSuccess: (message: string) => void;
  onSaveError: (error: string) => void;
}

const PropertySettings: React.FC<PropertySettingsProps> = ({
  settings,
  onUpdate,
  onSaveSuccess,
  onSaveError,
}) => {
  const [saving, setSaving] = useState(false);

  // Get property settings
  const maxImagesSetting = settings.find(
    (s) => s.key === "max_property_images"
  );
  const currentMaxImages = maxImagesSetting
    ? Number(maxImagesSetting.value)
    : 10;

  const [maxImages, setMaxImages] = useState(currentMaxImages);

  const handleMaxImagesChange = (value: number) => {
    setMaxImages(value);
    onUpdate("max_property_images", value);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSetting("max_property_images", {
        value: maxImages,
        description: `Maximum number of images allowed per property listing (${maxImages} images)`,
      });
      onSaveSuccess(`Maximum property images updated to ${maxImages}`);
    } catch (error: any) {
      onSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };

  // Calculate storage impact
  const avgImageSize = 2; // MB per image
  const storagePerProperty = maxImages * avgImageSize;
  const storageFor100Properties = storagePerProperty * 100;

  return (
    <div className="space-y-6">
      {/* Max Images Setting */}
      <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
        <div className="flex items-center mb-4">
          <Image className="h-6 w-6 text-purple-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Maximum Property Images
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Maximum number of images realtors can upload per property
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Images Input */}
          <div>
            <label
              htmlFor="max-images"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Maximum Images per Property
            </label>
            <div className="relative">
              <input
                type="number"
                id="max-images"
                min="1"
                max="50"
                step="1"
                value={maxImages}
                onChange={(e) => handleMaxImagesChange(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg font-semibold"
                placeholder="10"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                images
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Limit must be between 1 and 50 images
            </p>

            {/* Common Presets */}
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Quick Presets:
              </p>
              <div className="flex flex-wrap gap-2">
                {[5, 10, 15, 20, 25].map((count) => (
                  <button
                    key={count}
                    onClick={() => handleMaxImagesChange(count)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      maxImages === count
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white text-gray-600 border-gray-300 hover:border-purple-300 hover:text-purple-600"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || maxImages === currentMaxImages}
              className="mt-4 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
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

          {/* Storage Impact */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Grid className="h-4 w-4 mr-2 text-purple-600" />
              Storage Impact
            </h4>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                <span className="text-gray-600">Per Property</span>
                <span className="font-medium text-purple-600">
                  ~{storagePerProperty} MB
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                <span className="text-gray-600">100 Properties</span>
                <span className="font-medium text-blue-600">
                  ~{storageFor100Properties} MB
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                <span className="text-gray-600">1000 Properties</span>
                <span className="font-medium text-green-600">
                  ~{((storageFor100Properties * 10) / 1000).toFixed(1)} GB
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              *Estimates based on 2MB average per image
            </p>
          </div>
        </div>
      </div>

      {/* Image Limit Impact */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center mb-4">
          <Home className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Impact on Property Listings
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              How image limits affect property presentation and user experience
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Low Limit */}
          <div
            className={`p-4 rounded-lg border-2 ${
              maxImages <= 5
                ? "border-orange-200 bg-orange-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              <span className="font-medium text-gray-900">Low Limit (≤5)</span>
            </div>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Minimal storage costs</li>
              <li>• Fast page loading</li>
              <li>• Limited property showcase</li>
              <li>• May reduce bookings</li>
              <li>• Quick uploads</li>
            </ul>
          </div>

          {/* Medium Limit */}
          <div
            className={`p-4 rounded-lg border-2 ${
              maxImages > 5 && maxImages <= 15
                ? "border-green-200 bg-green-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="font-medium text-gray-900">Balanced (6-15)</span>
            </div>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Good property showcase</li>
              <li>• Reasonable storage costs</li>
              <li>• Adequate detail coverage</li>
              <li>• Good user experience</li>
              <li>• Industry standard</li>
            </ul>
          </div>

          {/* High Limit */}
          <div
            className={`p-4 rounded-lg border-2 ${
              maxImages > 15
                ? "border-purple-200 bg-purple-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              <span className="font-medium text-gray-900">
                High Limit ({">"}15)
              </span>
            </div>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Comprehensive showcase</li>
              <li>• Higher storage costs</li>
              <li>• Slower page loading</li>
              <li>• Premium experience</li>
              <li>• Detailed property view</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Performance Considerations */}
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800 mb-2">
              Performance Considerations
            </h4>
            <div className="text-xs text-yellow-700 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium mb-1">Current Setting Impact:</p>
                  <ul className="space-y-1">
                    <li>
                      • {maxImages} images × 2MB ≈ {storagePerProperty}MB per
                      property
                    </li>
                    <li>
                      • Page load time:{" "}
                      {maxImages <= 5
                        ? "Fast"
                        : maxImages <= 15
                        ? "Medium"
                        : "Slower"}
                    </li>
                    <li>
                      • Mobile experience:{" "}
                      {maxImages <= 10 ? "Optimal" : "May lag"}
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-1">Recommendations:</p>
                  <ul className="space-y-1">
                    <li>• Consider image compression at upload</li>
                    <li>• Implement lazy loading for galleries</li>
                    <li>• Monitor CDN costs with higher limits</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Setting Information */}
      {maxImagesSetting && (
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
                  {Number(maxImagesSetting.value)} images
                </p>
                <p>
                  <strong>Last Updated:</strong>{" "}
                  {new Date(maxImagesSetting.updatedAt).toLocaleDateString()}
                </p>
                <p>
                  <strong>Updated By:</strong>{" "}
                  {maxImagesSetting.updatedByUser.firstName}{" "}
                  {maxImagesSetting.updatedByUser.lastName}
                </p>
                {maxImagesSetting.description && (
                  <p>
                    <strong>Description:</strong> {maxImagesSetting.description}
                  </p>
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
            <h4 className="text-sm font-medium text-amber-800 mb-2">
              Important Notes
            </h4>
            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
              <li>Image limit changes apply to all new property uploads</li>
              <li>
                Existing properties with more images than the new limit remain
                unchanged
              </li>
              <li>
                Consider storage costs and CDN bandwidth when setting higher
                limits
              </li>
              <li>
                Higher limits improve property showcase but may affect page
                performance
              </li>
              <li>
                Mobile users may experience slower loading with many images
              </li>
              <li>
                All limit changes are logged for audit and performance
                monitoring
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertySettings;
