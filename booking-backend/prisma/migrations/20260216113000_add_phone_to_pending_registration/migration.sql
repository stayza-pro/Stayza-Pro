-- Add phone support for passwordless guest registration pending records
ALTER TABLE "pending_registrations"
ADD COLUMN "phone" TEXT;