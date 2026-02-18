"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock } from "lucide-react";
import { cn } from "@/utils/cn";

interface BaseAnimatedInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  inputWrapperClassName?: string;
  inputClassName?: string;
  iconClassName?: string;
}

const AnimatedField = ({
  type,
  label,
  value,
  onChange,
  min,
  max,
  required,
  disabled,
  className,
  labelClassName,
  inputWrapperClassName,
  inputClassName,
  iconClassName,
  icon: Icon,
}: BaseAnimatedInputProps & {
  type: "date" | "time";
  icon: typeof CalendarDays | typeof Clock;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isFocused || Boolean(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={cn("space-y-2", className)}
    >
      <label className={cn("text-sm font-medium text-gray-900", labelClassName)}>
        {label}
      </label>
      <motion.div
        whileHover={disabled ? undefined : { y: -1, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        animate={{
          borderColor: isFocused ? "rgba(59, 130, 246, 0.55)" : "rgba(229, 231, 235, 1)",
          boxShadow: isFocused
            ? "0 10px 26px rgba(37, 99, 235, 0.20), 0 0 0 3px rgba(59, 130, 246, 0.18)"
            : "0 6px 18px rgba(15, 23, 42, 0.05)",
        }}
        className={cn(
          "relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50",
          inputWrapperClassName,
        )}
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/45 to-transparent"
          initial={{ x: "-120%", opacity: 0 }}
          animate={
            isFocused
              ? { x: ["-120%", "120%"], opacity: [0, 1, 0] }
              : { x: "-120%", opacity: 0 }
          }
          transition={{
            duration: 1.15,
            ease: "easeInOut",
            repeat: isFocused ? Infinity : 0,
            repeatDelay: 0.5,
          }}
        />

        <div
          className={cn(
            "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500",
            iconClassName,
          )}
        >
          <motion.div
            animate={{
              scale: isActive ? 1.07 : 1,
              rotate: isFocused ? -6 : 0,
              y: isFocused ? -1 : 0,
            }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
          >
            <Icon className="h-5 w-5" />
          </motion.div>
        </div>
        <input
          type={type}
          value={value}
          min={min}
          max={max}
          required={required}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "h-12 w-full bg-transparent pl-12 pr-4 text-gray-900 outline-none transition-colors duration-200",
            "[-webkit-appearance:none] [appearance:none]",
            "cursor-pointer",
            disabled ? "cursor-not-allowed opacity-60" : "",
            inputClassName,
          )}
        />
      </motion.div>
    </motion.div>
  );
};

export const AnimatedDateInput = (props: BaseAnimatedInputProps) => (
  <AnimatedField {...props} type="date" icon={CalendarDays} />
);

export const AnimatedTimeInput = (props: BaseAnimatedInputProps) => (
  <AnimatedField {...props} type="time" icon={Clock} />
);
