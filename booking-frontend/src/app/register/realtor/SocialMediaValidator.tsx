"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Plus,
  ExternalLink,
  Check,
  AlertTriangle,
  Globe,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui";

// Social media platform configurations
const SOCIAL_PLATFORMS = {
  website: {
    name: "Website",
    icon: Globe,
    placeholder: "https://yourcompany.com",
    pattern: /^https?:\/\/(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/,
    color: "#6B7280",
    required: false,
    validator: (url: string) => validateWebsiteUrl(url),
  },
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
  linkedin: {
    name: "LinkedIn",
    icon: () => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    placeholder: "https://linkedin.com/in/username",
    pattern:
      /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/[a-zA-Z0-9._-]+\/?$/,
    color: "#0077B5",
    required: false,
    validator: (url: string) => validateLinkedInUrl(url),
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
  youtube: {
    name: "YouTube",
    icon: () => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    placeholder: "https://youtube.com/@channel",
    pattern:
      /^https?:\/\/(www\.)?youtube\.com\/(channel\/|@|c\/)[a-zA-Z0-9_-]+\/?$/,
    color: "#FF0000",
    required: false,
    validator: (url: string) => validateYouTubeUrl(url),
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
  maxProfiles?: number;
  required?: string[];
  className?: string;
}

// URL validation functions
async function validateWebsiteUrl(url: string): Promise<ValidationResult> {
  if (!url) return { status: "idle" };

  const urlPattern = SOCIAL_PLATFORMS.website.pattern;
  if (!urlPattern.test(url)) {
    return {
      status: "invalid",
      message:
        "Please enter a valid website URL (e.g., https://yourcompany.com)",
      suggestions: ["https://www.yourcompany.com", "https://yourcompany.com"],
    };
  }

  try {
    // Simple URL accessibility check
    const domain = new URL(url).hostname;
    if (domain.includes("localhost") || domain.includes("127.0.0.1")) {
      return {
        status: "invalid",
        message: "Please enter a public website URL",
      };
    }

    return { status: "valid", message: "Website URL is valid" };
  } catch {
    return {
      status: "invalid",
      message: "Invalid URL format",
    };
  }
}

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

async function validateLinkedInUrl(url: string): Promise<ValidationResult> {
  if (!url) return { status: "idle" };

  const urlPattern = SOCIAL_PLATFORMS.linkedin.pattern;
  if (!urlPattern.test(url)) {
    return {
      status: "invalid",
      message: "Please enter a valid LinkedIn URL",
      suggestions: [
        "https://linkedin.com/in/yourname",
        "https://linkedin.com/company/yourcompany",
      ],
    };
  }

  return { status: "valid", message: "LinkedIn profile URL is valid" };
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

async function validateYouTubeUrl(url: string): Promise<ValidationResult> {
  if (!url) return { status: "idle" };

  const urlPattern = SOCIAL_PLATFORMS.youtube.pattern;
  if (!urlPattern.test(url)) {
    return {
      status: "invalid",
      message: "Please enter a valid YouTube URL",
      suggestions: [
        "https://youtube.com/@yourchannel",
        "https://youtube.com/channel/UCxxxxxxxxxx",
        "https://youtube.com/c/yourchannel",
      ],
    };
  }

  return { status: "valid", message: "YouTube channel URL is valid" };
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

export function SocialMediaValidator({
  profiles,
  onChange,
  onValidationChange,
  maxProfiles = 6,
  required = [],
  className = "",
}: SocialMediaValidatorProps) {
  const [socialProfiles, setSocialProfiles] = useState<SocialProfile[]>([]);
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);

  // Initialize social profiles from props
  useEffect(() => {
    const profileEntries = Object.entries(profiles || {}).map(
      ([platform, url]) => ({
        platform,
        url,
        validation: { status: "idle" as ValidationStatus },
      })
    );

    setSocialProfiles(profileEntries);

    // Calculate available platforms
    const usedPlatforms = Object.keys(profiles || {});
    const available = Object.keys(SOCIAL_PLATFORMS).filter(
      (platform) => !usedPlatforms.includes(platform)
    );
    setAvailablePlatforms(available);
  }, [profiles]);

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

  // Handle URL change with validation
  const handleUrlChange = async (platform: string, url: string) => {
    // Update profiles immediately
    const updatedProfiles = { ...profiles };
    if (url.trim()) {
      updatedProfiles[platform] = url;
    } else {
      delete updatedProfiles[platform];
    }
    onChange(updatedProfiles);

    // Update local state with validation status
    setSocialProfiles((prev) =>
      prev.map((profile) =>
        profile.platform === platform
          ? { ...profile, url, validation: { status: "validating" } }
          : profile
      )
    );

    // Perform validation
    if (url.trim()) {
      const validation = await validateProfile(platform, url);
      setSocialProfiles((prev) =>
        prev.map((profile) =>
          profile.platform === platform ? { ...profile, validation } : profile
        )
      );
    } else {
      setSocialProfiles((prev) =>
        prev.map((profile) =>
          profile.platform === platform
            ? { ...profile, validation: { status: "idle" } }
            : profile
        )
      );
    }
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

    // Update profiles
    const updatedProfiles = { ...profiles };
    delete updatedProfiles[platform];
    onChange(updatedProfiles);
  };

  // Validation change effect
  useEffect(() => {
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

  const getValidationIcon = (validation: ValidationResult) => {
    switch (validation.status) {
      case "validating":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case "valid":
        return <Check className="w-4 h-4 text-green-500" />;
      case "invalid":
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getValidationMessage = (validation: ValidationResult) => {
    if (validation.status === "invalid" || validation.status === "error") {
      return (
        <div className="mt-1">
          <p className="text-red-600 text-sm">{validation.message}</p>
          {validation.suggestions && validation.suggestions.length > 0 && (
            <div className="mt-1">
              <p className="text-xs text-gray-600">Suggestions:</p>
              <ul className="text-xs text-blue-600 ml-2">
                {validation.suggestions.map((suggestion, index) => (
                  <li key={index} className="truncate">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (validation.status === "valid" && validation.message) {
      return (
        <p className="text-green-600 text-sm mt-1">{validation.message}</p>
      );
    }

    return null;
  };

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
                    type="url"
                    value={profile.url}
                    onChange={(e) =>
                      handleUrlChange(profile.platform, e.target.value)
                    }
                    placeholder={platformConfig?.placeholder || "Enter URL"}
                    className={`pr-10 ${
                      profile.validation.status === "invalid" ||
                      profile.validation.status === "error"
                        ? "border-red-500"
                        : profile.validation.status === "valid"
                        ? "border-green-500"
                        : ""
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-1">
                    {getValidationIcon(profile.validation)}
                    {profile.url && profile.validation.status === "valid" && (
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

              {/* Validation Message */}
              {getValidationMessage(profile.validation)}
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
