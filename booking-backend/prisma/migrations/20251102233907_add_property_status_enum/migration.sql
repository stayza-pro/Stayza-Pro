-- CreateEnum
CREATE TYPE "public"."PropertyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "public"."properties" ADD COLUMN     "status" "public"."PropertyStatus" NOT NULL DEFAULT 'DRAFT';
