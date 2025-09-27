"use client";

import React, { useState, useMemo } from "react";
import { Button, Card } from "../ui";
import { ChevronLeft, ChevronRight, Calendar, Ban } from "lucide-react";

interface AvailabilityRule {
  id?: string;
  startDate: string;
  endDate: string;
  isAvailable: boolean;
  minStay?: number;
  maxStay?: number;
  priceOverride?: number;
  reason?: string;
}

interface PropertyAvailabilityProps {
  availabilityRules: AvailabilityRule[];
  onRulesChange: (rules: AvailabilityRule[]) => void;
  basePrice: number;
  currency: string;
  isLoading?: boolean;
  className?: string;
}

export const PropertyAvailability: React.FC<PropertyAvailabilityProps> = ({
  availabilityRules,
  onRulesChange,
  basePrice,
  currency,
  isLoading = false,
  className = "",
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AvailabilityRule | null>(null);

  const [ruleForm, setRuleForm] = useState({
    isAvailable: true,
    minStay: 1,
    maxStay: 30,
    priceOverride: basePrice,
    reason: "",
  });

  // Generate calendar data
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

  // Get rule for a specific date
  const getRuleForDate = (date: Date): AvailabilityRule | null => {
    const dateStr = date.toISOString().split("T")[0];
    return (
      availabilityRules.find(
        (rule) => dateStr >= rule.startDate && dateStr <= rule.endDate
      ) || null
    );
  };

  // Format date string
  const formatDate = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  // Handle date selection
  const handleDateClick = (date: Date) => {
    const dateStr = formatDate(date);

    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter((d) => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr]);
    }
  };

  // Navigate calendar
  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    setCurrentDate(newDate);
  };

  // Create new rule
  const handleCreateRule = () => {
    if (selectedDates.length === 0) return;

    const sortedDates = selectedDates.sort();
    const newRule: AvailabilityRule = {
      id: Date.now().toString(),
      startDate: sortedDates[0],
      endDate: sortedDates[sortedDates.length - 1],
      isAvailable: ruleForm.isAvailable,
      minStay: ruleForm.minStay,
      maxStay: ruleForm.maxStay,
      priceOverride: ruleForm.isAvailable ? ruleForm.priceOverride : undefined,
      reason: ruleForm.reason || undefined,
    };

    onRulesChange([...availabilityRules, newRule]);
    setSelectedDates([]);
    setShowRuleForm(false);
    setRuleForm({
      isAvailable: true,
      minStay: 1,
      maxStay: 30,
      priceOverride: basePrice,
      reason: "",
    });
  };

  // Edit rule
  const handleEditRule = (rule: AvailabilityRule) => {
    setEditingRule(rule);
    setRuleForm({
      isAvailable: rule.isAvailable,
      minStay: rule.minStay || 1,
      maxStay: rule.maxStay || 30,
      priceOverride: rule.priceOverride || basePrice,
      reason: rule.reason || "",
    });
    setShowRuleForm(true);
  };

  // Update rule
  const handleUpdateRule = () => {
    if (!editingRule) return;

    const updatedRules = availabilityRules.map((rule) =>
      rule.id === editingRule.id
        ? {
            ...rule,
            isAvailable: ruleForm.isAvailable,
            minStay: ruleForm.minStay,
            maxStay: ruleForm.maxStay,
            priceOverride: ruleForm.isAvailable
              ? ruleForm.priceOverride
              : undefined,
            reason: ruleForm.reason || undefined,
          }
        : rule
    );

    onRulesChange(updatedRules);
    setEditingRule(null);
    setShowRuleForm(false);
  };

  // Delete rule
  const handleDeleteRule = (ruleId: string) => {
    onRulesChange(availabilityRules.filter((rule) => rule.id !== ruleId));
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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Calendar Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Property Availability
          </h2>

          <div className="flex items-center space-x-4">
            {selectedDates.length > 0 && (
              <Button
                variant="primary"
                onClick={() => setShowRuleForm(true)}
                disabled={isLoading}
              >
                Set Availability ({selectedDates.length} days)
              </Button>
            )}
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            onClick={() => navigateMonth("prev")}
            disabled={isLoading}
            className="p-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h3 className="text-lg font-medium text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>

          <Button
            variant="outline"
            onClick={() => navigateMonth("next")}
            disabled={isLoading}
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
            const dateStr = formatDate(date);
            const rule = getRuleForDate(date);
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const isToday = dateStr === formatDate(new Date());
            const isSelected = selectedDates.includes(dateStr);
            const isPast = date < new Date(new Date().toDateString());

            return (
              <div
                key={index}
                onClick={() =>
                  !isPast && isCurrentMonth && handleDateClick(date)
                }
                className={`
                  relative p-2 min-h-[40px] text-center text-sm cursor-pointer border transition-colors
                  ${isCurrentMonth ? "text-gray-900" : "text-gray-400"}
                  ${isPast ? "cursor-not-allowed opacity-50" : ""}
                  ${isToday ? "bg-blue-100 border-blue-300" : "border-gray-200"}
                  ${isSelected ? "bg-blue-600 text-white" : ""}
                  ${
                    rule && !isSelected
                      ? rule.isAvailable
                        ? "bg-green-100"
                        : "bg-red-100"
                      : ""
                  }
                  ${!isPast && isCurrentMonth ? "hover:bg-gray-100" : ""}
                  ${isSelected ? "hover:bg-blue-700" : ""}
                `}
              >
                <div>{date.getDate()}</div>

                {/* Rule Indicator */}
                {rule && !isSelected && (
                  <div className="absolute bottom-0 left-0 right-0 h-1">
                    <div
                      className={`h-full ${
                        rule.isAvailable ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                  </div>
                )}

                {/* Price Override Indicator */}
                {rule &&
                  rule.priceOverride &&
                  rule.priceOverride !== basePrice &&
                  !isSelected && (
                    <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-500 rounded-full" />
                  )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 mt-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded" />
            <span>Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded" />
            <span>Blocked</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded" />
            <span>Selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-200 border border-gray-300 rounded relative">
              <div className="absolute top-0 right-0 w-1 h-1 bg-yellow-500 rounded-full" />
            </div>
            <span>Custom Price</span>
          </div>
        </div>
      </Card>

      {/* Rule Form Modal */}
      {showRuleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingRule ? "Edit Availability Rule" : "Set Availability"}
            </h3>

            <div className="space-y-4">
              {/* Availability Toggle */}
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={ruleForm.isAvailable}
                    onChange={(e) =>
                      setRuleForm({
                        ...ruleForm,
                        isAvailable: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Available for booking
                  </span>
                </label>
              </div>

              {/* Stay Requirements */}
              {ruleForm.isAvailable && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Stay (nights)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={ruleForm.minStay}
                        onChange={(e) =>
                          setRuleForm({
                            ...ruleForm,
                            minStay: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Stay (nights)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={ruleForm.maxStay}
                        onChange={(e) =>
                          setRuleForm({
                            ...ruleForm,
                            maxStay: parseInt(e.target.value) || 30,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Price Override */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price per Night ({currency})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={ruleForm.priceOverride}
                      onChange={(e) =>
                        setRuleForm({
                          ...ruleForm,
                          priceOverride:
                            parseFloat(e.target.value) || basePrice,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Base price: {currency} {basePrice}
                    </p>
                  </div>
                </>
              )}

              {/* Reason (for blocked dates) */}
              {!ruleForm.isAvailable && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason (Optional)
                  </label>
                  <input
                    type="text"
                    value={ruleForm.reason}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, reason: e.target.value })
                    }
                    placeholder="e.g., Maintenance, Personal use"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRuleForm(false);
                  setEditingRule(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={editingRule ? handleUpdateRule : handleCreateRule}
                loading={isLoading}
                disabled={isLoading}
              >
                {editingRule ? "Update" : "Create"} Rule
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Existing Rules */}
      {availabilityRules.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Current Availability Rules
          </h3>

          <div className="space-y-3">
            {availabilityRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`p-2 rounded-full ${
                      rule.isAvailable ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    {rule.isAvailable ? (
                      <Calendar className="h-4 w-4 text-green-600" />
                    ) : (
                      <Ban className="h-4 w-4 text-red-600" />
                    )}
                  </div>

                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(rule.startDate).toLocaleDateString()} -{" "}
                      {new Date(rule.endDate).toLocaleDateString()}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span
                        className={
                          rule.isAvailable ? "text-green-600" : "text-red-600"
                        }
                      >
                        {rule.isAvailable ? "Available" : "Blocked"}
                      </span>
                      {rule.isAvailable && (
                        <>
                          <span>
                            Stay: {rule.minStay}-{rule.maxStay} nights
                          </span>
                          {rule.priceOverride && (
                            <span className="font-medium">
                              {currency} {rule.priceOverride}/night
                            </span>
                          )}
                        </>
                      )}
                      {rule.reason && (
                        <span className="italic">
                          &ldquo;{rule.reason}&rdquo;
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditRule(rule)}
                    disabled={isLoading}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rule.id && handleDeleteRule(rule.id)}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
