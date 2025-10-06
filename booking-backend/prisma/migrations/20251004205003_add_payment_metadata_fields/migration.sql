-- AlterTable
ALTER TABLE "public"."payments" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "refundAmount" DECIMAL(10,2);
