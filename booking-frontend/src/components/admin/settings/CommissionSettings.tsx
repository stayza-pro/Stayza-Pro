"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Percent,
  Plus,
  Save,
  Trash2,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { PlatformSetting, updateSetting } from "@/services/settingsService";

interface CommissionSettingsProps {
  settings: PlatformSetting[];
  onUpdate: (key: string, value: any) => void;
  onSaveSuccess: (message: string) => void;
  onSaveError: (error: string) => void;
}

interface CommissionTier {
  min: number;
  max: number | null;
  rate: number;
}

interface MonthlyDiscount {
  volume: number;
  reductionRate: number;
}

interface FeeComponent {
  percent: number;
  fixed: number;
  capVariable?: number;
  capTrigger?: number;
  noCap?: boolean;
}

interface WithdrawalFeeConfig {
  percent: number;
  cap: number;
  minimumWithdrawal: number;
}

interface FinanceConfigForm {
  tiers: CommissionTier[];
  monthlyDiscounts: MonthlyDiscount[];
  monthlyDiscountCapRate: number;
  stayzaFee: FeeComponent;
  localProcessingFee: FeeComponent;
  internationalProcessingFee: FeeComponent;
  withdrawalFee: WithdrawalFeeConfig;
}

const FINANCE_KEYS = {
  tiers: "finance.commission.tiers.v1",
  monthlyDiscounts: "finance.commission.monthly_discounts.v1",
  monthlyDiscountCapRate: "finance.commission.monthly_discount_cap_rate",
  stayzaFee: "finance.service_fee.stayza.v1",
  localProcessingFee: "finance.service_fee.processing.local.v1",
  internationalProcessingFee: "finance.service_fee.processing.international.v1",
  withdrawalFee: "finance.withdrawal_fee.v1",
} as const;

const DEFAULT_FORM: FinanceConfigForm = {
  tiers: [
    { min: 0, max: 500000, rate: 0.1 },
    { min: 500001, max: 2000000, rate: 0.07 },
    { min: 2000001, max: null, rate: 0.05 },
  ],
  monthlyDiscounts: [
    { volume: 5000000, reductionRate: 0.005 },
    { volume: 10000000, reductionRate: 0.01 },
    { volume: 20000000, reductionRate: 0.015 },
  ],
  monthlyDiscountCapRate: 0.02,
  stayzaFee: {
    percent: 0.01,
    fixed: 100,
    capVariable: 1333,
    capTrigger: 133333,
  },
  localProcessingFee: {
    percent: 0.015,
    fixed: 100,
    capVariable: 2000,
    capTrigger: 133333,
  },
  internationalProcessingFee: {
    percent: 0.039,
    fixed: 100,
    noCap: true,
  },
  withdrawalFee: {
    percent: 0.003,
    cap: 3000,
    minimumWithdrawal: 1000,
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);
};

const parseTierEntry = (entry: unknown): CommissionTier | null => {
  if (!isRecord(entry)) return null;

  const min = toNumber(entry.min, Number.NaN);
  const maxRaw = entry.max;
  const max =
    maxRaw === null || maxRaw === undefined
      ? null
      : toNumber(maxRaw, Number.NaN);
  const rate = toNumber(entry.rate, Number.NaN);

  if (!Number.isNaN(min) && !Number.isNaN(rate)) {
    return { min, max, rate };
  }

  const keys = Object.keys(entry);
  if (keys.length === 1) {
    const key = keys[0];
    const valueRate = toNumber(entry[key], Number.NaN);
    const [rawMin, rawMax] = key.split("-");
    const parsedMin = toNumber(rawMin, Number.NaN);
    const parsedMax = rawMax ? toNumber(rawMax, Number.NaN) : null;

    if (!Number.isNaN(parsedMin) && !Number.isNaN(valueRate)) {
      return {
        min: parsedMin,
        max: parsedMax,
        rate: valueRate,
      };
    }
  }

  return null;
};

