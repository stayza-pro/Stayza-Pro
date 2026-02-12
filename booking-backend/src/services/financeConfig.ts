import { prisma } from "@/config/database";
import { config } from "@/config";
import { logger } from "@/utils/logger";

export interface CommissionTierConfig {
  min: number;
  max: number | null;
  rate: number;
}

export interface MonthlyDiscountConfig {
  volume: number;
  reductionRate: number;
}

export interface FeeComponentConfig {
  percent: number;
  fixed: number;
  capVariable?: number;
  capTrigger?: number;
  noCap?: boolean;
}

export interface FinanceConfig {
  version: string;
  timezone: "Africa/Lagos";
  commission: {
    tiers: CommissionTierConfig[];
    monthlyDiscounts: MonthlyDiscountConfig[];
    monthlyDiscountCapRate: number;
  };
  serviceFee: {
    stayza: FeeComponentConfig;
    processing: {
      local: FeeComponentConfig;
      international: FeeComponentConfig;
    };
  };
  withdrawalFee: {
    percent: number;
    cap: number;
    minimumWithdrawal: number;
  };
}

export interface FinanceConfigHealth {
  status: "healthy" | "degraded" | "unhealthy";
  strictMode: boolean;
  usingDefaults: boolean;
  errors: string[];
  checkedAt: string;
}

export const FINANCE_SETTING_KEYS = {
  COMMISSION_TIERS: "finance.commission.tiers.v1",
  MONTHLY_DISCOUNTS: "finance.commission.monthly_discounts.v1",
  MONTHLY_DISCOUNT_CAP: "finance.commission.monthly_discount_cap_rate",
  STAYZA_FEE: "finance.service_fee.stayza.v1",
  PROCESSING_LOCAL: "finance.service_fee.processing.local.v1",
  PROCESSING_INTL: "finance.service_fee.processing.international.v1",
  WITHDRAWAL_FEE: "finance.withdrawal_fee.v1",
} as const;

export const DEFAULT_FINANCE_CONFIG: FinanceConfig = {
  version: "v1",
  timezone: "Africa/Lagos",
  commission: {
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
  },
  serviceFee: {
    stayza: {
      percent: 0.01,
      fixed: 100,
      capVariable: 1333,
      capTrigger: 133333,
    },
    processing: {
      local: {
        percent: 0.015,
        fixed: 100,
        capVariable: 2000,
        capTrigger: 133333,
      },
      international: {
        percent: 0.039,
        fixed: 100,
        noCap: true,
      },
    },
  },
  withdrawalFee: {
    percent: 0.003,
    cap: 3000,
    minimumWithdrawal: 1000,
  },
};

let financeConfigHealth: FinanceConfigHealth = {
  status: "healthy",
  strictMode: config.FINANCIAL_ENGINE_V2_STRICT,
  usingDefaults: false,
  errors: [],
  checkedAt: new Date().toISOString(),
};

const setFinanceConfigHealth = (
  partial: Omit<FinanceConfigHealth, "checkedAt">
): void => {
  financeConfigHealth = {
    ...partial,
    checkedAt: new Date().toISOString(),
  };
};

export const getFinanceConfigHealth = (): FinanceConfigHealth =>
  financeConfigHealth;

type SettingMap = Record<string, unknown>;

const numberOrNull = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const parseTierEntry = (entry: unknown): CommissionTierConfig | null => {
  if (!entry || typeof entry !== "object") return null;

  const obj = entry as Record<string, unknown>;
  const min = numberOrNull(obj.min);
  const max =
    obj.max === null || obj.max === undefined ? null : numberOrNull(obj.max);
  const rate = numberOrNull(obj.rate);

  if (min !== null && rate !== null) {
    return { min, max, rate };
  }

  // Accept legacy key style: {"0-500000":0.1}
  const keys = Object.keys(obj);
  if (keys.length === 1) {
    const key = keys[0];
    const valueRate = numberOrNull(obj[key]);
    if (valueRate === null) return null;

    const [rawMin, rawMax] = key.split("-");
    const parsedMin = numberOrNull(rawMin);
    const parsedMax = rawMax ? numberOrNull(rawMax) : null;
    if (parsedMin === null) return null;
    return {
      min: parsedMin,
      max: parsedMax,
      rate: valueRate,
    };
  }

  return null;
};

