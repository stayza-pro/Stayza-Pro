import { logger } from "@/utils/logger";
import { Request, Response } from "express";
import { prisma } from "@/config/database";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { BookingStatus, PaymentStatus } from "@prisma/client";
import { sendPaymentReceipt } from "@/services/email";
import { flutterwaveService } from "@/services/flutterwave";
import crypto from "crypto";
import { config } from "@/config";

// MVP: Simplified webhook controller for Flutterwave integration
// Removed Stripe, complex audit logging, and enterprise features

// Helper: Simple in-memory idempotency guard for MVP
let processedEvents: Set<string> = new Set();

async function alreadyProcessed(eventId: string): Promise<boolean> {
  return processedEvents.has(eventId);
}

async function markProcessed(eventId: string): Promise<void> {
  processedEvents.add(eventId);
}

// MVP: Flutterwave webhook handler
export const handleFlutterwaveWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    // Verify webhook signature
    const signature = req.headers["verif-hash"] as string;

    if (!signature) {
      logger.error("Flutterwave webhook: Missing signature header");
      throw new AppError("Missing webhook signature", 400);
    }

    // Verify the signature matches our secret hash
    const secretHash = config.FLUTTERWAVE_SECRET_KEY;
    if (signature !== secretHash) {
      logger.error("Flutterwave webhook: Invalid signature");
      throw new AppError("Invalid webhook signature", 401);
    }

    const { event, data } = req.body;
    const eventId = data?.id || req.body.id;

    if (!eventId) {
      throw new AppError("Invalid webhook payload - missing event ID", 400);
    }

    // Check if already processed
    if (await alreadyProcessed(eventId)) {
      return res.json({ success: true, message: "Event already processed" });
    }

    try {
      logger.info(`Processing Flutterwave webhook event: ${event}`, {
        eventId,
        status: data?.status,
        tx_ref: data?.tx_ref,
      });

      // Handle different Flutterwave events
      switch (event) {
        case "charge.completed":
          await handleChargeCompleted(data);
          break;

        case "charge.failed":
          await handleChargeFailed(data);
          break;

        default:
          logger.info(`Unhandled Flutterwave event type: ${event}`);
      }

      await markProcessed(eventId);
      return res.json({ success: true });
    } catch (error) {
      logger.error("Flutterwave webhook error:", error);
      throw new AppError("Webhook processing failed", 500);
    }
  }
);

// Handle successful payment
async function handleChargeCompleted(data: any): Promise<void> {
  const { tx_ref, amount, currency, status } = data;

  if (status !== "successful") {
    return;
  }

  // Find payment by reference
  const payment = await prisma.payment.findUnique({
    where: { reference: tx_ref },
    include: {
      booking: {
        include: {
          property: {
            select: {
              id: true,
              title: true,
            },
          },
          guest: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!payment) {
    logger.error(`Payment not found for reference: ${tx_ref}`);
    return;
  }

  if (payment.status === PaymentStatus.COMPLETED) {
    return; // Already processed
  }

  // Update payment status
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.COMPLETED,
      updatedAt: new Date(),
    },
  });

  // Update booking status
  await prisma.booking.update({
    where: { id: payment.bookingId },
    data: {
      status: BookingStatus.CONFIRMED,
      updatedAt: new Date(),
    },
  });

  // Send confirmation email (simplified for MVP)
  try {
    logger.info(
      `Payment confirmation completed for booking ${payment.bookingId}`
    );
    // TODO: Implement actual email notification in next iteration
  } catch (err) {
    logger.error("Email notification failed", err);
  }
}

// Handle failed payment
async function handleChargeFailed(data: any): Promise<void> {
  const { tx_ref, status } = data;

  if (status !== "failed") {
    return;
  }

  // Find payment by reference
  const payment = await prisma.payment.findFirst({
    where: { reference: tx_ref },
    include: {
      booking: true,
    },
  });

  if (!payment) {
    logger.error(`Payment not found for reference: ${tx_ref}`);
    return;
  }

  // Update payment status
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.FAILED,
      updatedAt: new Date(),
    },
  });

  // Update booking status
  await prisma.booking.update({
    where: { id: payment.bookingId },
    data: {
      status: BookingStatus.CANCELLED,
      updatedAt: new Date(),
    },
  });
}

// MVP: Simple booking completion handler
export const handleBookingCompletion = asyncHandler(
  async (req: Request, res: Response) => {
    const { bookingId } = req.body;

    if (!bookingId) {
      throw new AppError("Booking ID is required", 400);
    }

    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      const now = new Date();

      // Check if booking should be marked as completed (past checkout date)
      if (
        booking.checkOutDate <= now &&
        booking.status === BookingStatus.CONFIRMED
      ) {
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: BookingStatus.COMPLETED,
            updatedAt: now,
          },
        });

        res.json({
          success: true,
          message: "Booking marked as completed",
        });
      } else {
        res.json({
          success: true,
          message: "Booking completion conditions not met",
        });
      }
    } catch (error) {
      logger.error("Booking completion error:", error);
      throw new AppError("Failed to process booking completion", 500);
    }
  }
);

