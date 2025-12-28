/*
  Warnings:

  - You are about to drop the column `businessPhone` on the `realtors` table. All the data in the column will be lost.
  - You are about to drop the column `facebookUrl` on the `realtors` table. All the data in the column will be lost.
  - You are about to drop the column `instagramUrl` on the `realtors` table. All the data in the column will be lost.
  - You are about to drop the column `linkedinUrl` on the `realtors` table. All the data in the column will be lost.
  - You are about to drop the column `twitterUrl` on the `realtors` table. All the data in the column will be lost.
  - You are about to drop the column `whatsappType` on the `realtors` table. All the data in the column will be lost.
  - You are about to drop the column `youtubeUrl` on the `realtors` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."realtors" DROP COLUMN "businessPhone",
DROP COLUMN "facebookUrl",
DROP COLUMN "instagramUrl",
DROP COLUMN "linkedinUrl",
DROP COLUMN "twitterUrl",
DROP COLUMN "whatsappType",
DROP COLUMN "youtubeUrl";

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "phone";
