"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import DatePicker from "react-datepicker";
import { format, isValid, parse } from "date-fns";
import { cn } from "@/utils/cn";

interface BaseAnimatedInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  unavailableDates?: Array<string | Date>;
  disablePastDates?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  inputWrapperClassName?: string;
  inputClassName?: string;
  iconClassName?: string;
}

type Meridiem = "AM" | "PM";

const toTwoDigits = (value: number): string =>
  value.toString().padStart(2, "0");

const parseDateValue = (value: string): Date | null => {
  if (!value) return null;
  const parsedDate = parse(value, "yyyy-MM-dd", new Date());
  return isValid(parsedDate) ? parsedDate : null;
};

const parseFlexibleDateValue = (value: string): Date | null => {
  const parsed = parseDateValue(value);
  if (parsed) return parsed;

  const fallback = new Date(value);
  return isValid(fallback) ? fallback : null;
};

const normalizeDate = (value: Date): Date => {
  const normalized = new Date(value);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const toDateKey = (value: Date): string =>
  format(normalizeDate(value), "yyyy-MM-dd");

const parseTimeValue = (
  value: string,
): {
  hour12: number;
  minute: number;
  meridiem: Meridiem;
} => {
  const timeMatch = value.match(/^(\d{1,2}):(\d{2})$/);

  if (!timeMatch) {
    return { hour12: 2, minute: 0, meridiem: "PM" };
  }

  const hour24 = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (!Number.isFinite(hour24) || hour24 < 0 || hour24 > 23) {
    return { hour12: 2, minute: 0, meridiem: "PM" };
  }

  const safeMinute =
    Number.isFinite(minute) && minute >= 0 && minute <= 59 ? minute : 0;
  const meridiem: Meridiem = hour24 >= 12 ? "PM" : "AM";

  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return {
    hour12,
    minute: safeMinute,
    meridiem,
  };
};

const to24Hour = (hour12: number, meridiem: Meridiem): number => {
  if (meridiem === "AM") {
    return hour12 === 12 ? 0 : hour12;
  }

  return hour12 === 12 ? 12 : hour12 + 12;
};

const AnimatedInputShell = ({
  label,
  className,
  labelClassName,
  inputWrapperClassName,
  iconClassName,
  isFocused,
  isActive,
  disabled,
  icon: Icon,
  children,
}: {
  label: string;
  className?: string;
  labelClassName?: string;
  inputWrapperClassName?: string;
  iconClassName?: string;
  isFocused: boolean;
  isActive: boolean;
  disabled?: boolean;
  icon: typeof CalendarDays | typeof Clock;
  children: React.ReactNode;
}) => (
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
        borderColor: isFocused
          ? "rgba(59, 130, 246, 0.55)"
          : "rgba(229, 231, 235, 1)",
        boxShadow: isFocused
          ? "0 10px 26px rgba(37, 99, 235, 0.20), 0 0 0 3px rgba(59, 130, 246, 0.18)"
          : "0 6px 18px rgba(15, 23, 42, 0.05)",
      }}
      className={cn(
        "relative overflow-visible rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50",
        inputWrapperClassName,
      )}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-blue-100/45 to-transparent"
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
          "pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-gray-500",
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

      <div className="pointer-events-none absolute right-4 top-1/2 z-10 -translate-y-1/2 text-gray-700">
        <ChevronDown className="h-5 w-5" />
      </div>

      {children}
    </motion.div>
  </motion.div>
);

