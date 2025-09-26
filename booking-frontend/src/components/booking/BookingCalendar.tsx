"use client";

import React, { useState, useMemo } from "react";
import { Button, Card } from "../ui";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface BookingCalendarProps {
  selectedDates?: {
    checkIn: Date | null;
    checkOut: Date | null;
  };
  onDatesChange: (dates: {
    checkIn: Date | null;
    checkOut: Date | null;
  }) => void;
  unavailableDates?: Date[];
  minStay?: number;
  maxStay?: number;
  className?: string;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  selectedDates = { checkIn: null, checkOut: null },
  onDatesChange,
  unavailableDates = [],
  minStay = 1,
  maxStay = 28,
  className = "",
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSelectingCheckOut, setIsSelectingCheckOut] = useState(false);

  // Generate calendar data for current month
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentDate]);

  // Check if a date is available
  const isDateAvailable = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) return false;

    return !unavailableDates.some(
      (unavailableDate) =>
        unavailableDate.toDateString() === date.toDateString()
    );
  };

  // Check if date is in range
  const isDateInRange = (date: Date): boolean => {
    if (!selectedDates.checkIn || !selectedDates.checkOut) return false;
    return date >= selectedDates.checkIn && date <= selectedDates.checkOut;
  };

  // Check if date is selected
  const isDateSelected = (date: Date): boolean => {
    return Boolean(
      (selectedDates.checkIn &&
        date.toDateString() === selectedDates.checkIn.toDateString()) ||
        (selectedDates.checkOut &&
          date.toDateString() === selectedDates.checkOut.toDateString())
    );
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    if (!isDateAvailable(date)) return;

    if (!selectedDates.checkIn || isSelectingCheckOut) {
      // Selecting check-in date or we're in check-out selection mode
      if (!selectedDates.checkIn) {
        onDatesChange({ checkIn: date, checkOut: null });
        setIsSelectingCheckOut(true);
      } else {
        // Selecting check-out date
        if (date <= selectedDates.checkIn) {
          // If selected date is before or same as check-in, reset and select as check-in
          onDatesChange({ checkIn: date, checkOut: null });
          setIsSelectingCheckOut(true);
        } else {
          // Valid check-out date
          const nights = Math.ceil(
            (date.getTime() - selectedDates.checkIn.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          if (nights > maxStay) {
            // Exceeds max stay, select as new check-in
            onDatesChange({ checkIn: date, checkOut: null });
            setIsSelectingCheckOut(true);
          } else if (nights < minStay) {
            // Below min stay, don't allow selection
            return;
          } else {
            // Valid selection
            onDatesChange({ checkIn: selectedDates.checkIn, checkOut: date });
            setIsSelectingCheckOut(false);
          }
        }
      }
    } else {
      // We have check-in but no check-out, and not in check-out selection mode
      if (date <= selectedDates.checkIn) {
        // Reset and select as check-in
        onDatesChange({ checkIn: date, checkOut: null });
        setIsSelectingCheckOut(true);
      } else {
        // Select as check-out
        const nights = Math.ceil(
          (date.getTime() - selectedDates.checkIn.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        if (nights > maxStay || nights < minStay) {
          // Invalid range, reset
          onDatesChange({ checkIn: date, checkOut: null });
          setIsSelectingCheckOut(true);
        } else {
          onDatesChange({ checkIn: selectedDates.checkIn, checkOut: date });
          setIsSelectingCheckOut(false);
        }
      }
    }
  };

  // Navigate months
  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    setCurrentDate(newDate);
  };

  // Clear selection
  const clearSelection = () => {
    onDatesChange({ checkIn: null, checkOut: null });
    setIsSelectingCheckOut(false);
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const nights =
    selectedDates.checkIn && selectedDates.checkOut
      ? Math.ceil(
          (selectedDates.checkOut.getTime() - selectedDates.checkIn.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Select Dates
        </h3>

        {(selectedDates.checkIn || selectedDates.checkOut) && (
          <Button variant="outline" size="sm" onClick={clearSelection}>
            Clear
          </Button>
        )}
      </div>

      {/* Selected Dates Display */}
      {(selectedDates.checkIn || selectedDates.checkOut) && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-600 mb-1">Check-in</div>
              <div className="font-medium">
                {selectedDates.checkIn
                  ? selectedDates.checkIn.toLocaleDateString()
                  : "Select date"}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">Check-out</div>
              <div className="font-medium">
                {selectedDates.checkOut
                  ? selectedDates.checkOut.toLocaleDateString()
                  : "Select date"}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">Nights</div>
              <div className="font-medium">
                {nights > 0 ? `${nights} nights` : "-"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth("prev")}
          className="p-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h4 className="text-lg font-medium text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h4>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth("next")}
          className="p-2"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {dayNames.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-gray-600 border-b"
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarData.map((date, index) => {
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const isToday = date.toDateString() === new Date().toDateString();
          const isAvailable = isDateAvailable(date);
          const isSelected = isDateSelected(date);
          const isInRange = isDateInRange(date);

          return (
            <div
              key={index}
              onClick={() =>
                isAvailable && isCurrentMonth && handleDateClick(date)
              }
              className={`
                relative p-2 min-h-[40px] text-center text-sm cursor-pointer border transition-all duration-200
                ${isCurrentMonth ? "text-gray-900" : "text-gray-400"}
                ${
                  !isAvailable
                    ? "cursor-not-allowed opacity-50 bg-gray-100"
                    : ""
                }
                ${
                  isToday && !isSelected
                    ? "bg-blue-100 border-blue-300"
                    : "border-gray-200"
                }
                ${isSelected ? "bg-blue-600 text-white font-medium" : ""}
                ${isInRange && !isSelected ? "bg-blue-100" : ""}
                ${isAvailable && isCurrentMonth ? "hover:bg-blue-50" : ""}
                ${isSelected ? "hover:bg-blue-700" : ""}
              `}
            >
              {date.getDate()}

              {/* Unavailable indicator */}
              {!isAvailable && isCurrentMonth && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-0.5 h-6 bg-red-400 transform rotate-45" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stay Requirements */}
      <div className="mt-4 text-sm text-gray-600 text-center">
        {minStay > 1 && <div>Minimum stay: {minStay} nights</div>}
        {maxStay < 365 && <div>Maximum stay: {maxStay} nights</div>}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-4 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-600 rounded" />
          <span>Selected</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded" />
          <span>In Range</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-0.5 h-2 bg-red-400 transform rotate-45" />
            </div>
          </div>
          <span>Unavailable</span>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-4 text-center text-sm text-gray-600">
        {!selectedDates.checkIn
          ? "Select your check-in date"
          : !selectedDates.checkOut
          ? "Select your check-out date"
          : `${nights} nights selected`}
      </div>
    </Card>
  );
};
