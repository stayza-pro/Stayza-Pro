"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Save,
  Eye,
  AlertCircle,
  Menu,
  X,
  MoreHorizontal,
} from "lucide-react";

interface StepInfo {
  id: number;
  title: string;
  isCompleted: boolean;
  isActive: boolean;
  hasErrors: boolean;
  isOptional?: boolean;
}

interface MobileStickyActionProps {
  steps: StepInfo[];
  currentStep: number;
  canGoBack: boolean;
  canGoNext: boolean;
  isSubmitting?: boolean;
  onBack: () => void;
  onNext: () => void;
  onPreview?: () => void;
  onSaveDraft?: () => void;
  onStepClick?: (stepId: number) => void;
  showProgress?: boolean;
  showStepList?: boolean;
  errorCount?: number;
  className?: string;
}

export const MobileStickyAction: React.FC<MobileStickyActionProps> = ({
  steps,
  currentStep,
  canGoBack,
  canGoNext,
  isSubmitting = false,
  onBack,
  onNext,
  onPreview,
  onSaveDraft,
  onStepClick,
  showProgress = true,
  showStepList = true,
  errorCount = 0,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showStepMenu, setShowStepMenu] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const currentStepInfo = steps.find((step) => step.id === currentStep);
  const completedSteps = steps.filter((step) => step.isCompleted).length;
  const totalSteps = steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  const isLastStep = currentStep === steps[steps.length - 1]?.id;
  const nextButtonText = isLastStep ? "Submit" : "Continue";

  return (
    <>
      {/* Main Action Bar */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg md:hidden ${className}`}
          >
            {/* Progress Bar */}
            {showProgress && (
              <div className="h-1 bg-gray-200">
                <motion.div
                  className="h-full bg-blue-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}

            {/* Main Content */}
            <div className="px-4 py-3">
              {/* Error Alert */}
              {errorCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-700">
                    {errorCount} error{errorCount > 1 ? "s" : ""} need
                    {errorCount === 1 ? "s" : ""} attention
                  </span>
                </motion.div>
              )}

              {/* Step Info and Actions */}
              <div className="flex items-center justify-between">
                {/* Step Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    {showStepList && (
                      <button
                        onClick={() => setShowStepMenu(true)}
                        className="p-1 text-gray-500 hover:text-gray-700 rounded"
                        title="View all steps"
                      >
                        <Menu className="w-4 h-4" />
                      </button>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">
                        Step {currentStep} of {totalSteps}
                      </p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {currentStepInfo?.title || `Step ${currentStep}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 ml-4">
                  {/* Secondary Actions */}
                  <div className="flex items-center space-x-1">
                    {onSaveDraft && (
                      <button
                        onClick={onSaveDraft}
                        className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-50"
                        title="Save draft"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    )}

                    {onPreview && (
                      <button
                        onClick={onPreview}
                        className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-50"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}

                    {/* More options */}
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-50"
                      title="More options"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Primary Navigation */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={onBack}
                      disabled={!canGoBack}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        canGoBack
                          ? "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                          : "text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      onClick={onNext}
                      disabled={!canGoNext || isSubmitting}
                      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors ${
                        canGoNext && !isSubmitting
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>{nextButtonText}</span>
                          {!isLastStep && <ChevronRight className="w-4 h-4" />}
                          {isLastStep && <Check className="w-4 h-4" />}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Options */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-gray-200"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {onSaveDraft && (
                        <button
                          onClick={onSaveDraft}
                          className="p-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg flex items-center space-x-2"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save Draft</span>
                        </button>
                      )}

                      {onPreview && (
                        <button
                          onClick={onPreview}
                          className="p-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Preview</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step Menu Overlay */}
      <AnimatePresence>
        {showStepMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-50 md:hidden"
            onClick={() => setShowStepMenu(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Menu Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Registration Steps
                  </h3>
                  <button
                    onClick={() => setShowStepMenu(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Progress Summary */}
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                      {completedSteps} of {totalSteps} completed
                    </span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Steps List */}
              <div className="p-4 space-y-3">
                {steps.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => {
                      if (onStepClick) {
                        onStepClick(step.id);
                        setShowStepMenu(false);
                      }
                    }}
                    disabled={!onStepClick}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                      step.isActive
                        ? "border-blue-600 bg-blue-50"
                        : step.isCompleted
                        ? "border-green-200 bg-green-50"
                        : step.hasErrors
                        ? "border-red-200 bg-red-50"
                        : "border-gray-200 bg-gray-50"
                    } ${
                      onStepClick ? "hover:bg-opacity-75" : "cursor-default"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Step Icon */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          step.isCompleted
                            ? "bg-green-600 text-white"
                            : step.isActive
                            ? "bg-blue-600 text-white"
                            : step.hasErrors
                            ? "bg-red-600 text-white"
                            : "bg-gray-400 text-white"
                        }`}
                      >
                        {step.isCompleted ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          step.id
                        )}
                      </div>

                      {/* Step Info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium ${
                            step.isActive
                              ? "text-blue-900"
                              : step.isCompleted
                              ? "text-green-900"
                              : step.hasErrors
                              ? "text-red-900"
                              : "text-gray-900"
                          }`}
                        >
                          {step.title}
                        </p>

                        <p
                          className={`text-sm ${
                            step.isActive
                              ? "text-blue-700"
                              : step.isCompleted
                              ? "text-green-700"
                              : step.hasErrors
                              ? "text-red-700"
                              : "text-gray-600"
                          }`}
                        >
                          {step.isCompleted
                            ? "Completed"
                            : step.isActive
                            ? "Current step"
                            : step.hasErrors
                            ? "Has errors"
                            : step.isOptional
                            ? "Optional"
                            : "Pending"}
                        </p>
                      </div>

                      {/* Status Indicator */}
                      {step.hasErrors && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer to prevent content from being hidden behind the sticky bar */}
      <div className="h-20 md:hidden" />
    </>
  );
};

export default MobileStickyAction;