export const AnimatedDateInput = ({
  label,
  value,
  onChange,
  min,
  max,
  unavailableDates,
  disablePastDates = false,
  required,
  disabled,
  className,
  labelClassName,
  inputWrapperClassName,
  inputClassName,
  iconClassName,
}: BaseAnimatedInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const selectedDate = useMemo(() => parseDateValue(value), [value]);
  const minDate = useMemo(() => parseDateValue(min || ""), [min]);
  const maxDate = useMemo(() => parseDateValue(max || ""), [max]);
  const today = useMemo(() => normalizeDate(new Date()), []);
  const unavailableDateKeys = useMemo(() => {
    const keys = new Set<string>();

    (unavailableDates || []).forEach((item) => {
      const date =
        item instanceof Date ? item : parseFlexibleDateValue(String(item));

      if (date) {
        keys.add(toDateKey(date));
      }
    });

    return keys;
  }, [unavailableDates]);

  const effectiveMinDate = useMemo(() => {
    if (!disablePastDates) {
      return minDate || null;
    }

    if (!minDate) {
      return today;
    }

    return minDate > today ? minDate : today;
  }, [disablePastDates, minDate, today]);

  const isDateSelectable = React.useCallback(
    (candidateDate: Date) => {
      const normalizedCandidate = normalizeDate(candidateDate);

      if (effectiveMinDate && normalizedCandidate < effectiveMinDate) {
        return false;
      }

      if (maxDate && normalizedCandidate > maxDate) {
        return false;
      }

      return !unavailableDateKeys.has(toDateKey(normalizedCandidate));
    },
    [effectiveMinDate, maxDate, unavailableDateKeys],
  );

  return (
    <AnimatedInputShell
      label={label}
      className={className}
      labelClassName={labelClassName}
      inputWrapperClassName={inputWrapperClassName}
      iconClassName={iconClassName}
      isFocused={isFocused}
      isActive={Boolean(value)}
      disabled={disabled}
      icon={CalendarDays}
    >
      <DatePicker
        selected={selectedDate}
        onChange={(date: Date | null) =>
          onChange(date ? format(date, "yyyy-MM-dd") : "")
        }
        minDate={effectiveMinDate || undefined}
        maxDate={maxDate || undefined}
        filterDate={isDateSelectable}
        dayClassName={(date) =>
          unavailableDateKeys.has(toDateKey(date))
            ? "react-datepicker__day--blocked"
            : null
        }
        onCalendarOpen={() => setIsFocused(true)}
        onCalendarClose={() => setIsFocused(false)}
        dateFormat="MMM d, yyyy"
        placeholderText="mm/dd/yyyy"
        disabled={disabled}
        required={required}
        renderCustomHeader={({
          date,
          decreaseMonth,
          increaseMonth,
          prevMonthButtonDisabled,
          nextMonthButtonDisabled,
        }) => (
          <div className="stayza-cal-header">
            <button
              type="button"
              onClick={decreaseMonth}
              disabled={prevMonthButtonDisabled}
              aria-label="Previous month"
              className="stayza-cal-nav-btn"
            >
              <ChevronLeft strokeWidth={2.2} />
            </button>

            <span className="stayza-cal-month-label">
              {format(date, "MMMM yyyy")}
            </span>

            <button
              type="button"
              onClick={increaseMonth}
              disabled={nextMonthButtonDisabled}
              aria-label="Next month"
              className="stayza-cal-nav-btn"
            >
              <ChevronRight strokeWidth={2.2} />
            </button>
          </div>
        )}
        className={cn(
          "relative z-20 h-12 w-full cursor-pointer bg-transparent pl-12 pr-12 text-gray-900 outline-none transition-colors duration-200",
          disabled ? "cursor-not-allowed opacity-60" : "",
          inputClassName,
        )}
        wrapperClassName="block w-full"
        calendarClassName="stayza-datepicker"
        popperClassName="stayza-datepicker-popper"
        popperPlacement="bottom-start"
        portalId="datepicker-portal"
      />
    </AnimatedInputShell>
  );
};

export const AnimatedTimeInput = ({
  label,
  value,
  onChange,
  required,
  disabled,
  className,
  labelClassName,
  inputWrapperClassName,
  inputClassName,
  iconClassName,
}: BaseAnimatedInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { hour12, minute, meridiem } = useMemo(
    () => parseTimeValue(value || "14:00"),
    [value],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const hours = useMemo(
    () => Array.from({ length: 12 }, (_, index) => index + 1),
    [],
  );
  const minutes = useMemo(
    () => Array.from({ length: 60 }, (_, index) => index),
    [],
  );

  const updateTime = (
    nextHour12: number = hour12,
    nextMinute: number = minute,
    nextMeridiem: Meridiem = meridiem,
  ) => {
    const hour24 = to24Hour(nextHour12, nextMeridiem);
    onChange(`${toTwoDigits(hour24)}:${toTwoDigits(nextMinute)}`);
  };

  const displayValue = value
    ? `${toTwoDigits(hour12)}:${toTwoDigits(minute)} ${meridiem}`
    : "Select time";

  return (
    <div ref={containerRef} className="relative">
      <AnimatedInputShell
        label={label}
        className={className}
        labelClassName={labelClassName}
        inputWrapperClassName={inputWrapperClassName}
        iconClassName={iconClassName}
        isFocused={isOpen}
        isActive={Boolean(value)}
        disabled={disabled}
        icon={Clock}
      >
        <button
          type="button"
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={cn(
            "relative z-20 h-12 w-full pl-12 pr-12 text-left text-gray-900 outline-none transition-colors duration-200",
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            inputClassName,
          )}
          disabled={disabled}
        >
          {displayValue}
        </button>

        {required && <input type="hidden" value={value} readOnly required />}
      </AnimatedInputShell>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute z-[70] mt-2 w-full min-w-[300px] rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
          >
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Hour
                </div>
                <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
                  {hours.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => updateTime(h, minute, meridiem)}
                      className={cn(
                        "w-full rounded-lg px-2 py-2 text-sm transition-colors",
                        h === hour12
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-blue-50",
                      )}
                    >
                      {toTwoDigits(h)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Minute
                </div>
                <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
                  {minutes.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => updateTime(hour12, m, meridiem)}
                      className={cn(
                        "w-full rounded-lg px-2 py-2 text-sm transition-colors",
                        m === minute
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-blue-50",
                      )}
                    >
                      {toTwoDigits(m)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Period
                </div>
                <div className="space-y-1">
                  {(["AM", "PM"] as const).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => updateTime(hour12, minute, period)}
                      className={cn(
                        "w-full rounded-lg px-2 py-2 text-sm font-semibold transition-colors",
                        period === meridiem
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-blue-50",
                      )}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-end border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