const parseDiscountEntry = (entry: unknown): MonthlyDiscount | null => {
  if (!isRecord(entry)) return null;

  const volume = toNumber(entry.volume, Number.NaN);
  const reductionRate = toNumber(entry.reductionRate, Number.NaN);

  if (!Number.isNaN(volume) && !Number.isNaN(reductionRate)) {
    return { volume, reductionRate };
  }

  const keys = Object.keys(entry);
  if (keys.length === 1) {
    const key = keys[0];
    const parsedVolume = toNumber(key, Number.NaN);
    const parsedRate = toNumber(entry[key], Number.NaN);
    if (!Number.isNaN(parsedVolume) && !Number.isNaN(parsedRate)) {
      return {
        volume: parsedVolume,
        reductionRate: parsedRate,
      };
    }
  }

  return null;
};

const parseFeeComponent = (value: unknown, fallback: FeeComponent): FeeComponent => {
  if (!isRecord(value)) return fallback;

  return {
    percent: toNumber(value.percent, fallback.percent),
    fixed: toNumber(value.fixed, fallback.fixed),
    capVariable:
      value.capVariable === undefined
        ? fallback.capVariable
        : toNumber(value.capVariable, fallback.capVariable || 0),
    capTrigger:
      value.capTrigger === undefined
        ? fallback.capTrigger
        : toNumber(value.capTrigger, fallback.capTrigger || 0),
    noCap: value.noCap === true,
  };
};

