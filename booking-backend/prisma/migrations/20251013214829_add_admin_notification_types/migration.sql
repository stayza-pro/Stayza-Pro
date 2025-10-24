-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."NotificationType" ADD VALUE 'REALTOR_REGISTRATION';
ALTER TYPE "public"."NotificationType" ADD VALUE 'CAC_VERIFICATION';
ALTER TYPE "public"."NotificationType" ADD VALUE 'PAYOUT_COMPLETED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'PROPERTY_SUBMISSION';
ALTER TYPE "public"."NotificationType" ADD VALUE 'REVIEW_FLAGGED';
ALTER TYPE "public"."NotificationType" ADD VALUE 'DISPUTE_OPENED';
