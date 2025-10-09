"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  ExternalLink,
  AlertCircle,
  Loader2,
  Eye,
  Users,
  TrendingUp,
  Star,
  Globe,
  Zap,
} from "lucide-react";

// Social media platform configurations
const PLATFORMS = {
  linkedin: {
    name: "LinkedIn",
    icon: "💼",
    color: "bg-blue-600",
    urlPattern:
      /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/[a-zA-Z0-9-_]+\/?$/,
    placeholder: "https://linkedin.com/in/yourname",
    recommended: true,
    businessValue: "high",
    description: "Professional networking - essential for realtors",
  },
  facebook: {
    name: "Facebook",
    icon: "📘",
    color: "bg-blue-500",
    urlPattern: /^https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9.-]+\/?$/,
    placeholder: "https://facebook.com/yourpage",
    recommended: true,
    businessValue: "high",
    description: "Great for local community engagement",
  },
  instagram: {
    name: "Instagram",
    icon: "📸",
    color: "bg-pink-500",
    urlPattern: /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?$/,
    placeholder: "https://instagram.com/yourusername",
    recommended: true,
    businessValue: "high",
    description: "Visual content for property showcases",
  },
  twitter: {
    name: "Twitter/X",
    icon: "🐦",
    color: "bg-gray-900",
    urlPattern: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?$/,
    placeholder: "https://twitter.com/yourusername",
    recommended: false,
    businessValue: "medium",
    description: "News and industry updates",
  },
  youtube: {
    name: "YouTube",
    icon: "📺",
    color: "bg-red-600",
    urlPattern:
      /^https?:\/\/(www\.)?youtube\.com\/(channel\/|c\/|user\/|@)[a-zA-Z0-9_-]+\/?$/,
    placeholder: "https://youtube.com/@yourchannel",
    recommended: false,
    businessValue: "high",
    description: "Video content and virtual tours",
  },
  tiktok: {
    name: "TikTok",
    icon: "🎵",
    color: "bg-black",
    urlPattern: /^https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9._]+\/?$/,
    placeholder: "https://tiktok.com/@yourusername",
    recommended: false,
    businessValue: "medium",
    description: "Short-form video content",
  },
  pinterest: {
    name: "Pinterest",
    icon: "📌",
    color: "bg-red-500",
    urlPattern: /^https?:\/\/(www\.)?pinterest\.com\/[a-zA-Z0-9_]+\/?$/,
    placeholder: "https://pinterest.com/yourusername",
    recommended: false,
    businessValue: "medium",
    description: "Home design and inspiration boards",
  },
};

interface SocialMediaValidatorProps {
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  maxPlatforms?: number;
  showRecommendations?: boolean;
  autoValidate?: boolean;
  className?: string;
}

interface ValidationResult {
  isValid: boolean;
  platform?: keyof typeof PLATFORMS;
  error?: string;
  suggestion?: string;
  profileData?: {
    exists: boolean;
    isPublic: boolean;
    followerCount?: number;
    isVerified?: boolean;
  };
}