const parseFinanceState = (settings: PlatformSetting[]): FinanceConfigForm => {
  const byKey = settings.reduce<Record<string, unknown>>((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {});

  const tiersRaw = byKey[FINANCE_KEYS.tiers];
  const tiers = Array.isArray(tiersRaw)
    ? tiersRaw
        .map((entry) => parseTierEntry(entry))
        .filter((entry): entry is CommissionTier => Boolean(entry))
    : DEFAULT_FORM.tiers;

  const monthlyRaw = byKey[FINANCE_KEYS.monthlyDiscounts];
  const monthlyDiscounts = Array.isArray(monthlyRaw)
    ? monthlyRaw
        .map((entry) => parseDiscountEntry(entry))
        .filter((entry): entry is MonthlyDiscount => Boolean(entry))
    : DEFAULT_FORM.monthlyDiscounts;

  const monthlyDiscountCapRate = toNumber(
    byKey[FINANCE_KEYS.monthlyDiscountCapRate],
    DEFAULT_FORM.monthlyDiscountCapRate
  );

  const stayzaFee = parseFeeComponent(
    byKey[FINANCE_KEYS.stayzaFee],
    DEFAULT_FORM.stayzaFee
  );
  const localProcessingFee = parseFeeComponent(
    byKey[FINANCE_KEYS.localProcessingFee],
    DEFAULT_FORM.localProcessingFee
  );
  const internationalProcessingFee = parseFeeComponent(
    byKey[FINANCE_KEYS.internationalProcessingFee],
    DEFAULT_FORM.internationalProcessingFee
  );

  const withdrawalRaw = byKey[FINANCE_KEYS.withdrawalFee];
  const withdrawalFee = isRecord(withdrawalRaw)
    ? {
        percent: toNumber(withdrawalRaw.percent, DEFAULT_FORM.withdrawalFee.percent),
        cap: toNumber(withdrawalRaw.cap, DEFAULT_FORM.withdrawalFee.cap),
        minimumWithdrawal: toNumber(
          withdrawalRaw.minimumWithdrawal,
          DEFAULT_FORM.withdrawalFee.minimumWithdrawal
        ),
      }
    : DEFAULT_FORM.withdrawalFee;

  return {
    tiers: tiers.length > 0 ? tiers : DEFAULT_FORM.tiers,
    monthlyDiscounts:
      monthlyDiscounts.length > 0 ? monthlyDiscounts : DEFAULT_FORM.monthlyDiscounts,
    monthlyDiscountCapRate,
    stayzaFee,
    localProcessingFee,
    internationalProcessingFee,
    withdrawalFee,
  };
};

const validateFinanceState = (state: FinanceConfigForm): string[] => {
  const errors: string[] = [];

  const sortedTiers = [...state.tiers].sort((a, b) => a.min - b.min);
  if (sortedTiers.length === 0) {
    errors.push("At least one commission tier is required.");
  } else {
    if (sortedTiers[0].min !== 0) {
      errors.push("Commission tiers must start at 0.");
    }

    sortedTiers.forEach((tier, index) => {
      if (tier.min < 0) errors.push("Commission tier minimum cannot be negative.");
      if (tier.max !== null && tier.max < tier.min) {
        errors.push("Commission tier max must be greater than or equal to min.");
      }
      if (tier.rate < 0 || tier.rate > 0.25) {
        errors.push("Commission tier rates must be between 0% and 25%.");
      }

      if (index > 0) {
        const previous = sortedTiers[index - 1];
        if (previous.max === null) {
          errors.push("Only the final tier can have open-ended max.");
        } else if (tier.min !== previous.max + 1) {
          errors.push("Commission tiers must be contiguous and non-overlapping.");
        }
      }
    });

    if (sortedTiers[sortedTiers.length - 1].max !== null) {
      errors.push("Final commission tier must have no max.");
    }
  }

  const sortedDiscounts = [...state.monthlyDiscounts].sort(
    (a, b) => a.volume - b.volume
  );
  let previousVolume = -1;
  sortedDiscounts.forEach((item) => {
    if (item.volume <= previousVolume) {
      errors.push("Monthly discount thresholds must be strictly increasing.");
    }
    previousVolume = item.volume;

    if (item.volume <= 0) {
      errors.push("Monthly discount thresholds must be greater than zero.");
    }
    if (item.reductionRate < 0 || item.reductionRate > 0.25) {
      errors.push("Monthly discount rates must be between 0% and 25%.");
    }
  });

  if (state.monthlyDiscountCapRate < 0 || state.monthlyDiscountCapRate > 0.05) {
    errors.push("Monthly discount cap must be between 0% and 5%.");
  }

  const validateComponent = (component: FeeComponent, label: string) => {
    if (component.percent < 0 || component.percent > 0.25) {
      errors.push(`${label} percent must be between 0% and 25%.`);
    }
    if (component.fixed < 0) {
      errors.push(`${label} fixed fee cannot be negative.`);
    }
    if (!component.noCap) {
      if ((component.capVariable || 0) < 0) {
        errors.push(`${label} cap variable cannot be negative.`);
      }
      if ((component.capTrigger || 0) <= 0) {
        errors.push(`${label} cap trigger must be greater than zero.`);
      }
    }
  };

  validateComponent(state.stayzaFee, "Stayza fee");
  validateComponent(state.localProcessingFee, "Local processing fee");
  validateComponent(state.internationalProcessingFee, "International processing fee");

  if (state.withdrawalFee.percent < 0 || state.withdrawalFee.percent > 0.25) {
    errors.push("Withdrawal fee percent must be between 0% and 25%.");
  }
  if (state.withdrawalFee.cap <= 0) {
    errors.push("Withdrawal fee cap must be greater than zero.");
  }
  if (state.withdrawalFee.minimumWithdrawal <= 0) {
    errors.push("Minimum withdrawal must be greater than zero.");
  }

  return Array.from(new Set(errors));
};

const CommissionSettings: React.FC<CommissionSettingsProps> = ({
  settings,
  onUpdate,
  onSaveSuccess,
  onSaveError,
}) => {
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState<FinanceConfigForm>(DEFAULT_FORM);
  const [originalState, setOriginalState] = useState<FinanceConfigForm>(
    DEFAULT_FORM
  );

  useEffect(() => {
    const parsed = parseFinanceState(settings);
    setFormState(parsed);
    setOriginalState(parsed);
  }, [settings]);

  const validationErrors = useMemo(() => {
    return validateFinanceState(formState);
  }, [formState]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(formState) !== JSON.stringify(originalState);
  }, [formState, originalState]);

  const updateTier = (
    index: number,
    field: keyof CommissionTier,
    value: number | null
  ) => {
    setFormState((prev) => {
      const next = [...prev.tiers];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return { ...prev, tiers: next };
    });
  };

  const updateDiscount = (
    index: number,
    field: keyof MonthlyDiscount,
    value: number
  ) => {
    setFormState((prev) => {
      const next = [...prev.monthlyDiscounts];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return { ...prev, monthlyDiscounts: next };
    });
  };

  const updateFeeComponent = (
    key: "stayzaFee" | "localProcessingFee" | "internationalProcessingFee",
    field: keyof FeeComponent,
    value: number | boolean | undefined
  ) => {
    setFormState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const updates: Array<[string, unknown]> = [
        [FINANCE_KEYS.tiers, formState.tiers],
        [FINANCE_KEYS.monthlyDiscounts, formState.monthlyDiscounts],
        [FINANCE_KEYS.monthlyDiscountCapRate, formState.monthlyDiscountCapRate],
        [FINANCE_KEYS.stayzaFee, formState.stayzaFee],
        [FINANCE_KEYS.localProcessingFee, formState.localProcessingFee],
        [FINANCE_KEYS.internationalProcessingFee, formState.internationalProcessingFee],
        [FINANCE_KEYS.withdrawalFee, formState.withdrawalFee],
      ];

      for (const [key, value] of updates) {
        await updateSetting(key, { value });
        onUpdate(key, value);
      }

      setOriginalState(formState);
      onSaveSuccess("Finance configuration updated successfully.");
    } catch (error) {
      onSaveError(
        error instanceof Error
          ? error.message
          : "Failed to save finance configuration"
      );
    } finally {
      setSaving(false);
    }
  };

  const sampleRoomFee = 500000;
  const sampleCleaningFee = 50000;
  const sampleSubtotal = sampleRoomFee + sampleCleaningFee;
  const sampleMonthlyVolume = 10000000;

  const sortedTiers = [...formState.tiers].sort((a, b) => a.min - b.min);
  const tier =
    sortedTiers.find((item) => {
      const maxOk = item.max === null || sampleRoomFee <= item.max;
      return sampleRoomFee >= item.min && maxOk;
    }) || sortedTiers[0];

  const sortedDiscounts = [...formState.monthlyDiscounts].sort(
    (a, b) => a.volume - b.volume
  );
  let volumeReduction = 0;
  sortedDiscounts.forEach((item) => {
    if (sampleMonthlyVolume >= item.volume) {
      volumeReduction = item.reductionRate;
    }
  });

  const effectiveRate = Math.max(
    tier.rate - Math.min(volumeReduction, formState.monthlyDiscountCapRate),
    0
  );

  const commissionAmount = sampleRoomFee * effectiveRate;
  const realtorRoomPayout = sampleRoomFee - commissionAmount;

  const stayzaVariable = Math.min(
    sampleSubtotal * formState.stayzaFee.percent,
    formState.stayzaFee.capVariable || Number.POSITIVE_INFINITY
  );
  const stayzaTotal = stayzaVariable + formState.stayzaFee.fixed;

  const localProcessingVariable = formState.localProcessingFee.noCap
    ? sampleSubtotal * formState.localProcessingFee.percent
    : Math.min(
        sampleSubtotal * formState.localProcessingFee.percent,
        formState.localProcessingFee.capVariable || Number.POSITIVE_INFINITY
      );
  const localProcessingTotal =
    localProcessingVariable + formState.localProcessingFee.fixed;

  const withdrawalSample = 1000000;
  const withdrawalFee = Math.min(
    withdrawalSample * formState.withdrawalFee.percent,
    formState.withdrawalFee.cap
  );
  const withdrawalNet = withdrawalSample - withdrawalFee;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
          <Percent className="h-5 w-5" />
          Financial Engine Configuration
        </h3>
        <p className="text-sm text-blue-700 mt-1">
          Configure commission tiers, monthly loyalty discounts, guest service fees,
          and withdrawal fees used by pricing engine V2.
        </p>
      </div>

      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-red-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Fix these validation issues before saving
          </p>
          <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
            {validationErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900">Commission Tiers (Room Fee Basis)</h4>
          <button
            type="button"
            onClick={() =>
              setFormState((prev) => ({
                ...prev,
                tiers: [
                  ...prev.tiers,
                  {
                    min:
                      prev.tiers.length > 0
                        ? (prev.tiers[prev.tiers.length - 1].max || 0) + 1
                        : 0,
                    max: null,
                    rate: 0.05,
                  },
                ],
              }))
            }
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center gap-1"
          >
            <Plus className="h-4 w-4" /> Add tier
          </button>
        </div>

        <div className="space-y-2">
          {formState.tiers.map((tierItem, index) => (
            <div
              key={`${tierItem.min}-${index}`}
              className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end"
            >
              <label className="text-sm text-gray-600">
                Min (NGN)
                <input
                  type="number"
                  value={tierItem.min}
                  onChange={(e) =>
                    updateTier(index, "min", Math.max(0, Number(e.target.value)))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </label>

              <label className="text-sm text-gray-600">
                Max (NGN, blank = open)
                <input
                  type="number"
                  value={tierItem.max ?? ""}
                  onChange={(e) =>
                    updateTier(
                      index,
                      "max",
                      e.target.value === "" ? null : Math.max(0, Number(e.target.value))
                    )
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </label>

              <label className="text-sm text-gray-600">
                Rate (%)
                <input
                  type="number"
                  step="0.01"
                  value={Number((tierItem.rate * 100).toFixed(2))}
                  onChange={(e) =>
                    updateTier(index, "rate", Math.max(0, Number(e.target.value)) / 100)
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </label>

              <button
                type="button"
                disabled={formState.tiers.length <= 1}
                onClick={() =>
                  setFormState((prev) => ({
                    ...prev,
                    tiers: prev.tiers.filter((_, rowIndex) => rowIndex !== index),
                  }))
                }
                className="px-3 py-2 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <Trash2 className="h-4 w-4" /> Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900">Monthly Volume Discounts</h4>
          <button
            type="button"
            onClick={() =>
              setFormState((prev) => ({
                ...prev,
                monthlyDiscounts: [
                  ...prev.monthlyDiscounts,
                  {
                    volume:
                      prev.monthlyDiscounts.length > 0
                        ? prev.monthlyDiscounts[prev.monthlyDiscounts.length - 1].volume +
                          1000000
                        : 5000000,
                    reductionRate: 0.005,
                  },
                ],
              }))
            }
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center gap-1"
          >
            <Plus className="h-4 w-4" /> Add threshold
          </button>
        </div>

        <div className="space-y-2">
          {formState.monthlyDiscounts.map((item, index) => (
            <div key={`${item.volume}-${index}`} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
              <label className="text-sm text-gray-600">
                Threshold (NGN)
                <input
                  type="number"
                  value={item.volume}
                  onChange={(e) =>
                    updateDiscount(index, "volume", Math.max(0, Number(e.target.value)))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </label>

              <label className="text-sm text-gray-600">
                Reduction (%)
                <input
                  type="number"
                  step="0.01"
                  value={Number((item.reductionRate * 100).toFixed(2))}
                  onChange={(e) =>
                    updateDiscount(
                      index,
                      "reductionRate",
                      Math.max(0, Number(e.target.value)) / 100
                    )
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </label>

              <button
                type="button"
                disabled={formState.monthlyDiscounts.length <= 1}
                onClick={() =>
                  setFormState((prev) => ({
                    ...prev,
                    monthlyDiscounts: prev.monthlyDiscounts.filter(
                      (_, rowIndex) => rowIndex !== index
                    ),
                  }))
                }
                className="px-3 py-2 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <Trash2 className="h-4 w-4" /> Remove
              </button>
            </div>
          ))}
        </div>

        <label className="text-sm text-gray-600 block max-w-sm">
          Monthly discount cap (%)
          <input
            type="number"
            step="0.01"
            value={Number((formState.monthlyDiscountCapRate * 100).toFixed(2))}
            onChange={(e) =>
              setFormState((prev) => ({
                ...prev,
                monthlyDiscountCapRate: Math.max(0, Number(e.target.value)) / 100,
              }))
            }
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </label>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <h4 className="font-semibold text-gray-900">Guest Service Fee Components</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            ["stayzaFee", "Stayza fee"],
            ["localProcessingFee", "Paystack local"],
            ["internationalProcessingFee", "Paystack international"],
          ].map(([key, label]) => {
            const fee = formState[key as "stayzaFee" | "localProcessingFee" | "internationalProcessingFee"];
            return (
              <div key={key} className="border border-gray-200 rounded-lg p-3 space-y-2">
                <p className="font-medium text-gray-800">{label}</p>

                <label className="text-xs text-gray-600 block">
                  Percent (%)
                  <input
                    type="number"
                    step="0.01"
                    value={Number((fee.percent * 100).toFixed(3))}
                    onChange={(e) =>
                      updateFeeComponent(
                        key as "stayzaFee" | "localProcessingFee" | "internationalProcessingFee",
                        "percent",
                        Math.max(0, Number(e.target.value)) / 100
                      )
                    }
                    className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg"
                  />
                </label>

                <label className="text-xs text-gray-600 block">
                  Fixed (NGN)
                  <input
                    type="number"
                    value={fee.fixed}
                    onChange={(e) =>
                      updateFeeComponent(
                        key as "stayzaFee" | "localProcessingFee" | "internationalProcessingFee",
                        "fixed",
                        Math.max(0, Number(e.target.value))
                      )
                    }
                    className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg"
                  />
                </label>

                <label className="text-xs text-gray-600 block">
                  <input
                    type="checkbox"
                    checked={Boolean(fee.noCap)}
                    onChange={(e) =>
                      updateFeeComponent(
                        key as "stayzaFee" | "localProcessingFee" | "internationalProcessingFee",
                        "noCap",
                        e.target.checked
                      )
                    }
                    className="mr-1"
                  />
                  No cap
                </label>

                {!fee.noCap && (
                  <>
                    <label className="text-xs text-gray-600 block">
                      Cap variable (NGN)
                      <input
                        type="number"
                        value={fee.capVariable || 0}
                        onChange={(e) =>
                          updateFeeComponent(
                            key as "stayzaFee" | "localProcessingFee" | "internationalProcessingFee",
                            "capVariable",
                            Math.max(0, Number(e.target.value))
                          )
                        }
                        className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg"
                      />
                    </label>

                    <label className="text-xs text-gray-600 block">
                      Cap trigger (NGN)
                      <input
                        type="number"
                        value={fee.capTrigger || 0}
                        onChange={(e) =>
                          updateFeeComponent(
                            key as "stayzaFee" | "localProcessingFee" | "internationalProcessingFee",
                            "capTrigger",
                            Math.max(0, Number(e.target.value))
                          )
                        }
                        className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-lg"
                      />
                    </label>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Withdrawal Fee
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-sm text-gray-600 block">
            Percent (%)
            <input
              type="number"
              step="0.01"
              value={Number((formState.withdrawalFee.percent * 100).toFixed(3))}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  withdrawalFee: {
                    ...prev.withdrawalFee,
                    percent: Math.max(0, Number(e.target.value)) / 100,
                  },
                }))
              }
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </label>

          <label className="text-sm text-gray-600 block">
            Cap (NGN)
            <input
              type="number"
              value={formState.withdrawalFee.cap}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  withdrawalFee: {
                    ...prev.withdrawalFee,
                    cap: Math.max(0, Number(e.target.value)),
                  },
                }))
              }
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </label>

          <label className="text-sm text-gray-600 block">
            Minimum withdrawal (NGN)
            <input
              type="number"
              value={formState.withdrawalFee.minimumWithdrawal}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  withdrawalFee: {
                    ...prev.withdrawalFee,
                    minimumWithdrawal: Math.max(0, Number(e.target.value)),
                  },
                }))
              }
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </label>
        </div>
      </section>

      <section className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Live Preview (Sample Values)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-1">
            <p className="font-medium text-gray-900">Commission preview</p>
            <p>Room fee: {formatCurrency(sampleRoomFee)}</p>
            <p>Base tier rate: {(tier.rate * 100).toFixed(2)}%</p>
            <p>Volume reduction: {(volumeReduction * 100).toFixed(2)}%</p>
            <p>Effective rate: {(effectiveRate * 100).toFixed(2)}%</p>
            <p>Platform commission: {formatCurrency(commissionAmount)}</p>
            <p>Realtor room payout: {formatCurrency(realtorRoomPayout)}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-1">
            <p className="font-medium text-gray-900">Service + withdrawal preview</p>
            <p>Chargeable subtotal: {formatCurrency(sampleSubtotal)}</p>
            <p>Stayza fee: {formatCurrency(stayzaTotal)}</p>
            <p>Processing fee (local): {formatCurrency(localProcessingTotal)}</p>
            <p>Total service fee: {formatCurrency(stayzaTotal + localProcessingTotal)}</p>
            <p>Withdrawal request: {formatCurrency(withdrawalSample)}</p>
            <p>Withdrawal fee: {formatCurrency(withdrawalFee)}</p>
            <p>Net transfer: {formatCurrency(withdrawalNet)}</p>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges || validationErrors.length > 0}
          className={`px-5 py-2.5 rounded-lg font-medium text-white flex items-center gap-2 ${
            saving || !hasChanges || validationErrors.length > 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Finance Configuration"}
        </button>
      </div>
    </div>
  );
};

export default CommissionSettings;
