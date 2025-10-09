"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Volume2,
  VolumeX,
  Keyboard,
  Mouse,
  Zap,
  CheckCircle,
  AlertTriangle,
  Settings,
  Contrast,
  Type,
  Focus,
  Navigation,
} from "lucide-react";

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  focusIndicators: boolean;
  reduceMotion: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
}

interface ContrastCheckResult {
  ratio: number;
  grade: "AAA" | "AA" | "A" | "FAIL";
  accessible: boolean;
}

interface AccessibilityEnhancerProps {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  onSettingsChange?: (settings: AccessibilitySettings) => void;
  className?: string;
}

// WCAG contrast ratio calculation
function getLuminance(color: string): number {
  // Convert hex to RGB
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  // Apply gamma correction
  const gamma = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * gamma(r) + 0.7152 * gamma(g) + 0.0722 * gamma(b);
}

function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

function checkContrast(
  foreground: string,
  background: string
): ContrastCheckResult {
  const ratio = getContrastRatio(foreground, background);

  let grade: ContrastCheckResult["grade"] = "FAIL";
  let accessible = false;

  if (ratio >= 7) {
    grade = "AAA";
    accessible = true;
  } else if (ratio >= 4.5) {
    grade = "AA";
    accessible = true;
  } else if (ratio >= 3) {
    grade = "A";
    accessible = false;
  }

  return { ratio: Math.round(ratio * 100) / 100, grade, accessible };
}

