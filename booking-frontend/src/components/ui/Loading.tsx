import React from "react";
import { cn } from "../../utils/cn";

export interface LoadingProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "primary" | "secondary" | "white";
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  size = "md",
  color = "primary",
  text,
  fullScreen = false,
  className,
}) => {
  const spinner = (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <svg
        className={cn(
          "animate-spin",
          {
            "w-4 h-4": size === "sm",
            "w-6 h-6": size === "md",
            "w-8 h-8": size === "lg",
            "w-12 h-12": size === "xl",
          },
          {
            "text-blue-600": color === "primary",
            "text-gray-600": color === "secondary",
            "text-white": color === "white",
          }
        )}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>

      {text && (
        <p
          className={cn("mt-2 text-sm font-medium", {
            "text-gray-600": color === "primary" || color === "secondary",
            "text-white": color === "white",
          })}
        >
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        {spinner}
      </div>
    );
  }

  return spinner;
};

// Skeleton loader component
export interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = "rectangular",
  width,
  height,
  animation = true,
}) => {
  return (
    <div
      className={cn(
        "bg-gray-200 dark:bg-gray-700",
        {
          "rounded-full": variant === "circular",
          rounded: variant === "rectangular",
          "rounded-sm": variant === "text",
        },
        {
          "animate-pulse": animation,
        },
        variant === "text" && "h-4",
        className
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
    />
  );
};

export default Loading;
