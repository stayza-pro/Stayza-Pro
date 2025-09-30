import React, { useState, ChangeEvent } from "react";
import { Button, Input, TextArea } from "@/components/ui";
import { Palette, Upload, Eye, X } from "lucide-react";
import { OnboardingData } from "@/app/onboarding/page";
import Image from "next/image";

interface BrandingStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#F97316", // Orange
  "#6366F1", // Indigo
];

export const BrandingStep: React.FC<BrandingStepProps> = ({
  data,
  onUpdate,
  onNext,
  onBack,
  isSubmitting,
}) => {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof OnboardingData, value: string) => {
    onUpdate({ [field]: value });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleColorSelect = (color: string) => {
    handleChange("primaryColor", color);
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          logo: "Logo file must be less than 5MB",
        }));
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, logo: "Logo must be an image file" }));
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setLogoPreview(result);
        onUpdate({ logo: file });
      };
      reader.readAsDataURL(file);

      // Clear any previous errors
      if (errors.logo) {
        setErrors((prev) => ({ ...prev, logo: "" }));
      }
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    onUpdate({ logo: undefined });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!data.businessName.trim()) {
      newErrors.businessName = "Business name is required for branding preview";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Palette className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">
          Brand Your Booking Site
        </h2>
        <p className="text-gray-600 mt-2">
          Customize the look and feel of your booking site to match your brand
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Branding Settings */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Branding Settings
            </h3>

            {/* Logo Upload */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Business Logo
              </label>

              {logoPreview ? (
                <div className="relative w-32 h-20 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    fill
                    className="object-contain"
                  />
                  <button
                    onClick={removeLogo}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">Upload Logo</span>
                </div>
              )}

              {errors.logo && (
                <p className="text-sm text-red-600">{errors.logo}</p>
              )}
              <p className="text-xs text-gray-500">
                PNG, JPG or SVG. Max file size 5MB.
              </p>
            </div>

            {/* Primary Color */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Primary Color
              </label>

              <div className="grid grid-cols-5 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      data.primaryColor === color
                        ? "border-gray-400 scale-110"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <Input
                label="Custom Color"
                value={data.primaryColor}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleChange("primaryColor", e.target.value)
                }
                placeholder="#3B82F6"
              />
            </div>

            {/* Custom Domain */}
            <Input
              label="Custom Subdomain"
              value={data.customDomain}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange("customDomain", e.target.value)
              }
              placeholder="your-business"
              helperText="Your booking site will be available at: your-business.stayza.com"
            />

            {/* Custom Message */}
            <TextArea
              label="Welcome Message"
              value={data.customMessage}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                handleChange("customMessage", e.target.value)
              }
              placeholder="Welcome to our booking platform! We're excited to help you find your perfect stay..."
              rows={3}
              helperText="This message will appear on your booking site's homepage"
            />
          </div>
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
          </div>

          <div className="border rounded-lg overflow-hidden shadow-sm">
            {/* Header Preview */}
            <div
              className="px-6 py-4 text-white"
              style={{ backgroundColor: data.primaryColor || "#3B82F6" }}
            >
              <div className="flex items-center gap-3">
                {logoPreview ? (
                  <div className="w-8 h-8 bg-white rounded overflow-hidden">
                    <Image
                      src={logoPreview}
                      alt="Logo"
                      width={32}
                      height={32}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded flex items-center justify-center">
                    <span className="text-sm font-bold">
                      {data.businessName.charAt(0) || "B"}
                    </span>
                  </div>
                )}
                <h4 className="font-semibold">
                  {data.businessName || "Your Business"}
                </h4>
              </div>
            </div>

            {/* Content Preview */}
            <div className="p-6 bg-white">
              <h5 className="text-lg font-semibold text-gray-900 mb-2">
                Book Your Stay
              </h5>
              <p className="text-gray-600 text-sm mb-4">
                {data.customMessage ||
                  "Welcome to our booking platform! Find and book your perfect property."}
              </p>

              {/* Mock booking form */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 border rounded text-xs text-gray-500">
                    Check-in Date
                  </div>
                  <div className="p-2 border rounded text-xs text-gray-500">
                    Check-out Date
                  </div>
                </div>
                <button
                  className="w-full py-2 px-4 text-white rounded text-sm font-medium"
                  style={{ backgroundColor: data.primaryColor || "#3B82F6" }}
                >
                  Search Properties
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center">
            This is how your booking site will look to customers
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <Button onClick={onBack} variant="outline" disabled={isSubmitting}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={isSubmitting} className="px-8">
          Continue
        </Button>
      </div>
    </div>
  );
};