export const SocialMediaValidator: React.FC<SocialMediaValidatorProps> = ({
  value,
  onChange,
  maxPlatforms = 5,
  showRecommendations = true,
  autoValidate = true,
  className = "",
}) => {
  const [activePlatforms, setActivePlatforms] = useState<Set<string>>(
    new Set()
  );
  const [validationResults, setValidationResults] = useState<
    Record<string, ValidationResult>
  >({});
  const [validatingUrls, setValidatingUrls] = useState<Set<string>>(new Set());
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);

  // Initialize active platforms from existing values
  useEffect(() => {
    const platforms = new Set(Object.keys(value).filter((key) => value[key]));
    setActivePlatforms(platforms);
  }, []);

  // Validate a single URL
  const validateUrl = useCallback(
    async (url: string, platformKey?: string): Promise<ValidationResult> => {
      if (!url.trim()) {
        return { isValid: false, error: "URL is required" };
      }

      // Detect platform if not provided
      let detectedPlatform: keyof typeof PLATFORMS | undefined =
        platformKey as keyof typeof PLATFORMS;

      if (!detectedPlatform) {
        for (const [key, platform] of Object.entries(PLATFORMS)) {
          if (platform.urlPattern.test(url)) {
            detectedPlatform = key as keyof typeof PLATFORMS;
            break;
          }
        }
      }

      if (!detectedPlatform) {
        return {
          isValid: false,
          error: "Unsupported platform",
          suggestion: "Please use a supported social media platform URL",
        };
      }

      const platform = PLATFORMS[detectedPlatform];

      // Validate URL format
      if (!platform.urlPattern.test(url)) {
        return {
          isValid: false,
          platform: detectedPlatform,
          error: "Invalid URL format",
          suggestion: `Use format: ${platform.placeholder}`,
        };
      }

      // Basic validation passed
      let result: ValidationResult = {
        isValid: true,
        platform: detectedPlatform,
      };

      // Enhanced validation (simulated - in production, you'd make API calls)
      if (autoValidate) {
        try {
          // Simulate API call delay
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 + Math.random() * 1000)
          );

          // Simulate different outcomes
          const outcomes = [
            {
              exists: true,
              isPublic: true,
              followerCount: Math.floor(Math.random() * 10000),
            },
            { exists: true, isPublic: false },
            { exists: false, isPublic: false }, // Ensure isPublic is always present
          ];

          const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

          result.profileData = {
            ...outcome,
            isVerified: Math.random() > 0.8, // 20% chance of being verified
          };

          if (!outcome.exists) {
            result.error = "Profile not found";
            result.suggestion =
              "Double-check the URL or make sure the profile is public";
          } else if (!outcome.isPublic) {
            result.error = "Profile is private";
            result.suggestion =
              "Make your profile public for better client engagement";
          }
        } catch (error) {
          result.error = "Unable to verify profile";
          result.suggestion =
            "The URL format is correct, but we couldn't verify the profile";
        }
      }

      return result;
    },
    [autoValidate]
  );

  // Validate URL with debouncing
  const validateUrlDebounced = useCallback(
    (url: string, platformKey: string, delay = 1500) => {
      const timer = setTimeout(async () => {
        if (!url.trim()) {
          setValidationResults((prev) => ({
            ...prev,
            [platformKey]: { isValid: false },
          }));
          return;
        }

        setValidatingUrls((prev) => new Set([...prev, platformKey]));

        try {
          const result = await validateUrl(url, platformKey);
          setValidationResults((prev) => ({ ...prev, [platformKey]: result }));
        } finally {
          setValidatingUrls((prev) => {
            const newSet = new Set(prev);
            newSet.delete(platformKey);
            return newSet;
          });
        }
      }, delay);

      return () => clearTimeout(timer);
    },
    [validateUrl]
  );

  // Handle URL change
  const handleUrlChange = (platformKey: string, url: string) => {
    const newValue = { ...value, [platformKey]: url };

    // Remove empty values
    if (!url.trim()) {
      delete newValue[platformKey];
      setActivePlatforms((prev) => {
        const newSet = new Set(prev);
        newSet.delete(platformKey);
        return newSet;
      });
    }

    onChange(newValue);

    // Validate if URL is provided
    if (url.trim()) {
      validateUrlDebounced(url, platformKey);
    } else {
      setValidationResults((prev) => {
        const newResults = { ...prev };
        delete newResults[platformKey];
        return newResults;
      });
    }
  };

  // Add platform
  const addPlatform = (platformKey: string) => {
    if (activePlatforms.size >= maxPlatforms) {
      return;
    }

    setActivePlatforms((prev) => new Set([...prev, platformKey]));
  };

  // Remove platform
  const removePlatform = (platformKey: string) => {
    const newValue = { ...value };
    delete newValue[platformKey];
    onChange(newValue);

    setActivePlatforms((prev) => {
      const newSet = new Set(prev);
      newSet.delete(platformKey);
      return newSet;
    });

    setValidationResults((prev) => {
      const newResults = { ...prev };
      delete newResults[platformKey];
      return newResults;
    });
  };

  // Get available platforms
  const availablePlatforms = useMemo(() => {
    return Object.entries(PLATFORMS).filter(
      ([key]) => !activePlatforms.has(key)
    );
  }, [activePlatforms]);

  // Get recommended platforms
  const recommendedPlatforms = useMemo(() => {
    return availablePlatforms.filter(([, platform]) => platform.recommended);
  }, [availablePlatforms]);

  // Calculate overall score
  const overallScore = useMemo(() => {
    const validPlatforms = Object.entries(validationResults).filter(
      ([, result]) => result.isValid
    );
    const totalBusinessValue = validPlatforms.reduce((sum, [key, result]) => {
      const platform = PLATFORMS[key as keyof typeof PLATFORMS];
      const value =
        platform.businessValue === "high"
          ? 3
          : platform.businessValue === "medium"
          ? 2
          : 1;
      return sum + value;
    }, 0);

    return {
      count: validPlatforms.length,
      businessValue: totalBusinessValue,
      maxPossible: Object.values(PLATFORMS).reduce(
        (sum, platform) =>
          sum +
          (platform.businessValue === "high"
            ? 3
            : platform.businessValue === "medium"
            ? 2
            : 1),
        0
      ),
    };
  }, [validationResults]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Social Media Profiles
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Add your professional social media profiles to build trust with
            clients
          </p>
        </div>

        {/* Score Display */}
        <div className="text-right">
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-blue-600">
              {overallScore.count}
            </div>
            <div className="text-sm text-gray-500">
              <div>platforms</div>
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 text-yellow-500" />
                <span>
                  {Math.round(
                    (overallScore.businessValue / overallScore.maxPossible) *
                      100
                  )}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Platforms */}
      <div className="space-y-4">
        <AnimatePresence>
          {Array.from(activePlatforms).map((platformKey) => {
            const platform = PLATFORMS[platformKey as keyof typeof PLATFORMS];
            const validation = validationResults[platformKey];
            const isValidating = validatingUrls.has(platformKey);
            const currentUrl = value[platformKey] || "";

            return (
              <motion.div
                key={platformKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start space-x-3">
                  {/* Platform Icon */}
                  <div
                    className={`w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center text-white font-semibold`}
                  >
                    <span className="text-lg">{platform.icon}</span>
                  </div>

                  {/* Input Section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">
                        {platform.name}
                      </h4>
                      <button
                        onClick={() => removePlatform(platformKey)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Remove platform"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* URL Input */}
                    <div className="relative">
                      <input
                        type="url"
                        value={currentUrl}
                        onChange={(e) =>
                          handleUrlChange(platformKey, e.target.value)
                        }
                        placeholder={platform.placeholder}
                        className={`w-full px-3 py-2 border rounded-md text-sm transition-colors ${
                          validation?.isValid === false && currentUrl
                            ? "border-red-300 focus:border-red-500"
                            : validation?.isValid === true
                            ? "border-green-300 focus:border-green-500"
                            : "border-gray-300 focus:border-blue-500"
                        } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      />

                      {/* Status Icons */}
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {isValidating ? (
                          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                        ) : validation?.isValid === true ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : validation?.isValid === false && currentUrl ? (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        ) : null}
                      </div>
                    </div>

                    {/* Validation Messages */}
                    {validation && currentUrl && (
                      <div className="mt-2 space-y-1">
                        {validation.error && (
                          <div className="flex items-start space-x-2 text-red-600">
                            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span className="text-xs">{validation.error}</span>
                          </div>
                        )}

                        {validation.suggestion && (
                          <div className="text-xs text-gray-500">
                            💡 {validation.suggestion}
                          </div>
                        )}

                        {/* Profile Data */}
                        {validation.profileData?.exists &&
                          validation.isValid && (
                            <div className="flex items-center space-x-4 text-xs text-gray-600 mt-2">
                              {validation.profileData.isPublic && (
                                <div className="flex items-center space-x-1">
                                  <Eye className="w-3 h-3" />
                                  <span>Public</span>
                                </div>
                              )}

                              {validation.profileData.followerCount !==
                                undefined && (
                                <div className="flex items-center space-x-1">
                                  <Users className="w-3 h-3" />
                                  <span>
                                    {validation.profileData.followerCount.toLocaleString()}{" "}
                                    followers
                                  </span>
                                </div>
                              )}

                              {validation.profileData.isVerified && (
                                <div className="flex items-center space-x-1">
                                  <Check className="w-3 h-3 text-blue-500" />
                                  <span>Verified</span>
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    )}

                    {/* Quick Actions */}
                    {currentUrl && validation?.isValid && (
                      <div className="flex items-center space-x-2 mt-2">
                        <a
                          href={currentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Visit Profile</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add Platform Section */}
      {activePlatforms.size < maxPlatforms && availablePlatforms.length > 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <Globe className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900 mb-2">
              Add Social Media Platform
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              {activePlatforms.size} of {maxPlatforms} platforms added
            </p>

            {/* Recommended Platforms */}
            {showRecommendations && recommendedPlatforms.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Recommended:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {recommendedPlatforms.slice(0, 3).map(([key, platform]) => (
                    <button
                      key={key}
                      onClick={() => addPlatform(key)}
                      className={`flex items-center space-x-2 px-3 py-2 ${platform.color} text-white rounded-lg hover:opacity-90 transition-opacity text-sm`}
                    >
                      <span>{platform.icon}</span>
                      <span>{platform.name}</span>
                      <Zap className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* All Platforms */}
            <div>
              <button
                onClick={() => setShowAllPlatforms(!showAllPlatforms)}
                className="text-sm text-gray-600 hover:text-gray-800 underline mb-3"
              >
                {showAllPlatforms ? "Show less" : "Show all platforms"}
              </button>

              <AnimatePresence>
                {showAllPlatforms && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 md:grid-cols-3 gap-2"
                  >
                    {availablePlatforms.map(([key, platform]) => (
                      <button
                        key={key}
                        onClick={() => addPlatform(key)}
                        className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        <span>{platform.icon}</span>
                        <span className="truncate">{platform.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* Business Impact Info */}
      {activePlatforms.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Business Impact</h4>
              <p className="text-sm text-blue-700 mt-1">
                Realtors with complete social media profiles receive 3x more
                client inquiries and are viewed as 67% more trustworthy by
                potential clients.
              </p>

              {overallScore.count >= 3 && (
                <div className="mt-2 flex items-center space-x-1 text-sm text-green-700">
                  <Check className="w-4 h-4" />
                  <span>Great! You have strong social media presence.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialMediaValidator;
