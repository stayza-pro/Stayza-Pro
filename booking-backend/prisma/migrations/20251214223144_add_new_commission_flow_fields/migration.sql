-- CreateEnum
CREATE TYPE "public"."DisputeTier" AS ENUM ('TIER_1_SEVERE', 'TIER_2_PARTIAL', 'TIER_3_ABUSE');

-- CreateEnum
CREATE TYPE "public"."CheckInConfirmationType" AS ENUM ('GUEST_CONFIRMED', 'REALTOR_CONFIRMED', 'AUTO_FALLBACK');

-- CreateEnum
CREATE TYPE "public"."RealtorDisputeOutcome" AS ENUM ('WIN', 'LOSS', 'PARTIAL');

-- AlterEnum
ALTER TYPE "public"."BookingStatus" ADD VALUE 'CHECKED_IN_CONFIRMED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."EscrowEventType" ADD VALUE 'RELEASE_CLEANING_FEE';
ALTER TYPE "public"."EscrowEventType" ADD VALUE 'COLLECT_SERVICE_FEE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."PaymentStatus" ADD VALUE 'PARTIAL_RELEASED';
ALTER TYPE "public"."PaymentStatus" ADD VALUE 'DEPOSIT_PROCESSING';

-- AlterTable
ALTER TABLE "public"."bookings" ADD COLUMN     "checkinConfirmationType" TEXT,
ADD COLUMN     "checkinConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "cleaningFeeReleasedAt" TIMESTAMP(3),
ADD COLUMN     "depositDeductionAmount" DECIMAL(10,2),
ADD COLUMN     "depositRefundEligibleAt" TIMESTAMP(3),
ADD COLUMN     "disputeRefundAmount" DECIMAL(10,2),
ADD COLUMN     "guestDisputeTier" TEXT,
ADD COLUMN     "realtorDisputeOutcome" TEXT,
ADD COLUMN     "roomFeeReleaseEligibleAt" TIMESTAMP(3),
ADD COLUMN     "serviceFeeCollectedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."payments" ADD COLUMN     "cleaningFeeReleaseReference" TEXT,
ADD COLUMN     "cleaningFeeReleasedToRealtor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "depositDeductionProcessed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "depositPartialRefundAmount" DECIMAL(10,2),
ADD COLUMN     "depositPartialRefundReference" TEXT,
ADD COLUMN     "disputeRefundProcessed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "disputeRefundReference" TEXT,
ADD COLUMN     "roomFeeSplitPlatformAmount" DECIMAL(10,2),
ADD COLUMN     "roomFeeSplitRealtorAmount" DECIMAL(10,2),
ADD COLUMN     "roomFeeSplitReleaseReference" TEXT,
ADD COLUMN     "serviceFeeCollectedByPlatform" BOOLEAN NOT NULL DEFAULT false;
