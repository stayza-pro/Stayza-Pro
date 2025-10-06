import { Request, Response } from "express";
import { prisma } from "@/config/database";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { BookingStatus, PaymentStatus } from "@prisma/client";
import { sendPaymentReceipt } from "@/services/email";

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
      // Handle different Flutterwave events
      switch (event) {
        case "charge.completed":
          await handleChargeCompleted(data);
          break;

        case "charge.failed":
          await handleChargeFailed(data);
          break;

        default:
          console.log(`Unhandled Flutterwave event type: ${event}`);
      }

      await markProcessed(eventId);
      return res.json({ success: true });
    } catch (error) {
      console.error("Flutterwave webhook error:", error);
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
    console.error(`Payment not found for reference: ${tx_ref}`);
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
    console.log(
      `Payment confirmation completed for booking ${payment.bookingId}`
    );
    // TODO: Implement actual email notification in next iteration
  } catch (err) {
    console.error("Email notification failed", err);
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
    console.error(`Payment not found for reference: ${tx_ref}`);
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
      console.error("Booking completion error:", error);
      throw new AppError("Failed to process booking completion", 500);
    }
  }
);

// Export all webhook handlers
export default {
  handleFlutterwaveWebhook,
  handleBookingCompletion,
};