const parseDiscountEntry = (entry: unknown): MonthlyDiscountConfig | null => {
  if (!entry || typeof entry !== "object") return null;
  const obj = entry as Record<string, unknown>;
  const volume = numberOrNull(obj.volume);
  const reductionRate = numberOrNull(obj.reductionRate);
  if (volume !== null && reductionRate !== null) {
    return { volume, reductionRate };
  }

  // Accept legacy key style: {"5000000":0.005}
  const keys = Object.keys(obj);
  if (keys.length === 1) {
    const key = keys[0];
    const parsedVolume = numberOrNull(key);
    const parsedRate = numberOrNull(obj[key]);
    if (parsedVolume !== null && parsedRate !== null) {
      return { volume: parsedVolume, reductionRate: parsedRate };
    }
  }

  return null;
};

const parseFeeComponent = (value: unknown): FeeComponentConfig | null => {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;

  const percent = numberOrNull(obj.percent);
  const fixed = numberOrNull(obj.fixed);
  if (percent === null || fixed === null) return null;

  const capVariable = numberOrNull(obj.capVariable);
  const capTrigger = numberOrNull(obj.capTrigger);
  const noCap = obj.noCap === true;

  return {
    percent,
    fixed,
    capVariable: capVariable ?? undefined,
    capTrigger: capTrigger ?? undefined,
    noCap,
  };
};

