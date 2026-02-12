import express from "express";
import crypto from "crypto";
import { PaymentStatus, BookingStatus } from "@prisma/client";
import { prisma } from "@/config/database";
import { config } from "@/config";
import { asyncHandler } from "@/middleware/errorHandler";
import { logger } from "@/utils/logger";
import { createAdminNotification } from "@/services/notificationService";
import { ensureRealtorTransferRecipientCode } from "@/services/payoutAccountService";
import { initiateTransfer, verifyTransfer } from "@/services/paystack";
import { finalizePaystackPayment } from "@/services/paymentFinalization";

const router = express.Router();

// Helper function to check if webhook event was already processed
async function isEventProcessed(eventId: string): Promise<boolean> {
  const existing = await prisma.webhookEvent.findUnique({
    where: { eventId },
  });
  return existing !== null;
}

// Helper function to mark webhook event as processed
async function markEventProcessed(
  provider: string,
  eventId: string,
  eventType: string,
  payload: any,
  metadata?: any
): Promise<void> {
  await prisma.webhookEvent.create({
    data: {
      provider,
      eventId,
      eventType,
      status: "PROCESSED",
      payload,
      metadata,
    },
  });
}

// Helper function to mark webhook event as failed
async function markEventFailed(
  provider: string,
  eventId: string,
  eventType: string,
  payload: any,
  error: string
): Promise<void> {
  await prisma.webhookEvent.create({
    data: {
      provider,
      eventId,
      eventType,
      status: "FAILED",
      payload,
      metadata: { error },
    },
  });
}

const getRawBodyBuffer = (body: unknown): Buffer => {
  if (Buffer.isBuffer(body)) {
    return body;
  }

  if (typeof body === "string") {
    return Buffer.from(body, "utf8");
  }

  return Buffer.from(JSON.stringify(body || {}), "utf8");
};

const isValidPaystackSignature = (
  rawBody: Buffer,
  signatureHeader: unknown
): boolean => {
  if (typeof signatureHeader !== "string") {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha512", config.PAYSTACK_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  try {
    const providedBuffer = Buffer.from(signatureHeader, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    return (
      providedBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(providedBuffer, expectedBuffer)
    );
  } catch {
    return false;
  }
};

const parsePaystackPayload = (
  rawBody: Buffer
): { event: string; data: Record<string, any>; payload: Record<string, any> } => {
  const parsed = JSON.parse(rawBody.toString("utf8")) as Record<string, any>;
  const event = typeof parsed.event === "string" ? parsed.event : "";
  const data =
    parsed.data && typeof parsed.data === "object" && !Array.isArray(parsed.data)
      ? (parsed.data as Record<string, any>)
      : {};

  if (!event) {
    throw new Error("Webhook payload missing event type");
  }

  return { event, data, payload: parsed };
};

/**
 * @swagger
 * tags:
 *   - name: Webhooks
 *     description: Payment gateway webhook handlers (Paystack)
 */

/**
 * @swagger
 * /api/webhooks/paystack:
 *   post:
 *     summary: Paystack webhook handler (HMAC SHA512 verification)
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       401:
 *         description: Invalid signature
 */
router.post(
  "/paystack",
  asyncHandler(async (req, res) => {
    const rawBody = getRawBodyBuffer(req.body);
    const signature = req.headers["x-paystack-signature"];
    if (!signature || typeof signature !== "string") {
      logger.warn("Paystack webhook: Missing signature");
      return res.status(401).json({ error: "Missing signature" });
    }

    if (!isValidPaystackSignature(rawBody, signature)) {
      logger.warn("Paystack webhook: Invalid signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    let event = "";
    let data: Record<string, any> = {};
    let payload: Record<string, any> = {};

    try {
      const parsed = parsePaystackPayload(rawBody);
      event = parsed.event;
      data = parsed.data;
      payload = parsed.payload;
    } catch (error) {
      logger.warn("Paystack webhook: Invalid payload", {
        error: error instanceof Error ? error.message : error,
      });
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    const eventId = `paystack-${event}-${data.reference || data.id}`;

    // Database-backed idempotency check
    if (await isEventProcessed(eventId)) {
      logger.info(`Paystack webhook: Duplicate event ${eventId}, skipping`);
      // Mark as duplicate
      await prisma.webhookEvent.create({
        data: {
          provider: "PAYSTACK",
          eventId: `${eventId}-duplicate-${Date.now()}`,
          eventType: event,
          status: "DUPLICATE",
          payload,
        },
      });
      return res.status(200).json({ message: "Event already processed" });
    }

    logger.info(`Paystack webhook received: ${event}`, {
      reference: data.reference,
    });

    try {
      // Route to appropriate handler
      switch (event) {
        case "charge.success":
          await handleChargeCompleted(data.reference, data);
          break;

        case "charge.failed":
          await handleChargeFailed(data.reference, data);
          break;

        case "transfer.success":
          await handleTransferSuccess(data.reference, data);
          break;

        case "transfer.failed":
          await handleTransferFailed(data.reference, data);
          break;

        case "transfer.reversed":
          await handleTransferReversed(data.reference, data);
          break;

        default:
          logger.info(`Paystack webhook: Unhandled event type ${event}`);
      }

      // Mark as processed in database
      await markEventProcessed("PAYSTACK", eventId, event, payload, {
        reference: data.reference,
      });

      return res.status(200).json({ message: "Webhook processed" });
    } catch (error: any) {
      logger.error(`Paystack webhook error: ${error.message}`, {
        event,
        reference: data.reference,
        error: error.stack,
      });
      // Mark as failed
      await markEventFailed(
        "PAYSTACK",
        eventId,
        event,
        payload,
        error.message
      );
      return res.status(500).json({ error: "Webhook processing failed" });
    }
  })
);

/**
 * @swagger
 * /api/webhooks/booking-completion:
 *   post:
 *     summary: Internal booking completion handler
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bookingId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking completion processed
 */
router.post(
  "/booking-completion",
  asyncHandler(async (req, res) => {
    const { bookingId } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Check if checkout date has passed
    const now = new Date();
    if (
      booking.checkOutDate <= now &&
      booking.status === BookingStatus.ACTIVE
    ) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.COMPLETED },
      });

      logger.info(`Booking ${bookingId} marked as COMPLETED`);
    }

    return res.status(200).json({ message: "Booking completion processed" });
  })
);

