import { FinanceConfig } from "@/services/financeConfig";

export type PaystackMode = "LOCAL" | "INTERNATIONAL";
export type ProcessingFeeMode =
  | "LOCAL_QUOTED"
  | "INTERNATIONAL_QUOTED"
  | "LOCAL_ACTUAL"
  | "INTERNATIONAL_ACTUAL";

export interface CommissionSnapshot {
  baseRate: number;
  volumeReductionRate: number;
  effectiveRate: number;
  commissionAmount: number;
  realtorRoomPayout: number;
}

export interface ServiceFeeBreakdown {
  total: number;
  stayza: number;
  processing: number;
  processingMode: ProcessingFeeMode;
  stayzaCapApplied: boolean;
  processingCapApplied: boolean;
}

export interface WithdrawalFeePreview {
  requestedAmount: number;
  feeAmount: number;
  netAmount: number;
  capApplied: boolean;
  minimumWithdrawal: number;
}

export interface MonthlyVolumeProgress {
  current: number;
  nextThreshold: number | null;
  nextReduction: number | null;
}

export interface QuoteBookingParams {
  pricePerNight: number;
  numberOfNights: number;
  cleaningFee?: number;
  securityDeposit?: number;
  monthlyVolume?: number;
  paystackMode?: PaystackMode;
}

export interface BookingQuoteResult {
  roomFee: number;
  cleaningFee: number;
  securityDeposit: number;
  chargeableSubtotal: number;
  serviceFee: number;
  serviceFeeBreakdown: ServiceFeeBreakdown;
  platformFee: number;
  totalPayable: number;
  commissionSnapshot: CommissionSnapshot;
  estimatedNetPayout: number;
  monthlyVolumeProgress: MonthlyVolumeProgress;
  nights: number;
}

const toKobo = (naira: number): number =>
  Math.round((Number(naira) + Number.EPSILON) * 100);

const fromKobo = (kobo: number): number =>
  Number((Math.round(kobo) / 100).toFixed(2));

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const computeFeeComponentInKobo = (
  subtotalKobo: number,
  component: FinanceConfig["serviceFee"]["stayza"]
): {
  totalKobo: number;
  capApplied: boolean;
} => {
  const percent = toNumber(component.percent, 0);
  const fixedKobo = toKobo(toNumber(component.fixed, 0));
  const variableRawKobo = Math.round(subtotalKobo * percent);

  if (component.noCap) {
    return {
      totalKobo: variableRawKobo + fixedKobo,
      capApplied: false,
    };
  }

  const variableCapKobo =
    component.capVariable !== undefined
      ? toKobo(toNumber(component.capVariable, 0))
      : Number.POSITIVE_INFINITY;
  const capTriggerKobo =
    component.capTrigger !== undefined
      ? toKobo(toNumber(component.capTrigger, 0))
      : null;
  const canApplyCap = capTriggerKobo === null || subtotalKobo >= capTriggerKobo;
  const variableCappedKobo = canApplyCap
    ? Math.min(variableRawKobo, variableCapKobo)
    : variableRawKobo;

  return {
    totalKobo: variableCappedKobo + fixedKobo,
    capApplied: canApplyCap && variableCappedKobo !== variableRawKobo,
  };
};

export const computeCommissionSnapshot = (
  roomFee: number,
  monthlyVolume: number,
  config: FinanceConfig
): CommissionSnapshot => {
  const normalizedRoomFee = Math.max(0, toNumber(roomFee, 0));
  const normalizedMonthlyVolume = Math.max(0, toNumber(monthlyVolume, 0));

  const tiers = [...config.commission.tiers].sort((a, b) => a.min - b.min);
  const applicableTier =
    tiers.find((tier) => {
      const inRangeMin = normalizedRoomFee >= tier.min;
      const inRangeMax = tier.max === null || normalizedRoomFee <= tier.max;
      return inRangeMin && inRangeMax;
    }) || tiers[tiers.length - 1];

  const discounts = [...config.commission.monthlyDiscounts].sort(
    (a, b) => a.volume - b.volume
  );
  let volumeReductionRate = 0;
  for (const discount of discounts) {
    if (normalizedMonthlyVolume >= discount.volume) {
      volumeReductionRate = discount.reductionRate;
    }
  }

  const cappedReduction = Math.min(
    volumeReductionRate,
    config.commission.monthlyDiscountCapRate
  );
  const effectiveRate = clamp(applicableTier.rate - cappedReduction, 0, 1);

  const roomFeeKobo = toKobo(normalizedRoomFee);
  const commissionKobo = Math.round(roomFeeKobo * effectiveRate);
  const realtorRoomKobo = roomFeeKobo - commissionKobo;

  return {
    baseRate: applicableTier.rate,
    volumeReductionRate: cappedReduction,
    effectiveRate,
    commissionAmount: fromKobo(commissionKobo),
    realtorRoomPayout: fromKobo(realtorRoomKobo),
  };
};