const loadSettingMap = async (): Promise<SettingMap> => {
  const keys = Object.values(FINANCE_SETTING_KEYS);
  const rows = await prisma.platformSettings.findMany({
    where: {
      key: { in: keys },
      isActive: true,
    },
    select: {
      key: true,
      value: true,
    },
  });

  return rows.reduce<SettingMap>((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
};

export const validateCommissionTiers = (
  tiers: CommissionTierConfig[]
): string[] => {
  const errors: string[] = [];
  if (!Array.isArray(tiers) || tiers.length === 0) {
    return ["Commission tiers must be a non-empty array"];
  }

  const sorted = [...tiers].sort((a, b) => a.min - b.min);
  if (sorted[0].min !== 0) {
    errors.push("Commission tiers must start at 0");
  }

  for (let index = 0; index < sorted.length; index += 1) {
    const tier = sorted[index];
    if (tier.min < 0) errors.push("Commission tier min cannot be negative");
    if (tier.max !== null && tier.max < tier.min) {
      errors.push("Commission tier max must be >= min");
    }
    if (tier.rate < 0 || tier.rate > 0.25) {
      errors.push("Commission tier rate must be between 0 and 0.25");
    }

    if (index > 0) {
      const prev = sorted[index - 1];
      if (prev.max === null) {
        errors.push("Only the final commission tier can have max = null");
      } else if (tier.min !== prev.max + 1) {
        errors.push("Commission tiers must be contiguous and non-overlapping");
      }
    }
  }

  if (sorted[sorted.length - 1].max !== null) {
    errors.push("Final commission tier must have max = null");
  }

  return errors;
};

export const validateMonthlyDiscounts = (
  discounts: MonthlyDiscountConfig[]
): string[] => {
  const errors: string[] = [];
  if (!Array.isArray(discounts) || discounts.length === 0) {
    return ["Monthly discounts must be a non-empty array"];
  }

  const sorted = [...discounts].sort((a, b) => a.volume - b.volume);
  let prevVolume = -1;
  for (const entry of sorted) {
    if (entry.volume <= prevVolume) {
      errors.push("Monthly discounts must have strictly increasing volume");
      break;
    }
    prevVolume = entry.volume;
    if (entry.volume <= 0) {
      errors.push("Monthly discount volume must be positive");
    }
    if (entry.reductionRate < 0 || entry.reductionRate > 0.25) {
      errors.push("Monthly discount rate must be between 0 and 0.25");
    }
  }

  return errors;
};

export const validateFeeComponent = (
  component: FeeComponentConfig,
  label: string
): string[] => {
  const errors: string[] = [];
  if (component.percent < 0 || component.percent > 0.25) {
    errors.push(`${label} percent must be between 0 and 0.25`);
  }
  if (component.fixed < 0) {
    errors.push(`${label} fixed fee cannot be negative`);
  }
  if (!component.noCap) {
    if (component.capVariable !== undefined && component.capVariable < 0) {
      errors.push(`${label} capVariable cannot be negative`);
    }
    if (
      component.capVariable !== undefined &&
      component.capTrigger === undefined
    ) {
      errors.push(`${label} capTrigger is required when capVariable is set`);
    }
    if (component.capTrigger !== undefined && component.capTrigger <= 0) {
      errors.push(`${label} capTrigger must be positive`);
    }
  }
  return errors;
};

export const validateWithdrawalFee = (
  value: FinanceConfig["withdrawalFee"]
): string[] => {
  const errors: string[] = [];
  if (value.percent < 0 || value.percent > 0.25) {
    errors.push("Withdrawal fee percent must be between 0 and 0.25");
  }
  if (value.cap <= 0) {
    errors.push("Withdrawal fee cap must be positive");
  }
  if (value.minimumWithdrawal <= 0) {
    errors.push("Minimum withdrawal must be positive");
  }
  return errors;
};

export const validateFinanceConfig = (config: FinanceConfig): string[] => {
  const errors: string[] = [];
  errors.push(...validateCommissionTiers(config.commission.tiers));
  errors.push(...validateMonthlyDiscounts(config.commission.monthlyDiscounts));
  if (
    config.commission.monthlyDiscountCapRate < 0 ||
    config.commission.monthlyDiscountCapRate > 0.05
  ) {
    errors.push("Monthly discount cap must be between 0 and 0.05");
  }
  errors.push(
    ...validateFeeComponent(config.serviceFee.stayza, "Stayza fee config")
  );
  errors.push(
    ...validateFeeComponent(
      config.serviceFee.processing.local,
      "Local processing fee config"
    )
  );
  errors.push(
    ...validateFeeComponent(
      config.serviceFee.processing.international,
      "International processing fee config"
    )
  );
  errors.push(...validateWithdrawalFee(config.withdrawalFee));
  return errors;
};

export const validateFinanceSettingValue = (
  key: string,
  value: unknown
): string[] => {
  switch (key) {
    case FINANCE_SETTING_KEYS.COMMISSION_TIERS: {
      if (!Array.isArray(value)) {
        return ["Commission tiers must be an array"];
      }
      const parsed = value
        .map((entry) => parseTierEntry(entry))
        .filter((entry): entry is CommissionTierConfig => Boolean(entry));
      return validateCommissionTiers(parsed);
    }
    case FINANCE_SETTING_KEYS.MONTHLY_DISCOUNTS: {
      if (!Array.isArray(value)) {
        return ["Monthly discounts must be an array"];
      }
      const parsed = value
        .map((entry) => parseDiscountEntry(entry))
        .filter((entry): entry is MonthlyDiscountConfig => Boolean(entry));
      return validateMonthlyDiscounts(parsed);
    }
    case FINANCE_SETTING_KEYS.MONTHLY_DISCOUNT_CAP: {
      const cap = numberOrNull(value);
      if (cap === null || cap < 0 || cap > 0.05) {
        return ["Monthly discount cap must be between 0 and 0.05"];
      }
      return [];
    }
    case FINANCE_SETTING_KEYS.STAYZA_FEE:
    case FINANCE_SETTING_KEYS.PROCESSING_LOCAL:
    case FINANCE_SETTING_KEYS.PROCESSING_INTL: {
      const parsed = parseFeeComponent(value);
      if (!parsed) {
        return [`${key} must be a valid fee component object`];
      }
      return validateFeeComponent(parsed, key);
    }
    case FINANCE_SETTING_KEYS.WITHDRAWAL_FEE: {
      if (!value || typeof value !== "object") {
        return ["Withdrawal fee config must be an object"];
      }
      const obj = value as Record<string, unknown>;
      const parsed = {
        percent: numberOrNull(obj.percent) ?? Number.NaN,
        cap: numberOrNull(obj.cap) ?? Number.NaN,
        minimumWithdrawal:
          numberOrNull(obj.minimumWithdrawal) ?? Number.NaN,
      };
      return validateWithdrawalFee(parsed);
    }
    default:
      return [];
  }
};

export const loadFinanceConfig = async (): Promise<FinanceConfig> => {
  const settingsMap = await loadSettingMap();
  const defaults = DEFAULT_FINANCE_CONFIG;
  const strictMode = config.FINANCIAL_ENGINE_V2_STRICT;
  const settingsValidationErrors: string[] = [];
  const normalizedSettingsMap: SettingMap = { ...settingsMap };

  for (const [key, value] of Object.entries(settingsMap)) {
    const errors = validateFinanceSettingValue(key, value);
    if (errors.length > 0) {
      settingsValidationErrors.push(
        ...errors.map((error) => `${key}: ${error}`)
      );
      delete normalizedSettingsMap[key];
    }
  }

  const parsedTiers =
    Array.isArray(normalizedSettingsMap[FINANCE_SETTING_KEYS.COMMISSION_TIERS]) &&
    (normalizedSettingsMap[FINANCE_SETTING_KEYS.COMMISSION_TIERS] as unknown[])
      .length > 0
      ? (
          normalizedSettingsMap[
            FINANCE_SETTING_KEYS.COMMISSION_TIERS
          ] as unknown[]
        )
          .map((entry) => parseTierEntry(entry))
          .filter((entry): entry is CommissionTierConfig => Boolean(entry))
      : defaults.commission.tiers;

  const parsedDiscounts =
    Array.isArray(
      normalizedSettingsMap[FINANCE_SETTING_KEYS.MONTHLY_DISCOUNTS]
    ) &&
    (normalizedSettingsMap[
      FINANCE_SETTING_KEYS.MONTHLY_DISCOUNTS
    ] as unknown[]).length > 0
      ? (
          normalizedSettingsMap[
            FINANCE_SETTING_KEYS.MONTHLY_DISCOUNTS
          ] as unknown[]
        )
          .map((entry) => parseDiscountEntry(entry))
          .filter((entry): entry is MonthlyDiscountConfig => Boolean(entry))
      : defaults.commission.monthlyDiscounts;

  const parsedDiscountCap =
    numberOrNull(
      normalizedSettingsMap[FINANCE_SETTING_KEYS.MONTHLY_DISCOUNT_CAP]
    ) ??
    defaults.commission.monthlyDiscountCapRate;

  const parsedStayzaFee =
    parseFeeComponent(normalizedSettingsMap[FINANCE_SETTING_KEYS.STAYZA_FEE]) ??
    defaults.serviceFee.stayza;
  const parsedLocalProcessingFee =
    parseFeeComponent(
      normalizedSettingsMap[FINANCE_SETTING_KEYS.PROCESSING_LOCAL]
    ) ??
    defaults.serviceFee.processing.local;
  const parsedIntlProcessingFee =
    parseFeeComponent(
      normalizedSettingsMap[FINANCE_SETTING_KEYS.PROCESSING_INTL]
    ) ??
    defaults.serviceFee.processing.international;

  const withdrawalRaw =
    normalizedSettingsMap[FINANCE_SETTING_KEYS.WITHDRAWAL_FEE] ||
    defaults.withdrawalFee;
  const withdrawalParsed = (() => {
    if (!withdrawalRaw || typeof withdrawalRaw !== "object") {
      return defaults.withdrawalFee;
    }
    const record = withdrawalRaw as Record<string, unknown>;
    return {
      percent:
        numberOrNull(record.percent) ?? defaults.withdrawalFee.percent,
      cap: numberOrNull(record.cap) ?? defaults.withdrawalFee.cap,
      minimumWithdrawal:
        numberOrNull(record.minimumWithdrawal) ??
        defaults.withdrawalFee.minimumWithdrawal,
    };
  })();

  const resolvedConfig: FinanceConfig = {
    version: defaults.version,
    timezone: defaults.timezone,
    commission: {
      tiers: parsedTiers,
      monthlyDiscounts: parsedDiscounts,
      monthlyDiscountCapRate: parsedDiscountCap,
    },
    serviceFee: {
      stayza: parsedStayzaFee,
      processing: {
        local: parsedLocalProcessingFee,
        international: parsedIntlProcessingFee,
      },
    },
    withdrawalFee: withdrawalParsed,
  };

  const validationErrors = [
    ...settingsValidationErrors,
    ...validateFinanceConfig(resolvedConfig),
  ];

  if (validationErrors.length > 0) {
    const errorMessage = `Finance config invalid: ${validationErrors.join(
      " | "
    )}`;

    setFinanceConfigHealth({
      status: strictMode ? "unhealthy" : "degraded",
      strictMode,
      usingDefaults: true,
      errors: validationErrors,
    });

    logger.error(errorMessage, {
      strictMode,
      validationErrors,
    });

    if (strictMode) {
      throw new Error(errorMessage);
    }

    return defaults;
  }

  setFinanceConfigHealth({
    status: "healthy",
    strictMode,
    usingDefaults: false,
    errors: [],
  });

  return resolvedConfig;
};
