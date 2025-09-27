import { Request, Response } from "express";
import { prisma } from "@/config/database";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import {
  verifyWebhookSignature as verifyStripeSignature,
  captureAndTransfer,
  stripe,
} from "@/services/stripe";
import { verifyWebhookSignature as verifyPaystackSignature } from "@/services/paystack";
import { config } from "@/config";
import { BookingStatus, PaymentStatus, PayoutStatus } from "@prisma/client";
import { auditLogger } from "@/services/auditLogger";
import {
  transitionBookingStatus,
  BookingStatusConflictError,
} from "@/services/bookingStatus";
import { sendPaymentReceipt, sendRealtorPayout } from "@/services/email";

// Helper: idempotency guard using payment.metadata.processedEvents array
async function alreadyProcessed(eventId: string, bookingId?: string) {
  if (!bookingId) return false;
  const payment = await prisma.payment.findUnique({
    where: { bookingId },
    select: { id: true, metadata: true },
  });
  if (!payment) return false;
  const meta = (payment.metadata || {}) as any;
  const processed: string[] = meta.processedEvents || [];
  return processed.includes(eventId);
}

async function markProcessed(eventId: string, bookingId?: string) {
  if (!bookingId) return;
  const payment = await prisma.payment.findUnique({
    where: { bookingId },
    select: { metadata: true },
  });
  const meta = (payment?.metadata || {}) as any;
  const processed: string[] = meta.processedEvents || [];
  if (processed.includes(eventId)) return; // already recorded
  processed.push(eventId);
  await prisma.payment.update({
    where: { bookingId },
    data: { metadata: { ...meta, processedEvents: processed } },
  });
}

// Compute gateway fee & platform net for Stripe using balance transaction
async function updateStripeGatewayFee(
  bookingId: string,
  paymentIntentId: string
) {
  try {
    // Retrieve payment intent with expanded charge
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });
    const latestCharge: any = (pi as any).latest_charge;
    if (!latestCharge || !latestCharge.balance_transaction) return;
    const bt = await stripe.balanceTransactions.retrieve(
      latestCharge.balance_transaction as string
    );
    const gatewayFee = (bt.fee || 0) / 100; // convert from cents
    const payment = await prisma.payment.findUnique({
      where: { bookingId },
      select: {
        serviceFeeAmount: true,
        platformCommission: true,
      },
    });
    if (!payment) return;
    const platformNet =
      Number(payment.serviceFeeAmount) +
      Number(payment.platformCommission) -
      gatewayFee;
    await prisma.payment.update({
      where: { bookingId },
      data: {
        gatewayFee: gatewayFee.toFixed(2),
        platformNet: platformNet.toFixed(2),
      },
    });
  } catch (err) {
    console.error("Failed to update Stripe gateway fee", err);
  }
}

// Compute gateway fee & platform net for Paystack
async function updatePaystackGatewayFee(bookingId: string, feesKobo?: number) {
  try {
    if (feesKobo == null) return;
    const gatewayFee = feesKobo / 100 / 100; // kobo -> naira (assumes 2 decimals)
    const payment = await prisma.payment.findUnique({
      where: { bookingId },
      select: { serviceFeeAmount: true, platformCommission: true },
    });
    if (!payment) return;
    const platformNet =
      Number(payment.serviceFeeAmount) +
      Number(payment.platformCommission) -
      gatewayFee;
    await prisma.payment.update({
      where: { bookingId },
      data: {
        gatewayFee: gatewayFee.toFixed(2),
        platformNet: platformNet.toFixed(2),
      },
    });
  } catch (err) {
    console.error("Failed to update Paystack gateway fee", err);
  }
}

/**
 * @desc    Handle Stripe webhooks
 * @route   POST /api/webhooks/stripe
 * @access  Public (webhook)
 */
