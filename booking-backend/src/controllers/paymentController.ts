import { Response } from "express";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { prisma } from "@/config/database";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { stripeService } from "@/services/stripe";
import { paystackService } from "@/services/paystack";
import { refundPolicyService } from "@/services/refundPolicy";
import { PDFService } from "@/services/pdf";
import { sendPaymentReceipt } from "@/services/email";
import { sendRefundProcessed } from "@/services/email";
import { auditLogger } from "@/services/auditLogger";

// Helper: ensure booking belongs to user (guest) or user is admin
async function fetchBookingForPayment(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      property: { include: { realtor: true } },
      payment: true,
    },
  });
  if (!booking) throw new AppError("Booking not found", 404);
  if (booking.guestId !== userId) throw new AppError("Not authorized", 403);
  if (booking.status === "CANCELLED")
    throw new AppError("Cannot pay for a cancelled booking", 400);
  return booking;
}

// Create Stripe PaymentIntent (manual capture model) & Payment row if absent
export const createStripePaymentIntent = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId } = req.body;
    if (!bookingId) throw new AppError("bookingId is required", 400);

    const booking = await fetchBookingForPayment(bookingId, req.user!.id);

    // Prevent duplicate payment
    if (booking.payment && booking.payment.status !== PaymentStatus.FAILED) {
      return res.json({
        success: true,
        message: "Existing payment found",
        data: { paymentId: booking.payment.id },
      });
    }

    // Create payment row first (PENDING)
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        userId: req.user!.id,
        amount: booking.totalPrice,
        propertyAmount: booking.propertyPrice,
        serviceFeeAmount: booking.serviceFee,
        platformCommission: booking.platformCommission,
        realtorPayout: booking.realtorPayout,
        gatewayFee: 0, // Updated after webhook
        platformNet: 0, // Updated after webhook
        currency: booking.currency,
        method: PaymentMethod.STRIPE,
        status: PaymentStatus.PENDING,
        metadata: {},
      },
    });

    const guest = await prisma.user.findUnique({
      where: { id: booking.guestId },
      select: { email: true },
    });

    const realtorStripeAccountId =
      booking.property.realtor.stripeAccountId || "";

    const intent = await stripeService.createPaymentIntentWithSplit({
      id: booking.id,
      totalPrice: Number(booking.totalPrice),
      currency: booking.currency,
      propertyPrice: Number(booking.propertyPrice),
      serviceFee: Number(booking.serviceFee),
      platformCommission: Number(booking.platformCommission),
      realtorPayout: Number(booking.realtorPayout),
      realtorStripeAccountId,
      guestEmail: guest?.email || "",
    });

    // Store intent id
    await prisma.payment.update({
      where: { id: payment.id },
      data: { stripePaymentIntentId: intent.payment_intent_id },
    });

    return res.json({
      success: true,
      message: "Stripe payment intent created",
      data: {
        clientSecret: intent.client_secret,
        paymentId: payment.id,
      },
    });

    auditLogger
      .log("PAYMENT_INTENT_CREATED", "Payment", {
        entityId: payment.id,
        userId: req.user!.id,
        details: { bookingId: booking.id, method: payment.method },
        req,
      })
      .catch(() => {});
  }
);

// Initialize Paystack Payment with split
export const initializePaystackPayment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId } = req.body;
    if (!bookingId) throw new AppError("bookingId is required", 400);

    const booking = await fetchBookingForPayment(bookingId, req.user!.id);

    if (booking.payment && booking.payment.status !== PaymentStatus.FAILED) {
      return res.json({
        success: true,
        message: "Existing payment found",
        data: { paymentId: booking.payment.id },
      });
    }

    const guest = await prisma.user.findUnique({
      where: { id: booking.guestId },
      select: { email: true },
    });

    const realtor = booking.property.realtor;
    if (!realtor.paystackSubAccountId) {
      throw new AppError("Realtor not onboarded for Paystack", 400);
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        userId: req.user!.id,
        amount: booking.totalPrice,
        propertyAmount: booking.propertyPrice,
        serviceFeeAmount: booking.serviceFee,
        platformCommission: booking.platformCommission,
        realtorPayout: booking.realtorPayout,
        gatewayFee: 0,
        platformNet: 0,
        currency: booking.currency,
        method: PaymentMethod.PAYSTACK,
        status: PaymentStatus.PENDING,
      },
    });

    const init = await paystackService.initializeSplitPayment({
      id: booking.id,
      totalPrice: Number(booking.totalPrice),
      currency: booking.currency,
      guestEmail: guest?.email || "",
      realtorSubAccountCode: realtor.paystackSubAccountId,
      realtorPayout: Number(booking.realtorPayout),
      platformCommission: Number(booking.platformCommission),
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        paystackReference: init.reference,
        paystackSplitCode: init.split_code,
      },
    });

    return res.json({
      success: true,
      message: "Paystack payment initialized",
      data: {
        authorizationUrl: init.authorization_url,
        reference: init.reference,
        paymentId: payment.id,
      },
    });

    auditLogger
      .log("PAYMENT_INITIALIZED", "Payment", {
        entityId: payment.id,
        userId: req.user!.id,
        details: { bookingId: booking.id, method: payment.method },
        req,
      })
      .catch(() => {});
  }
);

