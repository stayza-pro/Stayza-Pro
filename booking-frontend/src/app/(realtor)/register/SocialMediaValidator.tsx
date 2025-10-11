"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { X, Plus, ExternalLink, Globe } from "lucide-react";
import { Input } from "@/components/ui";

// Social media platform configurations
const SOCIAL_PLATFORMS = {
  instagram: {
    name: "Instagram",
    icon: () => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    placeholder: "https://instagram.com/username",
    pattern: /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._-]+\/?$/,
    color: "#E4405F",
    required: false,
    validator: (url: string) => validateInstagramUrl(url),
  },
  facebook: {
    name: "Facebook",
    icon: () => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    placeholder: "https://facebook.com/page",
    pattern: /^https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9._-]+\/?$/,
    color: "#1877F2",
    required: false,
    validator: (url: string) => validateFacebookUrl(url),
  },

  twitter: {
    name: "Twitter/X",
    icon: () => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    placeholder: "https://twitter.com/username",
    pattern: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?$/,
    color: "#000000",
    required: false,
    validator: (url: string) => validateTwitterUrl(url),
  },

  tiktok: {
    name: "TikTok",
    icon: () => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
    placeholder: "https://tiktok.com/@username",
    pattern: /^https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9._-]+\/?$/,
    color: "#000000",
    required: false,
    validator: (url: string) => validateTikTokUrl(url),
  },
  whatsapp: {
    name: "WhatsApp",
    icon: () => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.570-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.58-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
      </svg>
    ),
    placeholder: "Enter WhatsApp number (e.g. +1234567890)",
    pattern: /^\+[1-9]\d{1,14}$/,
    color: "#25D366",
    required: false,
    validator: (url: string) => validateWhatsAppNumber(url),
    accountType: true, // Flag to show account type selector
  },
};

type ValidationStatus = "idle" | "validating" | "valid" | "invalid" | "error";

interface ValidationResult {
  status: ValidationStatus;
  message?: string;
  suggestions?: string[];
}

interface SocialProfile {
  platform: string;
  url: string;
  validation: ValidationResult;
}

interface SocialMediaValidatorProps {
  profiles: Record<string, string>;
  onChange: (profiles: Record<string, string>) => void;
  onValidationChange?: (
    isValid: boolean,
    errors: Record<string, string>
  ) => void;
  whatsappType?: "personal" | "business";
  onWhatsappTypeChange?: (type: "personal" | "business") => void;
  maxProfiles?: number;
  required?: string[];
  className?: string;
}

// URL validation functions

async function validateInstagramUrl(url: string): Promise<ValidationResult> {
  if (!url) return { status: "idle" };

  const urlPattern = SOCIAL_PLATFORMS.instagram.pattern;
  if (!urlPattern.test(url)) {
    return {
      status: "invalid",
      message: "Please enter a valid Instagram URL",
      suggestions: [
        "https://instagram.com/yourusername",
        "https://www.instagram.com/yourusername",
      ],
    };
  }

  try {
    const match = url.match(/instagram\.com\/([a-zA-Z0-9._-]+)/);
    const username = match?.[1];

    if (username && username.length < 2) {
      return {
        status: "invalid",
        message: "Instagram username must be at least 2 characters long",
      };
    }

    if (username && username.length > 30) {
      return {
        status: "invalid",
        message: "Instagram username must be less than 30 characters",
      };
    }

    return { status: "valid", message: "Instagram profile URL is valid" };
  } catch {
    return {
      status: "invalid",
      message: "Invalid Instagram URL format",
    };
  }
}

async function validateFacebookUrl(url: string): Promise<ValidationResult> {
  if (!url) return { status: "idle" };

  const urlPattern = SOCIAL_PLATFORMS.facebook.pattern;
  if (!urlPattern.test(url)) {
    return {
      status: "invalid",
      message: "Please enter a valid Facebook URL",
      suggestions: [
        "https://facebook.com/yourpage",
        "https://www.facebook.com/yourpage",
      ],
    };
  }

  return { status: "valid", message: "Facebook page URL is valid" };
}

