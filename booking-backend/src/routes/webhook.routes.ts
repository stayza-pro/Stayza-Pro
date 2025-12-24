import express from "express";
import crypto from "crypto";
import { PaymentStatus, BookingStatus } from "@prisma/client";
import { prisma } from "@/config/database";
import { config } from "@/config";
import { asyncHandler } from "@/middleware/errorHandler";
import { logger } from "@/utils/logger";

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
    // Verify Paystack signature (HMAC SHA512)
    const signature = req.headers["x-paystack-signature"];

    if (!signature) {
      logger.warn("Paystack webhook: Missing signature");
      return res.status(401).json({ error: "Missing signature" });
    }

    const hash = crypto
      .createHmac("sha512", config.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== signature) {
      logger.warn("Paystack webhook: Invalid signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const { event, data } = req.body;
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
          payload: req.body,
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
      await markEventProcessed("PAYSTACK", eventId, event, req.body, {
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
        req.body,
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
      booking.status === BookingStatus.CONFIRMED
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
    include: {
      booking: {
        select: {
          id: true,
          propertyId: true,
          property: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });

  if (!payment) {
    logger.warn(
      `Charge completed: Payment not found for reference ${paymentRef}`
    );
    return;
  }

  // Skip if already completed
  if (payment.status === PaymentStatus.COMPLETED) {
    logger.info(`Payment ${payment.id} already completed, skipping`);
    return;
  }

  // Update payment status
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.COMPLETED,
      updatedAt: new Date(),
      metadata: {
        ...((payment.metadata as object) || {}),
        webhookProcessedAt: new Date().toISOString(),
        webhookData: data,
      },
    },
  });

  // Update booking to CONFIRMED (legacy support)
  await prisma.booking.update({
    where: { id: payment.bookingId },
    data: { status: BookingStatus.CONFIRMED },
  });

  logger.info(`Charge completed successfully`, {
    paymentId: payment.id,
    reference: paymentRef,
    amount: Number(payment.amount),
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
    data: { status: BookingStatus.CANCELLED },
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

    // TODO: Send notification to admin
    // TODO: Trigger automatic retry or escalation
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

  // TODO: Handle reversal - may need to retry or escalate to admin
}

export default router;
