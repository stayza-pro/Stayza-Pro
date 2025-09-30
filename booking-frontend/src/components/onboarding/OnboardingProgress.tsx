import React from "react";
import { CheckCircle } from "lucide-react";

interface Step {
  id: number;
  title: string;
  description: string;
}

interface OnboardingProgressProps {
  steps: Step[];
  currentStep: number;
}

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  steps,
  currentStep,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center flex-1">
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors ${
                  step.id < currentStep
                    ? "bg-green-500 border-green-500 text-white"
                    : step.id === currentStep
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "border-gray-300 text-gray-400"
                }`}
              >
                {step.id < currentStep ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <span className="text-sm font-semibold">{step.id}</span>
                )}
              </div>
              <div className="mt-3 text-center">
                <h3
                  className={`text-sm font-medium ${
                    step.id <= currentStep ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {step.title}
                </h3>
                <p
                  className={`text-xs mt-1 ${
                    step.id <= currentStep ? "text-gray-600" : "text-gray-400"
                  }`}
                >
                  {step.description}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 bg-gray-200 mx-4 mt-6">
                <div
                  className={`h-full transition-colors ${
                    step.id < currentStep ? "bg-green-500" : "bg-gray-200"
                  }`}
                  style={{
                    width: step.id < currentStep ? "100%" : "0%",
                  }}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
