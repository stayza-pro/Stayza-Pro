-- AlterTable
ALTER TABLE "public"."payments" ADD COLUMN     "commissionPaidOut" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "commissionRate" DECIMAL(5,4),
ADD COLUMN     "payoutDate" TIMESTAMP(3),
ADD COLUMN     "payoutReference" TEXT,
ADD COLUMN     "platformCommission" DECIMAL(10,2),
ADD COLUMN     "realtorEarnings" DECIMAL(10,2);