export const handleStripeWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
      throw new AppError("No Stripe signature header", 400);
    }

    let event;
    try {
      event = verifyStripeSignature(
        req.body,
        signature,
        config.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error("Stripe webhook signature verification failed:", error);
      throw new AppError("Invalid signature", 400);
    }

    console.log("Stripe webhook event:", event.type);

    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object, event.id);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object, event.id);
        break;

      case "transfer.created":
        await handleTransferCreated(event.data.object, event.id);
        break;

      // Note: transfer.paid event will be handled when we confirm the transfer
      // case "transfer.paid":
      //   await handleTransferPaid(event.data.object);
      //   break;

      case "charge.dispute.created":
        await handleChargeDispute(event.data.object, event.id);
        break;

      case "charge.dispute.closed":
        await handleChargeDisputeClosed(event.data.object, event.id);
        break;

      case "account.updated":
        await handleAccountUpdated(event.data.object, event.id);
        break;

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ received: true });
  }
);

/**
 * @desc    Handle Paystack webhooks
 * @route   POST /api/webhooks/paystack
 * @access  Public (webhook)
 */
export const handlePaystackWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const signature = req.headers["x-paystack-signature"] as string;

    if (!signature) {
      throw new AppError("No Paystack signature header", 400);
    }

    const payload = JSON.stringify(req.body);

    if (!verifyPaystackSignature(payload, signature)) {
      throw new AppError("Invalid signature", 400);
    }

    const event = req.body;
    console.log("Paystack webhook event:", event.event);

    switch (event.event) {
      case "charge.success":
        await handlePaystackChargeSuccess(
          event.data,
          event.event,
          event.data.id
        );
        break;

      case "charge.failed":
        await handlePaystackChargeFailed(
          event.data,
          event.event,
          event.data.id
        );
        break;

      case "transfer.success":
        await handlePaystackTransferSuccess(
          event.data,
          event.event,
          event.data.id
        );
        break;

      case "transfer.failed":
        await handlePaystackTransferFailed(
          event.data,
          event.event,
          event.data.id
        );
        break;

      default:
        console.log(`Unhandled Paystack event type: ${event.event}`);
    }

    res.json({ status: true });
  }
);

// Stripe webhook handlers
async function handlePaymentIntentSucceeded(
  paymentIntent: any,
  eventId: string
) {
  const bookingId = paymentIntent.metadata?.booking_id;

  if (!bookingId) {
    console.error("No booking ID in payment intent metadata");
    return;
  }

  if (await alreadyProcessed(eventId, bookingId)) {
    console.log("Stripe PI succeeded already processed", eventId);
    return;
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        payoutReleaseDate: true,
        checkInDate: true,
        payoutStatus: true,
      },
    });

    const offsetHours = config.ESCROW_RELEASE_OFFSET_HOURS || 0;
    const offsetMs = offsetHours * 60 * 60 * 1000;
    let computedRelease: Date | undefined;

    if (booking?.checkInDate) {
      computedRelease = new Date(booking.checkInDate.getTime() + offsetMs);
    } else {
      computedRelease = new Date(Date.now() + offsetMs);
    }

    let payoutReleaseDate = booking?.payoutReleaseDate || computedRelease;

    if (
      computedRelease &&
      (!payoutReleaseDate || computedRelease > payoutReleaseDate)
    ) {
      payoutReleaseDate = computedRelease;
    }

    const transitionData: Record<string, unknown> = {
      payoutStatus: PayoutStatus.PENDING,
    };

    if (payoutReleaseDate) {
      transitionData.payoutReleaseDate = payoutReleaseDate;
    }

    // Attempt transition only if currently PENDING
    await transitionBookingStatus(
      bookingId,
      "PENDING" as any,
      "CONFIRMED" as any,
      transitionData
    );
  } catch (e) {
    if (e instanceof BookingStatusConflictError) {
      console.warn(
        "Booking already transitioned; skipping status set",
        bookingId
      );
    } else throw e;
  }

  await prisma.payment.update({
    where: { bookingId },
    data: {
      status: PaymentStatus.COMPLETED,
      stripePaymentIntentId: paymentIntent.id,
    },
  });

  console.log(`Payment succeeded for booking ${bookingId}`);

  await updateStripeGatewayFee(bookingId, paymentIntent.id);
  await markProcessed(eventId, bookingId);

  auditLogger
    .log("PAYMENT_COMPLETED", "Payment", {
      entityId: bookingId,
      details: { provider: "STRIPE", paymentIntentId: paymentIntent.id },
    })
    .catch(() => {});

  // Send receipt email (best effort)
  try {
    const payment = await prisma.payment.findUnique({
      where: { bookingId },
      include: { booking: { include: { property: true } }, user: true },
    });
    if (payment?.user.email && payment.booking && payment.booking.property) {
      await sendPaymentReceipt(
        payment.user.email,
        payment.booking,
        payment,
        payment.booking.property
      );
    }
  } catch (e) {
    console.error("Failed to send payment receipt email", e);
  }
}

