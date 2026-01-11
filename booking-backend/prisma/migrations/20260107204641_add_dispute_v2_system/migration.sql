/*
  Warnings:

  - The values [NEGOTIATION,AGREED,ADMIN_REVIEW,REJECTED] on the enum `DisputeStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `agreedAmount` on the `disputes` table. All the data in the column will be lost.
  - You are about to drop the column `disputeType` on the `disputes` table. All the data in the column will be lost.
  - You are about to drop the column `evidence` on the `disputes` table. All the data in the column will be lost.
  - You are about to drop the column `messages` on the `disputes` table. All the data in the column will be lost.
  - You are about to drop the column `outcome` on the `disputes` table. All the data in the column will be lost.
  - Added the required column `category` to the `disputes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `claimedAmount` to the `disputes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `disputeSubject` to the `disputes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guestRefundAmount` to the `disputes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxRefundPercent` to the `disputes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platformFeeAmount` to the `disputes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `realtorPayoutAmount` to the `disputes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `writeup` to the `disputes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."DisputeSubject" AS ENUM ('ROOM_FEE', 'SECURITY_DEPOSIT');

-- CreateEnum
CREATE TYPE "public"."DisputeCategory" AS ENUM ('SAFETY_UNINHABITABLE', 'MAJOR_MISREPRESENTATION', 'MISSING_AMENITIES_CLEANLINESS', 'MINOR_INCONVENIENCE', 'PROPERTY_DAMAGE', 'MISSING_ITEMS', 'CLEANING_REQUIRED', 'OTHER_DEPOSIT_CLAIM');

-- CreateEnum
CREATE TYPE "public"."DisputeResponseAction" AS ENUM ('ACCEPT', 'REJECT_ESCALATE');

-- CreateEnum
CREATE TYPE "public"."AdminDisputeDecision" AS ENUM ('FULL_REFUND', 'PARTIAL_REFUND', 'NO_REFUND');

-- CreateEnum
CREATE TYPE "public"."DisputeFinalOutcome" AS ENUM ('FULL_REFUND_EXECUTED', 'PARTIAL_REFUND_EXECUTED', 'NO_REFUND_EXECUTED', 'DEPOSIT_FORFEITED', 'DEPOSIT_PARTIAL', 'DEPOSIT_RETURNED');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."DisputeStatus_new" AS ENUM ('OPEN', 'AWAITING_RESPONSE', 'ESCALATED', 'RESOLVED', 'CANCELLED');
ALTER TABLE "public"."disputes" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."disputes" ALTER COLUMN "status" TYPE "public"."DisputeStatus_new" USING ("status"::text::"public"."DisputeStatus_new");
ALTER TYPE "public"."DisputeStatus" RENAME TO "DisputeStatus_old";
ALTER TYPE "public"."DisputeStatus_new" RENAME TO "DisputeStatus";
DROP TYPE "public"."DisputeStatus_old";
ALTER TABLE "public"."disputes" ALTER COLUMN "status" SET DEFAULT 'OPEN';
COMMIT;

-- DropIndex
DROP INDEX "public"."disputes_disputeType_idx";

-- AlterTable
ALTER TABLE "public"."disputes" DROP COLUMN "agreedAmount",
DROP COLUMN "disputeType",
DROP COLUMN "evidence",
DROP COLUMN "messages",
DROP COLUMN "outcome",
ADD COLUMN     "adminDecision" "public"."AdminDisputeDecision",
ADD COLUMN     "attachments" JSONB,
ADD COLUMN     "category" "public"."DisputeCategory" NOT NULL,
ADD COLUMN     "claimedAmount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "disputeSubject" "public"."DisputeSubject" NOT NULL,
ADD COLUMN     "executedAt" TIMESTAMP(3),
ADD COLUMN     "executionReference" TEXT,
ADD COLUMN     "finalOutcome" "public"."DisputeFinalOutcome",
ADD COLUMN     "guestRefundAmount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "maxRefundPercent" INTEGER NOT NULL,
ADD COLUMN     "platformFeeAmount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "realtorPayoutAmount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "respondedBy" TEXT,
ADD COLUMN     "responseAction" "public"."DisputeResponseAction",
ADD COLUMN     "responseNotes" TEXT,
ADD COLUMN     "writeup" TEXT NOT NULL;

-- DropEnum
DROP TYPE "public"."DisputeType";

-- CreateIndex
CREATE INDEX "disputes_disputeSubject_idx" ON "public"."disputes"("disputeSubject");

-- CreateIndex
CREATE INDEX "disputes_category_idx" ON "public"."disputes"("category");

-- AddForeignKey
ALTER TABLE "public"."disputes" ADD CONSTRAINT "disputes_respondedBy_fkey" FOREIGN KEY ("respondedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
