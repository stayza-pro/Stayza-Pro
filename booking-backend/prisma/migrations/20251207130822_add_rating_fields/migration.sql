/*
  Warnings:

  - Made the column `reviewCount` on table `properties` required. This step will fail if there are existing NULL values in that column.
  - Made the column `reviewCount` on table `realtors` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."properties" ALTER COLUMN "reviewCount" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."realtors" ALTER COLUMN "reviewCount" SET NOT NULL;
