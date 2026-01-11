-- CreateEnum
CREATE TYPE "public"."StayStatus" AS ENUM ('NOT_STARTED', 'CHECKED_IN', 'CHECKED_OUT');

-- AlterTable
ALTER TABLE "public"."bookings" ADD COLUMN     "stayStatus" "public"."StayStatus" NOT NULL DEFAULT 'NOT_STARTED';
