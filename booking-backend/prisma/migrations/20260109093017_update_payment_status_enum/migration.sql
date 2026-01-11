/*
  Warnings:

  - The values [RELEASED] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."PaymentStatus_new" AS ENUM ('INITIATED', 'HELD', 'PARTIALLY_RELEASED', 'SETTLED', 'REFUNDED', 'FAILED');
ALTER TABLE "public"."bookings" ALTER COLUMN "paymentStatus" DROP DEFAULT;
ALTER TABLE "public"."payments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."bookings" ALTER COLUMN "paymentStatus" TYPE "public"."PaymentStatus_new" USING ("paymentStatus"::text::"public"."PaymentStatus_new");
ALTER TABLE "public"."payments" ALTER COLUMN "status" TYPE "public"."PaymentStatus_new" USING ("status"::text::"public"."PaymentStatus_new");
ALTER TYPE "public"."PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "public"."PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
ALTER TABLE "public"."bookings" ALTER COLUMN "paymentStatus" SET DEFAULT 'INITIATED';
ALTER TABLE "public"."payments" ALTER COLUMN "status" SET DEFAULT 'INITIATED';
COMMIT;
