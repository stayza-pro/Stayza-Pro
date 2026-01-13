-- AlterTable
ALTER TABLE "public"."withdrawal_requests" ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "public"."withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "public"."wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_realtorId_fkey" FOREIGN KEY ("realtorId") REFERENCES "public"."realtors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