// ============================================================================
// HELPER FUNCTIONS (Inlined from webhookController)
// ============================================================================

/**
 * Handle successful charge completion
 */
async function handleChargeCompleted(paymentRef: string, data: any) {
  const payment = await prisma.payment.findUnique({
    where: { reference: paymentRef },
  });

  if (!payment) {
    logger.warn(
      `Charge completed: Payment not found for reference ${paymentRef}`
    );
    return;
  }

  // Skip if already completed
  if (
    (payment.status === PaymentStatus.HELD && Boolean(payment.paidAt)) ||
    payment.status === PaymentStatus.PARTIALLY_RELEASED ||
    payment.status === PaymentStatus.SETTLED
  ) {
    logger.info(`Payment ${payment.id} already processed, skipping`);
    return;
  }

  const finalized = await finalizePaystackPayment({
    paymentId: payment.id,
    source: "WEBHOOK",
    providerData: data,
    extraMetadata: {
      webhookProcessedAt: new Date().toISOString(),
      webhookReference: paymentRef,
      webhookEvent: "charge.success",
    },
  });

  logger.info(`Charge completed successfully`, {
    paymentId: payment.id,
    reference: paymentRef,
    amount: Number(payment.amount),
    alreadyFinalized: finalized.alreadyFinalized,
  });
}

/**
 * Handle failed charge
 */
async function handleChargeFailed(paymentRef: string, data: any) {
  const payment = await prisma.payment.findUnique({
    where: { reference: paymentRef },
  });

  if (!payment) {
    logger.warn(`Charge failed: Payment not found for reference ${paymentRef}`);
    return;
  }

  if (
    payment.status === PaymentStatus.HELD ||
    payment.status === PaymentStatus.PARTIALLY_RELEASED ||
    payment.status === PaymentStatus.SETTLED
  ) {
    logger.warn(
      `Charge failed webhook ignored for already-finalized payment ${payment.id}`
    );
    return;
  }

  // Update payment to FAILED
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.FAILED,
      metadata: {
        ...((payment.metadata as object) || {}),
        failureReason:
          data.message || data.gateway_response || "Payment failed",
        webhookData: data,
      },
    },
  });

  // Cancel booking
  await prisma.booking.update({
    where: { id: payment.bookingId },
    data: {
      status: BookingStatus.CANCELLED,
      paymentStatus: PaymentStatus.FAILED,
    },
  });

  logger.info(`Charge failed`, {
    paymentId: payment.id,
    reference: paymentRef,
    reason: data.message || data.gateway_response,
  });
}

/**
 * Handle successful transfer (escrow payout)
 */
