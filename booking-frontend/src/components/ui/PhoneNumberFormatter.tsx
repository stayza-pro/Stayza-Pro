"use client";

import React from "react";

interface PhoneNumberFormatterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export const PhoneNumberFormatter: React.FC<PhoneNumberFormatterProps> = ({
  value,
  onChange,
  placeholder = "Enter phone number",
  className = "",
  disabled = false,
  required = false,
}) => {
  const formatPhoneNumber = (input: string): string => {
    // Remove all non-numeric characters
    const numbers = input.replace(/\D/g, "");

    // Handle Nigerian phone numbers
    if (numbers.startsWith("234")) {
      // International format: +234 xxx xxx xxxx
      const formatted = numbers.replace(
        /^234(\d{3})(\d{3})(\d{4})$/,
        "+234 $1 $2 $3"
      );
      return formatted;
    } else if (numbers.startsWith("0")) {
      // Local format: 0xxx xxx xxxx
      const formatted = numbers.replace(
        /^0(\d{3})(\d{3})(\d{4})$/,
        "0$1 $2 $3"
      );
      return formatted;
    } else if (numbers.length <= 10) {
      // Assume local number without leading 0
      const formatted = numbers.replace(/^(\d{3})(\d{3})(\d{4})$/, "0$1 $2 $3");
      return formatted;
    }

    // Return as-is if doesn't match expected patterns
    return input;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onChange(formatted);
  };

  return (
    <input
      type="tel"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={`
        w-full px-3 py-2 border border-gray-300 rounded-md
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        disabled:bg-gray-100 disabled:cursor-not-allowed
        ${className}
      `.trim()}
      disabled={disabled}
      required={required}
    />
  );
};

export default PhoneNumberFormatter;
