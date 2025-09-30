import React from "react";
import { cn } from "../../utils/cn";

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  resize?: "none" | "vertical" | "horizontal" | "both";
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      fullWidth = true,
      resize = "vertical",
      disabled,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const textareaId =
      props.id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    const resizeClass = {
      none: "resize-none",
      vertical: "resize-y",
      horizontal: "resize-x",
      both: "resize",
    };

    return (
      <div className={cn("flex flex-col space-y-2", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            // Base styles
            "block w-full rounded-lg border transition-colors duration-200",
            "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2",
            "px-3 py-2",

            // Resize
            resizeClass[resize],

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

TextArea.displayName = "TextArea";

export default TextArea;
