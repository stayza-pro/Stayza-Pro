-- CreateEnum
CREATE TYPE "public"."RefundRequestStatus" AS ENUM ('PENDING_REALTOR_APPROVAL', 'REALTOR_APPROVED', 'REALTOR_REJECTED', 'ADMIN_PROCESSING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."refund_requests" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "requestedAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "customerNotes" TEXT,
    "status" "public"."RefundRequestStatus" NOT NULL DEFAULT 'PENDING_REALTOR_APPROVAL',
    "realtorId" TEXT,
    "realtorApprovedAt" TIMESTAMP(3),
    "realtorReason" TEXT,
    "realtorNotes" TEXT,
    "adminId" TEXT,
    "adminProcessedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "actualRefundAmount" DECIMAL(10,2),
    "providerRefundId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "refund_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "refund_requests_bookingId_idx" ON "public"."refund_requests"("bookingId");

-- CreateIndex
CREATE INDEX "refund_requests_paymentId_idx" ON "public"."refund_requests"("paymentId");

-- CreateIndex
CREATE INDEX "refund_requests_status_idx" ON "public"."refund_requests"("status");

-- CreateIndex
CREATE INDEX "refund_requests_requestedBy_idx" ON "public"."refund_requests"("requestedBy");

-- CreateIndex
CREATE INDEX "refund_requests_realtorId_idx" ON "public"."refund_requests"("realtorId");

-- AddForeignKey
ALTER TABLE "public"."refund_requests" ADD CONSTRAINT "refund_requests_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refund_requests" ADD CONSTRAINT "refund_requests_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refund_requests" ADD CONSTRAINT "refund_requests_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refund_requests" ADD CONSTRAINT "refund_requests_realtorId_fkey" FOREIGN KEY ("realtorId") REFERENCES "public"."realtors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refund_requests" ADD CONSTRAINT "refund_requests_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
