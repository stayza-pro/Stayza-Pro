import express from "express";
import { PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/config/database";
import { AuthenticatedRequest } from "@/types";
import { paystackService } from "@/services/paystack";
import { flutterwaveService } from "@/services/flutterwave";
import escrowService from "@/services/escrowService";
import {
  sendPaymentReceipt,
  sendBookingConfirmation,
  sendEmail,
} from "@/services/email";
import {
  NotificationService,
  notificationHelpers,
} from "@/services/notificationService";
import { updatePaymentCommission } from "@/services/commission";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { authenticate, authorize } from "@/middleware/auth";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Payments
 *     description: Payment processing with Paystack (primary) and Flutterwave (secondary)
 */

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
 *           enum: [PAYSTACK, FLUTTERWAVE]
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
 *     InitializeFlutterwaveRequest:
 *       type: object
 *       required:
 *         - bookingId
 *       properties:
 *         bookingId:
 *           type: string
 *           description: ID of the booking to pay for
 *
 *     VerifyFlutterwaveRequest:
 *       type: object
 *       required:
 *         - transactionId
 *       properties:
 *         transactionId:
 *           type: string
 *           description: Transaction ID from Flutterwave
 *
 *     VerifyByBookingRequest:
 *       type: object
 *       required:
 *         - bookingId
 *       properties:
 *         bookingId:
 *           type: string
 *           description: Booking ID to verify payment for
 *         transactionId:
 *           type: string
 *           description: Required for Flutterwave payments
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
 *           enum: [PAYSTACK, FLUTTERWAVE]
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
    const { bookingId } = req.body;
    const userId = req.user!.id;

    if (!bookingId) {
      throw new AppError("Booking ID is required", 400);
    }

    // Fetch booking with all required relations
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
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
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    // Verify user is the guest
    if (booking.guestId !== userId) {
      throw new AppError("Unauthorized: Not your booking", 403);
    }

    // Check if booking already has a payment
    const existingPayment = await prisma.payment.findFirst({
      where: {
        bookingId,
        status: {
          in: [PaymentStatus.PENDING, PaymentStatus.COMPLETED],
        },
      },
    });

    if (existingPayment) {
      throw new AppError("Payment already exists for this booking", 400);
    }

    // Calculate fee breakdown
    const feeBreakdown = escrowService.calculateFeeBreakdown(
      Number(booking.roomFee),
      Number(booking.cleaningFee || 0),
      Number(booking.securityDeposit || 0)
    );

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId,
        userId,
        amount: booking.totalPrice,
        currency: booking.currency,
        status: PaymentStatus.INITIATED,
        method: PaymentMethod.PAYSTACK,
        roomFeeAmount: feeBreakdown.roomFee,
        cleaningFeeAmount: feeBreakdown.cleaningFee,
        securityDepositAmount: feeBreakdown.securityDeposit,
        serviceFeeAmount: feeBreakdown.serviceFee,
        platformFeeAmount: feeBreakdown.platformFee,
      },
    });

    // Initialize Paystack payment
    // NOTE: NO subaccount - all funds go to main Stayza account
    // Escrow system handles payouts after check-in
    const paystackResponse =
      await paystackService.initializePaystackTransaction({
        email: booking.guest.email,
        amount: Number(booking.totalPrice),
        reference: payment.reference!,
        metadata: {
          bookingId: booking.id,
          paymentId: payment.id,
          guestId: booking.guestId,
          propertyId: booking.propertyId,
        },
      });

    res.status(200).json({
      success: true,
      message: "Payment initialized successfully",
      data: {
        authorizationUrl: paystackResponse.data.authorization_url,
        accessCode: paystackResponse.data.access_code,
        reference: payment.reference,
        paymentId: payment.id,
      },
    });
  })
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VerifyPaymentResponse'
 *       400:
 *         description: Payment verification failed
 *       404:
 *         description: Payment not found
 */
