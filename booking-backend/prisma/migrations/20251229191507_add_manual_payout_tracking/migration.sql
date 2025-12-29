-- AlterTable
ALTER TABLE "public"."payments" ADD COLUMN     "realtorTransferCompleted" TIMESTAMP(3),
ADD COLUMN     "realtorTransferInitiated" TIMESTAMP(3),
ADD COLUMN     "realtorTransferReference" TEXT,
ADD COLUMN     "transferFailed" BOOLEAN NOT NULL DEFAULT false;