async function handlePaymentIntentFailed(paymentIntent: any, eventId: string) {
  const bookingId = paymentIntent.metadata?.booking_id;

  if (!bookingId) {
    console.error("No booking ID in payment intent metadata");
    return;
  }

  if (await alreadyProcessed(eventId, bookingId)) {
    console.log("Stripe PI failed already processed", eventId);
    return;
  }

  try {
    await transitionBookingStatus(
      bookingId,
      "PENDING" as any,
      "CANCELLED" as any
    );
  } catch (e) {
    if (e instanceof BookingStatusConflictError) {
      console.warn("Booking status changed before failure handling", bookingId);
    } else throw e;
  }
  await prisma.payment.update({
    where: { bookingId },
    data: { status: PaymentStatus.FAILED },
  });
  console.log(`Payment failed for booking ${bookingId}`);
  await markProcessed(eventId, bookingId);
  auditLogger
    .log("PAYMENT_FAILED", "Payment", {
      entityId: bookingId,
      details: { provider: "STRIPE", paymentIntentId: paymentIntent.id },
    })
    .catch(() => {});
}

async function handleTransferCreated(transfer: any, eventId: string) {
  const bookingId = transfer.metadata?.booking_id;

  if (!bookingId) {
    console.error("No booking ID in transfer metadata");
    return;
  }

  if (await alreadyProcessed(eventId, bookingId)) {
    console.log("Transfer created already processed", eventId);
    return;
  }
  await prisma.payment.update({
    where: { bookingId },
    data: {
      stripeTransferId: transfer.id,
    },
  });

  console.log(`Transfer created for booking ${bookingId}`);
  await markProcessed(eventId, bookingId);
}

async function handleTransferPaid(transfer: any) {
  const bookingId = transfer.metadata?.booking_id;

  if (!bookingId) {
    console.error("No booking ID in transfer metadata");
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Update booking payout status
    await tx.booking.update({
      where: { id: bookingId },
      data: { payoutStatus: PayoutStatus.RELEASED },
    });

    // Update payment payout status
    await tx.payment.update({
      where: { bookingId },
      data: {
        payoutReleased: true,
        payoutReleasedAt: new Date(),
      },
    });

    console.log(`Transfer paid for booking ${bookingId}`);
  });
}

async function handleChargeDispute(dispute: any, eventId: string) {
  // Handle chargeback/dispute
  const chargeId = dispute.charge;

  // Find payment by Stripe charge ID
  const payment = await prisma.payment.findFirst({
    where: {
      OR: [{ stripePaymentIntentId: chargeId }, { disputeId: dispute.id }],
    },
    include: {
      booking: {
        include: {
          property: {
            select: {
              realtorId: true,
            },
          },
        },
      },
    },
  });

  if (payment) {
    console.log(`Dispute created for booking ${payment.bookingId}`);

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: BookingStatus.DISPUTED,
          payoutStatus: PayoutStatus.ON_HOLD,
          payoutHoldReason: `STRIPE_DISPUTE_${dispute.id}`,
          payoutHoldUntil: dispute.evidence_due_by
            ? new Date(dispute.evidence_due_by * 1000)
            : null,
        },
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          isDisputed: true,
          disputeId: dispute.id,
          disputeStatus: dispute.status,
        },
      });

      if (payment.booking?.property?.realtorId) {
        await (tx as any).payout.upsert({
          where: { paymentId: payment.id },
          update: {
            status: PayoutStatus.ON_HOLD,
            metadata: {
              ...(payment.metadata as Record<string, any>),
              disputeId: dispute.id,
              disputeStatus: dispute.status,
              disputeCreatedAt: new Date().toISOString(),
            },
          },
          create: {
            bookingId: payment.bookingId,
            paymentId: payment.id,
            realtorId: payment.booking.property.realtorId,
            amount: payment.realtorPayout,
            currency: payment.currency,
            provider: payment.method,
            status: PayoutStatus.ON_HOLD,
            metadata: {
              ...(payment.metadata as Record<string, any>),
              disputeId: dispute.id,
              disputeStatus: dispute.status,
              disputeCreatedAt: new Date().toISOString(),
            },
          },
        });
      }
    });
  }
  // Idempotency not strictly necessary here unless dispute events repeat
  await markProcessed(eventId, payment?.bookingId);
}

