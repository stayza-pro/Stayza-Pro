import React, { useId } from "react";
import { cn } from "../../utils/cn";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  id?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      placeholder,
      error,
      helperText,
      fullWidth = true,
      disabled,
      required,
      value,
      onChange,
      options,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || `select-${generatedId}`;

    return (
      <div className={cn("flex flex-col space-y-2", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={cn(
              // Base styles
              "block w-full rounded-lg border transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              "appearance-none px-3 py-2 pr-10",

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

                // Placeholder state
                "text-gray-400": !value,
              },

              // Dark mode
              "dark:bg-gray-800 dark:border-gray-600 dark:text-white",

              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown
              className={cn("h-4 w-4 text-gray-400", error && "text-red-500")}
            />
          </div>
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

Select.displayName = "Select";

export default Select;
