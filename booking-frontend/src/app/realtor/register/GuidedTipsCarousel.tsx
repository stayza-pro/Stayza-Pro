"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Pause,
  RotateCcw,
  Bookmark,
  BookmarkCheck,
  Share2,
} from "lucide-react";

interface GuidedTip {
  id: string;
  title: string;
  content: string;
  category: "best_practice" | "requirement" | "warning" | "enhancement";
  step?: number;
  field?: string;
  priority: "high" | "medium" | "low";
  actionable?: boolean;
  videoUrl?: string;
  exampleImage?: string;
  relatedFields?: string[];
}

interface GuidedTipsCarouselProps {
  currentStep: number;
  currentField?: string;
  tips: GuidedTip[];
  onDismiss?: () => void;
  autoPlay?: boolean;
  compact?: boolean;
  className?: string;
}

export const GuidedTipsCarousel: React.FC<GuidedTipsCarouselProps> = ({
  currentStep,
  currentField,
  tips,
  onDismiss,
  autoPlay = true,
  compact = false,
  className = "",
}) => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [bookmarkedTips, setBookmarkedTips] = useState<Set<string>>(new Set());
  const [isVisible, setIsVisible] = useState(true);

  // Filter tips based on current step and field
  const relevantTips = tips
    .filter((tip) => {
      if (tip.step && tip.step !== currentStep) return false;
      if (tip.field && tip.field !== currentField) return false;
      return true;
    })
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

  const currentTip = relevantTips[currentTipIndex];

  // Auto-advance tips
  useEffect(() => {
    if (!isPlaying || relevantTips.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % relevantTips.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, relevantTips.length]);

  // Reset to first tip when step changes
  useEffect(() => {
    setCurrentTipIndex(0);
  }, [currentStep, currentField]);

  const handleNext = useCallback(() => {
    setCurrentTipIndex((prev) => (prev + 1) % relevantTips.length);
  }, [relevantTips.length]);

  const handlePrevious = useCallback(() => {
    setCurrentTipIndex(
      (prev) => (prev - 1 + relevantTips.length) % relevantTips.length
    );
  }, [relevantTips.length]);

  const handleBookmark = useCallback((tipId: string) => {
    setBookmarkedTips((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tipId)) {
        newSet.delete(tipId);
      } else {
        newSet.add(tipId);
      }
      return newSet;
    });
  }, []);

  const handleShare = useCallback((tip: GuidedTip) => {
    if (navigator.share) {
      navigator.share({
        title: `Tip: ${tip.title}`,
        text: tip.content,
        url: window.location.href,
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${tip.title}\n\n${tip.content}`);
    }
  }, []);

  const getCategoryIcon = (category: GuidedTip["category"]) => {
    switch (category) {
      case "best_practice":
        return "💡";
      case "requirement":
        return "📋";
      case "warning":
        return "⚠️";
      case "enhancement":
        return "✨";
      default:
        return "💡";
    }
  };

  const getCategoryColor = (category: GuidedTip["category"]) => {
    switch (category) {
      case "best_practice":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "requirement":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "enhancement":
        return "bg-green-50 border-green-200 text-green-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  if (!isVisible || relevantTips.length === 0) return null;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}
      >
        <div className="flex items-start space-x-2">
          <div className="text-lg">{getCategoryIcon(currentTip.category)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-900">
              {currentTip.title}
            </p>
            <p className="text-xs text-blue-700 mt-1">{currentTip.content}</p>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-blue-600 hover:text-blue-800 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Helpful Tips</h3>
            <span className="text-xs text-gray-500">
              {currentTipIndex + 1} of {relevantTips.length}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {relevantTips.length > 1 && (
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1 text-gray-500 hover:text-gray-700 rounded"
                title={isPlaying ? "Pause auto-advance" : "Resume auto-advance"}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </button>
            )}

            <button
              onClick={() => setCurrentTipIndex(0)}
              className="p-1 text-gray-500 hover:text-gray-700 rounded"
              title="Reset to first tip"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1 text-gray-500 hover:text-gray-700 rounded"
                title="Close tips"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTip.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-4"
          >
            {/* Category Badge */}
            <div
              className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium mb-3 ${getCategoryColor(
                currentTip.category
              )}`}
            >
              <span>{getCategoryIcon(currentTip.category)}</span>
              <span>{currentTip.category.replace("_", " ").toUpperCase()}</span>
            </div>

            {/* Title */}
            <h4 className="font-semibold text-gray-900 mb-2">
              {currentTip.title}
            </h4>

            {/* Content */}
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              {currentTip.content}
            </p>

            {/* Media */}
            {currentTip.exampleImage && (
              <div className="mb-4">
                <img
                  src={currentTip.exampleImage}
                  alt={currentTip.title}
                  className="rounded-lg border border-gray-200 w-full h-32 object-cover"
                />
              </div>
            )}

            {currentTip.videoUrl && (
              <div className="mb-4">
                <div className="bg-gray-100 rounded-lg p-3 flex items-center space-x-2">
                  <Play className="w-4 h-4 text-blue-600" />
                  <a
                    href={currentTip.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Watch tutorial video
                  </a>
                </div>
              </div>
            )}

            {/* Related Fields */}
            {currentTip.relatedFields &&
              currentTip.relatedFields.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Related to:</p>
                  <div className="flex flex-wrap gap-1">
                    {currentTip.relatedFields.map((field) => (
                      <span
                        key={field}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {field.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBookmark(currentTip.id)}
                  className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 rounded"
                  title={
                    bookmarkedTips.has(currentTip.id)
                      ? "Remove bookmark"
                      : "Bookmark tip"
                  }
                >
                  {bookmarkedTips.has(currentTip.id) ? (
                    <BookmarkCheck className="w-3 h-3" />
                  ) : (
                    <Bookmark className="w-3 h-3" />
                  )}
                  <span>
                    {bookmarkedTips.has(currentTip.id) ? "Saved" : "Save"}
                  </span>
                </button>

                <button
                  onClick={() => handleShare(currentTip)}
                  className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 rounded"
                  title="Share tip"
                >
                  <Share2 className="w-3 h-3" />
                  <span>Share</span>
                </button>
              </div>

              {/* Navigation */}
              {relevantTips.length > 1 && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handlePrevious}
                    className="p-1 text-gray-500 hover:text-gray-700 rounded"
                    title="Previous tip"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex space-x-1 px-2">
                    {relevantTips.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentTipIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentTipIndex
                            ? "bg-blue-600"
                            : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleNext}
                    className="p-1 text-gray-500 hover:text-gray-700 rounded"
                    title="Next tip"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Predefined tips for different steps and fields
export const realtorRegistrationTips: GuidedTip[] = [
  {
    id: "personal-info-intro",
    title: "Welcome to Realtor Registration",
    content:
      "We'll guide you through setting up your professional profile. This process typically takes 5-10 minutes.",
    category: "best_practice",
    step: 1,
    priority: "high",
  },
  {
    id: "email-professional",
    title: "Use Your Professional Email",
    content:
      "Use your business email address rather than personal email. This helps establish credibility with clients.",
    category: "best_practice",
    step: 1,
    field: "email",
    priority: "medium",
  },
  {
    id: "password-security",
    title: "Create a Strong Password",
    content:
      "Use a unique password with at least 8 characters, including numbers and symbols. Consider using a password manager.",
    category: "requirement",
    step: 1,
    field: "password",
    priority: "high",
  },
  {
    id: "business-type-important",
    title: "Choose Your Business Type Carefully",
    content:
      "Your business type affects available features and compliance requirements. You can change this later in settings.",
    category: "warning",
    step: 2,
    field: "businessType",
    priority: "high",
  },
  {
    id: "license-verification",
    title: "License Verification Required",
    content:
      "Licensed professionals must provide valid license numbers. This helps build trust with clients and ensures compliance.",
    category: "requirement",
    step: 2,
    priority: "high",
    relatedFields: ["licenseNumber", "licenseState"],
  },
  {
    id: "social-media-optimization",
    title: "Complete Your Social Media Profiles",
    content:
      "Well-maintained social profiles increase client trust by 67%. Make sure your profiles are professional and up-to-date.",
    category: "enhancement",
    step: 3,
    priority: "medium",
    relatedFields: ["socialMedia"],
  },
  {
    id: "photo-tips",
    title: "Professional Photo Guidelines",
    content:
      "Use a high-quality headshot with good lighting. Avoid casual clothing and ensure the background is clean and professional.",
    category: "best_practice",
    step: 3,
    field: "profilePhoto",
    priority: "medium",
  },
  {
    id: "specialization-benefits",
    title: "Define Your Specialization",
    content:
      "Specialists typically earn 23% more than generalists. Choose areas where you have expertise and passion.",
    category: "enhancement",
    step: 3,
    field: "specializations",
    priority: "medium",
  },
  {
    id: "service-area-strategy",
    title: "Define Your Service Areas",
    content:
      "Be specific about your service areas. Clients prefer agents who know their neighborhoods well.",
    category: "best_practice",
    step: 3,
    field: "serviceAreas",
    priority: "medium",
  },
  {
    id: "marketing-channels",
    title: "Diversify Your Marketing",
    content:
      "Successful realtors use 3-5 marketing channels. Don't rely on just one method to reach potential clients.",
    category: "best_practice",
    step: 4,
    field: "marketingChannels",
    priority: "medium",
  },
  {
    id: "final-review",
    title: "Review Everything Carefully",
    content:
      "Double-check all information before submitting. Incorrect details can delay your account approval.",
    category: "warning",
    step: 5,
    priority: "high",
  },
];

export default GuidedTipsCarousel;
