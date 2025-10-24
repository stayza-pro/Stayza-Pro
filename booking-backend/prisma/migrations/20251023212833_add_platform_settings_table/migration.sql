/*
  Warnings:

  - The values [REALTOR_REINSTATED] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."NotificationType_new" AS ENUM ('BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'PAYMENT_COMPLETED', 'PAYMENT_FAILED', 'REVIEW_RECEIVED', 'REVIEW_RESPONSE', 'SYSTEM_ALERT', 'PROPERTY_STATUS_CHANGE', 'MESSAGE_RECEIVED', 'CAC_STATUS_UPDATE', 'BOOKING_REMINDER', 'PAYMENT_REMINDER', 'REALTOR_REGISTRATION', 'CAC_VERIFICATION', 'PAYOUT_COMPLETED', 'PROPERTY_SUBMISSION', 'REVIEW_FLAGGED', 'DISPUTE_OPENED');
ALTER TABLE "public"."notifications" ALTER COLUMN "type" TYPE "public"."NotificationType_new" USING ("type"::text::"public"."NotificationType_new");
ALTER TYPE "public"."NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "public"."NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- CreateTable
CREATE TABLE "public"."platform_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "platform_settings_category_idx" ON "public"."platform_settings"("category");

-- CreateIndex
CREATE INDEX "platform_settings_isActive_idx" ON "public"."platform_settings"("isActive");

-- AddForeignKey
ALTER TABLE "public"."platform_settings" ADD CONSTRAINT "platform_settings_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
