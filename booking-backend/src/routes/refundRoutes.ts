import express from "express";
import { authenticate, authorize } from "@/middleware/auth";
import {
  requestRefund,
  getRealtorRefundRequests,
  realtorDecision,
  getAdminRefundRequests,
  processRefund,
  getRefundRequest,
} from "@/controllers/refundController";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RefundRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Refund request ID
 *         bookingId:
 *           type: string
 *           description: Associated booking ID
 *         paymentId:
 *           type: string
 *           description: Associated payment ID
 *         requestedBy:
 *           type: string
 *           description: User ID who requested the refund
 *         requestedAmount:
 *           type: number
 *           description: Requested refund amount
 *         currency:
 *           type: string
 *           description: Currency code
 *         reason:
 *           type: string
 *           description: Reason for refund request
 *         customerNotes:
 *           type: string
 *           description: Additional notes from customer
 *         status:
 *           type: string
 *           enum: [PENDING_REALTOR_APPROVAL, REALTOR_APPROVED, REALTOR_REJECTED, ADMIN_PROCESSING, COMPLETED, CANCELLED]
 *           description: Current status of refund request
 *         realtorReason:
 *           type: string
 *           description: Realtor's reason for approval/rejection
 *         realtorNotes:
 *           type: string
 *           description: Additional realtor notes
 *         adminNotes:
 *           type: string
 *           description: Admin processing notes
 *         actualRefundAmount:
 *           type: number
 *           description: Final refunded amount
 *         createdAt:
 *           type: string
 *           format: date-time
 *         realtorApprovedAt:
 *           type: string
 *           format: date-time
 *         adminProcessedAt:
 *           type: string
 *           format: date-time
 *         completedAt:
 *           type: string
 *           format: date-time
 *     RefundRequestInput:
 *       type: object
 *       required:
 *         - bookingId
 *         - paymentId
 *         - requestedAmount
 *         - reason
 *       properties:
 *         bookingId:
 *           type: string
 *           description: Booking ID to refund
 *         paymentId:
 *           type: string
 *           description: Payment ID to refund
 *         requestedAmount:
 *           type: number
 *           minimum: 0.01
 *           description: Amount to refund
 *         reason:
 *           type: string
 *           enum: [BOOKING_CANCELLED, SERVICE_ISSUE, PROPERTY_UNAVAILABLE, OVERCHARGE, OTHER]
 *           description: Reason for refund
 *         customerNotes:
 *           type: string
 *           maxLength: 500
 *           description: Additional customer notes
 *     RealtorDecisionInput:
 *       type: object
 *       required:
 *         - approved
 *         - realtorReason
 *       properties:
 *         approved:
 *           type: boolean
 *           description: Whether to approve or reject the refund
 *         realtorReason:
 *           type: string
 *           maxLength: 500
 *           description: Reason for the decision
 *         realtorNotes:
 *           type: string
 *           maxLength: 1000
 *           description: Additional notes from realtor
 *     AdminProcessInput:
 *       type: object
 *       properties:
 *         actualRefundAmount:
 *           type: number
 *           minimum: 0.01
 *           description: Final refund amount (defaults to requested amount)
 *         adminNotes:
 *           type: string
 *           maxLength: 1000
 *           description: Admin processing notes
 */

/**
 * @swagger
 * /api/refunds/request:
 *   post:
 *     summary: Request a refund (Guest only)
 *     tags: [Refunds]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefundRequestInput'
 *     responses:
 *       201:
 *         description: Refund request created successfully
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
 *                   example: Refund request submitted successfully
 *                 data:
 *                   $ref: '#/components/schemas/RefundRequest'
 *       400:
 *         description: Bad request - Invalid refund amount or existing request
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
 *         description: Forbidden - Guest access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Booking or payment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post("/request", authenticate, authorize("GUEST"), requestRefund);

/**
 * @swagger
 * /api/refunds/realtor/pending:
 *   get:
 *     summary: Get refund requests for realtor review (Realtor only)
 *     tags: [Refunds]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING_REALTOR_APPROVAL, REALTOR_APPROVED, REALTOR_REJECTED]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Refund requests retrieved successfully
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
 *                   example: Refund requests retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RefundRequest'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - Realtor access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get(
  "/realtor/pending",
  authenticate,
  authorize("REALTOR"),
  getRealtorRefundRequests
);

/**
 * @swagger
 * /api/refunds/{id}/realtor-decision:
 *   patch:
 *     summary: Approve or reject refund request (Realtor only)
 *     tags: [Refunds]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Refund request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RealtorDecisionInput'
 *     responses:
 *       200:
 *         description: Refund request decision recorded successfully
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
 *                   example: Refund request approved successfully
 *                 data:
 *                   $ref: '#/components/schemas/RefundRequest'
 *       400:
 *         description: Bad request
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
 *         description: Forbidden - Realtor access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Refund request not found or not pending approval
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.patch(
  "/:id/realtor-decision",
  authenticate,
  authorize("REALTOR"),
  realtorDecision
);

/**
 * @swagger
 * /api/refunds/admin/pending:
 *   get:
 *     summary: Get refund requests for admin processing (Admin only)
 *     tags: [Refunds]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [REALTOR_APPROVED, ADMIN_PROCESSING, COMPLETED]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Admin refund requests retrieved successfully
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
 *                   example: Admin refund requests retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RefundRequest'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get(
  "/admin/pending",
  authenticate,
  authorize("ADMIN"),
  getAdminRefundRequests
);

/**
 * @swagger
 * /api/refunds/{id}/process:
 *   post:
 *     summary: Process refund - Admin final step (Admin only)
 *     tags: [Refunds]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Refund request ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminProcessInput'
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
 *                   type: object
 *                   properties:
 *                     refundRequestId:
 *                       type: string
 *                     actualRefundAmount:
 *                       type: number
 *                     currency:
 *                       type: string
 *                     processedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Invalid refund amount
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
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Refund request not found or not ready for processing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       500:
 *         description: Failed to process refund
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post("/:id/process", authenticate, authorize("ADMIN"), processRefund);

/**
 * @swagger
 * /api/refunds/{id}:
 *   get:
 *     summary: Get refund request details
 *     tags: [Refunds]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Refund request ID
 *     responses:
 *       200:
 *         description: Refund request details retrieved successfully
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
 *                   example: Refund request details retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/RefundRequest'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - Cannot view this refund request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Refund request not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get("/:id", authenticate, getRefundRequest);

export default router;
