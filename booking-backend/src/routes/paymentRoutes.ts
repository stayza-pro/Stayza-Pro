import express from "express";
import {
  createPayment,
  getPayment,
  getUserPayments,
  initializeFlutterwavePayment,
  verifyFlutterwavePayment,
  initializePaystackPayment,
  verifyPaystackPayment,
  processRefund,
} from "@/controllers/paymentController";
// MVP: Webhooks handled in separate routes
import { authenticate } from "@/middleware/auth";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Payment ID
 *         bookingId:
 *           type: string
 *           description: Associated booking ID
 *         amount:
 *           type: number
 *           description: Payment amount
 *         currency:
 *           type: string
 *           description: Payment currency (e.g., USD, NGN)
 *         provider:
 *           type: string
 *           enum: [FLUTTERWAVE, PAYSTACK]
 *           description: Payment provider
 *         providerPaymentId:
 *           type: string
 *           description: Payment ID from provider
 *         status:
 *           type: string
 *           enum: [PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED, CANCELLED]
 *           description: Payment status
 *         paymentMethod:
 *           type: string
 *           description: Payment method used
 *         failureReason:
 *           type: string
 *           description: Reason for failure (if applicable)
 *         processedAt:
 *           type: string
 *           format: date-time
 *           description: When payment was processed
 *         refundedAt:
 *           type: string
 *           format: date-time
 *           description: When payment was refunded
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         booking:
 *           $ref: '#/components/schemas/Booking'
 *     InitializePaystackRequest:
 *       type: object
 *       required:
 *         - bookingId
 *         - email
 *       properties:
 *         bookingId:
 *           type: string
 *           description: Booking ID to create payment for
 *         email:
 *           type: string
 *           format: email
 *           description: Customer email address
 *         callbackUrl:
 *           type: string
 *           format: uri
 *           description: Callback URL after payment
 *     PaystackInitializeResponse:
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
 *               format: uri
 *               description: Paystack payment URL
 *             accessCode:
 *               type: string
 *               description: Paystack access code
 *             reference:
 *               type: string
 *               description: Payment reference
 *     VerifyPaystackRequest:
 *       type: object
 *       required:
 *         - reference
 *       properties:
 *         reference:
 *           type: string
 *           description: Paystack payment reference
 *     RefundRequest:
 *       type: object
 *       properties:
 *         reason:
 *           type: string
 *           description: Reason for refund
 *         amount:
 *           type: number
 *           description: Refund amount (optional, defaults to full amount)
 */

/**
 * @swagger
 * /api/payments/stripe-webhook:
 *   post:
 *     summary: Handle Stripe webhook events
 *     tags: [Payments]
 *     description: Webhook endpoint for Stripe payment events (requires raw body)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Stripe webhook event payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook signature or payload
 */
// MVP: Webhook routes moved to separate webhookRoutes.ts

/**
 * @swagger
 * /api/payments/paystack-webhook:
 *   post:
 *     summary: Handle Paystack webhook events
 *     tags: [Payments]
 *     description: Webhook endpoint for Paystack payment events
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Paystack webhook event payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook signature or payload
 */
// MVP: Paystack webhook route moved to separate webhookRoutes.ts

router.post("/create-payment", authenticate, createPayment);

/**
 * @swagger
 * /api/payments/initialize-paystack:
 *   post:
 *     summary: Initialize Paystack payment
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
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
 *               $ref: '#/components/schemas/PaystackInitializeResponse'
 *       400:
 *         description: Bad request - Invalid booking or payment data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// Flutterwave payment endpoints
router.post(
  "/initialize-flutterwave",
  authenticate,
  initializeFlutterwavePayment
);
router.post("/verify-flutterwave", authenticate, verifyFlutterwavePayment);

// Paystack payment endpoints
router.post("/initialize-paystack", authenticate, initializePaystackPayment);
router.post("/verify-paystack", authenticate, verifyPaystackPayment);

/**
 * @swagger
 * /api/payments/verify-paystack:
 *   post:
 *     summary: Verify Paystack payment
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyPaystackRequest'
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Payment verified successfully
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Bad request - Payment verification failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Payment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get("/:id", authenticate, getPayment);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Payment retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - Cannot access this payment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Payment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get("/:id", authenticate, getUserPayments);

/**
 * @swagger
 * /api/payments/{id}/refund:
 *   post:
 *     summary: Process payment refund
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefundRequest'
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Refund processed successfully
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Bad request - Cannot refund this payment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - Cannot refund this payment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Payment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
/**
 * @swagger
 * /api/payments/{id}/refund:
 *   post:
 *     deprecated: true
 *     summary: "[DEPRECATED] Direct refund - Use new two-stage refund system"
 *     description: "This endpoint is deprecated. Use the new two-stage refund system: POST /api/refunds/request (Guest) → PATCH /api/refunds/{id}/realtor-decision (Realtor) → POST /api/refunds/{id}/process (Admin)"
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       410:
 *         description: Endpoint deprecated - Use new two-stage refund system
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "This refund endpoint is deprecated. Please use the new two-stage refund system starting with POST /api/refunds/request"
 */
router.post("/:id/refund", authenticate, (req, res) => {
  res.status(410).json({
    success: false,
    message:
      "This refund endpoint is deprecated. Please use the new two-stage refund system starting with POST /api/refunds/request",
    newEndpoints: {
      requestRefund: "POST /api/refunds/request",
      realtorDecision: "PATCH /api/refunds/{id}/realtor-decision",
      adminProcess: "POST /api/refunds/{id}/process",
      viewDetails: "GET /api/refunds/{id}",
    },
  });
});

// Additional payment endpoints
/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get payments for current user
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get("/", authenticate, getUserPayments);

/**
 * @swagger
 * /api/payments/{id}/receipt:
 *   get:
 *     summary: Download payment receipt PDF
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: PDF receipt generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Payment not found or receipt unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
// Flutterwave payment endpoints
router.post(
  "/initialize-flutterwave",
  authenticate,
  initializeFlutterwavePayment
);
router.post("/verify-flutterwave", authenticate, verifyFlutterwavePayment);

// Payment management
router.post("/create-payment", authenticate, createPayment);
router.get("/", authenticate, getUserPayments);
router.get("/:id", authenticate, getPayment);
router.post("/:id/refund", authenticate, processRefund);

// MVP: Receipt generation coming soon
// router.get("/:id/receipt", authenticate, generatePaymentReceipt);

export default router;
