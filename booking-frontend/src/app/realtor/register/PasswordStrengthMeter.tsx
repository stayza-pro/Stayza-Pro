"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Eye, EyeOff, Check, X } from "lucide-react";

interface PasswordStrengthResult {
  score: number;
  feedback: {
    warning: string;
    suggestions: string[];
  };
  crack_times_display: {
    offline_slow_hashing_1e4_per_second: string;
  };
}

interface PasswordStrengthMeterProps {
  password: string;
  onStrengthChange?: (
    score: number,
    result: PasswordStrengthResult | null
  ) => void;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  onStrengthChange,
}) => {
  const [result, setResult] = useState<PasswordStrengthResult | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!password) {
      setResult(null);
      onStrengthChange?.(0, null);
      return;
    }

    // Simple password strength calculation (in production, you'd use zxcvbn)
    const calculateStrength = (pwd: string) => {
      let score = 0;
      const suggestions = [];
      let warning = "";

      // Length check
      if (pwd.length >= 8) score += 1;
      else suggestions.push("Use 8 or more characters");

      // Character variety checks
      if (/[a-z]/.test(pwd)) score += 1;
      else suggestions.push("Add lowercase letters");

      if (/[A-Z]/.test(pwd)) score += 1;
      else suggestions.push("Add uppercase letters");

      if (/\d/.test(pwd)) score += 1;
      else suggestions.push("Add numbers");

      if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;
      else suggestions.push("Add special characters");

      // Common password patterns
      const commonPatterns = [
        /^password/i,
        /^123456/,
        /^qwerty/i,
        /^admin/i,
        /^welcome/i,
      ];

      if (commonPatterns.some((pattern) => pattern.test(pwd))) {
        score = Math.max(0, score - 2);
        warning = "This is a common password pattern";
      }

      // Sequential characters
      if (/123|abc|xyz|789/i.test(pwd)) {
        score = Math.max(0, score - 1);
        warning = "Avoid sequences like '123' or 'abc'";
      }

      return {
        score: Math.min(5, score),
        feedback: {
          warning,
          suggestions: suggestions.slice(0, 3), // Limit suggestions
        },
        crack_times_display: {
          offline_slow_hashing_1e4_per_second:
            score <= 1
              ? "less than a day"
              : score <= 2
              ? "3 days"
              : score <= 3
              ? "2 months"
              : score <= 4
              ? "2 years"
              : "centuries",
        },
      };
    };

    const strengthResult = calculateStrength(password);
    setResult(strengthResult);
    onStrengthChange?.(strengthResult.score, strengthResult);
  }, [password, onStrengthChange]);

  if (!password || !result) return null;

  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-green-500",
  ];

  const requirements = [
    { label: "At least 8 characters", test: password.length >= 8 },
    { label: "Contains uppercase letter", test: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", test: /[a-z]/.test(password) },
    { label: "Contains number", test: /\d/.test(password) },
    {
      label: "Contains special character",
      test: /[^a-zA-Z0-9]/.test(password),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-3 p-4 border border-gray-200 rounded-lg bg-gray-50"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Password Strength
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsVisible(!isVisible)}
          className="p-1 text-gray-500 hover:text-gray-700 rounded transition-colors"
          title={isVisible ? "Hide details" : "Show details"}
        >
          {isVisible ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Strength Bar */}
      <div className="mb-3">
        <div className="flex space-x-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                i < result.score
                  ? strengthColors[Math.min(result.score - 1, 4)]
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        <div className="flex justify-between items-center">
          <span
            className={`text-sm font-medium ${
              result.score <= 1
                ? "text-red-600"
                : result.score <= 2
                ? "text-orange-600"
                : result.score <= 3
                ? "text-yellow-600"
                : result.score <= 4
                ? "text-blue-600"
                : "text-green-600"
            }`}
          >
            {strengthLabels[Math.min(result.score, 4)] || "Very Weak"}
          </span>

          <span className="text-xs text-gray-500">
            Time to crack:{" "}
            {result.crack_times_display.offline_slow_hashing_1e4_per_second}
          </span>
        </div>
      </div>

      {/* Requirements Checklist */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <p className="text-xs font-medium text-gray-600 mb-2">
              Requirements:
            </p>
            <div className="space-y-1">
              {requirements.map((req, index) => (
                <motion.div
                  key={req.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-2"
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      req.test ? "bg-green-100" : "bg-gray-100"
                    }`}
                  >
                    {req.test ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <X className="w-3 h-3 text-gray-400" />
                    )}
                  </div>
                  <span
                    className={`text-xs ${
                      req.test ? "text-green-700" : "text-gray-600"
                    }`}
                  >
                    {req.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback */}
      {result.feedback.warning && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded"
        >
          <p className="text-xs text-yellow-800">
            ⚠️ {result.feedback.warning}
          </p>
        </motion.div>
      )}

      {result.feedback.suggestions.length > 0 && isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-3"
        >
          <p className="text-xs font-medium text-gray-600 mb-1">Suggestions:</p>
          <ul className="space-y-1">
            {result.feedback.suggestions.map((suggestion, index) => (
              <motion.li
                key={suggestion}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-xs text-gray-600 flex items-center space-x-1"
              >
                <span>•</span>
                <span>{suggestion}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Security Tips */}
      {result.score >= 4 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-3 p-2 bg-green-50 border border-green-200 rounded"
        >
          <p className="text-xs text-green-800 flex items-center space-x-1">
            <Check className="w-3 h-3" />
            <span>Great! This password looks strong and secure.</span>
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PasswordStrengthMeter;