async function handleChargeDisputeClosed(dispute: any, eventId: string) {
  const disputeId = dispute.id;
  let payment = await prisma.payment.findFirst({
    where: { disputeId },
    include: { booking: true },
  });

  if (!payment && dispute.charge) {
    payment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: dispute.charge },
      include: { booking: true },
    });
  }

  if (!payment) {
    console.warn("Dispute closed but payment not found", disputeId);
    await markProcessed(eventId, undefined);
    return;
  }

  const booking = payment.booking;

  await prisma.$transaction(async (tx) => {
    // Update payment dispute tracking
    await tx.payment.update({
      where: { id: payment!.id },
      data: {
        disputeStatus: dispute.status,
        isDisputed: false,
      },
    });

    if (!booking) {
      return;
    }

    if (dispute.status === "won") {
      const offsetHours = config.ESCROW_RELEASE_OFFSET_HOURS || 0;
      const offsetMs = offsetHours * 60 * 60 * 1000;
      let payoutReleaseDate = booking.payoutReleaseDate || new Date();

      if (booking.checkInDate) {
        const computed = new Date(booking.checkInDate.getTime() + offsetMs);
        if (computed > payoutReleaseDate) {
          payoutReleaseDate = computed;
        }
      }

      if (payoutReleaseDate < new Date()) {
        payoutReleaseDate = new Date();
      }

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status:
            booking.status === BookingStatus.REFUNDED
              ? BookingStatus.REFUNDED
              : booking.checkOutDate < new Date()
              ? BookingStatus.COMPLETED
              : BookingStatus.CONFIRMED,
          payoutStatus: PayoutStatus.PENDING,
          payoutHoldReason: null,
          payoutHoldUntil: null,
          payoutReleaseDate,
        },
      });
    } else {
      // Lost dispute or warning closed against us
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.REFUNDED,
          payoutStatus: PayoutStatus.FAILED,
          payoutHoldReason: `DISPUTE_${disputeId}_LOST`,
          payoutHoldUntil: null,
        },
      });

      await tx.payment.update({
        where: { id: payment!.id },
        data: {
          status: PaymentStatus.REFUNDED,
        },
      });
    }
  });

  await markProcessed(eventId, payment.bookingId);
}

async function handleAccountUpdated(account: any, eventId: string) {
  // Update realtor's Stripe account status
  const realtorId = account.metadata?.realtor_id;

  if (!realtorId) {
    console.error("No realtor ID in account metadata");
    return;
  }

  await prisma.realtor.update({
    where: { id: realtorId },
    data: {
      stripeAccountId: account.id,
      // Could add more fields for account status tracking
    },
  });

  console.log(`Account updated for realtor ${realtorId}`);
  await markProcessed(eventId, undefined);
}

