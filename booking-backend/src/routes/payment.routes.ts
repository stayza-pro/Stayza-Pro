import express from "express";
import { PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/config/database";
import { AuthenticatedRequest } from "@/types";
import { paystackService } from "@/services/paystack";
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
import { ReceiptGenerator } from "@/services/receiptGenerator";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { authenticate, authorize } from "@/middleware/auth";
import { config } from "@/config/index";
import { logger } from "@/utils/logger";

const router = express.Router();

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
    const getFirstParam = (param: any): string | undefined => {
      if (Array.isArray(param)) return param[0];
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

    // Redirect to verification endpoint or return success page
    // For now, return simple success page with instructions
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Processing</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              text-align: center;
              max-width: 500px;
            }
            h1 { color: #333; margin-bottom: 20px; }
            .reference {
              background: #f0f0f0;
              padding: 10px;
              border-radius: 5px;
              font-family: monospace;
              margin: 20px 0;
            }
            .btn {
              background: #667eea;
              color: white;
              border: none;
              padding: 15px 30px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
              margin-top: 20px;
            }
            .btn:hover { background: #5568d3; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Payment Initiated</h1>
            <p>Your payment has been received. Please verify to complete the process.</p>
            <div class="reference">Reference: ${payment.reference}</div>
            <button class="btn" onclick="verifyPayment()">Verify Payment Now</button>
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              Or verify manually using:<br>
              <code>POST /api/payments/verify-${payment.method.toLowerCase()}</code>
            </p>
          </div>
          <script>
            async function verifyPayment() {
              try {
                const response = await fetch('/api/payments/verify-${payment.method.toLowerCase()}', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                  },
                  body: JSON.stringify({
                    ${
                      payment.method === "PAYSTACK"
                        ? `reference: '${payment.reference}'`
                        : `transactionId: '${payment.reference}'`
                    }
                  })
                });
                const data = await response.json();
                if (data.success) {
                  alert('✅ Payment verified successfully!');
                  window.location.href = '/api/payments/${payment.id}';
                } else {
                  alert('❌ Verification failed: ' + data.message);
                }
              } catch (error) {
                alert('❌ Error: ' + error.message);
              }
            }
          </script>
        </body>
      </html>
    `);
  })
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

    // Check if booking already has a payment (any status due to unique constraint)
    const existingPayment = await prisma.payment.findUnique({
      where: { bookingId },
    });

    if (existingPayment) {
      // If payment exists but failed, return the existing record so user can retry
      if (existingPayment.status === PaymentStatus.FAILED) {
        return res.status(200).json({
          success: true,
          message: "Using existing payment record",
          data: {
            paymentId: existingPayment.id,
            reference: existingPayment.reference,
            status: existingPayment.status,
          },
        });
      }
      throw new AppError("Payment already exists for this booking", 400);
    }

    // Generate unique payment reference
    const reference = `PAY-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 11)
      .toUpperCase()}`;

    // Use booking's pre-calculated fee breakdown
    // No need to recalculate since booking already has these values
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
      },
    });

    // Initialize Paystack payment
    // NOTE: NO subaccount - all funds go to main Stayza account
    // Escrow system handles payouts after check-in

    // Build proper callback URL based on environment
    const isDev = config.NODE_ENV === "development";
    const callbackBaseUrl = isDev
      ? `http://localhost:${config.PORT}`
      : `https://api.${config.MAIN_DOMAIN}`;

    const paystackResponse =
      await paystackService.initializePaystackTransaction({
        email: booking.guest.email,
        amount: Math.round(Number(booking.totalPrice) * 100), // Convert to kobo
        reference: payment.reference!,
        callback_url: `${callbackBaseUrl}/api/payments/callback?reference=${reference}`,
        metadata: {
          bookingId: booking.id,
          paymentId: payment.id,
          guestId: booking.guestId,
          propertyId: booking.propertyId,
        },
      });

    return res.status(200).json({
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

    console.log(
      "Paystack verification result:",
      JSON.stringify(verificationResult, null, 2)
    );

    // Check Paystack API response structure
    // Paystack returns: { status: true/false, message: "...", data: { status: "success", amount: 123, ... } }
    const txData = verificationResult.data || {};
    const isApiSuccess = verificationResult.status === true;
    const isTransactionSuccess = txData.status === "success";

    // Validate amount matches (convert from kobo to naira)
    const expectedAmount = Math.round(Number(payment.amount) * 100);
    const actualAmount = txData.amount || 0;

    if (actualAmount !== expectedAmount) {
      console.error("Payment amount mismatch:", {
        expected: expectedAmount,
        actual: actualAmount,
        difference: actualAmount - expectedAmount,
      });

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

      throw new AppError(
        `Payment amount mismatch: expected ₦${Number(
          payment.amount
        ).toLocaleString()}, got ₦${(actualAmount / 100).toLocaleString()}`,
        400
      );
    }

    // Check if transaction is successful
    // Note: gateway_response can be "Successful", "test-3ds", etc. - we only check transaction status
    if (!isApiSuccess || !isTransactionSuccess) {
      // Log detailed failure info
      console.error("Payment verification failed:", {
        apiSuccess: isApiSuccess,
        transactionStatus: txData.status,
        gateway_response: txData.gateway_response,
        message: verificationResult.message,
      });

      // Update payment to FAILED
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

      // Send failure notification (non-blocking)
      sendEmail(payment.booking.guest.email, {
        subject: "Payment Failed",
        html: `<p>Your payment for ${payment.booking.property.title} has failed. Please try again.</p>`,
      }).catch((err) =>
        console.error("Failed to send payment failure email:", err.message)
      );

      throw new AppError(
        `Payment verification failed: ${
          verificationResult.message || txData.status || "Unknown error"
        }`,
        400
      );
    }

    // Use booking's pre-calculated fee breakdown
    const feeBreakdown = {
      roomFee: Number(payment.booking.roomFee),
      cleaningFee: Number(payment.booking.cleaningFee),
      securityDeposit: Number(payment.booking.securityDeposit),
      serviceFee: Number(payment.booking.serviceFee),
      platformFee: Number(payment.booking.platformFee),
      totalAmount: Number(payment.booking.totalPrice),
    };

    // Hold room fee and deposit in escrow (NEW FLOW)
    await escrowService.holdFundsInEscrow(
      payment.id,
      payment.booking.id,
      feeBreakdown
    );

    const now = new Date();

    // IMMEDIATE RELEASES (NEW COMMISSION FLOW)
    // 1. Cleaning fee → Realtor (immediate release)
    // 2. Service fee → Platform (already collected from customer)

    // TODO: Implement actual Paystack transfer to realtor subaccount for cleaning fee
    // For now, we'll mark it as released in database
    const cleaningFeeReleaseReference = `CLEANING_FEE_${
      payment.booking.id
    }_${Date.now()}`;

    // Log immediate releases in escrow events
    await escrowService.logEscrowEvent({
      bookingId: payment.booking.id,
      eventType: "RELEASE_CLEANING_FEE",
      amount: payment.booking.cleaningFee,
      description: `Cleaning fee of ₦${payment.booking.cleaningFee} released immediately to realtor`,
      metadata: {
        releaseReference: cleaningFeeReleaseReference,
      },
    });

    await escrowService.logEscrowEvent({
      bookingId: payment.booking.id,
      eventType: "COLLECT_SERVICE_FEE",
      amount: payment.booking.serviceFee,
      description: `Service fee of ₦${payment.booking.serviceFee} collected by platform`,
      metadata: {
        serviceFeeRate: "2%",
      },
    });

    // Update payment status with immediate releases
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PARTIAL_RELEASED, // NEW STATUS
        paidAt: new Date(),

        // Immediate release tracking
        cleaningFeeReleasedToRealtor: true,
        cleaningFeeReleaseReference,
        serviceFeeCollectedByPlatform: true,

        // Room fee split amounts (to be released after 1-hour window)
        roomFeeSplitRealtorAmount: new Decimal(payment.booking.roomFee).mul(
          0.9
        ),
        roomFeeSplitPlatformAmount: new Decimal(payment.booking.roomFee).mul(
          0.1
        ),

        metadata: {
          ...((payment.metadata as object) || {}),
          providerId: txData.id?.toString(),
          providerResponse: txData,
          gatewayResponse: txData.gateway_response,
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

    // Update booking status to CONFIRMED and track immediate releases
    await prisma.booking.update({
      where: { id: payment.booking.id },
      data: {
        status: "CONFIRMED",
        paymentStatus: PaymentStatus.PARTIAL_RELEASED,
        cleaningFeeReleasedAt: now,
        serviceFeeCollectedAt: now,
      },
    });

    // Update commission tracking
    await updatePaymentCommission(payment.id);

    // Send payment receipt to guest (non-blocking)
    sendPaymentReceipt(
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
    ).catch((err) =>
      console.error("Failed to send payment receipt:", err.message)
    );

    // Send booking confirmation to guest (non-blocking)
    sendBookingConfirmation(
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
    ).catch((err) =>
      console.error("Failed to send booking confirmation:", err.message)
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

      // Check Paystack response structure
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

        throw new AppError(
          `Payment verification failed: ${
            verificationResult.message || txData.status
          }`,
          400
        );
      }

      // Use booking's pre-calculated fee breakdown
      const feeBreakdown = {
        roomFee: Number(payment.booking.roomFee),
        cleaningFee: Number(payment.booking.cleaningFee),
        securityDeposit: Number(payment.booking.securityDeposit),
        serviceFee: Number(payment.booking.serviceFee),
        platformFee: Number(payment.booking.platformFee),
        totalAmount: Number(payment.booking.totalPrice),
      };

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
            gatewayResponse: txData.gateway_response,
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

      // Update booking to CONFIRMED (Paystack verification in verify-by-booking)
      await prisma.booking.update({
        where: { id: payment.booking.id },
        data: {
          status: "CONFIRMED", // BookingStatus.CONFIRMED
          paymentStatus: PaymentStatus.ESCROW_HELD,
        },
      });

      // Send receipts and notifications (non-blocking)
      sendPaymentReceipt(
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
      ).catch((err) =>
        console.error("Failed to send payment receipt:", err.message)
      );

      sendBookingConfirmation(
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
      ).catch((err) =>
        console.error("Failed to send booking confirmation:", err.message)
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
      throw new AppError("Unauthorized to download this receipt", 403);
    }

    // Only generate receipt for completed payments
    if (payment.status !== "COMPLETED") {
      throw new AppError("Receipt only available for completed payments", 400);
    }

    // Generate PDF
    const doc = ReceiptGenerator.generateReceipt(payment);

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="receipt-${payment.reference}.pdf"`
    );

    // Pipe PDF to response
    doc.pipe(res);
    doc.end();
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