router.post(
  "/verify-paystack",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { reference } = req.body;

    if (!reference) {
      throw new AppError("Payment reference is required", 400);
    }

    // Find payment with booking and related data
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

    // Check if already verified
    if (
      payment.status === PaymentStatus.COMPLETED ||
      payment.status === PaymentStatus.ESCROW_HELD
    ) {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        data: { payment, booking: payment.booking },
      });
    }

    // Verify with Paystack
    const verificationResult = await paystackService.verifyPaystackTransaction(
      reference
    );

    if (
      !verificationResult.success ||
      verificationResult.data.status !== "success"
    ) {
      // Update payment to FAILED
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          metadata: {
            ...((payment.metadata as object) || {}),
            failureReason:
              verificationResult.data.gateway_response ||
              "Payment verification failed",
          },
        },
      });

      // Send failure notification
      await sendEmail(payment.booking.guest.email, {
        subject: "Payment Failed",
        html: `<p>Your payment for ${payment.booking.property.title} has failed. Please try again.</p>`,
      });

      throw new AppError("Payment verification failed", 400);
    }

    // Calculate fee breakdown
    const feeBreakdown = escrowService.calculateFeeBreakdown(
      Number(payment.booking.roomFee),
      Number(payment.booking.cleaningFee || 0),
      Number(payment.booking.securityDeposit || 0)
    );

    // Hold funds in escrow
    await escrowService.holdFundsInEscrow(
      payment.id,
      payment.booking.id,
      feeBreakdown
    );

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.ESCROW_HELD,
        paidAt: new Date(),
        metadata: {
          ...((payment.metadata as object) || {}),
          providerId: verificationResult.data.id?.toString(),
          providerResponse: verificationResult.data,
        },
      },
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

    // Update booking status to PAID
    await prisma.booking.update({
      where: { id: payment.booking.id },
      data: {
        status: "PAID",
        paymentStatus: PaymentStatus.ESCROW_HELD,
      },
    });

    // Update commission tracking
    await updatePaymentCommission(payment.id);

    // Send payment receipt to guest
    await sendPaymentReceipt(
      payment.booking.guest.email,
      payment.booking.guest.firstName,
      {
        reference: payment.reference!,
        amount: Number(payment.amount),
        propertyName: payment.booking.property.title,
        checkInDate: payment.booking.checkInDate,
        checkOutDate: payment.booking.checkOutDate,
      },
      payment.booking.property
    );

    // Send booking confirmation to guest
    await sendBookingConfirmation(
      payment.booking.guest.email,
      payment.booking.guest.firstName,
      {
        bookingId: payment.booking.id,
        propertyName: payment.booking.property.title,
        checkInDate: payment.booking.checkInDate,
        checkOutDate: payment.booking.checkOutDate,
        totalPrice: Number(payment.booking.totalPrice),
        realtorName:
          payment.booking.property.realtor.businessName ||
          `${payment.booking.property.realtor.user.firstName} ${payment.booking.property.realtor.user.lastName}`,
        realtorEmail: payment.booking.property.realtor.user.email,
      },
      payment.booking.property.realtor
    );

    // Send real-time notifications
    await prisma.notification.create({
      data: {
        userId: payment.booking.guestId,
        type: "PAYMENT_COMPLETED",
        title: "Payment Confirmed",
        message: `Your payment of ₦${Number(
          payment.amount
        ).toLocaleString()} for ${
          payment.booking.property.title
        } has been confirmed`,
      },
    });

    await prisma.notification.create({
      data: {
        userId: payment.booking.property.realtorId,
        type: "BOOKING_CONFIRMED",
        title: "New Booking",
        message: `New booking confirmed for ${payment.booking.property.title}. Payment held in escrow.`,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully and held in escrow",
      data: {
        payment: updatedPayment,
        booking: updatedPayment.booking,
      },
    });
  })
);

/**
 * @swagger
 * /api/payments/initialize-flutterwave:
 *   post:
 *     summary: Initialize Flutterwave payment (SECONDARY GATEWAY)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InitializeFlutterwaveRequest'
 *     responses:
 *       200:
 *         description: Payment initialized successfully
 *       400:
 *         description: Invalid request or booking already paid
 *       404:
 *         description: Booking not found
 */
