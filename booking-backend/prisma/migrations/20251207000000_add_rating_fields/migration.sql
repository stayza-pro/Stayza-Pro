-- Add rating and review count fields to Property table
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "averageRating" DECIMAL(3,2) DEFAULT 0;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER DEFAULT 0;

-- Add rating and review count fields to Realtor table  
ALTER TABLE "realtors" ADD COLUMN IF NOT EXISTS "averageRating" DECIMAL(3,2) DEFAULT 0;
ALTER TABLE "realtors" ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER DEFAULT 0;

-- Additional rating breakdown fields for properties
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "cleanlinessRating" DECIMAL(3,2) DEFAULT 0;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "communicationRating" DECIMAL(3,2) DEFAULT 0;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "checkInRating" DECIMAL(3,2) DEFAULT 0;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "accuracyRating" DECIMAL(3,2) DEFAULT 0;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "locationRating" DECIMAL(3,2) DEFAULT 0;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "valueRating" DECIMAL(3,2) DEFAULT 0;
