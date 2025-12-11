-- AlterTable
ALTER TABLE "public"."properties" ADD COLUMN     "cleaningFee" DECIMAL(10,2),
ADD COLUMN     "securityDeposit" DECIMAL(10,2),
ADD COLUMN     "serviceFee" DECIMAL(10,2);
