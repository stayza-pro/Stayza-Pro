import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Check, X, Eye, EyeOff } from "lucide-react";

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

    // Dynamic import of zxcvbn to avoid bundling it initially
    import("zxcvbn").then(({ default: zxcvbn }) => {
      const strengthResult = zxcvbn(password) as PasswordStrengthResult;
      setResult(strengthResult);
      onStrengthChange?.(strengthResult.score, strengthResult);
    });
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
    { label: "Contains special character", test: /[@$!%*?&]/.test(password) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Password Strength
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsVisible(!isVisible)}
          className="p-1 text-gray-500 hover:text-gray-700"
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
        <div className="flex space-x-1 mb-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className={`h-2 flex-1 rounded ${
                index <= result.score
                  ? strengthColors[result.score]
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between items-center">
          <span
            className={`text-xs font-medium ${
              result.score <= 1
                ? "text-red-600"
                : result.score <= 2
                ? "text-orange-600"
                : result.score <= 3
                ? "text-blue-600"
                : "text-green-600"
            }`}
          >
            {strengthLabels[result.score]}
          </span>
          <span className="text-xs text-gray-500">
            Time to crack:{" "}
            {result.crack_times_display.offline_slow_hashing_1e4_per_second}
          </span>
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-600 mb-2">Requirements:</p>
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center space-x-2">
            {req.test ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <X className="w-3 h-3 text-gray-400" />
            )}
            <span
              className={`text-xs ${
                req.test ? "text-green-600" : "text-gray-500"
              }`}
            >
              {req.label}
            </span>
          </div>
        ))}
      </div>

      {/* Feedback */}
      {result.feedback.warning && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-xs text-yellow-800">{result.feedback.warning}</p>
        </div>
      )}

      {result.feedback.suggestions.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium text-gray-600 mb-1">Suggestions:</p>
          {result.feedback.suggestions.map((suggestion, index) => (
            <p key={index} className="text-xs text-gray-600">
              • {suggestion}
            </p>
          ))}
        </div>
      )}
    </motion.div>
  );
};
