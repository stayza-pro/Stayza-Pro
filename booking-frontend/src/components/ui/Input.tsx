import React from "react";
import { cn } from "../../utils/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = true,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = props.id; // Only use explicitly provided IDs

    return (
      <div className={cn("flex flex-col space-y-2", fullWidth && "w-full")}>
        {label && inputId && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {label && !inputId && (
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </div>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-gray-400">{leftIcon}</span>
            </div>
          )}

          <input
            ref={ref}
            type={type}
            id={inputId}
            className={cn(
              // Base styles
              "block w-full rounded-lg border transition-colors duration-200",
              "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2",

              // Padding
              {
                "pl-10": leftIcon,
                "pr-10": rightIcon,
                "px-3 py-2": !leftIcon && !rightIcon,
                "pl-3 py-2 pr-10": !leftIcon && rightIcon,
                "pl-10 py-2 pr-3": leftIcon && !rightIcon,
              },

              // States
              {
                // Normal state
                "border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500":
                  !error && !disabled,

                // Error state
                "border-red-500 bg-white text-gray-900 focus:border-red-500 focus:ring-red-500":
                  error && !disabled,

                // Disabled state
                "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed":
                  disabled,
              },

              // Dark mode
              "dark:bg-gray-800 dark:border-gray-600 dark:text-white",
              "dark:placeholder:text-gray-400",

              className
            )}
            disabled={disabled}
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className={cn("text-gray-400", error && "text-red-500")}>
                {rightIcon}
              </span>
            </div>
          )}
        </div>

        {(error || helperText) && (
          <div className="text-sm">
            {error ? (
              <span className="text-red-600 dark:text-red-400">{error}</span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">
                {helperText}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