router.post(
  "/initialize-flutterwave",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { bookingId } = req.body;
    const userId = req.user!.id;

    if (!bookingId) {
      throw new AppError("Booking ID is required", 400);
    }

    // Fetch booking with all required relations
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
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
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    // Verify user is the guest
    if (booking.guestId !== userId) {
      throw new AppError("Unauthorized: Not your booking", 403);
    }

    // Check if booking already has a payment
    const existingPayment = await prisma.payment.findFirst({
      where: {
        bookingId,
        status: {
          in: [PaymentStatus.PENDING, PaymentStatus.COMPLETED],
        },
      },
    });

    if (existingPayment) {
      throw new AppError("Payment already exists for this booking", 400);
    }

    // Calculate fee breakdown
    const feeBreakdown = escrowService.calculateFeeBreakdown(
      Number(booking.roomFee),
      Number(booking.cleaningFee || 0),
      Number(booking.securityDeposit || 0)
    );

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId,
        userId,
        amount: booking.totalPrice,
        currency: booking.currency,
        status: PaymentStatus.INITIATED,
        method: PaymentMethod.FLUTTERWAVE,
        roomFeeAmount: feeBreakdown.roomFee,
        cleaningFeeAmount: feeBreakdown.cleaningFee,
        securityDepositAmount: feeBreakdown.securityDeposit,
        serviceFeeAmount: feeBreakdown.serviceFee,
        platformFeeAmount: feeBreakdown.platformFee,
      },
    });

    // Initialize Flutterwave payment
    const flutterwaveResponse =
      await flutterwaveService.initializeFlutterwavePayment({
        reference: payment.reference!,
        email: booking.guest.email,
        amount: Number(booking.totalPrice),
        currency: booking.currency,
        metadata: {
          bookingId: booking.id,
          paymentId: payment.id,
          customerName: `${booking.guest.firstName} ${booking.guest.lastName}`,
          customerPhone: booking.guest.phone || "",
        },
      });

    res.status(200).json({
      success: true,
      message: "Payment initialized successfully",
      data: {
        link: flutterwaveResponse.data.link,
        reference: payment.reference,
        paymentId: payment.id,
      },
    });
  })
);

/**
 * @swagger
 * /api/payments/verify-flutterwave:
 *   post:
 *     summary: Verify Flutterwave payment and hold in escrow
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyFlutterwaveRequest'
 *     responses:
 *       200:
 *         description: Payment verified and held in escrow
 *       400:
 *         description: Payment verification failed
 *       404:
 *         description: Payment not found
 */
router.post(
  "/verify-flutterwave",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { transactionId } = req.body;

    if (!transactionId) {
      throw new AppError("Transaction ID is required", 400);
    }

    // Verify transaction with Flutterwave
    const verificationResult =
      await flutterwaveService.verifyFlutterwaveTransaction(transactionId);

    if (!verificationResult.success) {
      throw new AppError("Transaction verification failed", 400);
    }

    const txData = verificationResult.data;

    // Find payment by reference
    const payment = await prisma.payment.findUnique({
      where: { reference: txData.tx_ref },
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

    // Verify user authorization
    if (payment.booking.guestId !== req.user!.id) {
      throw new AppError("Unauthorized", 403);
    }

    // Check transaction status
    if (txData.status !== "successful") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          metadata: {
            ...((payment.metadata as object) || {}),
            failureReason: `Transaction status: ${txData.status}`,
          },
        },
      });

      await sendEmail(payment.booking.guest.email, {
        subject: "Payment Failed",
        html: `<p>Your payment verification failed. Status: ${txData.status}</p>`,
      });

      throw new AppError(`Payment failed with status: ${txData.status}`, 400);
    }

    // Validate amount
    if (parseFloat(txData.amount) !== Number(payment.amount)) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          metadata: {
            ...((payment.metadata as object) || {}),
            failureReason: "Amount mismatch",
          },
        },
      });

      throw new AppError("Payment amount mismatch", 400);
    }

    // Calculate fee breakdown
    const feeBreakdown = escrowService.calculateFeeBreakdown(
      Number(payment.booking.roomFee),
      Number(payment.booking.cleaningFee || 0),
      Number(payment.booking.securityDeposit || 0)
    );

    // Hold funds in escrow
    await escrowService.holdFundsInEscrow(
      payment.id,
      payment.booking.id,
      feeBreakdown
    );

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.ESCROW_HELD,
        paidAt: new Date(),
        metadata: {
          ...((payment.metadata as object) || {}),
          providerId: txData.id?.toString(),
          providerResponse: txData,
        },
      },
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

    // Update booking status to PAID
    await prisma.booking.update({
      where: { id: payment.booking.id },
      data: {
        status: "PAID",
        paymentStatus: PaymentStatus.ESCROW_HELD,
      },
    });

    // Update commission tracking
    await updatePaymentCommission(payment.id);

    // Send payment receipt
    await sendPaymentReceipt(
      payment.booking.guest.email,
      payment.booking.guest.firstName,
      {
        reference: payment.reference!,
        amount: Number(payment.amount),
        propertyName: payment.booking.property.title,
        checkInDate: payment.booking.checkInDate,
        checkOutDate: payment.booking.checkOutDate,
      },
      payment.booking.property
    );

    // Send booking confirmation
    await sendBookingConfirmation(
      payment.booking.guest.email,
      payment.booking.guest.firstName,
      {
        bookingId: payment.booking.id,
        propertyName: payment.booking.property.title,
        checkInDate: payment.booking.checkInDate,
        checkOutDate: payment.booking.checkOutDate,
        totalPrice: Number(payment.booking.totalPrice),
        realtorName:
          payment.booking.property.realtor.businessName ||
          `${payment.booking.property.realtor.user.firstName} ${payment.booking.property.realtor.user.lastName}`,
        realtorEmail: payment.booking.property.realtor.user.email,
      },
      payment.booking.property.realtor
    );

    // Send notifications
    await prisma.notification.create({
      data: {
        userId: payment.booking.guestId,
        type: "PAYMENT_COMPLETED",
        title: "Payment Confirmed",
        message: `Your payment of ₦${Number(
          payment.amount
        ).toLocaleString()} for ${
          payment.booking.property.title
        } has been confirmed`,
      },
    });

    await prisma.notification.create({
      data: {
        userId: payment.booking.property.realtorId,
        type: "BOOKING_CONFIRMED",
        title: "New Booking",
        message: `New booking confirmed for ${payment.booking.property.title}. Payment held in escrow.`,
      },
    });

    res.status(200).json({
      success: true,
      message: "Payment verified and held in escrow",
      data: {
        payment: updatedPayment,
        booking: updatedPayment.booking,
      },
    });
  })
);