// Paystack webhook handler
export const handlePaystackWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    // Verify webhook signature
    const hash = crypto
      .createHmac("sha512", config.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");

    const signature = req.headers["x-paystack-signature"];

    if (hash !== signature) {
      logger.error("Paystack webhook: Invalid signature");
      throw new AppError("Invalid webhook signature", 401);
    }

    const { event, data } = req.body;
    const eventId = data?.id || req.body.id;

    if (!eventId) {
      throw new AppError("Invalid webhook payload - missing event ID", 400);
    }

    // Check if already processed
    if (await alreadyProcessed(eventId)) {
      return res.json({ success: true, message: "Event already processed" });
    }

    try {
      logger.info(`Processing Paystack webhook event: ${event}`, {
        eventId,
        status: data?.status,
        reference: data?.reference,
      });

      // Handle different Paystack events
      switch (event) {
        case "charge.success":
          await handleChargeCompleted(data);
          break;

        case "charge.failed":
          await handleChargeFailed(data);
          break;

        case "transfer.success":
          await handleTransferSuccess(data);
          break;

        case "transfer.failed":
          await handleTransferFailed(data);
          break;

        case "transfer.reversed":
          await handleTransferReversed(data);
          break;

        default:
          logger.info(`Unhandled Paystack event type: ${event}`);
      }

      await markProcessed(eventId);
      return res.json({ success: true });
    } catch (error) {
      logger.error("Paystack webhook error:", error);
      throw new AppError("Webhook processing failed", 500);
    }
  }
);

// Handle successful transfer
async function handleTransferSuccess(data: any): Promise<void> {
  const { reference, recipient, amount, status } = data;

  if (status !== "success") {
    return;
  }

  logger.info("Transfer success webhook received", {
    reference,
    recipient,
    amount,
  });

  // Find the escrow event by transfer reference
  const escrowEvent = await prisma.escrowEvent.findFirst({
    where: {
      transactionReference: reference,
    },
    include: {
      booking: true,
    },
  });

  if (!escrowEvent) {
    logger.warn(`No escrow event found for transfer reference: ${reference}`);
    return;
  }

  // Update escrow event to mark transfer as confirmed
  const currentResponse = (escrowEvent.providerResponse as any) || {};
  await prisma.escrowEvent.update({
    where: { id: escrowEvent.id },
    data: {
      providerResponse: {
        ...currentResponse,
        transferConfirmed: true,
        transferConfirmedAt: new Date().toISOString(),
        webhookData: data,
      },
    },
  });

  logger.info(`Transfer confirmed for escrow event ${escrowEvent.id}`, {
    bookingId: escrowEvent.bookingId,
    eventType: escrowEvent.eventType,
  });
}

// Handle failed transfer
async function handleTransferFailed(data: any): Promise<void> {
  const { reference, recipient, amount, status } = data;

  logger.error("Transfer failed webhook received", {
    reference,
    recipient,
    amount,
    status,
  });

  // Find the escrow event by transfer reference
  const escrowEvent = await prisma.escrowEvent.findFirst({
    where: {
      transactionReference: reference,
    },
    include: {
      booking: true,
    },
  });

  if (!escrowEvent) {
    logger.warn(`No escrow event found for transfer reference: ${reference}`);
    return;
  }

  // Update escrow event to mark transfer as failed
  const currentResponse = (escrowEvent.providerResponse as any) || {};
  await prisma.escrowEvent.update({
    where: { id: escrowEvent.id },
    data: {
      providerResponse: {
        ...currentResponse,
        transferFailed: true,
        transferFailedAt: new Date().toISOString(),
        failureReason: data.message || "Transfer failed",
        webhookData: data,
      },
    },
  });

  // If this was a critical transfer (room fee release, deposit return), alert admin
  const criticalTypes = [
    "RELEASE_ROOM_FEE_SPLIT",
    "RELEASE_DEPOSIT_TO_CUSTOMER",
    "PAY_REALTOR_FROM_DEPOSIT",
  ];

  if (criticalTypes.includes(escrowEvent.eventType)) {
    logger.error(`CRITICAL: Transfer failed for ${escrowEvent.eventType}`, {
      bookingId: escrowEvent.bookingId,
      eventId: escrowEvent.id,
      reference,
      amount,
    });

    // TODO: Send admin notification or trigger retry logic
  }
}

// Handle reversed transfer
async function handleTransferReversed(data: any): Promise<void> {
  const { reference, recipient, amount } = data;

  logger.warn("Transfer reversed webhook received", {
    reference,
    recipient,
    amount,
  });

  // Find the escrow event by transfer reference
  const escrowEvent = await prisma.escrowEvent.findFirst({
    where: {
      transactionReference: reference,
    },
    include: {
      booking: true,
    },
  });

  if (!escrowEvent) {
    logger.warn(`No escrow event found for transfer reference: ${reference}`);
    return;
  }

  // Update escrow event to mark transfer as reversed
  const currentResponse = (escrowEvent.providerResponse as any) || {};
  await prisma.escrowEvent.update({
    where: { id: escrowEvent.id },
    data: {
      providerResponse: {
        ...currentResponse,
        transferReversed: true,
        transferReversedAt: new Date().toISOString(),
        webhookData: data,
      },
    },
  });

  logger.error(`Transfer reversed for escrow event ${escrowEvent.id}`, {
    bookingId: escrowEvent.bookingId,
    eventType: escrowEvent.eventType,
  });

  // TODO: Handle reversal - may need to retry or escalate
}

// Export all webhook handlers
export default {
  handleFlutterwaveWebhook,
  handlePaystackWebhook,
  handleBookingCompletion,
};