// Paystack webhook handlers
async function handlePaystackChargeSuccess(
  charge: any,
  eventName: string,
  eventId: string
) {
  const bookingId = charge.metadata?.booking_id;

  if (!bookingId) {
    console.error("No booking ID in charge metadata");
    return;
  }

  if (await alreadyProcessed(eventId, bookingId)) {
    console.log("Paystack charge success already processed", eventId);
    return;
  }
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        payoutReleaseDate: true,
        checkInDate: true,
      },
    });

    const offsetHours = config.ESCROW_RELEASE_OFFSET_HOURS || 0;
    const offsetMs = offsetHours * 60 * 60 * 1000;
    let computedRelease: Date | undefined;

    if (booking?.checkInDate) {
      computedRelease = new Date(booking.checkInDate.getTime() + offsetMs);
    } else {
      computedRelease = new Date(Date.now() + offsetMs);
    }

    let payoutReleaseDate = booking?.payoutReleaseDate || computedRelease;

    if (
      computedRelease &&
      (!payoutReleaseDate || computedRelease > payoutReleaseDate)
    ) {
      payoutReleaseDate = computedRelease;
    }

    const transitionData: Record<string, unknown> = {
      payoutStatus: PayoutStatus.PENDING,
    };

    if (payoutReleaseDate) {
      transitionData.payoutReleaseDate = payoutReleaseDate;
    }

    await transitionBookingStatus(
      bookingId,
      "PENDING" as any,
      "CONFIRMED" as any,
      transitionData
    );
  } catch (e) {
    if (e instanceof BookingStatusConflictError) {
      console.warn("Booking already confirmed elsewhere", bookingId);
    } else throw e;
  }
  await prisma.payment.update({
    where: { bookingId },
    data: {
      status: PaymentStatus.COMPLETED,
      paystackReference: charge.reference,
    },
  });
  console.log(`Paystack payment succeeded for booking ${bookingId}`);
  await updatePaystackGatewayFee(bookingId, charge.fees);
  await markProcessed(eventId, bookingId);

  auditLogger
    .log("PAYMENT_COMPLETED", "Payment", {
      entityId: bookingId,
      details: { provider: "PAYSTACK", reference: charge.reference },
    })
    .catch(() => {});

  // Send receipt email (best effort)
  try {
    const payment = await prisma.payment.findUnique({
      where: { bookingId },
      include: { booking: { include: { property: true } }, user: true },
    });
    if (payment?.user.email && payment.booking && payment.booking.property) {
      await sendPaymentReceipt(
        payment.user.email,
        payment.booking,
        payment,
        payment.booking.property
      );
    }
  } catch (e) {
    console.error("Failed to send paystack payment receipt email", e);
  }
}

async function handlePaystackChargeFailed(
  charge: any,
  eventName: string,
  eventId: string
) {
  const bookingId = charge.metadata?.booking_id;

  if (!bookingId) {
    console.error("No booking ID in charge metadata");
    return;
  }

  if (await alreadyProcessed(eventId, bookingId)) {
    console.log("Paystack charge failed already processed", eventId);
    return;
  }
  try {
    await transitionBookingStatus(
      bookingId,
      "PENDING" as any,
      "CANCELLED" as any
    );
  } catch (e) {
    if (e instanceof BookingStatusConflictError) {
      console.warn("Booking status changed before marking failed", bookingId);
    } else throw e;
  }
  await prisma.payment.update({
    where: { bookingId },
    data: { status: PaymentStatus.FAILED },
  });
  console.log(`Paystack payment failed for booking ${bookingId}`);
  await markProcessed(eventId, bookingId);
  auditLogger
    .log("PAYMENT_FAILED", "Payment", {
      entityId: bookingId,
      details: { provider: "PAYSTACK", reference: charge.reference },
    })
    .catch(() => {});
}

async function handlePaystackTransferSuccess(
  transfer: any,
  eventName: string,
  eventId: string
) {
  // Handle successful payout to realtor
  console.log("Paystack transfer successful:", transfer);
  await markProcessed(eventId, undefined);

  // Note: Paystack Split handles this automatically
  // We might just need to log or send notifications
}

async function handlePaystackTransferFailed(
  transfer: any,
  eventName: string,
  eventId: string
) {
  // Handle failed payout
  console.log("Paystack transfer failed:", transfer);
  await markProcessed(eventId, undefined);

  // Mark payout as failed and notify admin
}

/**
 * Release pending payouts (cron job function)
 * Call this from a scheduled task to automatically release escrow funds
 */
