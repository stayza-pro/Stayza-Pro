import express from "express";
import {
  PaymentMethod,
  PaymentStatus,
  Prisma,
  BookingStatus,
} from "@prisma/client";
import { prisma } from "@/config/database";
import { AuthenticatedRequest } from "@/types";
import { paystackService } from "@/services/paystack";
import { sendEmail } from "@/services/email";
import { ReceiptGenerator } from "@/services/receiptGenerator";
import {
  dedupeSavedPaymentMethods,
  extractPaystackAuthorization,
  getMetadataObject,
} from "@/services/savedPaymentMethods";
import { finalizePaystackPayment } from "@/services/paymentFinalization";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import {
  authenticate,
  authorize,
  optionalAuthenticate,
} from "@/middleware/auth";
import { config } from "@/config/index";

const router = express.Router();

const SAVED_METHOD_ELIGIBLE_STATUSES: PaymentStatus[] = [
  PaymentStatus.HELD,
  PaymentStatus.PARTIALLY_RELEASED,
  PaymentStatus.SETTLED,
];

const CHECKOUT_EVENT_TYPES = [
  "CHECKOUT_PAGE_VIEWED",
  "CHECKOUT_SUBMITTED",
  "CHECKOUT_SUBMIT_FAILED",
  "BOOKING_CREATED",
  "PAYMENT_PAGE_VIEWED",
  "PAYSTACK_POPUP_OPENED",
  "PAYSTACK_CALLBACK_SUCCESS",
  "PAYMENT_VERIFIED",
  "PAYMENT_VERIFY_FAILED",
  "SAVED_METHOD_PAYMENT_ATTEMPT",
  "SAVED_METHOD_PAYMENT_SUCCESS",
  "SAVED_METHOD_PAYMENT_FAILED",
] as const;

type CheckoutEventType = (typeof CHECKOUT_EVENT_TYPES)[number];
const CHECKOUT_EVENT_TYPE_SET = new Set<string>(CHECKOUT_EVENT_TYPES);

const extractCheckoutEventName = (
  action: string,
  details: unknown,
): CheckoutEventType | null => {
  if (typeof details === "object" && details !== null) {
    const payload = details as { event?: unknown };
    if (
      typeof payload.event === "string" &&
      CHECKOUT_EVENT_TYPE_SET.has(payload.event)
    ) {
      return payload.event as CheckoutEventType;
    }
  }

  const fromAction = action.replace(/^CHECKOUT_EVENT_/, "");
  if (CHECKOUT_EVENT_TYPE_SET.has(fromAction)) {
    return fromAction as CheckoutEventType;
  }

  return null;
};

const extractCheckoutBookingKey = (
  entityId: string,
  details: unknown,
): string | null => {
  if (typeof details === "object" && details !== null) {
    const payload = details as {
      bookingId?: unknown;
      paymentId?: unknown;
      propertyId?: unknown;
      sessionId?: unknown;
    };

    if (typeof payload.bookingId === "string" && payload.bookingId.trim()) {
      return `booking:${payload.bookingId}`;
    }

    if (typeof payload.paymentId === "string" && payload.paymentId.trim()) {
      return `payment:${payload.paymentId}`;
    }

    if (typeof payload.propertyId === "string" && payload.propertyId.trim()) {
      return `property:${payload.propertyId}`;
    }

    if (typeof payload.sessionId === "string" && payload.sessionId.trim()) {
      return `session:${payload.sessionId}`;
    }
  }

  return entityId ? `entity:${entityId}` : null;
};

/**
 * @swagger
 * tags:
 *   - name: Payments
 *     description: Payment processing with Paystack
 */

/**
 * GET /api/payments/callback
 * Handles payment gateway redirects (Paystack)
 * Extracts reference from query params and auto-verifies payment
 */