// Verify Paystack payment manually (fallback if webhook missed)
export const verifyPaystackPayment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { reference } = req.body;
    if (!reference) throw new AppError("reference is required", 400);

    const payment = await prisma.payment.findFirst({
      where: { paystackReference: reference, userId: req.user!.id },
      include: { booking: true },
    });
    if (!payment) throw new AppError("Payment not found", 404);

    if (payment.status === PaymentStatus.COMPLETED) {
      return res.json({ success: true, message: "Already verified" });
    }

    const tx = await paystackService.verifyTransaction(reference);
    if (tx.status !== "success") {
      throw new AppError("Transaction not successful", 400);
    }

    await prisma.$transaction(async (trx) => {
      await trx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.COMPLETED },
      });
      await trx.booking.update({
        where: { id: payment.bookingId },
        data: { status: "CONFIRMED" },
      });
    });

    return res.json({ success: true, message: "Payment verified" });
  }
);

// Process refund (admin or owner if eligible) – simplified initial version
export const processRefund = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params; // payment id
    const { amount, reason, adminOverride } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        booking: { include: { property: { select: { realtorId: true } } } },
        refunds: true,
      },
    });
    if (!payment) throw new AppError("Payment not found", 404);
    if (payment.status === PaymentStatus.REFUNDED)
      return res.json({ success: true, message: "Already fully refunded" });

    // Authorization: owner or admin
    const isOwner = payment.userId === req.user!.id;
    const isAdmin = req.user!.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      throw new AppError("Not authorized to refund this payment", 403);
    }

    if (!payment.booking) throw new AppError("Associated booking missing", 500);

    // Already cancelled? if booking not cancelled, this is a manual partial refund scenario
    const totalPaid = Number(payment.amount);
    const alreadyRefunded = payment.refunds.reduce(
      (sum, r) => sum + Number(r.amount),
      0
    );
    const remaining = totalPaid - alreadyRefunded;
    if (remaining <= 0) {
      return res.json({ success: true, message: "No refundable balance" });
    }

    let targetAmount: number;
    if (amount != null) {
      targetAmount = Number(amount);
      if (targetAmount <= 0 || targetAmount > remaining) {
        throw new AppError("Invalid refund amount", 400);
      }
    } else {
      targetAmount = remaining; // default to remaining balance
    }

    // Policy evaluation (unless adminOverride explicitly true by admin)
    let evaluation: any = null;
    if (!adminOverride) {
      evaluation = await refundPolicyService.evaluateRefund({
        booking: payment.booking as any,
      });
      if (!evaluation.eligible) {
        throw new AppError(
          `Refund not eligible by policy: ${evaluation.reason}`,
          400
        );
      }
      // Cap amount by policy if not full refund
      if (!evaluation.fullRefund) {
        const maxPolicyAmount = evaluation.refundableAmount - alreadyRefunded;
        if (maxPolicyAmount <= 0) {
          throw new AppError("Policy refundable amount already exhausted", 400);
        }
        if (targetAmount > maxPolicyAmount) targetAmount = maxPolicyAmount;
      }
    } else if (!isAdmin) {
      throw new AppError("Only admin can perform override", 403);
    }

    // Execute provider refund
    let providerRefund: any = null;
    try {
      if (
        payment.method === PaymentMethod.STRIPE &&
        payment.stripePaymentIntentId
      ) {
        providerRefund = await stripeService.processRefund(
          payment.stripePaymentIntentId,
          targetAmount,
          "requested_by_customer"
        );
      } else if (
        payment.method === PaymentMethod.PAYSTACK &&
        payment.paystackReference
      ) {
        providerRefund = await paystackService.processRefund(
          payment.paystackReference,
          targetAmount === remaining ? undefined : targetAmount
        );
      }
    } catch (err) {
      console.error("Provider refund failed", err);
      throw new AppError("Provider refund failed", 502);
    }

    const finalAmount = targetAmount; // after potential capping
    const fullAfterThis = alreadyRefunded + finalAmount >= totalPaid - 0.0001;

    await prisma.$transaction(async (tx) => {
      await tx.refund.create({
        data: {
          amount: finalAmount,
          currency: payment.currency,
          reason:
            reason ||
            evaluation?.reason ||
            (fullAfterThis ? "Full refund" : "Partial refund"),
          status: PaymentStatus.COMPLETED,
          method: payment.method,
          bookingId: payment.bookingId,
          paymentId: payment.id,
          processedAt: new Date(),
          adminApproved: isAdmin || adminOverride || false,
          adminApprovedBy: isAdmin ? req.user!.id : undefined,
          adminApprovedAt: isAdmin ? new Date() : undefined,
          metadata: providerRefund ? { provider: providerRefund } : undefined,
        },
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: fullAfterThis
            ? PaymentStatus.REFUNDED
            : PaymentStatus.PARTIALLY_REFUNDED,
        },
      });

      if (fullAfterThis) {
        await tx.booking.update({
          where: { id: payment.bookingId },
          data: { status: "REFUNDED" },
        });
      }
    });

    return res.json({
      success: true,
      message: fullAfterThis
        ? "Full refund completed"
        : "Partial refund completed",
      data: {
        refundedAmount: finalAmount,
        totalRefunded: alreadyRefunded + finalAmount,
        remaining: totalPaid - (alreadyRefunded + finalAmount),
        providerRefund,
        evaluation: evaluation || undefined,
      },
    });

    auditLogger
      .log("REFUND_PROCESSED", "Refund", {
        entityId: payment!.id,
        userId: req.user!.id,
        details: {
          bookingId: payment!.bookingId,
          amount: finalAmount,
          fullAfterThis,
        },
        req,
      })
      .catch(() => {});
    // Send refund email (non-blocking) after response (fire and forget)
    (async () => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: payment!.userId },
          select: { email: true },
        });
        if (user?.email && payment!.booking) {
          await sendRefundProcessed(
            user.email,
            payment!.booking,
            finalAmount,
            alreadyRefunded + finalAmount,
            totalPaid - (alreadyRefunded + finalAmount),
            reason || evaluation?.reason || "Refund processed"
          );
        }
      } catch (e) {
        console.error("Refund email failed", e);
      }
    })();
  }
);