async function validateTwitterUrl(url: string): Promise<ValidationResult> {
  if (!url) return { status: "idle" };

  const urlPattern = SOCIAL_PLATFORMS.twitter.pattern;
  if (!urlPattern.test(url)) {
    return {
      status: "invalid",
      message: "Please enter a valid Twitter/X URL",
      suggestions: [
        "https://twitter.com/yourusername",
        "https://x.com/yourusername",
      ],
    };
  }

  try {
    const match = url.match(/(twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/);
    const username = match?.[2];

    if (username && username.length > 15) {
      return {
        status: "invalid",
        message: "Twitter username must be 15 characters or less",
      };
    }

    return { status: "valid", message: "Twitter/X profile URL is valid" };
  } catch {
    return {
      status: "invalid",
      message: "Invalid Twitter/X URL format",
    };
  }
}

async function validateTikTokUrl(url: string): Promise<ValidationResult> {
  if (!url) return { status: "idle" };

  const urlPattern = SOCIAL_PLATFORMS.tiktok.pattern;
  if (!urlPattern.test(url)) {
    return {
      status: "invalid",
      message: "Please enter a valid TikTok URL",
      suggestions: [
        "https://tiktok.com/@yourusername",
        "https://www.tiktok.com/@yourusername",
      ],
    };
  }

  return { status: "valid", message: "TikTok profile URL is valid" };
}

async function validateWhatsAppNumber(
  number: string
): Promise<ValidationResult> {
  if (!number) return { status: "idle" };

  const numberPattern = SOCIAL_PLATFORMS.whatsapp.pattern;
  if (!numberPattern.test(number)) {
    return {
      status: "invalid",
      message: "Please enter a valid WhatsApp number with country code",
      suggestions: [
        "+1234567890 (US format)",
        "+44123456789 (UK format)",
        "+234123456789 (Nigeria format)",
      ],
    };
  }

  return { status: "valid", message: "WhatsApp number is valid" };
}

export function SocialMediaValidator({
  profiles,
  onChange,
  onValidationChange,
  whatsappType = "personal",
  onWhatsappTypeChange,
  maxProfiles = 6,
  required = [],
  className = "",
}: SocialMediaValidatorProps) {
  const [socialProfiles, setSocialProfiles] = useState<SocialProfile[]>([]);
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);

  // Memoize profiles to prevent unnecessary re-renders
  const stableProfiles = useMemo(
    () => profiles || {},
    [JSON.stringify(profiles || {})]
  );

  // Initialize social profiles from props - only when profiles actually change
  useEffect(() => {
    const profileEntries = Object.entries(stableProfiles).map(
      ([platform, url]) => ({
        platform,
        url,
        validation: { status: "idle" as ValidationStatus },
      })
    );

    setSocialProfiles(profileEntries);

    // Calculate available platforms
    const usedPlatforms = Object.keys(stableProfiles);
    const available = Object.keys(SOCIAL_PLATFORMS).filter(
      (platform) => !usedPlatforms.includes(platform)
    );
    setAvailablePlatforms(available);
  }, [stableProfiles]);

  // Validation function with debouncing
  const validateProfile = useCallback(async (platform: string, url: string) => {
    if (!url.trim()) {
      return { status: "idle" as ValidationStatus };
    }

    const platformConfig =
      SOCIAL_PLATFORMS[platform as keyof typeof SOCIAL_PLATFORMS];
    if (!platformConfig) {
      return {
        status: "error" as ValidationStatus,
        message: "Unknown platform",
      };
    }

    return await platformConfig.validator(url);
  }, []);

  // Handle URL change without automatic validation
  const handleUrlChange = (platform: string, url: string) => {
    // Update profiles immediately
    const updatedProfiles = { ...profiles };
    if (url.trim()) {
      updatedProfiles[platform] = url;
    } else {
      delete updatedProfiles[platform];
    }
    onChange(updatedProfiles);

    // Update local state - no validation, just update the URL
    setSocialProfiles((prev) =>
      prev.map((profile) =>
        profile.platform === platform
          ? { ...profile, url, validation: { status: "idle" } }
          : profile
      )
    );
  };

  // Add new social platform
  const addPlatform = (platform: string) => {
    if (socialProfiles.length >= maxProfiles) return;

    const newProfile = {
      platform,
      url: "",
      validation: { status: "idle" as ValidationStatus },
    };

    setSocialProfiles((prev) => [...prev, newProfile]);
    setAvailablePlatforms((prev) => prev.filter((p) => p !== platform));

    // Update profiles
    const updatedProfiles = { ...profiles, [platform]: "" };
    onChange(updatedProfiles);
  };

  // Remove social platform
  const removePlatform = (platform: string) => {
    setSocialProfiles((prev) => prev.filter((p) => p.platform !== platform));
    setAvailablePlatforms((prev) => [...prev, platform].sort());

    // Update profiles by removing the platform
    const updatedProfiles = { ...profiles };
    delete updatedProfiles[platform];
    onChange(updatedProfiles);
  };

  // Initialize validation state as valid since we're not doing validation
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(true, {}); // Always valid, no errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Manual validation function - only called when needed (kept for future use)
  const validateAllProfiles = useCallback(() => {
    if (onValidationChange) {
      const errors: Record<string, string> = {};
      let hasErrors = false;

      socialProfiles.forEach((profile) => {
        if (profile.validation.status === "invalid") {
          errors[profile.platform] =
            profile.validation.message || "Invalid URL";
          hasErrors = true;
        }

        // Check required platforms
        if (required.includes(profile.platform) && !profile.url.trim()) {
          errors[profile.platform] = `${
            SOCIAL_PLATFORMS[profile.platform as keyof typeof SOCIAL_PLATFORMS]
              ?.name || profile.platform
          } is required`;
          hasErrors = true;
        }
      });

      onValidationChange(!hasErrors, errors);
    }
  }, [socialProfiles, required, onValidationChange]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Social Media Profiles
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Add your social media profiles to showcase your online presence
          </p>
        </div>
        {availablePlatforms.length > 0 &&
          socialProfiles.length < maxProfiles && (
            <div className="relative">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addPlatform(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue=""
              >
                <option value="" disabled>
                  Add Platform
                </option>
                {availablePlatforms.map((platform) => {
                  const config =
                    SOCIAL_PLATFORMS[platform as keyof typeof SOCIAL_PLATFORMS];
                  return (
                    <option key={platform} value={platform}>
                      {config.name}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
      </div>

      <div className="space-y-3">
        {socialProfiles.map((profile) => {
          const platformConfig =
            SOCIAL_PLATFORMS[profile.platform as keyof typeof SOCIAL_PLATFORMS];
          const IconComponent = platformConfig?.icon;
          const isRequired = required.includes(profile.platform);

          return (
            <div key={profile.platform} className="space-y-2">
              <div className="flex items-center space-x-3">
                {/* Platform Icon & Name */}
                <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                    style={{
                      backgroundColor: platformConfig?.color || "#6B7280",
                    }}
                  >
                    {IconComponent && <IconComponent />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {platformConfig?.name || profile.platform}
                      {isRequired && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* URL Input */}
                <div className="flex-1 relative">
                  <Input
                    type={profile.platform === "whatsapp" ? "tel" : "url"}
                    value={profile.url}
                    onChange={(e) =>
                      handleUrlChange(profile.platform, e.target.value)
                    }
                    placeholder={platformConfig?.placeholder || "Enter URL"}
                    className="pr-10"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-1">
                    {profile.url && profile.platform !== "whatsapp" && (
                      <a
                        href={profile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removePlatform(profile.platform)}
                  className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                  disabled={isRequired}
                  title={
                    isRequired ? "This platform is required" : "Remove platform"
                  }
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* WhatsApp Account Type Selection */}
              {profile.platform === "whatsapp" && profile.url && (
                <div className="mt-2 ml-10">
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    Account Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="whatsappType"
                        value="personal"
                        checked={whatsappType === "personal"}
                        onChange={(e) =>
                          onWhatsappTypeChange?.(
                            e.target.value as "personal" | "business"
                          )
                        }
                        className="mr-2 text-green-600"
                      />
                      <span className="text-sm text-gray-600">Personal</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="whatsappType"
                        value="business"
                        checked={whatsappType === "business"}
                        onChange={(e) =>
                          onWhatsappTypeChange?.(
                            e.target.value as "personal" | "business"
                          )
                        }
                        className="mr-2 text-green-600"
                      />
                      <span className="text-sm text-gray-600">Business</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {socialProfiles.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-sm">No social media profiles added yet</p>
          <p className="text-xs mt-1">
            Click "Add Platform" to showcase your online presence
          </p>
        </div>
      )}

      {socialProfiles.length >= maxProfiles && (
        <div className="text-center py-2">
          <p className="text-sm text-gray-500">
            Maximum {maxProfiles} platforms allowed
          </p>
        </div>
      )}
    </div>
  );
}