async function handleTransferSuccess(transferReference: string, data: any) {
  // Find escrow event by transaction reference
  const escrowEvent = await prisma.escrowEvent.findFirst({
    where: { transactionReference: transferReference },
  });

  if (!escrowEvent) {
    logger.warn(
      `Transfer success: Escrow event not found for ${transferReference}`
    );
    return;
  }

  // Update escrow event with transfer confirmation
  await prisma.escrowEvent.update({
    where: { id: escrowEvent.id },
    data: {
      providerResponse: {
        ...((escrowEvent.providerResponse as object) || {}),
        transferConfirmed: true,
        transferConfirmedAt: new Date().toISOString(),
        webhookData: data,
      },
    },
  });

  logger.info(`Transfer confirmed successfully`, {
    bookingId: escrowEvent.bookingId,
    eventType: escrowEvent.eventType,
    reference: transferReference,
  });
}

/**
 * Handle failed transfer (escrow payout)
 */
async function handleTransferFailed(transferReference: string, data: any) {
  // Find escrow event
  const escrowEvent = await prisma.escrowEvent.findFirst({
    where: { transactionReference: transferReference },
  });

  if (!escrowEvent) {
    logger.warn(
      `Transfer failed: Escrow event not found for ${transferReference}`
    );
    return;
  }

  // Update escrow event with failure details
  await prisma.escrowEvent.update({
    where: { id: escrowEvent.id },
    data: {
      providerResponse: {
        ...((escrowEvent.providerResponse as object) || {}),
        transferFailed: true,
        transferFailedAt: new Date().toISOString(),
        failureReason: data.message || "Transfer failed",
        webhookData: data,
      },
    },
  });

  // Check if this is a critical transfer that needs admin attention
  const criticalTypes = [
    "RELEASE_ROOM_FEE_SPLIT",
    "RELEASE_DEPOSIT_TO_CUSTOMER",
    "PAY_REALTOR_FROM_DEPOSIT",
  ];

  if (criticalTypes.includes(escrowEvent.eventType)) {
    logger.error(`CRITICAL: Transfer failed for important escrow event`, {
      bookingId: escrowEvent.bookingId,
      eventType: escrowEvent.eventType,
      reference: transferReference,
      reason: data.message,
    });
    await retryOrEscalateCriticalTransfer(escrowEvent.id, transferReference, data, "FAILED");
  } else {
    logger.warn(`Transfer failed`, {
      bookingId: escrowEvent.bookingId,
      eventType: escrowEvent.eventType,
      reference: transferReference,
    });
  }
}

/**
 * Handle reversed transfer
 */
async function handleTransferReversed(transferReference: string, data: any) {
  // Find escrow event
  const escrowEvent = await prisma.escrowEvent.findFirst({
    where: { transactionReference: transferReference },
  });

  if (!escrowEvent) {
    logger.warn(
      `Transfer reversed: Escrow event not found for ${transferReference}`
    );
    return;
  }

  // Update escrow event with reversal details
  await prisma.escrowEvent.update({
    where: { id: escrowEvent.id },
    data: {
      providerResponse: {
        ...((escrowEvent.providerResponse as object) || {}),
        transferReversed: true,
        transferReversedAt: new Date().toISOString(),
        reversalReason: data.message || "Transfer reversed",
        webhookData: data,
      },
    },
  });

  logger.error(`Transfer reversed`, {
    bookingId: escrowEvent.bookingId,
    eventType: escrowEvent.eventType,
    reference: transferReference,
    reason: data.message,
  });

  await retryOrEscalateCriticalTransfer(escrowEvent.id, transferReference, data, "REVERSED");
}

async function notifyAdminsTransferIncident(params: {
  title: string;
  message: string;
  bookingId: string;
  eventType: string;
  reference: string;
  reason?: string;
  severity?: "high" | "urgent";
  metadata?: Record<string, unknown>;
}) {
  await createAdminNotification({
    type: "SYSTEM_ALERT",
    title: params.title,
    message: params.message,
    priority: params.severity || "high",
    data: {
      bookingId: params.bookingId,
      eventType: params.eventType,
      reference: params.reference,
      reason: params.reason,
      ...params.metadata,
    },
  });
}