// Get all payments for current user (or specific payment by id param)
export const getUserPayments = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    if (id) {
      const payment = await prisma.payment.findFirst({
        where: { id, userId: req.user!.id },
        include: { booking: true },
      });
      if (!payment) throw new AppError("Payment not found", 404);
      return res.json({ success: true, data: payment });
    }

    const payments = await prisma.payment.findMany({
      where: { userId: req.user!.id },
      include: { booking: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, data: payments });
  }
);

// Generate PDF receipt and email (simplified: only after payment completed)
export const generatePaymentReceipt = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params; // payment id
    const payment = await prisma.payment.findFirst({
      where: { id, userId: req.user!.id, status: PaymentStatus.COMPLETED },
      include: {
        booking: {
          include: { property: true },
        },
      },
    });
    if (!payment) throw new AppError("Payment not found or not completed", 404);

    const user = await prisma.user.findUnique({
      where: { id: payment.userId },
      select: { firstName: true, lastName: true, email: true, phone: true },
    });
    if (!user) throw new AppError("User not found", 404);

    const pdfBuffer = await PDFService.generateBookingReceipt(
      payment.booking,
      payment.booking.property,
      user,
      payment
    );

    await sendPaymentReceipt(
      user.email,
      payment.booking,
      payment,
      payment.booking.property,
      {
        filename: `receipt-${payment.id}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      }
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=receipt-${payment.id}.pdf`
    );
    return res.send(pdfBuffer);
  }
);

// (Receipt generation audit)
// After response above, fire and forget audit (cannot insert earlier due to existing return pattern change risk)
// Note: Could refactor to capture before sending response if needed.
