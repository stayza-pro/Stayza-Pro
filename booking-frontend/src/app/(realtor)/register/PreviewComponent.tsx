import React, { useMemo } from "react";
import { ExternalLink, Globe, Eye, User } from "lucide-react";
import { RealtorRegistrationFormData } from "./schema";

interface PreviewComponentProps {
  data: Partial<RealtorRegistrationFormData>;
  previewMode?: "guest" | "dashboard";
  logoPreview?: string | null;
  currency?: string;
  highlightRegion?: string | null;
  isLoading?: boolean;
}

/**
 * Clean static preview interface that encourages users to open their preview in a new tab
 */
const PreviewComponent: React.FC<PreviewComponentProps> = ({
  data,
  previewMode = "guest",
  logoPreview,
}) => {
  // Build brand data for preview URL
  const brand = useMemo(() => {
    const name = data.agencyName || data.fullName || "Your Agency";
    const tagline = data.tagline || "Premium short-let properties";
    const color =
      data.brandColor ||
      data.customPrimaryColor ||
      data.primaryColor ||
      "#3B82F6";
    const logo = logoPreview || undefined;
    return { name, tagline, color, logo };
  }, [data, logoPreview]);

  // Generate preview URL with brand data
  const previewUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (brand.name) params.set("name", brand.name);
    if (brand.tagline) params.set("tagline", brand.tagline);
    if (brand.color) params.set("color", brand.color);
    if (brand.logo) params.set("logo", brand.logo);
    return `/preview/temp?${params.toString()}`;
  }, [brand]);

  const subdomain = data.customSubdomain || "yourbrand";

  return (
    <div className="space-y-4">
      {/* Preview Header - Keep existing elements */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {subdomain}.stayza.pro
            </span>
          </div>
          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
            Live
          </span>
        </div>

        <button
          onClick={() => window.open(previewUrl, "_blank")}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open Preview</span>
        </button>
      </div>

      {/* Tab Selection - Keep existing tabs */}
      <div className="flex items-center space-x-1 bg-gray-100 rounded-xl p-1">
        <button
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            previewMode === "guest"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Eye className="w-4 h-4 mr-1.5" />
          Website
        </button>
        <button
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            previewMode === "dashboard"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <User className="w-4 h-4 mr-1.5" />
          Dashboard
        </button>
      </div>

      {/* Call-to-Action Container */}
      <div
        className="relative overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white p-12 text-center hover:border-gray-300 transition-colors"
        style={{
          background: `linear-gradient(135deg, ${brand.color}08, ${brand.color}02)`,
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-8 grid-rows-6 h-full w-full">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="border-r border-b border-gray-300" />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-6">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
            <Globe className="w-8 h-8" style={{ color: brand.color }} />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900">
              {previewMode === "guest"
                ? "Your Website is Ready!"
                : "Dashboard Preview Available"}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {previewMode === "guest"
                ? "Click below to see your fully customized booking website in action. All your branding and content is live!"
                : "Preview your realtor dashboard with booking management, analytics, and property controls."}
            </p>
          </div>

          {/* Preview Details */}
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Live Updates</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Responsive Design</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Full Features</span>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => window.open(previewUrl, "_blank")}
            className="inline-flex items-center space-x-3 px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 border-2"
            style={{ borderColor: brand.color }}
          >
            <ExternalLink className="w-5 h-5" />
            <span>View Full Preview</span>
            <div className="text-xs bg-gray-100 px-2 py-1 rounded">
              Opens in new tab
            </div>
          </button>

          {/* URL Display */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">Preview URL:</p>
            <code className="text-sm bg-white px-3 py-1 rounded border text-gray-700 font-mono">
              {subdomain}.stayza.pro
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewComponent;
