/*
  Warnings:

  - The values [CONFIRMED,PAID,CHECKED_IN,DISPUTE_OPENED,CHECKED_OUT,CHECKED_IN_CONFIRMED] on the enum `BookingStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PENDING,ESCROW_HELD,ROOM_FEE_SPLIT_RELEASED,RELEASED_TO_REALTOR,REFUNDED_TO_CUSTOMER,PARTIAL_PAYOUT_REALTOR,COMPLETED,PARTIAL_RELEASED,DEPOSIT_PROCESSING] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."WalletOwnerType" AS ENUM ('REALTOR', 'PLATFORM');

-- CreateEnum
CREATE TYPE "public"."WalletTransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "public"."WalletTransactionSource" AS ENUM ('CLEANING_FEE', 'ROOM_FEE', 'SERVICE_FEE', 'WITHDRAWAL', 'REFUND', 'ADJUSTMENT', 'CANCELLATION');

-- CreateEnum
CREATE TYPE "public"."WalletTransactionStatus" AS ENUM ('COMPLETED', 'PENDING', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."EscrowStatus" AS ENUM ('HOLDING', 'RELEASED', 'REFUNDED', 'PARTIAL_RELEASED');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."BookingStatus_new" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."bookings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."bookings" ALTER COLUMN "status" TYPE "public"."BookingStatus_new" USING ("status"::text::"public"."BookingStatus_new");
ALTER TYPE "public"."BookingStatus" RENAME TO "BookingStatus_old";
ALTER TYPE "public"."BookingStatus_new" RENAME TO "BookingStatus";
DROP TYPE "public"."BookingStatus_old";
ALTER TABLE "public"."bookings" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."PaymentStatus_new" AS ENUM ('INITIATED', 'HELD', 'RELEASED', 'REFUNDED', 'FAILED');
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

-- CreateTable
CREATE TABLE "public"."wallets" (
    "id" TEXT NOT NULL,
    "ownerType" "public"."WalletOwnerType" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "balanceAvailable" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balancePending" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."wallet_transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "public"."WalletTransactionType" NOT NULL,
    "source" "public"."WalletTransactionSource" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "referenceId" TEXT,
    "status" "public"."WalletTransactionStatus" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."escrows" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "roomFeeHeld" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "depositHeld" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "public"."EscrowStatus" NOT NULL DEFAULT 'HOLDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escrows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wallets_ownerId_idx" ON "public"."wallets"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_ownerType_ownerId_key" ON "public"."wallets"("ownerType", "ownerId");

-- CreateIndex
CREATE INDEX "wallet_transactions_walletId_idx" ON "public"."wallet_transactions"("walletId");

-- CreateIndex
CREATE INDEX "wallet_transactions_referenceId_idx" ON "public"."wallet_transactions"("referenceId");

-- CreateIndex
CREATE INDEX "wallet_transactions_createdAt_idx" ON "public"."wallet_transactions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "escrows_bookingId_key" ON "public"."escrows"("bookingId");

-- CreateIndex
CREATE INDEX "escrows_bookingId_idx" ON "public"."escrows"("bookingId");

-- CreateIndex
CREATE INDEX "escrows_status_idx" ON "public"."escrows"("status");

-- AddForeignKey
ALTER TABLE "public"."wallet_transactions" ADD CONSTRAINT "wallet_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "public"."wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."escrows" ADD CONSTRAINT "escrows_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