// Screen Reader Announcements
const announceToScreenReader = (message: string) => {
  const announcement = document.createElement("div");
  announcement.setAttribute("aria-live", "polite");
  announcement.setAttribute("aria-atomic", "true");
  announcement.style.position = "absolute";
  announcement.style.left = "-10000px";
  announcement.style.width = "1px";
  announcement.style.height = "1px";
  announcement.style.overflow = "hidden";

  document.body.appendChild(announcement);
  announcement.textContent = message;

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

export function AccessibilityEnhancer({
  primaryColor = "#3B82F6",
  backgroundColor = "#FFFFFF",
  textColor = "#1F2937",
  onSettingsChange,
  className = "",
}: AccessibilityEnhancerProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    focusIndicators: true,
    reduceMotion: false,
    screenReaderMode: false,
    keyboardNavigation: true,
  });

  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false);
  const [contrastResults, setContrastResults] = useState<{
    primary: ContrastCheckResult;
    text: ContrastCheckResult;
  } | null>(null);

  const [keyboardNavActive, setKeyboardNavActive] = useState(false);
  const [focusedElement, setFocusedElement] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  // Load saved accessibility preferences
  useEffect(() => {
    const saved = localStorage.getItem("accessibility-settings");
    if (saved) {
      try {
        const savedSettings = JSON.parse(saved) as AccessibilitySettings;
        setSettings(savedSettings);
        applyAccessibilitySettings(savedSettings);
      } catch (error) {
        console.error("Failed to load accessibility settings:", error);
      }
    }

    // Check for system preferences
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setSettings((prev) => ({ ...prev, reduceMotion: true }));
    }

    if (
      window.matchMedia &&
      window.matchMedia("(prefers-contrast: high)").matches
    ) {
      setSettings((prev) => ({ ...prev, highContrast: true }));
    }
  }, []);

  // Calculate contrast ratios
  useEffect(() => {
    const primaryResult = checkContrast(primaryColor, backgroundColor);
    const textResult = checkContrast(textColor, backgroundColor);

    setContrastResults({
      primary: primaryResult,
      text: textResult,
    });
  }, [primaryColor, backgroundColor, textColor]);

  // Keyboard navigation detection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab" || e.key === "Enter" || e.key === " ") {
        setKeyboardNavActive(true);
        document.body.classList.add("keyboard-navigation");
      }
    };

    const handleMouseDown = () => {
      setKeyboardNavActive(false);
      document.body.classList.remove("keyboard-navigation");
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  // Focus management
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.id) {
        setFocusedElement(target.id);
      } else if (target.getAttribute("aria-label")) {
        setFocusedElement(target.getAttribute("aria-label"));
      }
    };

    document.addEventListener("focus", handleFocus, true);
    return () => document.removeEventListener("focus", handleFocus, true);
  }, []);

  // Apply accessibility settings to document
  const applyAccessibilitySettings = useCallback(
    (newSettings: AccessibilitySettings) => {
      const root = document.documentElement;

      // High contrast mode
      if (newSettings.highContrast) {
        root.classList.add("high-contrast");
      } else {
        root.classList.remove("high-contrast");
      }

      // Large text mode
      if (newSettings.largeText) {
        root.classList.add("large-text");
      } else {
        root.classList.remove("large-text");
      }

      // Enhanced focus indicators
      if (newSettings.focusIndicators) {
        root.classList.add("enhanced-focus");
      } else {
        root.classList.remove("enhanced-focus");
      }

      // Reduced motion
      if (newSettings.reduceMotion) {
        root.classList.add("reduce-motion");
      } else {
        root.classList.remove("reduce-motion");
      }

      // Screen reader mode
      if (newSettings.screenReaderMode) {
        root.classList.add("screen-reader-mode");
      } else {
        root.classList.remove("screen-reader-mode");
      }

      // Keyboard navigation
      if (newSettings.keyboardNavigation) {
        root.classList.add("keyboard-navigation-enabled");
      } else {
        root.classList.remove("keyboard-navigation-enabled");
      }
    },
    []
  );

  // Update settings
  const updateSetting = useCallback(
    (key: keyof AccessibilitySettings, value: boolean) => {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      applyAccessibilitySettings(newSettings);

      // Save to localStorage
      localStorage.setItem(
        "accessibility-settings",
        JSON.stringify(newSettings)
      );

      // Notify parent
      if (onSettingsChange) {
        onSettingsChange(newSettings);
      }

      // Announce to screen reader
      announceToScreenReader(
        `${key.replace(/([A-Z])/g, " $1").toLowerCase()} ${
          value ? "enabled" : "disabled"
        }`
      );
    },
    [settings, applyAccessibilitySettings, onSettingsChange]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + A to toggle accessibility panel
      if (e.altKey && e.key === "a") {
        e.preventDefault();
        setShowAccessibilityPanel((prev) => !prev);
        announceToScreenReader("Accessibility panel toggled");
      }

      // Alt + C for high contrast
      if (e.altKey && e.key === "c") {
        e.preventDefault();
        updateSetting("highContrast", !settings.highContrast);
      }

      // Alt + T for large text
      if (e.altKey && e.key === "t") {
        e.preventDefault();
        updateSetting("largeText", !settings.largeText);
      }

      // Escape to close panel
      if (e.key === "Escape" && showAccessibilityPanel) {
        setShowAccessibilityPanel(false);
        toggleButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [settings, showAccessibilityPanel, updateSetting]);

  // Click outside to close panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !toggleButtonRef.current?.contains(event.target as Node)
      ) {
        setShowAccessibilityPanel(false);
      }
    };

    if (showAccessibilityPanel) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showAccessibilityPanel]);

  const getContrastColor = (result: ContrastCheckResult) => {
    switch (result.grade) {
      case "AAA":
        return "text-green-600";
      case "AA":
        return "text-blue-600";
      case "A":
        return "text-yellow-600";
      default:
        return "text-red-600";
    }
  };

  const getContrastIcon = (result: ContrastCheckResult) => {
    return result.accessible ? (
      <CheckCircle className="w-4 h-4" />
    ) : (
      <AlertTriangle className="w-4 h-4" />
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Accessibility Toggle Button */}
      <button
        ref={toggleButtonRef}
        onClick={() => setShowAccessibilityPanel(!showAccessibilityPanel)}
        className="fixed bottom-20 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
        aria-label="Open accessibility settings"
        aria-expanded={showAccessibilityPanel}
        aria-controls="accessibility-panel"
        title="Accessibility Settings (Alt+A)"
      >
        <motion.div
          animate={{ rotate: showAccessibilityPanel ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Settings className="w-6 h-6" />
        </motion.div>
      </button>

      {/* Accessibility Panel */}
      <AnimatePresence>
        {showAccessibilityPanel && (
          <motion.div
            ref={panelRef}
            id="accessibility-panel"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-36 right-4 z-50 bg-white rounded-lg shadow-xl border-2 border-gray-200 w-80 max-h-96 overflow-y-auto"
            role="dialog"
            aria-labelledby="accessibility-title"
            aria-describedby="accessibility-description"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2
                    id="accessibility-title"
                    className="text-lg font-semibold text-gray-900"
                  >
                    Accessibility Settings
                  </h2>
                  <p
                    id="accessibility-description"
                    className="text-sm text-gray-600"
                  >
                    Customize your experience
                  </p>
                </div>
                <button
                  onClick={() => setShowAccessibilityPanel(false)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  aria-label="Close accessibility panel"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Contrast Check Results */}
              {contrastResults && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    <Contrast className="w-4 h-4 mr-1" />
                    Color Contrast
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Primary vs Background:</span>
                      <div
                        className={`flex items-center ${getContrastColor(
                          contrastResults.primary
                        )}`}
                      >
                        {getContrastIcon(contrastResults.primary)}
                        <span className="ml-1">
                          {contrastResults.primary.ratio}:1 (
                          {contrastResults.primary.grade})
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Text vs Background:</span>
                      <div
                        className={`flex items-center ${getContrastColor(
                          contrastResults.text
                        )}`}
                      >
                        {getContrastIcon(contrastResults.text)}
                        <span className="ml-1">
                          {contrastResults.text.ratio}:1 (
                          {contrastResults.text.grade})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Accessibility Controls */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900 flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    Visual Preferences
                  </h3>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center">
                      <Contrast className="w-4 h-4 mr-2 text-gray-600" />
                      <div>
                        <span className="text-sm font-medium">
                          High Contrast
                        </span>
                        <p className="text-xs text-gray-500">
                          Enhance color differences
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.highContrast}
                      onChange={(e) =>
                        updateSetting("highContrast", e.target.checked)
                      }
                      className="sr-only"
                      aria-describedby="high-contrast-desc"
                    />
                    <div
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        settings.highContrast ? "bg-blue-600" : "bg-gray-300"
                      }`}
                      role="switch"
                      aria-checked={settings.highContrast}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.highContrast
                            ? "translate-x-4"
                            : "translate-x-0.5"
                        }`}
                      />
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center">
                      <Type className="w-4 h-4 mr-2 text-gray-600" />
                      <div>
                        <span className="text-sm font-medium">Large Text</span>
                        <p className="text-xs text-gray-500">
                          Increase font size
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.largeText}
                      onChange={(e) =>
                        updateSetting("largeText", e.target.checked)
                      }
                      className="sr-only"
                    />
                    <div
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        settings.largeText ? "bg-blue-600" : "bg-gray-300"
                      }`}
                      role="switch"
                      aria-checked={settings.largeText}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.largeText
                            ? "translate-x-4"
                            : "translate-x-0.5"
                        }`}
                      />
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center">
                      <Focus className="w-4 h-4 mr-2 text-gray-600" />
                      <div>
                        <span className="text-sm font-medium">
                          Enhanced Focus
                        </span>
                        <p className="text-xs text-gray-500">
                          Clearer focus indicators
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.focusIndicators}
                      onChange={(e) =>
                        updateSetting("focusIndicators", e.target.checked)
                      }
                      className="sr-only"
                    />
                    <div
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        settings.focusIndicators ? "bg-blue-600" : "bg-gray-300"
                      }`}
                      role="switch"
                      aria-checked={settings.focusIndicators}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.focusIndicators
                            ? "translate-x-4"
                            : "translate-x-0.5"
                        }`}
                      />
                    </div>
                  </label>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900 flex items-center">
                    <Navigation className="w-4 h-4 mr-1" />
                    Navigation
                  </h3>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center">
                      <Keyboard className="w-4 h-4 mr-2 text-gray-600" />
                      <div>
                        <span className="text-sm font-medium">
                          Keyboard Navigation
                        </span>
                        <p className="text-xs text-gray-500">
                          Enhanced keyboard support
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.keyboardNavigation}
                      onChange={(e) =>
                        updateSetting("keyboardNavigation", e.target.checked)
                      }
                      className="sr-only"
                    />
                    <div
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        settings.keyboardNavigation
                          ? "bg-blue-600"
                          : "bg-gray-300"
                      }`}
                      role="switch"
                      aria-checked={settings.keyboardNavigation}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.keyboardNavigation
                            ? "translate-x-4"
                            : "translate-x-0.5"
                        }`}
                      />
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center">
                      <Zap className="w-4 h-4 mr-2 text-gray-600" />
                      <div>
                        <span className="text-sm font-medium">
                          Reduce Motion
                        </span>
                        <p className="text-xs text-gray-500">
                          Minimize animations
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.reduceMotion}
                      onChange={(e) =>
                        updateSetting("reduceMotion", e.target.checked)
                      }
                      className="sr-only"
                    />
                    <div
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        settings.reduceMotion ? "bg-blue-600" : "bg-gray-300"
                      }`}
                      role="switch"
                      aria-checked={settings.reduceMotion}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.reduceMotion
                            ? "translate-x-4"
                            : "translate-x-0.5"
                        }`}
                      />
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center">
                      {settings.screenReaderMode ? (
                        <Volume2 className="w-4 h-4 mr-2 text-gray-600" />
                      ) : (
                        <VolumeX className="w-4 h-4 mr-2 text-gray-600" />
                      )}
                      <div>
                        <span className="text-sm font-medium">
                          Screen Reader Mode
                        </span>
                        <p className="text-xs text-gray-500">
                          Optimized for assistive tech
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.screenReaderMode}
                      onChange={(e) =>
                        updateSetting("screenReaderMode", e.target.checked)
                      }
                      className="sr-only"
                    />
                    <div
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        settings.screenReaderMode
                          ? "bg-blue-600"
                          : "bg-gray-300"
                      }`}
                      role="switch"
                      aria-checked={settings.screenReaderMode}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.screenReaderMode
                            ? "translate-x-4"
                            : "translate-x-0.5"
                        }`}
                      />
                    </div>
                  </label>
                </div>
              </div>

              {/* Keyboard Shortcuts Info */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-xs font-medium text-gray-700 mb-2">
                  Keyboard Shortcuts
                </h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Alt + A: Toggle this panel</div>
                  <div>Alt + C: Toggle high contrast</div>
                  <div>Alt + T: Toggle large text</div>
                  <div>Tab: Navigate between elements</div>
                  <div>Escape: Close dialogs</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen Reader Live Region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {focusedElement && `Focused on ${focusedElement}`}
      </div>

      {/* Skip Links */}
      <div className="sr-only">
        <a
          href="#main-content"
          className="absolute top-0 left-0 bg-blue-600 text-white px-4 py-2 rounded focus:not-sr-only focus:z-50"
        >
          Skip to main content
        </a>
        <a
          href="#navigation"
          className="absolute top-0 left-20 bg-blue-600 text-white px-4 py-2 rounded focus:not-sr-only focus:z-50"
        >
          Skip to navigation
        </a>
      </div>
    </div>
  );
}
