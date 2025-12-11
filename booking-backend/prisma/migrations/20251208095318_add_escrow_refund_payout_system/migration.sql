-- CreateEnum
CREATE TYPE "public"."PayoutStatus" AS ENUM ('PENDING', 'READY', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."RefundTier" AS ENUM ('EARLY', 'MEDIUM', 'LATE', 'NONE');

-- AlterEnum
ALTER TYPE "public"."PaymentStatus" ADD VALUE 'PARTIAL_REFUND';

-- AlterTable
ALTER TABLE "public"."bookings" ADD COLUMN     "payoutCompletedAt" TIMESTAMP(3),
ADD COLUMN     "payoutEligibleAt" TIMESTAMP(3),
ADD COLUMN     "payoutStatus" "public"."PayoutStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "refundCutoffTime" TIMESTAMP(3),
ADD COLUMN     "refundTier" "public"."RefundTier",
ADD COLUMN     "specialRequests" TEXT;