async function retryOrEscalateCriticalTransfer(
  escrowEventId: string,
  originalReference: string,
  data: any,
  incidentType: "FAILED" | "REVERSED"
) {
  const escrowEvent = await prisma.escrowEvent.findUnique({
    where: { id: escrowEventId },
    include: {
      booking: {
        include: {
          property: {
            include: {
              realtor: true,
            },
          },
        },
      },
    },
  });

  if (!escrowEvent || !escrowEvent.booking) {
    logger.error("Critical transfer incident: escrow event or booking missing", {
      escrowEventId,
      originalReference,
      incidentType,
    });
    return;
  }

  const providerResponse = (escrowEvent.providerResponse as Record<string, any>) || {};
  const retryAttempts = Number(providerResponse.transferRetryAttempts || 0);
  const maxRetries = 2;

  await notifyAdminsTransferIncident({
    title:
      incidentType === "FAILED"
        ? "Critical Transfer Failed"
        : "Critical Transfer Reversed",
    message: `Escrow transfer ${incidentType.toLowerCase()} for booking ${escrowEvent.bookingId}.`,
    bookingId: escrowEvent.bookingId,
    eventType: escrowEvent.eventType,
    reference: originalReference,
    reason: data?.message,
    metadata: {
      retryAttempts,
      maxRetries,
    },
  });

  try {
    const verification = await verifyTransfer(originalReference);
    const verificationStatus = String(verification?.status || "").toLowerCase();

    if (verificationStatus === "success") {
      await prisma.escrowEvent.update({
        where: { id: escrowEvent.id },
        data: {
          providerResponse: {
            ...providerResponse,
            transferConfirmed: true,
            transferConfirmedAt: new Date().toISOString(),
            verificationRecovered: true,
            verificationPayload: verification,
          },
        },
      });

      await notifyAdminsTransferIncident({
        title: "Transfer Recovered by Verification",
        message: `Transfer ${originalReference} was confirmed successful during verification.`,
        bookingId: escrowEvent.bookingId,
        eventType: escrowEvent.eventType,
        reference: originalReference,
      });
      return;
    }
  } catch (verificationError: any) {
    logger.warn("Transfer verification check failed after webhook incident", {
      reference: originalReference,
      error: verificationError?.message,
    });
  }

  if (retryAttempts >= maxRetries) {
    await notifyAdminsTransferIncident({
      title: "Transfer Escalation Required",
      message: `Transfer for booking ${escrowEvent.bookingId} exceeded retry limit and requires manual intervention.`,
      bookingId: escrowEvent.bookingId,
      eventType: escrowEvent.eventType,
      reference: originalReference,
      reason: data?.message,
      severity: "urgent",
      metadata: {
        escalated: true,
        retryAttempts,
      },
    });

    await prisma.escrowEvent.update({
      where: { id: escrowEvent.id },
      data: {
        providerResponse: {
          ...providerResponse,
          transferEscalated: true,
          transferEscalatedAt: new Date().toISOString(),
          transferEscalationReason:
            data?.message || `Exceeded ${maxRetries} automatic retries`,
        },
      },
    });
    return;
  }

  const realtorId = escrowEvent.booking.property?.realtor?.id;
  if (!realtorId) {
    await notifyAdminsTransferIncident({
      title: "Transfer Escalation Required",
      message: `Unable to retry transfer for booking ${escrowEvent.bookingId} because realtor payout profile is missing.`,
      bookingId: escrowEvent.bookingId,
      eventType: escrowEvent.eventType,
      reference: originalReference,
      severity: "urgent",
    });
    return;
  }

  const recipient = await ensureRealtorTransferRecipientCode(realtorId);
  const retryReference = `${originalReference}_retry_${retryAttempts + 1}`;
  const retryResult = await initiateTransfer({
    amount: Number(escrowEvent.amount),
    recipient,
    reason: `Retry payout for ${escrowEvent.eventType} (${escrowEvent.bookingId})`,
    reference: retryReference,
  });

  await prisma.escrowEvent.update({
    where: { id: escrowEvent.id },
    data: {
      transactionReference: retryReference,
      providerResponse: {
        ...providerResponse,
        transferRetryAttempts: retryAttempts + 1,
        lastRetryAt: new Date().toISOString(),
        previousReference: originalReference,
        retryReference,
        retryTransferId: retryResult?.id || retryResult?.transfer_code,
        retryPayload: retryResult,
      },
    },
  });

  await notifyAdminsTransferIncident({
    title: "Automatic Transfer Retry Initiated",
    message: `Automatic transfer retry #${retryAttempts + 1} was initiated for booking ${escrowEvent.bookingId}.`,
    bookingId: escrowEvent.bookingId,
    eventType: escrowEvent.eventType,
    reference: retryReference,
    metadata: {
      previousReference: originalReference,
      retryAttempts: retryAttempts + 1,
    },
  });
}

export default router;
