/*
  Warnings:

  - The values [REFUNDED,PARTIAL_REFUND] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."DisputeType" AS ENUM ('USER_DISPUTE', 'REALTOR_DISPUTE');

-- CreateEnum
CREATE TYPE "public"."DisputeStatus" AS ENUM ('OPEN', 'AWAITING_RESPONSE', 'NEGOTIATION', 'AGREED', 'ADMIN_REVIEW', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."EscrowEventType" AS ENUM ('HOLD_ROOM_FEE', 'HOLD_SECURITY_DEPOSIT', 'RELEASE_ROOM_FEE_SPLIT', 'RELEASE_DEPOSIT_TO_CUSTOMER', 'PAY_REALTOR_FROM_DEPOSIT', 'PAY_BALANCE_FROM_CUSTOMER', 'REFUND_ROOM_FEE_TO_CUSTOMER', 'REFUND_PARTIAL_TO_CUSTOMER', 'REFUND_PARTIAL_TO_REALTOR');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."BookingStatus" ADD VALUE 'PAID';
ALTER TYPE "public"."BookingStatus" ADD VALUE 'CHECKED_IN';
ALTER TYPE "public"."BookingStatus" ADD VALUE 'DISPUTE_OPENED';
ALTER TYPE "public"."BookingStatus" ADD VALUE 'CHECKED_OUT';

-- AlterEnum
BEGIN;
CREATE TYPE "public"."PaymentStatus_new" AS ENUM ('INITIATED', 'PENDING', 'ESCROW_HELD', 'ROOM_FEE_SPLIT_RELEASED', 'RELEASED_TO_REALTOR', 'REFUNDED_TO_CUSTOMER', 'PARTIAL_PAYOUT_REALTOR', 'COMPLETED', 'FAILED');
ALTER TABLE "public"."payments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."payments" ALTER COLUMN "status" TYPE "public"."PaymentStatus_new" USING ("status"::text::"public"."PaymentStatus_new");
ALTER TYPE "public"."PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "public"."PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
ALTER TABLE "public"."payments" ALTER COLUMN "status" SET DEFAULT 'INITIATED';
COMMIT;

-- AlterTable
ALTER TABLE "public"."bookings" ADD COLUMN     "checkInTime" TIMESTAMP(3),
ADD COLUMN     "checkOutTime" TIMESTAMP(3),
ADD COLUMN     "cleaningFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "disputeWindowClosesAt" TIMESTAMP(3),
ADD COLUMN     "platformFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "realtorDisputeClosesAt" TIMESTAMP(3),
ADD COLUMN     "realtorDisputeOpened" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "roomFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "securityDeposit" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "serviceFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "userDisputeOpened" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."payments" ADD COLUMN     "cleaningFeeAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "cleaningFeePaidOut" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "depositInEscrow" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "depositRefunded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "depositReleasedAt" TIMESTAMP(3),
ADD COLUMN     "platformFeeAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "providerId" TEXT,
ADD COLUMN     "roomFeeAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "roomFeeInEscrow" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "roomFeeReleasedAt" TIMESTAMP(3),
ADD COLUMN     "roomFeeSplitDone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "securityDepositAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "serviceFeeAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "serviceFeeCollected" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "status" SET DEFAULT 'INITIATED';

-- CreateTable
CREATE TABLE "public"."disputes" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "disputeType" "public"."DisputeType" NOT NULL,
    "status" "public"."DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "openedBy" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "outcome" TEXT,
    "agreedAmount" DECIMAL(10,2),
    "evidence" JSONB,
    "messages" JSONB,
    "escalatedToAdmin" BOOLEAN NOT NULL DEFAULT false,
    "adminId" TEXT,
    "adminNotes" TEXT,
    "adminResolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."escrow_events" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "eventType" "public"."EscrowEventType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "fromParty" TEXT,
    "toParty" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionReference" TEXT,
    "providerResponse" JSONB,
    "notes" TEXT,
    "triggeredBy" TEXT,

    CONSTRAINT "escrow_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "disputes_bookingId_idx" ON "public"."disputes"("bookingId");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "public"."disputes"("status");

-- CreateIndex
CREATE INDEX "disputes_disputeType_idx" ON "public"."disputes"("disputeType");

-- CreateIndex
CREATE INDEX "escrow_events_bookingId_idx" ON "public"."escrow_events"("bookingId");

-- CreateIndex
CREATE INDEX "escrow_events_eventType_idx" ON "public"."escrow_events"("eventType");

-- AddForeignKey
ALTER TABLE "public"."disputes" ADD CONSTRAINT "disputes_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."disputes" ADD CONSTRAINT "disputes_openedBy_fkey" FOREIGN KEY ("openedBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."disputes" ADD CONSTRAINT "disputes_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."escrow_events" ADD CONSTRAINT "escrow_events_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
