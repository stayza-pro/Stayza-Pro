CREATE TYPE "public"."EmailJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

CREATE TABLE "public"."email_jobs" (
    "id" TEXT NOT NULL,
    "to" TEXT[] NOT NULL,
    "subject" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "attachments" JSONB,
    "status" "public"."EmailJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "provider" TEXT,
    "providerMessageId" TEXT,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_jobs_status_nextAttemptAt_idx" ON "public"."email_jobs"("status", "nextAttemptAt");
CREATE INDEX "email_jobs_createdAt_idx" ON "public"."email_jobs"("createdAt");
