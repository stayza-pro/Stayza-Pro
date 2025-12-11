-- CreateTable
CREATE TABLE "public"."job_locks" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "bookingIds" TEXT[],

    CONSTRAINT "job_locks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_locks_jobName_key" ON "public"."job_locks"("jobName");

-- CreateIndex
CREATE INDEX "job_locks_jobName_idx" ON "public"."job_locks"("jobName");

-- CreateIndex
CREATE INDEX "job_locks_expiresAt_idx" ON "public"."job_locks"("expiresAt");
