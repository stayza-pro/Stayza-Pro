-- CreateTable
CREATE TABLE "public"."webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_eventId_key" ON "public"."webhook_events"("eventId");

-- CreateIndex
CREATE INDEX "webhook_events_eventId_idx" ON "public"."webhook_events"("eventId");

-- CreateIndex
CREATE INDEX "webhook_events_provider_idx" ON "public"."webhook_events"("provider");

-- CreateIndex
CREATE INDEX "webhook_events_processedAt_idx" ON "public"."webhook_events"("processedAt");
