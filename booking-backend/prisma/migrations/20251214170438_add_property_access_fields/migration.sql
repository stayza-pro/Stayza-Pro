-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('INQUIRY', 'BOOKING_MESSAGE', 'SYSTEM');

-- AlterTable
ALTER TABLE "public"."properties" ADD COLUMN     "accessInstructions" TEXT,
ADD COLUMN     "checkInTime" TEXT,
ADD COLUMN     "checkOutTime" TEXT,
ADD COLUMN     "houseRules" TEXT,
ADD COLUMN     "parkingInstructions" TEXT,
ADD COLUMN     "wifiName" TEXT,
ADD COLUMN     "wifiPassword" TEXT;

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "public"."MessageType" NOT NULL DEFAULT 'BOOKING_MESSAGE',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "propertyId" TEXT,
    "bookingId" TEXT,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "wasFiltered" BOOLEAN NOT NULL DEFAULT false,
    "violations" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."message_attachments" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messages_propertyId_idx" ON "public"."messages"("propertyId");

-- CreateIndex
CREATE INDEX "messages_bookingId_idx" ON "public"."messages"("bookingId");

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "public"."messages"("senderId");

-- CreateIndex
CREATE INDEX "messages_recipientId_idx" ON "public"."messages"("recipientId");

-- CreateIndex
CREATE INDEX "messages_createdAt_idx" ON "public"."messages"("createdAt");

-- CreateIndex
CREATE INDEX "messages_isRead_idx" ON "public"."messages"("isRead");

-- CreateIndex
CREATE INDEX "message_attachments_messageId_idx" ON "public"."message_attachments"("messageId");

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_attachments" ADD CONSTRAINT "message_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
