-- CreateTable
CREATE TABLE "public"."pending_registrations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'GUEST',
    "referredByRealtorId" TEXT,
    "referralSource" TEXT,
    "otp" TEXT NOT NULL,
    "otpExpires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_registrations_email_key" ON "public"."pending_registrations"("email");

-- CreateIndex
CREATE INDEX "pending_registrations_email_idx" ON "public"."pending_registrations"("email");

-- CreateIndex
CREATE INDEX "pending_registrations_otpExpires_idx" ON "public"."pending_registrations"("otpExpires");