router.get(
  "/callback",
  asyncHandler(async (req, res) => {
    const { reference, trxref, transaction_id } = req.query;

    // Paystack sends 'reference' or 'trxref'
    // Handle arrays (duplicate query params) by taking first element
    const getFirstParam = (param: unknown): string | undefined => {
      if (Array.isArray(param)) {
        const first = param[0];
        return typeof first === "string" ? first : undefined;
      }
      if (typeof param === "string") return param;
      return undefined;
    };

    const paymentRef = getFirstParam(reference) || getFirstParam(trxref);
    const txId = getFirstParam(transaction_id);

    if (!paymentRef && !txId) {
      return res.status(400).json({
        success: false,
        message: "No payment reference found in callback",
      });
    }

    // Find payment by reference
    const payment = await prisma.payment.findFirst({
      where: {
        reference: paymentRef || txId,
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Redirect to frontend success page with reference
    const meta = (payment.metadata as Record<string, unknown> | null) ?? {};
    const callbackOrigin =
      typeof meta.originUrl === "string" ? meta.originUrl : null;
    const frontendUrl =
      callbackOrigin || config.FRONTEND_URL || "http://localhost:3000";
    const successUrl = `${frontendUrl}/booking/payment/success?reference=${
      payment.reference
    }&provider=${payment.method.toLowerCase()}`;

    return res.redirect(successUrl);
  }),
);

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         bookingId:
 *           type: string
 *         userId:
 *           type: string
 *         amount:
 *           type: number
 *         currency:
 *           type: string
 *         status:
 *           type: string
 *           enum: [INITIATED, PENDING, ESCROW_HELD, ROOM_FEE_SPLIT_RELEASED, RELEASED_TO_REALTOR, REFUNDED_TO_CUSTOMER, PARTIAL_PAYOUT_REALTOR, COMPLETED, FAILED]
 *         method:
 *           type: string
 *           enum: [PAYSTACK]
 *         reference:
 *           type: string
 *         providerId:
 *           type: string
 *         roomFeeAmount:
 *           type: number
 *         cleaningFeeAmount:
 *           type: number
 *         securityDepositAmount:
 *           type: number
 *         serviceFeeAmount:
 *           type: number
 *         platformFeeAmount:
 *           type: number
 *         roomFeeInEscrow:
 *           type: boolean
 *         depositInEscrow:
 *           type: boolean
 *         roomFeeReleasedAt:
 *           type: string
 *           format: date-time
 *         depositReleasedAt:
 *           type: string
 *           format: date-time
 *         paidAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     InitializePaystackRequest:
 *       type: object
 *       required:
 *         - bookingId
 *       properties:
 *         bookingId:
 *           type: string
 *           description: ID of the booking to pay for
 *
 *     InitializePaystackResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             authorizationUrl:
 *               type: string
 *             accessCode:
 *               type: string
 *             reference:
 *               type: string
 *             paymentId:
 *               type: string
 *
 *     VerifyPaymentRequest:
 *       type: object
 *       required:
 *         - reference
 *       properties:
 *         reference:
 *           type: string
 *           description: Payment reference from initialization
 *
 *     VerifyPaymentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             payment:
 *               $ref: '#/components/schemas/Payment'
 *             booking:
 *               type: object
 *
 *     VerifyByBookingRequest:
 *       type: object
 *       required:
 *         - bookingId
 *       properties:
 *         bookingId:
 *           type: string
 *           description: Booking ID to verify payment for
 *
 *     CreatePaymentRequest:
 *       type: object
 *       required:
 *         - bookingId
 *         - amount
 *         - provider
 *       properties:
 *         bookingId:
 *           type: string
 *         amount:
 *           type: number
 *         provider:
 *           type: string
 *           enum: [PAYSTACK]
 */

/**
 * @swagger
 * /api/payments/initialize-paystack:
 *   post:
 *     summary: Initialize Paystack payment (PRIMARY GATEWAY)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InitializePaystackRequest'
 *     responses:
 *       200:
 *         description: Payment initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InitializePaystackResponse'
 *       400:
 *         description: Invalid request or booking already paid
 *       404:
 *         description: Booking not found
 */
router.post(
  "/initialize-paystack",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { bookingId, originUrl } = req.body;
    const userId = req.user!.id;

    if (!bookingId) {
      throw new AppError("Booking ID is required", 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        guestId: true,
        totalPrice: true,
        propertyId: true,
        currency: true,
        roomFee: true,
        cleaningFee: true,
        securityDeposit: true,
        serviceFee: true,
        platformFee: true,
        commissionBaseRate: true,
        commissionVolumeReductionRate: true,
        commissionEffectiveRate: true,
        serviceFeeStayza: true,
        serviceFeeProcessing: true,
        processingFeeMode: true,
        guest: true,
        property: {
          select: {
            realtor: {
              select: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    if (booking.guestId !== userId) {
      throw new AppError("Unauthorized: Not your booking", 403);
    }

    const isDev = config.NODE_ENV === "development";
    const callbackBaseUrl = isDev
      ? `http://localhost:${config.PORT}`
      : `https://api.${config.MAIN_DOMAIN}`;

    const initializeWithReference = async (
      paymentId: string,
      reference: string,
    ) => {
      const paystackResponse =
        await paystackService.initializePaystackTransaction({
          email: booking.guest.email,
          amount: Math.round(Number(booking.totalPrice) * 100),
          reference,
          callback_url: `${callbackBaseUrl}/api/payments/callback?reference=${reference}`,
          metadata: {
            bookingId: booking.id,
            paymentId,
            guestId: booking.guestId,
            propertyId: booking.propertyId,
            ...(originUrl ? { originUrl } : {}),
          },
        });

      return {
        authorizationUrl: paystackResponse.data.authorization_url,
        accessCode: paystackResponse.data.access_code,
        reference,
        paymentId,
        publicKey: config.PAYSTACK_PUBLIC_KEY,
      };
    };

    const existingPayment = await prisma.payment.findUnique({
      where: { bookingId },
    });

    if (existingPayment) {
      const retryableStatuses = new Set<PaymentStatus>([
        PaymentStatus.INITIATED,
        PaymentStatus.FAILED,
      ]);

      if (!retryableStatuses.has(existingPayment.status)) {
        throw new AppError("Payment already exists for this booking", 400);
      }

      const reference =
        existingPayment.reference ||
        `PAY-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 11)
          .toUpperCase()}`;

      if (!existingPayment.reference) {
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: { reference },
        });
      }

      const payload = await initializeWithReference(
        existingPayment.id,
        reference,
      )
        .then((result) => result)
        .catch(() => ({
          authorizationUrl: undefined as string | undefined,
          accessCode: undefined as string | undefined,
          reference,
          paymentId: existingPayment.id,
          publicKey: config.PAYSTACK_PUBLIC_KEY,
        }));

      const existingMetadata =
        typeof existingPayment.metadata === "object" &&
        existingPayment.metadata !== null &&
        !Array.isArray(existingPayment.metadata)
          ? (existingPayment.metadata as Record<string, unknown>)
          : {};

      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: PaymentStatus.INITIATED,
          metadata: {
            ...existingMetadata,
            lastInitializationAt: new Date().toISOString(),
            retryCount: Number(existingMetadata.retryCount || 0) + 1,
            ...(originUrl ? { originUrl } : {}),
          },
        },
      });

      return res.status(200).json({
        success: true,
        message: "Payment re-initialized successfully",
        data: {
          ...payload,
          paymentStatus: PaymentStatus.INITIATED,
        },
      });
    }

    const reference = `PAY-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 11)
      .toUpperCase()}`;

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        userId,
        amount: booking.totalPrice,
        currency: booking.currency,
        status: PaymentStatus.INITIATED,
        method: PaymentMethod.PAYSTACK,
        reference,
        roomFeeAmount: booking.roomFee,
        cleaningFeeAmount: booking.cleaningFee,
        securityDepositAmount: booking.securityDeposit,
        serviceFeeAmount: booking.serviceFee,
        platformFeeAmount: booking.platformFee,
        commissionBaseRate: booking.commissionBaseRate,
        commissionVolumeReductionRate: booking.commissionVolumeReductionRate,
        commissionEffectiveRate: booking.commissionEffectiveRate,
        commissionBaseAmount: booking.commissionBaseRate
          ? new Prisma.Decimal(
              (
                Number(booking.roomFee) * Number(booking.commissionBaseRate)
              ).toFixed(2),
            )
          : null,
        serviceFeeStayzaAmount: booking.serviceFeeStayza,
        serviceFeeProcessingQuotedAmount: booking.serviceFeeProcessing,
        serviceFeeProcessingVarianceAmount: new Prisma.Decimal(0),
        processingFeeModeQuoted: booking.processingFeeMode,
        ...(originUrl ? { metadata: { originUrl } } : {}),
      },
    });

    const payload = await initializeWithReference(payment.id, reference);

    return res.status(200).json({
      success: true,
      message: "Payment initialized successfully",
      data: {
        ...payload,
        paymentStatus: payment.status,
      },
    });
  }),
);

