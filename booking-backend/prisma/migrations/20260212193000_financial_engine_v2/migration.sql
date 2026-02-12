-- Financial Engine V2 schema updates

-- Booking snapshots
ALTER TABLE "public"."bookings"
ADD COLUMN "commissionBaseRate" DECIMAL(5,4),
ADD COLUMN "commissionVolumeReductionRate" DECIMAL(5,4),
ADD COLUMN "commissionEffectiveRate" DECIMAL(5,4),
ADD COLUMN "monthlyVolumeAtPricing" DECIMAL(12,2),
ADD COLUMN "serviceFeeStayza" DECIMAL(10,2),
ADD COLUMN "serviceFeeProcessing" DECIMAL(10,2),
ADD COLUMN "processingFeeMode" TEXT;

-- Payment snapshots
ALTER TABLE "public"."payments"
ADD COLUMN "commissionBaseRate" DECIMAL(5,4),
ADD COLUMN "commissionVolumeReductionRate" DECIMAL(5,4),
ADD COLUMN "commissionEffectiveRate" DECIMAL(5,4),
ADD COLUMN "commissionBaseAmount" DECIMAL(10,2),
ADD COLUMN "serviceFeeStayzaAmount" DECIMAL(10,2),
ADD COLUMN "serviceFeeProcessingQuotedAmount" DECIMAL(10,2),
ADD COLUMN "serviceFeeProcessingActualAmount" DECIMAL(10,2),
ADD COLUMN "serviceFeeProcessingVarianceAmount" DECIMAL(10,2),
ADD COLUMN "processingFeeModeQuoted" TEXT,
ADD COLUMN "processingFeeModeActual" TEXT;

-- Withdrawal fee accounting
ALTER TABLE "public"."withdrawal_requests"
ADD COLUMN "feeAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "netAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "feeConfigVersion" TEXT;

-- Wallet transaction sources used by V2 accounting
ALTER TYPE "public"."WalletTransactionSource" ADD VALUE IF NOT EXISTS 'COMMISSION';
ALTER TYPE "public"."WalletTransactionSource" ADD VALUE IF NOT EXISTS 'WITHDRAWAL_FEE';
ALTER TYPE "public"."WalletTransactionSource" ADD VALUE IF NOT EXISTS 'PROCESSING_FEE_ADJUSTMENT';
