import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/utils/cn";

interface MobileStickyActionProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  canContinue: boolean;
  isLastStep: boolean;
  isSubmitting?: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  errors?: Record<string, string>;
  className?: string;
  showProgress?: boolean;
  ctaText?: string;
  submitText?: string;
}

export const MobileStickyAction: React.FC<MobileStickyActionProps> = ({
  currentStep,
  totalSteps,
  stepLabels,
  canContinue,
  isLastStep,
  isSubmitting = false,
  onNext,
  onPrevious,
  onSubmit,
  errors = {},
  className,
  showProgress = true,
  ctaText = "Continue",
  submitText = "Create Account",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Show/hide based on mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsVisible(window.innerWidth < 768); // Show on mobile/tablet
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle virtual keyboard on mobile
  useEffect(() => {
    const handleResize = () => {
      // Detect virtual keyboard by viewport height change
      const viewportHeight =
        window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.screen.height;

      setIsKeyboardVisible(viewportHeight < windowHeight * 0.75);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
      return () =>
        window.visualViewport?.removeEventListener("resize", handleResize);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const progress = ((currentStep + 1) / totalSteps) * 100;
  const errorCount = Object.keys(errors).length;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{
          y: isKeyboardVisible ? 100 : 0,
          opacity: isKeyboardVisible ? 0 : 1,
        }}
        exit={{ y: 100, opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg",
          "safe-area-inset-bottom", // Handle iOS safe areas
          className
        )}
      >
        {/* Progress Bar */}
        {showProgress && (
          <div className="relative h-1 bg-gray-100">
            <motion.div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-purple-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        )}

        <div className="p-4 pb-safe">
          {/* Step Info & Error Summary */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">
                Step {currentStep + 1} of {totalSteps}
              </span>
              <span className="text-xs text-gray-700 font-medium">
                {stepLabels[currentStep]}
              </span>
            </div>

            {/* Error Indicator */}
            {errorCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 px-2 py-1 bg-red-50 rounded-full"
              >
                <AlertCircle className="h-3 w-3 text-red-500" />
                <span className="text-xs text-red-600 font-medium">
                  {errorCount} error{errorCount > 1 ? "s" : ""}
                </span>
              </motion.div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Previous Button */}
            <motion.button
              type="button"
              onClick={onPrevious}
              disabled={currentStep === 0 || isSubmitting}
              className={cn(
                "flex items-center justify-center w-12 h-12 rounded-xl transition-all",
                currentStep === 0 || isSubmitting
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95"
              )}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="h-5 w-5" />
            </motion.button>

            {/* Main Action Button */}
            <motion.button
              type="button"
              onClick={isLastStep ? onSubmit : onNext}
              disabled={!canContinue || isSubmitting}
              className={cn(
                "flex-1 flex items-center justify-center h-12 rounded-xl font-semibold text-white transition-all",
                "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
                "disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed",
                "shadow-lg hover:shadow-xl active:scale-[0.98]"
              )}
              whileTap={{ scale: 0.98 }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Creating Account...
                </>
              ) : isLastStep ? (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  {submitText}
                </>
              ) : (
                <>
                  {ctaText}
                  <ChevronRight className="h-5 w-5 ml-2" />
                </>
              )}
            </motion.button>
          </div>

          {/* Progress Dots */}
          {showProgress && (
            <div className="flex justify-center gap-2 mt-3">
              {Array.from({ length: totalSteps }, (_, index) => (
                <motion.div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index <= currentStep ? "bg-blue-600" : "bg-gray-300"
                  )}
                  animate={{
                    scale: index === currentStep ? 1.2 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Safe area padding for devices with home indicator */}
        <div className="h-safe-bottom" />
      </motion.div>
    </AnimatePresence>
  );
};

// Hook for managing sticky action state
export const useMobileStickyAction = (
  currentStep: number,
  totalSteps: number,
  formValidation: (step: number) => boolean
) => {
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    setCanContinue(formValidation(currentStep));
  }, [currentStep, formValidation]);

  return { canContinue };
};

export default MobileStickyAction;