/**
 * @swagger
 * /api/payments/verify-paystack:
 *   post:
 *     summary: Verify Paystack payment and hold in escrow
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyPaymentRequest'
 *     responses:
 *       200:
 *         description: Payment verified and held in escrow
 *       400:
 *         description: Payment verification failed
 *       404:
 *         description: Payment not found
 */
router.post(
  "/verify-paystack",
  optionalAuthenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { reference } = req.body;

    if (!reference) {
      throw new AppError("Payment reference is required", 400);
    }

    const payment = await prisma.payment.findUnique({
      where: { reference },
      include: {
        booking: {
          include: {
            guest: true,
            property: {
              include: {
                realtor: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    if (
      payment.status === PaymentStatus.PARTIALLY_RELEASED ||
      payment.status === PaymentStatus.SETTLED ||
      (payment.status === PaymentStatus.HELD && payment.paidAt)
    ) {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        data: { payment, booking: payment.booking },
      });
    }

    const verificationResult =
      await paystackService.verifyPaystackTransaction(reference);
    const txData = verificationResult.data || {};
    const isApiSuccess = verificationResult.status === true;
    const isTransactionSuccess = txData.status === "success";
    const expectedAmount = Math.round(Number(payment.amount) * 100);
    const actualAmount = txData.amount || 0;

    if (actualAmount !== expectedAmount) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          metadata: {
            ...((payment.metadata as object) || {}),
            failureReason: `Amount mismatch: expected ${expectedAmount} kobo, got ${actualAmount} kobo`,
            verificationResponse: txData,
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          action: "PAYMENT_VERIFICATION_FAILED",
          userId: payment.booking.guestId,
          entityType: "PAYMENT",
          entityId: payment.id,
          details: {
            bookingId: payment.booking.id,
            reason: "AMOUNT_MISMATCH",
            expectedAmount,
            actualAmount,
          },
        },
      });

      throw new AppError(
        `Payment amount mismatch: expected NGN ${Number(
          payment.amount,
        ).toLocaleString()}, got NGN ${(actualAmount / 100).toLocaleString()}`,
        400,
      );
    }

    if (!isApiSuccess || !isTransactionSuccess) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          metadata: {
            ...((payment.metadata as object) || {}),
            failureReason:
              verificationResult.message || "Payment verification failed",
            verificationResponse: txData,
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          action: "PAYMENT_VERIFICATION_FAILED",
          userId: payment.booking.guestId,
          entityType: "PAYMENT",
          entityId: payment.id,
          details: {
            bookingId: payment.booking.id,
            reason: verificationResult.message || txData.status || "UNKNOWN",
          },
        },
      });

      sendEmail(payment.booking.guest.email, {
        subject: "Payment Failed",
        html: `<p>Your payment for ${payment.booking.property.title} has failed. Please try again.</p>`,
      }).catch(() => undefined);

      throw new AppError(
        `Payment verification failed: ${
          verificationResult.message || txData.status || "Unknown error"
        }`,
        400,
      );
    }

    const finalized = await finalizePaystackPayment({
      paymentId: payment.id,
      source: "VERIFY_PAYSTACK",
      providerData: txData,
    });

    return res.status(200).json({
      success: true,
      message: finalized.alreadyFinalized
        ? "Payment already verified"
        : "Payment verified successfully and held in escrow",
      data: {
        payment: finalized.payment,
        booking: finalized.booking,
      },
    });
  }),
);

