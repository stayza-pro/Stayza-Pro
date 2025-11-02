-- AlterEnum
ALTER TYPE "public"."NotificationType" ADD VALUE 'REALTOR_REINSTATED';

-- AlterTable
ALTER TABLE "public"."properties" ADD COLUMN     "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "customAmenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "state" TEXT;
