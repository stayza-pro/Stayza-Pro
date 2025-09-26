import React from "react";
import { cn } from "../../utils/cn";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      // Base styles
      "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200",
      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
      "disabled:opacity-50 disabled:cursor-not-allowed",

      // Size variants
      {
        "px-3 py-1.5 text-sm": size === "sm",
        "px-4 py-2 text-sm": size === "md",
        "px-6 py-3 text-base": size === "lg",
        "px-8 py-4 text-lg": size === "xl",
      },

      // Color variants
      {
        // Primary
        "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800":
          variant === "primary" && !disabled,

        // Secondary
        "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300":
          variant === "secondary" && !disabled,

        // Outline
        "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100":
          variant === "outline" && !disabled,

        // Ghost
        "text-gray-700 hover:bg-gray-100 active:bg-gray-200":
          variant === "ghost" && !disabled,

        // Destructive
        "bg-red-600 text-white hover:bg-red-700 active:bg-red-800":
          variant === "destructive" && !disabled,
      },

      // Full width
      {
        "w-full": fullWidth,
      },

      className
    );

    return (
      <button
        ref={ref}
        className={baseStyles}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="w-4 h-4 mr-2 animate-spin"
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
        )}

        {leftIcon && !loading && (
          <span className="mr-2 flex items-center">{leftIcon}</span>
        )}

        {children}

        {rightIcon && (
          <span className="ml-2 flex items-center">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