/**
 * @swagger
 * /api/payments/verify-by-booking:
 *   post:
 *     summary: Verify Paystack payment by booking ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyByBookingRequest'
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *       400:
 *         description: Payment verification failed
 *       404:
 *         description: Payment not found
 */
router.post(
  "/verify-by-booking",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { bookingId } = req.body;
    const userId = req.user!.id;

    if (!bookingId) {
      throw new AppError("Booking ID is required", 400);
    }

    const payment = await prisma.payment.findFirst({
      where: { bookingId },
      include: {
        booking: {
          include: {
            guest: true,
            property: {
              include: {
                realtor: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new AppError("Payment not found for this booking", 404);
    }

    if (payment.booking.guestId !== userId) {
      throw new AppError("Unauthorized", 403);
    }

    if (
      payment.status === PaymentStatus.PARTIALLY_RELEASED ||
      payment.status === PaymentStatus.SETTLED ||
      (payment.status === PaymentStatus.HELD && payment.paidAt)
    ) {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        data: { payment, booking: payment.booking },
      });
    }

    if (payment.method !== PaymentMethod.PAYSTACK) {
      throw new AppError(
        `Unsupported payment provider: ${payment.method}`,
        400,
      );
    }

    const verificationResult = await paystackService.verifyPaystackTransaction(
      payment.reference!,
    );
    const txData = verificationResult.data || {};
    const isApiSuccess = verificationResult.status === true;
    const isTransactionSuccess = txData.status === "success";

    if (!isApiSuccess || !isTransactionSuccess) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          metadata: {
            ...((payment.metadata as object) || {}),
            failureReason:
              verificationResult.message || "Payment verification failed",
            verificationResponse: txData,
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          action: "PAYMENT_VERIFICATION_FAILED",
          userId: payment.booking.guestId,
          entityType: "PAYMENT",
          entityId: payment.id,
          details: {
            bookingId: payment.booking.id,
            reason: verificationResult.message || txData.status || "UNKNOWN",
          },
        },
      });

      throw new AppError(
        `Payment verification failed: ${
          verificationResult.message || txData.status
        }`,
        400,
      );
    }

    const finalized = await finalizePaystackPayment({
      paymentId: payment.id,
      source: "VERIFY_BY_BOOKING",
      providerData: txData,
    });

    return res.status(200).json({
      success: true,
      message: finalized.alreadyFinalized
        ? "Payment already verified"
        : "Payment verified successfully",
      data: { payment: finalized.payment, booking: finalized.booking },
    });
  }),
);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get payments list (role-based filtering)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [INITIATED, PENDING, ESCROW_HELD, COMPLETED, FAILED]
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 */
router.get(
  "/",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { page = "1", limit = "10", status } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause based on role
    const where: Prisma.PaymentWhereInput = {};

    if (userRole === "GUEST") {
      where.booking = { guestId: userId };
    } else if (userRole === "REALTOR") {
      where.booking = { property: { realtor: { userId } } };
    }
    // ADMIN sees all payments (no filter)

    if (status) {
      where.status = status as PaymentStatus;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          booking: {
            select: {
              id: true,
              checkInDate: true,
              checkOutDate: true,
              property: {
                select: {
                  id: true,
                  title: true,
                  realtorId: true,
                },
              },
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  }),
);

router.post(
  "/checkout-event",
  optionalAuthenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { event, bookingId, paymentId, propertyId, sessionId, context } =
      req.body as {
        event?: string;
        bookingId?: string;
        paymentId?: string;
        propertyId?: string;
        sessionId?: string;
        context?: Record<string, unknown>;
      };

    const normalizedEvent = (event || "").trim().toUpperCase();
    if (!CHECKOUT_EVENT_TYPE_SET.has(normalizedEvent)) {
      throw new AppError("Unsupported checkout event", 400);
    }

    const resolvedEntityId =
      bookingId ||
      paymentId ||
      propertyId ||
      sessionId ||
      `anon:${req.ip || "unknown"}`;
    const eventDetails: Prisma.InputJsonObject = {
      event: normalizedEvent,
      bookingId: bookingId || null,
      paymentId: paymentId || null,
      propertyId: propertyId || null,
      sessionId: sessionId || null,
      context: (context || null) as Prisma.InputJsonValue,
    };

    await prisma.auditLog.create({
      data: {
        action: `CHECKOUT_EVENT_${normalizedEvent}`,
        entityType: "CHECKOUT_FUNNEL",
        entityId: resolvedEntityId,
        userId: req.user?.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]?.toString(),
        details: eventDetails,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Checkout event tracked",
    });
  }),
);

