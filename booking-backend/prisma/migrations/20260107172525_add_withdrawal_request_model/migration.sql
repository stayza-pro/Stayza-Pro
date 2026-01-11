-- CreateEnum
CREATE TYPE "public"."WithdrawalRequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."withdrawal_requests" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "realtorId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "public"."WithdrawalRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "paystackTransferId" TEXT,
    "paystackTransferCode" TEXT,
    "metadata" JSONB,

    CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "withdrawal_requests_realtorId_idx" ON "public"."withdrawal_requests"("realtorId");

-- CreateIndex
CREATE INDEX "withdrawal_requests_walletId_idx" ON "public"."withdrawal_requests"("walletId");

-- CreateIndex
CREATE INDEX "withdrawal_requests_status_idx" ON "public"."withdrawal_requests"("status");