/**
 * @swagger
 * /api/payments/verify-by-booking:
 *   post:
 *     summary: Auto-detect payment method and verify (supports both gateways)
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
    const { bookingId, transactionId } = req.body;
    const userId = req.user!.id;

    if (!bookingId) {
      throw new AppError("Booking ID is required", 400);
    }

    // Find payment with full relations
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

    // Verify authorization
    if (payment.booking.guestId !== userId) {
      throw new AppError("Unauthorized", 403);
    }

    // Check if already paid
    if (
      payment.status === PaymentStatus.COMPLETED ||
      payment.status === PaymentStatus.ESCROW_HELD
    ) {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        data: { payment, booking: payment.booking },
      });
    }

    // Auto-detect provider and verify
    if (payment.method === PaymentMethod.PAYSTACK) {
      // Verify with Paystack
      const verificationResult =
        await paystackService.verifyPaystackTransaction(payment.reference!);

      if (
        !verificationResult.success ||
        verificationResult.data.status !== "success"
      ) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            metadata: {
              ...((payment.metadata as object) || {}),
              failureReason:
                verificationResult.data.gateway_response ||
                "Payment verification failed",
            },
          },
        });

        throw new AppError("Payment verification failed", 400);
      }

      // Calculate fee breakdown
      const feeBreakdown = escrowService.calculateFeeBreakdown(
        Number(payment.booking.roomFee),
        Number(payment.booking.cleaningFee || 0),
        Number(payment.booking.securityDeposit || 0)
      );

      // Hold funds in escrow
      await escrowService.holdFundsInEscrow(
        payment.id,
        payment.booking.id,
        feeBreakdown
      );

      // Update payment
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.ESCROW_HELD,
          paidAt: new Date(),
          metadata: {
            ...((payment.metadata as object) || {}),
            providerId: verificationResult.data.id?.toString(),
            providerResponse: verificationResult.data,
          },
        },
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

      // Update booking
      await prisma.booking.update({
        where: { id: payment.booking.id },
        data: {
          status: "PAID",
          paymentStatus: PaymentStatus.ESCROW_HELD,
        },
      });

      // Send receipts and notifications
      await sendPaymentReceipt(
        payment.booking.guest.email,
        payment.booking.guest.firstName,
        {
          reference: payment.reference!,
          amount: Number(payment.amount),
          propertyName: payment.booking.property.title,
          checkInDate: payment.booking.checkInDate,
          checkOutDate: payment.booking.checkOutDate,
        },
        payment.booking.property
      );

      await sendBookingConfirmation(
        payment.booking.guest.email,
        payment.booking.guest.firstName,
        {
          bookingId: payment.booking.id,
          propertyName: payment.booking.property.title,
          checkInDate: payment.booking.checkInDate,
          checkOutDate: payment.booking.checkOutDate,
          totalPrice: Number(payment.booking.totalPrice),
          realtorName:
            payment.booking.property.realtor.businessName ||
            `${payment.booking.property.realtor.user.firstName} ${payment.booking.property.realtor.user.lastName}`,
          realtorEmail: payment.booking.property.realtor.user.email,
        },
        payment.booking.property.realtor
      );

      await prisma.notification.create({
        data: {
          userId: payment.booking.guestId,
          type: "PAYMENT_COMPLETED",
          title: "Payment Confirmed",
          message: `Your payment of ₦${Number(
            payment.amount
          ).toLocaleString()} for ${
            payment.booking.property.title
          } has been confirmed`,
        },
      });

      await prisma.notification.create({
        data: {
          userId: payment.booking.property.realtorId,
          type: "BOOKING_CONFIRMED",
          title: "New Booking",
          message: `New booking confirmed for ${payment.booking.property.title}. Payment held in escrow.`,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        data: { payment: updatedPayment, booking: updatedPayment.booking },
      });
    } else if (payment.method === PaymentMethod.FLUTTERWAVE) {
      // Flutterwave requires transactionId
      if (!transactionId) {
        throw new AppError(
          "Transaction ID is required for Flutterwave payments",
          400
        );
      }

      // Verify with Flutterwave
      const verificationResult =
        await flutterwaveService.verifyFlutterwaveTransaction(transactionId);

      if (
        !verificationResult.success ||
        verificationResult.data.status !== "successful"
      ) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            metadata: {
              ...((payment.metadata as object) || {}),
              failureReason: `Transaction status: ${verificationResult.data.status}`,
            },
          },
        });

        throw new AppError("Payment verification failed", 400);
      }

      const txData = verificationResult.data;

      // Calculate fee breakdown
      const feeBreakdown = escrowService.calculateFeeBreakdown(
        Number(payment.booking.roomFee),
        Number(payment.booking.cleaningFee || 0),
        Number(payment.booking.securityDeposit || 0)
      );

      // Hold funds in escrow
      await escrowService.holdFundsInEscrow(
        payment.id,
        payment.booking.id,
        feeBreakdown
      );

      // Update payment
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.ESCROW_HELD,
          paidAt: new Date(),
          metadata: {
            ...((payment.metadata as object) || {}),
            providerId: txData.id?.toString(),
            providerResponse: txData,
          },
        },
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

      // Update booking
      await prisma.booking.update({
        where: { id: payment.booking.id },
        data: {
          status: "PAID",
          paymentStatus: PaymentStatus.ESCROW_HELD,
        },
      });

      // Send receipts and notifications
      await sendPaymentReceipt(
        payment.booking.guest.email,
        payment.booking.guest.firstName,
        {
          reference: payment.reference!,
          amount: Number(payment.amount),
          propertyName: payment.booking.property.title,
          checkInDate: payment.booking.checkInDate,
          checkOutDate: payment.booking.checkOutDate,
        },
        payment.booking.property
      );

      await sendBookingConfirmation(
        payment.booking.guest.email,
        payment.booking.guest.firstName,
        {
          bookingId: payment.booking.id,
          propertyName: payment.booking.property.title,
          checkInDate: payment.booking.checkInDate,
          checkOutDate: payment.booking.checkOutDate,
          totalPrice: Number(payment.booking.totalPrice),
          realtorName:
            payment.booking.property.realtor.businessName ||
            `${payment.booking.property.realtor.user.firstName} ${payment.booking.property.realtor.user.lastName}`,
          realtorEmail: payment.booking.property.realtor.user.email,
        },
        payment.booking.property.realtor
      );

      await prisma.notification.create({
        data: {
          userId: payment.booking.guestId,
          type: "PAYMENT_COMPLETED",
          title: "Payment Confirmed",
          message: `Your payment of ₦${Number(
            payment.amount
          ).toLocaleString()} for ${
            payment.booking.property.title
          } has been confirmed`,
        },
      });

      await prisma.notification.create({
        data: {
          userId: payment.booking.property.realtorId,
          type: "BOOKING_CONFIRMED",
          title: "New Booking",
          message: `New booking confirmed for ${payment.booking.property.title}. Payment held in escrow.`,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        data: { payment: updatedPayment, booking: updatedPayment.booking },
      });
    } else {
      throw new AppError(
        `Unsupported payment provider: ${payment.method}`,
        400
      );
    }
  })
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
      where.booking = { property: { realtorId: userId } };
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
  })
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
      userRole === "REALTOR" && payment.booking.property.realtorId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isGuest && !isRealtor && !isAdmin) {
      throw new AppError("Unauthorized", 403);
    }

    res.status(200).json({
      success: true,
      data: { payment },
    });
  })
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
  })
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
  })
);

export default router;