router.get(
  "/leakage-metrics",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const parsedWindowDays = Number(req.query.windowDays ?? 30);
    const windowDays =
      Number.isFinite(parsedWindowDays) && parsedWindowDays > 0
        ? Math.min(Math.floor(parsedWindowDays), 90)
        : 30;

    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - windowDays);

    const abandonmentCutoff = new Date(Date.now() - 30 * 60 * 1000);

    const [
      startedCheckoutPayments,
      confirmedPayments,
      abandonedCheckoutPayments,
      completedBookings,
      recentBookings,
      checkoutEvents,
    ] = await Promise.all([
      prisma.payment.count({
        where: {
          createdAt: { gte: windowStart },
          method: PaymentMethod.PAYSTACK,
        },
      }),
      prisma.payment.count({
        where: {
          createdAt: { gte: windowStart },
          method: PaymentMethod.PAYSTACK,
          status: { in: SAVED_METHOD_ELIGIBLE_STATUSES },
        },
      }),
      prisma.payment.count({
        where: {
          createdAt: { gte: windowStart, lte: abandonmentCutoff },
          method: PaymentMethod.PAYSTACK,
          status: { in: [PaymentStatus.INITIATED] },
          booking: {
            status: BookingStatus.PENDING,
          },
        },
      }),
      prisma.booking.findMany({
        where: {
          status: BookingStatus.COMPLETED,
        },
        select: {
          guestId: true,
        },
      }),
      prisma.booking.findMany({
        where: {
          createdAt: { gte: windowStart },
          status: {
            in: [
              BookingStatus.PENDING,
              BookingStatus.ACTIVE,
              BookingStatus.COMPLETED,
            ],
          },
        },
        select: {
          guestId: true,
        },
      }),
      prisma.auditLog.findMany({
        where: {
          timestamp: { gte: windowStart },
          action: { startsWith: "CHECKOUT_EVENT_" },
        },
        select: {
          action: true,
          entityId: true,
          details: true,
        },
      }),
    ]);

    const funnelSets: Record<CheckoutEventType, Set<string>> = {
      CHECKOUT_PAGE_VIEWED: new Set<string>(),
      CHECKOUT_SUBMITTED: new Set<string>(),
      CHECKOUT_SUBMIT_FAILED: new Set<string>(),
      BOOKING_CREATED: new Set<string>(),
      PAYMENT_PAGE_VIEWED: new Set<string>(),
      PAYSTACK_POPUP_OPENED: new Set<string>(),
      PAYSTACK_CALLBACK_SUCCESS: new Set<string>(),
      PAYMENT_VERIFIED: new Set<string>(),
      PAYMENT_VERIFY_FAILED: new Set<string>(),
      SAVED_METHOD_PAYMENT_ATTEMPT: new Set<string>(),
      SAVED_METHOD_PAYMENT_SUCCESS: new Set<string>(),
      SAVED_METHOD_PAYMENT_FAILED: new Set<string>(),
    };

    for (const eventLog of checkoutEvents) {
      const eventName = extractCheckoutEventName(
        eventLog.action,
        eventLog.details,
      );
      if (!eventName) {
        continue;
      }

      const eventKey = extractCheckoutBookingKey(
        eventLog.entityId,
        eventLog.details,
      );
      if (!eventKey) {
        continue;
      }

      funnelSets[eventName].add(eventKey);
    }

    const paymentInitiatedFunnelSet = new Set<string>([
      ...funnelSets.PAYSTACK_POPUP_OPENED,
      ...funnelSets.SAVED_METHOD_PAYMENT_ATTEMPT,
    ]);
    const paymentSuccessFunnelSet = new Set<string>([
      ...funnelSets.PAYMENT_VERIFIED,
      ...funnelSets.SAVED_METHOD_PAYMENT_SUCCESS,
    ]);
    const paymentFailureFunnelSet = new Set<string>([
      ...funnelSets.PAYMENT_VERIFY_FAILED,
      ...funnelSets.SAVED_METHOD_PAYMENT_FAILED,
      ...funnelSets.CHECKOUT_SUBMIT_FAILED,
    ]);

    const funnel = {
      checkoutPageViewed: funnelSets.CHECKOUT_PAGE_VIEWED.size,
      checkoutSubmitted: funnelSets.CHECKOUT_SUBMITTED.size,
      checkoutSubmitFailed: funnelSets.CHECKOUT_SUBMIT_FAILED.size,
      bookingCreated: funnelSets.BOOKING_CREATED.size,
      paymentPageViewed: funnelSets.PAYMENT_PAGE_VIEWED.size,
      paymentInitiated: paymentInitiatedFunnelSet.size,
      paymentSucceeded: paymentSuccessFunnelSet.size,
      paymentFailed: paymentFailureFunnelSet.size,
      savedMethodAttempts: funnelSets.SAVED_METHOD_PAYMENT_ATTEMPT.size,
      savedMethodSuccesses: funnelSets.SAVED_METHOD_PAYMENT_SUCCESS.size,
      savedMethodFailures: funnelSets.SAVED_METHOD_PAYMENT_FAILED.size,
    };

    const startedCheckouts = Math.max(
      startedCheckoutPayments,
      funnel.checkoutPageViewed,
    );
    const abandonedCheckouts = Math.max(
      abandonedCheckoutPayments,
      funnel.checkoutSubmitFailed,
    );

    const completedCounts = new Map<string, number>();
    for (const booking of completedBookings) {
      completedCounts.set(
        booking.guestId,
        (completedCounts.get(booking.guestId) || 0) + 1,
      );
    }

    const repeatGuestIds = new Set(
      Array.from(completedCounts.entries())
        .filter(([, count]) => count >= 2)
        .map(([guestId]) => guestId),
    );

    const activeRecentGuestIds = new Set(recentBookings.map((b) => b.guestId));
    const repeatGuestsDroppedOff = Array.from(repeatGuestIds).filter(
      (guestId) => !activeRecentGuestIds.has(guestId),
    ).length;

    const conversionRate =
      startedCheckouts > 0
        ? Number(((confirmedPayments / startedCheckouts) * 100).toFixed(2))
        : 0;
    const abandonmentRate =
      startedCheckouts > 0
        ? Number(((abandonedCheckouts / startedCheckouts) * 100).toFixed(2))
        : 0;
    const checkoutToPaymentDropOffRate =
      funnel.checkoutPageViewed > 0
        ? Number(
            (
              ((funnel.checkoutPageViewed - funnel.paymentPageViewed) /
                funnel.checkoutPageViewed) *
              100
            ).toFixed(2),
          )
        : 0;
    const paymentToSuccessDropOffRate =
      funnel.paymentInitiated > 0
        ? Number(
            (
              ((funnel.paymentInitiated - funnel.paymentSucceeded) /
                funnel.paymentInitiated) *
              100
            ).toFixed(2),
          )
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        windowDays,
        startedCheckouts,
        confirmedPayments,
        abandonedCheckouts,
        conversionRate,
        abandonmentRate,
        checkoutToPaymentDropOffRate,
        paymentToSuccessDropOffRate,
        repeatGuestsTracked: repeatGuestIds.size,
        repeatGuestsDroppedOff,
        funnel,
      },
    });
  }),
);

