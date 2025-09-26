/*
  Warnings:

  - The values [HOST] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `refundAmount` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `refundReason` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `hostId` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `images` on the `properties` table. All the data in the column will be lost.
  - Added the required column `platformCommission` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `propertyPrice` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `realtorPayout` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceFee` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gatewayFee` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platformCommission` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platformNet` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `propertyAmount` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `realtorPayout` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceFeeAmount` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `realtorId` to the `properties` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."RealtorStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."PayoutStatus" AS ENUM ('PENDING', 'RELEASED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."RefundPolicyType" AS ENUM ('FULL_REFUND_24H', 'PARTIAL_REFUND_12_24H', 'NO_REFUND_UNDER_12H', 'CUSTOM');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."UserRole_new" AS ENUM ('GUEST', 'REALTOR', 'ADMIN');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."users" ALTER COLUMN "role" TYPE "public"."UserRole_new" USING ("role"::text::"public"."UserRole_new");
ALTER TYPE "public"."UserRole" RENAME TO "UserRole_old";
ALTER TYPE "public"."UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "public"."users" ALTER COLUMN "role" SET DEFAULT 'GUEST';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."properties" DROP CONSTRAINT "properties_hostId_fkey";

-- AlterTable
ALTER TABLE "public"."bookings" ADD COLUMN     "payoutReleaseDate" TIMESTAMP(3),
ADD COLUMN     "payoutStatus" "public"."PayoutStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "platformCommission" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "propertyPrice" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "realtorPayout" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "serviceFee" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "public"."payments" DROP COLUMN "refundAmount",
DROP COLUMN "refundReason",
ADD COLUMN     "gatewayFee" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "payoutReleased" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payoutReleasedAt" TIMESTAMP(3),
ADD COLUMN     "paystackSplitCode" TEXT,
ADD COLUMN     "platformCommission" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "platformNet" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "propertyAmount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "realtorPayout" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "serviceFeeAmount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "stripeTransferId" TEXT;

-- AlterTable
ALTER TABLE "public"."properties" DROP COLUMN "hostId",
DROP COLUMN "images",
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "realtorId" TEXT NOT NULL,
ADD COLUMN     "rejectionReason" TEXT;

-- CreateTable
CREATE TABLE "public"."realtors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "brandColorHex" TEXT NOT NULL DEFAULT '#3B82F6',
    "status" "public"."RealtorStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "website" TEXT,
    "businessPhone" TEXT,
    "businessEmail" TEXT,
    "businessAddress" TEXT,
    "stripeAccountId" TEXT,
    "paystackSubAccountId" TEXT,
    "commissionRate" DECIMAL(5,4) NOT NULL DEFAULT 0.05,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subscriptionPlan" TEXT NOT NULL DEFAULT 'FREE',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "realtors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."realtor_refund_policies" (
    "id" TEXT NOT NULL,
    "realtorId" TEXT NOT NULL,
    "policyType" "public"."RefundPolicyType" NOT NULL DEFAULT 'FULL_REFUND_24H',
    "fullRefundHours" INTEGER NOT NULL DEFAULT 24,
    "partialRefundHours" INTEGER NOT NULL DEFAULT 12,
    "partialRefundRate" DECIMAL(5,4) NOT NULL DEFAULT 0.50,
    "customDescription" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "realtor_refund_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."property_images" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "propertyId" TEXT NOT NULL,

    CONSTRAINT "property_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."refunds" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "reason" TEXT NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" "public"."PaymentMethod" NOT NULL,
    "stripeRefundId" TEXT,
    "paystackRefundId" TEXT,
    "adminApproved" BOOLEAN NOT NULL DEFAULT false,
    "adminApprovedBy" TEXT,
    "adminApprovedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "processedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bookingId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "realtors_userId_key" ON "public"."realtors"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "realtors_slug_key" ON "public"."realtors"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "realtors_stripeAccountId_key" ON "public"."realtors"("stripeAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "realtors_paystackSubAccountId_key" ON "public"."realtors"("paystackSubAccountId");

-- AddForeignKey
ALTER TABLE "public"."realtors" ADD CONSTRAINT "realtors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."realtor_refund_policies" ADD CONSTRAINT "realtor_refund_policies_realtorId_fkey" FOREIGN KEY ("realtorId") REFERENCES "public"."realtors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."properties" ADD CONSTRAINT "properties_realtorId_fkey" FOREIGN KEY ("realtorId") REFERENCES "public"."realtors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."property_images" ADD CONSTRAINT "property_images_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refunds" ADD CONSTRAINT "refunds_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refunds" ADD CONSTRAINT "refunds_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
