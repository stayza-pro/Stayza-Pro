-- AlterTable
ALTER TABLE "public"."payments" ADD COLUMN     "providerTransactionId" TEXT,
ADD COLUMN     "refundedAt" TIMESTAMP(3);