router.get(
  "/saved-methods",
  authenticate,
  authorize("GUEST"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;

    const priorPayments = await prisma.payment.findMany({
      where: {
        userId,
        method: PaymentMethod.PAYSTACK,
        status: {
          in: SAVED_METHOD_ELIGIBLE_STATUSES,
        },
      },
      select: {
        id: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    const savedMethods = dedupeSavedPaymentMethods(priorPayments);

    return res.status(200).json({
      success: true,
      data: {
        savedMethods,
      },
    });
  }),
);

router.post(
  "/pay-with-saved-method",
  authenticate,
  authorize("GUEST"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { bookingId, methodId } = req.body as {
      bookingId?: string;
      methodId?: string;
    };

    if (!bookingId || !methodId) {
      throw new AppError("bookingId and methodId are required", 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        guestId: true,
        status: true,
        totalPrice: true,
        propertyId: true,
        currency: true,
        roomFee: true,
        cleaningFee: true,
        securityDeposit: true,
        serviceFee: true,
        platformFee: true,
        commissionBaseRate: true,
        commissionVolumeReductionRate: true,
        commissionEffectiveRate: true,
        serviceFeeStayza: true,
        serviceFeeProcessing: true,
        processingFeeMode: true,
        guest: true,
        property: {
          select: {
            realtor: {
              select: {
                user: true,
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
            currency: true,
            method: true,
            reference: true,
            providerId: true,
            paidAt: true,
            metadata: true,
          },
        },
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    if (booking.guestId !== userId) {
      throw new AppError("Unauthorized: Not your booking", 403);
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new AppError("Only pending bookings can be paid", 400);
    }

    if (
      booking.payment &&
      SAVED_METHOD_ELIGIBLE_STATUSES.includes(booking.payment.status)
    ) {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        data: { payment: booking.payment, booking },
      });
    }

    if (
      booking.payment &&
      booking.payment.status !== PaymentStatus.INITIATED &&
      booking.payment.status !== PaymentStatus.FAILED
    ) {
      throw new AppError(
        "This booking already has an active payment process",
        400,
      );
    }

    const sourcePayment = await prisma.payment.findFirst({
      where: {
        id: methodId,
        userId,
        method: PaymentMethod.PAYSTACK,
        status: {
          in: SAVED_METHOD_ELIGIBLE_STATUSES,
        },
      },
      select: {
        id: true,
        metadata: true,
      },
    });

    if (!sourcePayment) {
      throw new AppError("Saved payment method not found", 404);
    }

    const authorization = extractPaystackAuthorization(sourcePayment.metadata);
    if (!authorization.authorizationCode || !authorization.reusable) {
      throw new AppError(
        "Selected payment method is not reusable. Please pay with Paystack.",
        400,
      );
    }

    let payment = booking.payment;
    if (!payment) {
      const reference = `PAY-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 11)
        .toUpperCase()}`;

      payment = await prisma.payment.create({
        data: {
          bookingId: booking.id,
          userId,
          amount: booking.totalPrice,
          currency: booking.currency,
          status: PaymentStatus.INITIATED,
          method: PaymentMethod.PAYSTACK,
          reference,
          roomFeeAmount: booking.roomFee,
          cleaningFeeAmount: booking.cleaningFee,
          securityDepositAmount: booking.securityDeposit,
          serviceFeeAmount: booking.serviceFee,
          platformFeeAmount: booking.platformFee,
          commissionBaseRate: booking.commissionBaseRate,
          commissionVolumeReductionRate: booking.commissionVolumeReductionRate,
          commissionEffectiveRate: booking.commissionEffectiveRate,
          commissionBaseAmount: booking.commissionBaseRate
            ? new Prisma.Decimal(
                (
                  Number(booking.roomFee) * Number(booking.commissionBaseRate)
                ).toFixed(2),
              )
            : null,
          serviceFeeStayzaAmount: booking.serviceFeeStayza,
          serviceFeeProcessingQuotedAmount: booking.serviceFeeProcessing,
          serviceFeeProcessingVarianceAmount: new Prisma.Decimal(0),
          processingFeeModeQuoted: booking.processingFeeMode,
        },
      });
    }

    let chargeReference = payment.reference;
    if (!chargeReference) {
      chargeReference = `PAY-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 11)
        .toUpperCase()}`;

      payment = await prisma.payment.update({
        where: { id: payment.id },
        data: { reference: chargeReference },
      });
    }

    const chargeResult = await paystackService.chargeAuthorization({
      authorizationCode: authorization.authorizationCode,
      email: booking.guest.email,
      amount: Math.round(Number(booking.totalPrice) * 100),
      reference: chargeReference,
      metadata: {
        bookingId: booking.id,
        paymentId: payment.id,
        reusedFromPaymentId: sourcePayment.id,
        paymentMode: "SAVED_METHOD",
      },
    });

    const chargeData = chargeResult?.data || {};
    const paymentSuccessful =
      chargeResult?.status === true && chargeData?.status === "success";

    if (!paymentSuccessful) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          metadata: {
            ...getMetadataObject(payment.metadata),
            failureReason:
              chargeResult?.message ||
              chargeData?.gateway_response ||
              "Saved method charge failed",
            providerResponse: chargeData,
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          action: "PAYMENT_FAILED_SAVED_METHOD",
          userId,
          entityType: "PAYMENT",
          entityId: payment.id,
          details: {
            bookingId: booking.id,
            sourcePaymentId: sourcePayment.id,
            chargeReference,
          },
        },
      });

      throw new AppError(
        `Payment failed: ${
          chargeResult?.message ||
          chargeData?.gateway_response ||
          "Could not complete payment"
        }`,
        400,
      );
    }
    const finalized = await finalizePaystackPayment({
      paymentId: payment.id,
      source: "SAVED_METHOD",
      providerData: chargeData,
      extraMetadata: {
        authorizationCode: authorization.authorizationCode,
        savedMethodPayment: true,
        reusedFromPaymentId: sourcePayment.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "PAYMENT_COMPLETED_SAVED_METHOD",
        userId,
        entityType: "PAYMENT",
        entityId: finalized.payment.id,
        details: {
          bookingId: booking.id,
          sourcePaymentId: sourcePayment.id,
          chargeReference,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Payment completed successfully with saved method",
      data: {
        payment: finalized.payment,
        booking: finalized.booking,
      },
    });
  }),
);

/**
 * @swagger
 * /api/payments/{id}/receipt:
 *   get:
 *     summary: Download payment receipt as PDF
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF receipt generated
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Payment not found
 *       403:
 *         description: Unauthorized
 */
router.get(
  "/:id/receipt",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            guest: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                city: true,
                state: true,
                country: true,
                realtorId: true,
                realtor: {
                  select: {
                    userId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    // Authorization check
    const isGuest = userRole === "GUEST" && payment.booking.guestId === userId;
    const isRealtor =
      userRole === "REALTOR" &&
      payment.booking.property.realtor.userId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isGuest && !isRealtor && !isAdmin) {
      throw new AppError("Unauthorized to download this receipt", 403);
    }

    // Only generate receipt for completed payments
    if (
      payment.status !== "HELD" &&
      payment.status !== "PARTIALLY_RELEASED" &&
      payment.status !== "SETTLED"
    ) {
      throw new AppError(
        "Receipt is available once payment is held or released",
        400,
      );
    }

    // Generate PDF
    const doc = ReceiptGenerator.generateReceipt(payment);

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="receipt-${payment.reference}.pdf"`,
    );

    // Pipe PDF to response
    doc.pipe(res);
    doc.end();
  }),
);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get single payment details
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment retrieved successfully
 *       404:
 *         description: Payment not found
 *       403:
 *         description: Unauthorized
 */
router.get(
  "/:id",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            guest: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            property: {
              select: {
                id: true,
                title: true,
                realtorId: true,
                realtor: {
                  select: {
                    userId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    // Authorization check
    const isGuest = userRole === "GUEST" && payment.booking.guestId === userId;
    const isRealtor =
      userRole === "REALTOR" &&
      payment.booking.property.realtor.userId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isGuest && !isRealtor && !isAdmin) {
      throw new AppError("Unauthorized", 403);
    }

    res.status(200).json({
      success: true,
      data: { payment },
    });
  }),
);

/**
 * @swagger
 * /api/payments/create:
 *   post:
 *     summary: Create payment record (internal use)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePaymentRequest'
 *     responses:
 *       201:
 *         description: Payment created successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Booking not found
 */
router.post(
  "/create",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { bookingId, amount, provider } = req.body;
    const userId = req.user!.id;

    if (!bookingId || !amount || !provider) {
      throw new AppError("Missing required fields", 400);
    }

    // Validate booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    // Verify user is the guest
    if (booking.guestId !== userId) {
      throw new AppError("Unauthorized", 403);
    }

    // Generate unique reference
    const reference = `${provider}-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}`;

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        userId,
        amount,
        currency: booking.currency,
        status: PaymentStatus.INITIATED,
        method: provider as PaymentMethod,
        reference,
      },
    });

    res.status(201).json({
      success: true,
      message: "Payment record created",
      data: { payment },
    });
  }),
);

/**
 * @swagger
 * /api/payments/{id}/refund:
 *   post:
 *     summary: Process refund (DEPRECATED - use new refund system)
 *     tags: [Payments]
 *     deprecated: true
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       410:
 *         description: Endpoint deprecated - use new refund system
 */
router.post(
  "/:id/refund",
  authenticate,
  authorize("ADMIN"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    res.status(410).json({
      success: false,
      message:
        "This endpoint is deprecated. Please use the new two-stage refund system.",
      newEndpoints: {
        requestRefund: "POST /api/refunds/request",
        realtorDecision: "POST /api/refunds/:id/realtor-decision",
        processRefund: "POST /api/refunds/:id/process",
      },
    });
  }),
);

export default router;