export const buildMonthlyVolumeProgress = (
  monthlyVolume: number,
  config: FinanceConfig
): MonthlyVolumeProgress => {
  const normalizedMonthlyVolume = Math.max(0, toNumber(monthlyVolume, 0));
  const sorted = [...config.commission.monthlyDiscounts].sort(
    (a, b) => a.volume - b.volume
  );
  const next = sorted.find((item) => item.volume > normalizedMonthlyVolume);
  return {
    current: Number(normalizedMonthlyVolume.toFixed(2)),
    nextThreshold: next ? next.volume : null,
    nextReduction: next ? next.reductionRate : null,
  };
};

export const computeGuestServiceFee = (
  chargeableSubtotal: number,
  paystackMode: PaystackMode,
  config: FinanceConfig,
  quoteMode: "QUOTED" | "ACTUAL" = "QUOTED"
): ServiceFeeBreakdown => {
  const subtotalKobo = toKobo(Math.max(0, toNumber(chargeableSubtotal, 0)));
  const stayzaPart = computeFeeComponentInKobo(subtotalKobo, config.serviceFee.stayza);
  const processingSource =
    paystackMode === "INTERNATIONAL"
      ? config.serviceFee.processing.international
      : config.serviceFee.processing.local;
  const processingPart = computeFeeComponentInKobo(subtotalKobo, processingSource);

  const modePrefix = paystackMode === "INTERNATIONAL" ? "INTERNATIONAL" : "LOCAL";
  const processingMode = `${modePrefix}_${quoteMode}` as ProcessingFeeMode;

  return {
    total: fromKobo(stayzaPart.totalKobo + processingPart.totalKobo),
    stayza: fromKobo(stayzaPart.totalKobo),
    processing: fromKobo(processingPart.totalKobo),
    processingMode,
    stayzaCapApplied: stayzaPart.capApplied,
    processingCapApplied: processingPart.capApplied,
  };
};

export const quoteBooking = (
  params: QuoteBookingParams,
  config: FinanceConfig
): BookingQuoteResult => {
  const nights = Math.max(1, Math.floor(toNumber(params.numberOfNights, 1)));
  const pricePerNight = Math.max(0, toNumber(params.pricePerNight, 0));
  const roomFee = Number((pricePerNight * nights).toFixed(2));
  const cleaningFee = Number(
    Math.max(0, toNumber(params.cleaningFee, 0)).toFixed(2)
  );
  const securityDeposit = Number(
    Math.max(0, toNumber(params.securityDeposit, 0)).toFixed(2)
  );
  const monthlyVolume = Number(
    Math.max(0, toNumber(params.monthlyVolume, 0)).toFixed(2)
  );
  const paystackMode = params.paystackMode || "LOCAL";

  const chargeableSubtotal = Number((roomFee + cleaningFee).toFixed(2));
  const commissionSnapshot = computeCommissionSnapshot(
    roomFee,
    monthlyVolume,
    config
  );
  const serviceFeeBreakdown = computeGuestServiceFee(
    chargeableSubtotal,
    paystackMode,
    config,
    "QUOTED"
  );

  const totalPayable = Number(
    (roomFee + cleaningFee + securityDeposit + serviceFeeBreakdown.total).toFixed(
      2
    )
  );
  const estimatedNetPayout = Number(
    (cleaningFee + commissionSnapshot.realtorRoomPayout).toFixed(2)
  );

  return {
    roomFee,
    cleaningFee,
    securityDeposit,
    chargeableSubtotal,
    serviceFee: serviceFeeBreakdown.total,
    serviceFeeBreakdown,
    platformFee: commissionSnapshot.commissionAmount,
    totalPayable,
    commissionSnapshot,
    estimatedNetPayout,
    monthlyVolumeProgress: buildMonthlyVolumeProgress(monthlyVolume, config),
    nights,
  };
};

export const computeWithdrawalFee = (
  requestedAmount: number,
  config: FinanceConfig
): WithdrawalFeePreview => {
  const requested = Number(Math.max(0, toNumber(requestedAmount, 0)).toFixed(2));
  const feeRaw = requested * config.withdrawalFee.percent;
  const feeAmount = Number(
    Math.min(feeRaw, config.withdrawalFee.cap).toFixed(2)
  );
  const netAmount = Number((requested - feeAmount).toFixed(2));
  return {
    requestedAmount: requested,
    feeAmount,
    netAmount,
    capApplied: feeRaw > config.withdrawalFee.cap,
    minimumWithdrawal: config.withdrawalFee.minimumWithdrawal,
  };
};

export const computeCommissionReversal = (
  refundedRoomFee: number,
  effectiveRate: number
): number => {
  const refundedKobo = toKobo(Math.max(0, toNumber(refundedRoomFee, 0)));
  const rate = clamp(toNumber(effectiveRate, 0), 0, 1);
  return fromKobo(Math.round(refundedKobo * rate));
};

export const getCurrentLagosMonthBounds = (
  referenceDate = new Date()
): { start: Date; end: Date } => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(referenceDate);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const lagosOffsetMs = 60 * 60 * 1000; // Africa/Lagos = UTC+1 (no DST)

  const startUtc = new Date(Date.UTC(year, month - 1, 1) - lagosOffsetMs);
  const endUtc = new Date(Date.UTC(year, month, 1) - lagosOffsetMs);

  return {
    start: startUtc,
    end: endUtc,
  };
};