export const releasePendingPayouts = async () => {
  try {
    console.log("Starting payout release job...");

    // Find bookings ready for payout release
    const now = new Date();

    const readyBookings = await prisma.booking.findMany({
      where: {
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
        },
        payoutReleaseDate: {
          lte: now, // Release date has passed
        },
        OR: [
          {
            payoutStatus: PayoutStatus.PENDING,
            OR: [
              { payoutHoldUntil: null },
              {
                payoutHoldUntil: {
                  lte: now,
                },
              },
            ],
          },
          {
            payoutStatus: PayoutStatus.ON_HOLD,
            payoutHoldUntil: {
              not: null,
              lte: now,
            },
          },
        ],
      },
      include: {
        property: {
          include: {
            realtor: true,
          },
        },
        payment: true,
      },
    });

    console.log(`Found ${readyBookings.length} bookings ready for payout`);

    for (const booking of readyBookings) {
      const payment = booking.payment;
      const paymentMetadata = (payment?.metadata as Record<string, any>) || {};
      try {
        if (!payment) {
          console.warn(
            "Booking ready for payout but missing payment",
            booking.id
          );
          continue;
        }

        if (payment.payoutReleased) {
          console.log("Payout already released for booking", booking.id);
          continue;
        }

        if (payment.isDisputed) {
          console.log(
            `Skipping payout for booking ${booking.id} due to active dispute`
          );
          continue;
        }

        let providerTransferId: string | undefined;

        if (
          payment.method === "STRIPE" &&
          booking.property.realtor.stripeAccountId &&
          payment.stripePaymentIntentId
        ) {
          // Process Stripe capture + transfer
          const result = await captureAndTransfer(
            payment.stripePaymentIntentId,
            booking.property.realtor.stripeAccountId,
            Number(booking.realtorPayout),
            booking.currency,
            booking.id
          );
          providerTransferId = result.transfer?.id;
        }

        await prisma.$transaction(async (tx) => {
          const processedAt = new Date();

          await (tx as any).payout.upsert({
            where: { paymentId: payment.id },
            update: {
              status: PayoutStatus.RELEASED,
              providerTransferId:
                providerTransferId ??
                payment.paystackReference ??
                payment.stripeTransferId ??
                undefined,
              processedAt,
              metadata: {
                ...paymentMetadata,
                releasedBy: "system",
              },
            },
            create: {
              bookingId: booking.id,
              paymentId: payment.id,
              realtorId: booking.property.realtorId,
              amount: booking.realtorPayout,
              currency: booking.currency,
              provider: payment.method,
              status: PayoutStatus.RELEASED,
              providerTransferId:
                providerTransferId ??
                payment.paystackReference ??
                payment.stripeTransferId ??
                undefined,
              processedAt,
              metadata: {
                ...paymentMetadata,
                releasedBy: "system",
              },
            },
          });

          await tx.booking.update({
            where: { id: booking.id },
            data: {
              payoutStatus: PayoutStatus.RELEASED,
              payoutHoldReason: null,
              payoutHoldUntil: null,
            },
          });

          await tx.payment.update({
            where: { id: payment.id },
            data: {
              payoutReleased: true,
              payoutReleasedAt: processedAt,
              stripeTransferId: providerTransferId ?? payment.stripeTransferId,
            },
          });
        });

        console.log(`Released payout for booking ${booking.id}`);
        auditLogger
          .log("PAYOUT_RELEASED", "Payout", {
            entityId: booking.id,
            details: { method: payment.method },
          })
          .catch(() => {});

        if (booking.property.realtor.businessEmail) {
          try {
            await sendRealtorPayout(
              booking.property.realtor.businessEmail,
              booking.property.realtor,
              Number(booking.realtorPayout),
              booking.currency,
              booking.id
            );
          } catch (e) {
            console.error("Failed to send payout email", e);
          }
        }
      } catch (error) {
        console.error(
          `Failed to release payout for booking ${booking.id}:`,
          error
        );

        await prisma.$transaction(async (tx) => {
          await tx.booking.update({
            where: { id: booking.id },
            data: { payoutStatus: PayoutStatus.FAILED },
          });

          if (payment) {
            await (tx as any).payout.upsert({
              where: { paymentId: payment.id },
              update: {
                status: PayoutStatus.FAILED,
                processedAt: new Date(),
                metadata: {
                  ...paymentMetadata,
                  error: (error as Error).message,
                },
              },
              create: {
                bookingId: booking.id,
                paymentId: payment.id,
                realtorId: booking.property.realtorId,
                amount: booking.realtorPayout,
                currency: booking.currency,
                provider: payment.method,
                status: PayoutStatus.FAILED,
                metadata: {
                  ...paymentMetadata,
                  error: (error as Error).message,
                },
              },
            });
          }
        });
      }
    }

    console.log("Payout release job completed");
  } catch (error) {
    console.error("Error in payout release job:", error);
  }
};
