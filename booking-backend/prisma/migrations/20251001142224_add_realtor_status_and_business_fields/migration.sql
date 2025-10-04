-- CreateEnum
CREATE TYPE "public"."RealtorStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."realtors" ADD COLUMN     "businessPhone" TEXT,
ADD COLUMN     "cacDocumentUrl" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "status" "public"."RealtorStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "primaryColor" SET DEFAULT '#000000';
