"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

// Simple animation variants

export const fadeInScale = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.3, ease: "easeOut" },
};

export const slideInLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 30 },
  transition: { duration: 0.4, ease: "easeOut" },
};

// Simplified Animated Components
interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary";
  disabled?: boolean;
  className?: string;
}

export function AnimatedButton({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  className = "",
}: AnimatedButtonProps) {
  const baseClasses =
    "px-4 py-2 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variantClasses =
    variant === "primary"
      ? "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500"
      : "bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-500";

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${className} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.button>
  );
}

interface AnimatedInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  success?: boolean;
  disabled?: boolean;
}

export function AnimatedInput({
  placeholder,
  value,
  onChange,
  error = false,
  success = false,
  disabled = false,
}: AnimatedInputProps) {
  return (
    <motion.input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`
        w-full px-3 py-2 text-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2
        ${
          error
            ? "border-red-500 focus:ring-red-200"
            : success
            ? "border-green-500 focus:ring-green-200"
            : "border-gray-300 focus:ring-blue-200"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
      whileFocus={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    />
  );
}

interface AnimatedProgressProps {
  steps: string[];
  currentStep: number;
  completedSteps: number[];
}

export function AnimatedProgress({
  steps,
  currentStep,
  completedSteps,
}: AnimatedProgressProps) {
  const progress = (currentStep / (steps.length - 1)) * 100;

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="relative h-2 bg-gray-200 rounded-full mb-4 overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 15,
          }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex justify-between items-center">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const isCurrent = index === currentStep;
          const isAccessible = index <= currentStep;

          return (
            <motion.div
              key={step}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                  ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isCurrent
                      ? "bg-blue-500 text-white"
                      : isAccessible
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-200 text-gray-400"
                  }
                `}
                whileHover={isAccessible ? { scale: 1.1 } : undefined}
                animate={isCurrent ? { scale: 1.05 } : { scale: 1 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <span>{index + 1}</span>
                )}
              </motion.div>

              <motion.span
                className={`
                  text-xs mt-2 text-center max-w-16 leading-tight
                  ${
                    isCurrent
                      ? "text-blue-600 font-medium"
                      : isAccessible
                      ? "text-gray-600"
                      : "text-gray-400"
                  }
                `}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                {step}
              </motion.span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function AnimatedCard({
  children,
  className = "",
  hover = false,
}: AnimatedCardProps) {
  return (
    <motion.div
      className={`bg-white rounded-lg shadow-lg ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={
        hover
          ? { y: -2, shadow: "0 10px 25px -3px rgba(0, 0, 0, 0.1)" }
          : undefined
      }
    >
      {children}
    </motion.div>
  );
}

interface SuccessAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
}

export function SuccessAnimation({
  isVisible,
  onComplete,
}: SuccessAnimationProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onComplete}
    >
      <motion.div
        className="bg-white rounded-lg p-8 flex flex-col items-center"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
        >
          <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
        </motion.div>
        <motion.h3
          className="text-xl font-semibold text-gray-900 mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Success!
        </motion.h3>
        <motion.p
          className="text-gray-600 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          Your registration has been completed successfully.
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
