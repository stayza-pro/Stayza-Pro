-- CreateEnum
CREATE TYPE "public"."CacStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "public"."realtors" ADD COLUMN     "cacRejectedAt" TIMESTAMP(3),
ADD COLUMN     "cacRejectionReason" TEXT,
ADD COLUMN     "cacStatus" "public"."CacStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "cacVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "canAppeal" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "suspensionExpiresAt" TIMESTAMP(3);
