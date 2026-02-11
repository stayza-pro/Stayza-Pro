"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Percent,
  Save,
  Info,
  TrendingUp,
  Calculator,
  Target,
  AlertCircle,
  CheckCircle,
  Download,
  Zap,
} from "lucide-react";
import {
  PlatformSetting,
  updateCommissionRate,
} from "@/services/settingsService";
import { getAnalytics, type PlatformAnalytics } from "@/services/adminService";
import toast from "react-hot-toast";

interface CommissionSettingsProps {
  settings: PlatformSetting[];
  onUpdate: (key: string, value: number) => void;
  onSaveSuccess: (message: string) => void;
  onSaveError: (error: string) => void;
}

interface CommissionImpactAnalysis {
  currentMonthlyRevenue: number;
  currentCommission: number;
  newCommission: number;
  difference: number;
  percentageChange: number;
  averageBookingValue: number;
  projectedAnnualImpact: number;
}

const CommissionSettings: React.FC<CommissionSettingsProps> = ({
  settings,
  onUpdate,
  onSaveSuccess,
  onSaveError,
}) => {
  const [saving, setSaving] = useState(false);
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [showAdvancedCalculator, setShowAdvancedCalculator] = useState(false);
  const [customBookingAmount, setCustomBookingAmount] = useState(50000);
  const [impactAnalysis, setImpactAnalysis] =
    useState<CommissionImpactAnalysis | null>(null);

  // Mini calculator states
  const [calculatorInput, setCalculatorInput] = useState("");
  const [calculatorResult, setCalculatorResult] = useState<number | null>(null);

  // Get commission rate setting
  const commissionSetting = settings.find((s) => s.key === "commission_rate");
  const currentRate = commissionSetting
    ? Number(commissionSetting.value)
    : 0.07;
  const [commissionRate, setCommissionRate] = useState(() => {
    // Initialize state with current rate only once
    return commissionSetting ? Number(commissionSetting.value) : 0.07;
  });

  // Check if commission rate has changed (with tolerance for floating point precision)
  const hasChanges = Math.abs(commissionRate - currentRate) > 0.01;

  // Debug logging
  

  // Calculate preview values
  const previewBookingAmount = 50000; // ₦50,000 sample booking
  const commissionAmount = previewBookingAmount * commissionRate;
  const realtorAmount = previewBookingAmount - commissionAmount;

  const calculateImpactAnalysis = useCallback(
    (analyticsData: PlatformAnalytics, newRate: number) => {
      if (!analyticsData?.overview) return;

      const totalRevenue = parseFloat(analyticsData.overview.totalRevenue || "0");
      const totalBookings = analyticsData.overview.totalBookings || 0;

      const currentCommission = totalRevenue * currentRate;
      const newCommission = totalRevenue * newRate;
      const difference = newCommission - currentCommission;

      setImpactAnalysis({
        currentMonthlyRevenue: totalRevenue,
        currentCommission,
        newCommission,
        difference,
        percentageChange:
          currentCommission > 0 ? (difference / currentCommission) * 100 : 0,
        averageBookingValue:
          totalBookings > 0 ? totalRevenue / totalBookings : 0,
        projectedAnnualImpact: difference * 12,
      });
    },
    [currentRate]
  );

  const fetchAnalytics = useCallback(async () => {
    try {
      const data = await getAnalytics("30d");
      setAnalytics(data);
      calculateImpactAnalysis(data, commissionRate);
    } catch {
      
    }
  }, [calculateImpactAnalysis, commissionRate]);

  // Fetch analytics for impact analysis
  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  const handleCommissionRateChange = (value: number) => {
    setCommissionRate(value);
    onUpdate("commission_rate", value);
    if (analytics) {
      calculateImpactAnalysis(analytics, value);
    }
  };

  // Preset commission rates for quick selection
  const presetRates = [
    { rate: 0.05, label: "5% - Low", description: "Attract more realtors" },
    { rate: 0.07, label: "7% - Standard", description: "Industry standard" },
    { rate: 0.1, label: "10% - Premium", description: "High value service" },
    {
      rate: 0.12,
      label: "12% - Enterprise",
      description: "Full-service platform",
    },
  ];

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `₦${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `₦${(amount / 1000).toFixed(0)}K`;
    }
    return `₦${amount.toLocaleString()}`;
  };

  // Mini percentage calculator functions
  const calculatePercentage = (expression: string) => {
    try {
      // Handle percentage calculations
      // Convert "x% of y" or "x% * y" format
      const processedExpression = expression
        .replace(
          /(\d+(?:\.\d+)?)%\s*(?:of|×|\*)\s*(\d+(?:\.\d+)?)/g,
          "($1/100)*$2"
        )
        .replace(
          /(\d+(?:\.\d+)?)\s*(?:of|×|\*)\s*(\d+(?:\.\d+)?)%/g,
          "$1*($2/100)"
        )
        .replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");

      // Evaluate the expression safely
      const result = Function(
        '"use strict"; return (' + processedExpression + ")"
      )();
      return Number(result);
    } catch (error) {
      throw new Error("Invalid calculation");
    }
  };

  const handleCalculatorInput = (value: string) => {
    if (value === "C") {
      setCalculatorInput("");
      setCalculatorResult(null);
    } else if (value === "=") {
      try {
        const result = calculatePercentage(calculatorInput);
        setCalculatorResult(result);
        toast.success(`Result: ${result}`);
      } catch (error) {
        toast.error("Invalid calculation");
        setCalculatorResult(null);
      }
    } else {
      setCalculatorInput((prev) => prev + value);
    }
  };

  // Export commission analysis
  const exportAnalysis = () => {
    if (!impactAnalysis) return;

    const csvContent = [
      "Commission Rate Analysis Report",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "Current Settings",
      `Current Rate,${(currentRate * 100).toFixed(2)}%`,
      `New Rate,${(commissionRate * 100).toFixed(2)}%`,
      `Current Monthly Commission,${impactAnalysis.currentCommission}`,
      `New Monthly Commission,${impactAnalysis.newCommission}`,
      `Monthly Difference,${impactAnalysis.difference}`,
      `Percentage Change,${impactAnalysis.percentageChange.toFixed(2)}%`,
      `Projected Annual Impact,${impactAnalysis.projectedAnnualImpact}`,
      "",
      "Market Context",
      `Current Monthly Revenue,${impactAnalysis.currentMonthlyRevenue}`,
      `Average Booking Value,${impactAnalysis.averageBookingValue}`,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `commission-analysis-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Commission analysis exported!");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateCommissionRate(commissionRate);

      // Update the local settings to reflect the change
      onUpdate("commission_rate", commissionRate);

      onSaveSuccess(
        `Commission rate updated to ${(commissionRate * 100).toFixed(1)}%`
      );

      // Refresh analytics to get updated projections
      setTimeout(() => {
        fetchAnalytics();
      }, 1000);
    } catch (error: unknown) {
      onSaveError(
        error instanceof Error ? error.message : "Failed to update commission rate"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Action Buttons */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Percent className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Advanced Commission Management
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Optimize your platform&apos;s commission rate with real-time impact
                analysis
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAdvancedCalculator(!showAdvancedCalculator)}
              className={`flex items-center px-3 py-2 text-sm border rounded-lg transition-colors ${
                showAdvancedCalculator
                  ? "bg-purple-50 border-purple-300 text-purple-700"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Calculator className="h-4 w-4 mr-1" />
              {showAdvancedCalculator ? "Hide Calculator" : "Calculator"}
            </button>
            <button
              onClick={exportAnalysis}
              disabled={!impactAnalysis}
              className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
          </div>
        </div>

        {/* Quick Preset Rates */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Quick Presets
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {presetRates.map((preset) => (
              <button
                key={preset.rate}
                onClick={() => handleCommissionRateChange(preset.rate)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  Math.abs(commissionRate - preset.rate) < 0.001
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="font-semibold text-sm">{preset.label}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {preset.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enhanced Rate Input with Slider */}
          <div>
            <label
              htmlFor="commission-rate"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Commission Rate (%)
            </label>

            {/* Slider Input */}
            <div className="mb-4">
              <input
                type="range"
                min="1"
                max="15"
                step="0.1"
                value={commissionRate * 100}
                onChange={(e) =>
                  handleCommissionRateChange(Number(e.target.value) / 100)
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1%</span>
                <span>15%</span>
              </div>
            </div>

            {/* Numeric Input */}
            <div className="relative mb-4">
              <input
                type="number"
                id="commission-rate"
                min="1"
                max="15"
                step="0.1"
                value={(commissionRate * 100).toFixed(1)}
                onChange={(e) =>
                  handleCommissionRateChange(Number(e.target.value) / 100)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
                placeholder="7.0"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                %
              </span>
            </div>

            {/* Rate Impact Indicator */}
            <div className="mb-4 p-3 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Rate Change</span>
                <span
                  className={`text-sm font-medium ${
                    commissionRate > currentRate
                      ? "text-red-600"
                      : commissionRate < currentRate
                      ? "text-green-600"
                      : "text-gray-600"
                  }`}
                >
                  {commissionRate === currentRate
                    ? "No change"
                    : commissionRate > currentRate
                    ? `+${((commissionRate - currentRate) * 100).toFixed(1)}%`
                    : `${((commissionRate - currentRate) * 100).toFixed(1)}%`}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Rate must be between 1% and 15%
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center ${
                hasChanges
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {hasChanges ? "Apply Changes" : "No Changes"}
                </>
              )}
            </button>
          </div>

          {/* Enhanced Live Preview with Impact Analysis */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
              Real-Time Impact Analysis
            </h4>

            {/* Sample Booking Preview */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-2">
                Example booking: ₦{previewBookingAmount.toLocaleString()}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Platform Commission
                  </span>
                  <span className="font-medium text-blue-600">
                    ₦{commissionAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Realtor Earnings
                  </span>
                  <span className="font-medium text-green-600">
                    ₦{realtorAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Platform Impact */}
            {impactAnalysis && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-xs font-medium text-blue-900 mb-1">
                    Monthly Impact
                  </div>
                  <div className="text-sm">
                    <span
                      className={`font-semibold ${
                        impactAnalysis.difference >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {impactAnalysis.difference >= 0 ? "+" : ""}
                      {formatCurrency(impactAnalysis.difference)}
                    </span>
                    <span className="text-gray-600 ml-2">
                      ({impactAnalysis.percentageChange >= 0 ? "+" : ""}
                      {impactAnalysis.percentageChange.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-xs font-medium text-purple-900 mb-1">
                    Annual Projection
                  </div>
                  <div className="text-sm font-semibold text-purple-600">
                    {impactAnalysis.projectedAnnualImpact >= 0 ? "+" : ""}
                    {formatCurrency(impactAnalysis.projectedAnnualImpact)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mini Percentage Calculator */}
      {showAdvancedCalculator && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center mb-4">
            <Calculator className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Percentage Calculator
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Calculator Interface */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calculate Percentages
                </label>
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="text-xs text-gray-600 mb-2">Examples:</div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>• 7% of 50000 = commission</div>
                    <div>• 15 * 1000 = basic math</div>
                    <div>• 25% * 80000 = percentage</div>
                  </div>
                </div>
                <input
                  type="text"
                  value={calculatorInput}
                  onChange={(e) => setCalculatorInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono"
                  placeholder="Enter calculation (e.g., 7% of 50000)"
                />
                {calculatorResult !== null && (
                  <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                    <span className="text-sm font-medium text-green-800">
                      Result: {calculatorResult.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Calculator Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  "7",
                  "8",
                  "9",
                  "%",
                  "4",
                  "5",
                  "6",
                  "*",
                  "1",
                  "2",
                  "3",
                  "of",
                  "0",
                  ".",
                  "=",
                  "C",
                ].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => handleCalculatorInput(btn)}
                    className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
                      btn === "="
                        ? "bg-purple-600 text-white border-purple-600 hover:bg-purple-700"
                        : btn === "C"
                        ? "bg-red-500 text-white border-red-500 hover:bg-red-600"
                        : btn === "%" || btn === "of" || btn === "*"
                        ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Commission Calculations */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Quick Commission Calculator
                </h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Booking Amount (₦)
                  </label>
                  <input
                    type="number"
                    value={customBookingAmount}
                    onChange={(e) =>
                      setCustomBookingAmount(Number(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 mb-3"
                    placeholder="50000"
                  />
                </div>

                <div className="space-y-3">
                  {[
                    { rate: 0.05, label: "5%" },
                    { rate: 0.07, label: "7%" },
                    { rate: 0.1, label: "10%" },
                    { rate: 0.12, label: "12%" },
                  ].map((item) => {
                    const commission = customBookingAmount * item.rate;
                    const realtorEarnings = customBookingAmount - commission;
                    return (
                      <div
                        key={item.rate}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          Math.abs(commissionRate - item.rate) < 0.001
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {item.label} Commission Rate
                          </span>
                          <span className="text-sm font-bold text-purple-600">
                            ₦{commission.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          Realtor gets: ₦{realtorEarnings.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Market Positioning Analysis */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-center mb-4">
          <Target className="h-5 w-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Market Position Analysis
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Current Position */}
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Your Rate</div>
            <div className="text-2xl font-bold text-blue-600">
              {(commissionRate * 100).toFixed(1)}%
            </div>
          </div>

          {/* Market Comparison */}
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Market Average</div>
            <div className="text-2xl font-bold text-gray-600">8.5%</div>
            <div
              className={`text-xs mt-1 ${
                commissionRate < 0.085 ? "text-green-600" : "text-red-600"
              }`}
            >
              {commissionRate < 0.085 ? "Below average" : "Above average"}
            </div>
          </div>

          {/* Competitiveness */}
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Competitiveness</div>
            <div
              className={`text-2xl font-bold ${
                commissionRate <= 0.06
                  ? "text-green-600"
                  : commissionRate <= 0.09
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {commissionRate <= 0.06
                ? "High"
                : commissionRate <= 0.09
                ? "Medium"
                : "Low"}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-4 p-4 bg-white rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
            <Zap className="h-4 w-4 text-yellow-500 mr-1" />
            Smart Recommendations
          </h4>
          <div className="text-sm text-gray-600 space-y-1">
            {commissionRate > 0.1 && (
              <div className="flex items-center text-amber-600">
                <AlertCircle className="h-4 w-4 mr-2" />
                Consider lowering the rate to attract more realtors
              </div>
            )}
            {commissionRate < 0.05 && (
              <div className="flex items-center text-blue-600">
                <Info className="h-4 w-4 mr-2" />
                You could increase the rate to boost revenue without hurting
                competitiveness
              </div>
            )}
            {commissionRate >= 0.05 && commissionRate <= 0.08 && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-2" />
                Your rate is well-positioned for growth and retention
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Commission Rate History & Info */}
      {commissionSetting && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Setting Information
              </h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>
                  <strong>Current Value:</strong>{" "}
                  {(Number(commissionSetting.value) * 100).toFixed(1)}%
                </p>
                <p>
                  <strong>Last Updated:</strong>{" "}
                  {new Date(commissionSetting.updatedAt).toLocaleDateString()}
                </p>
                <p>
                  <strong>Updated By:</strong>{" "}
                  {commissionSetting.updatedByUser.firstName}{" "}
                  {commissionSetting.updatedByUser.lastName}
                </p>
                {commissionSetting.description && (
                  <p>
                    <strong>Description:</strong>{" "}
                    {commissionSetting.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Impact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-amber-600 mr-3 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-800 mb-2">
                Implementation Notes
              </h4>
              <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                <li>Changes affect all new bookings immediately</li>
                <li>Existing active bookings maintain original rates</li>
                <li>All modifications are logged for audit compliance</li>
                <li>Rate changes may impact realtor acquisition</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-green-800 mb-2">
                Best Practices
              </h4>
              <ul className="text-xs text-green-700 space-y-1 list-disc list-inside">
                <li>Monitor competitor rates regularly</li>
                <li>Test rate changes with A/B testing</li>
                <li>Consider seasonal adjustments</li>
                <li>Balance revenue with realtor satisfaction</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Add custom CSS for slider styling */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default CommissionSettings;
