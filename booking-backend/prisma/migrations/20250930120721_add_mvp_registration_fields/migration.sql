/*
  Warnings:

  - You are about to drop the column `brandColorHex` on the `realtors` table. All the data in the column will be lost.
  - Added the required column `fullName` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."realtors" DROP COLUMN "brandColorHex",
ADD COLUMN     "accentColor" TEXT DEFAULT '#F59E0B',
ADD COLUMN     "corporateRegNumber" TEXT,
ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "primaryColor" TEXT NOT NULL DEFAULT '#3B82F6',
ADD COLUMN     "secondaryColor" TEXT DEFAULT '#10B981',
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "twitterUrl" TEXT,
ADD COLUMN     "websiteUrl" TEXT,
ADD COLUMN     "whatsappType" TEXT DEFAULT 'business',
ADD COLUMN     "youtubeUrl" TEXT;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "businessAddress" TEXT,
ADD COLUMN     "businessEmail" TEXT,
ADD COLUMN     "fullName" TEXT NOT NULL;
