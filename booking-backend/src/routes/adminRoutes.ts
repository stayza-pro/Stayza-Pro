import express from "express";
import {
  getAllRealtors,
  approveRealtor,
  rejectRealtor,
  suspendRealtor,
  batchSuspendRealtorBookings,
  getPlatformAnalytics,
  getPlatformCommissionReport,
  getRealtorCommissionReport,
  processRealtorPayout,
  getPendingPayouts,
} from "@/controllers/adminController";
import { getAuditLogs } from "@/controllers/auditController";
import { batchUpdateBookingStatuses } from "@/controllers/bookingStatusController";
import { authenticate, requireRole } from "@/middleware/auth";

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, requireRole("ADMIN"));

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminRealtorResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         businessName:
 *           type: string
 *         slug:
 *           type: string
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, SUSPENDED]
 *         logoUrl:
 *           type: string
 *         brandColorHex:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         user:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             phone:
 *               type: string
 *             country:
 *               type: string
 *             city:
 *               type: string
 *         _count:
 *           type: object
 *           properties:
 *             properties:
 *               type: number
 */

/**
 * @swagger
 * /api/admin/realtors:
 *   get:
 *     summary: Get all realtors (admin)
 *     description: Get paginated list of all realtors with filtering options
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, SUSPENDED]
 *         description: Filter by realtor status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by business name, email, or realtor name
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 20
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Realtors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         realtors:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/AdminRealtorResponse'
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             currentPage:
 *                               type: number
 *                             totalPages:
 *                               type: number
 *                             totalCount:
 *                               type: number
 *                             hasNextPage:
 *                               type: boolean
 *                             hasPrevPage:
 *                               type: boolean
 *       403:
 *         description: Admin access required
 */
router.get("/realtors", getAllRealtors);

/**
 * @swagger
 * /api/admin/realtors/{id}/approve:
 *   post:
 *     summary: Approve realtor account
 *     description: Approve a pending realtor account
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Realtor ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Optional approval notes
 *     responses:
 *       200:
 *         description: Realtor approved successfully
 *       400:
 *         description: Realtor already approved
 *       404:
 *         description: Realtor not found
 */
router.post("/realtors/:id/approve", approveRealtor);

/**
 * @swagger
 * /api/admin/realtors/{id}/reject:
 *   post:
 *     summary: Reject realtor account
 *     description: Reject a pending realtor account with reason
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Realtor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Rejection reason (required)
 *     responses:
 *       200:
 *         description: Realtor rejected successfully
 *       400:
 *         description: Missing rejection reason or already rejected
 *       404:
 *         description: Realtor not found
 */
router.post("/realtors/:id/reject", rejectRealtor);

/**
 * @swagger
 * /api/admin/realtors/{id}/suspend:
 *   post:
 *     summary: Suspend realtor account
 *     description: Suspend an approved realtor account and deactivate their properties
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Realtor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Suspension reason (required)
 *     responses:
 *       200:
 *         description: Realtor suspended successfully
 *       400:
 *         description: Missing suspension reason
 *       404:
 *         description: Realtor not found
 */
router.post("/realtors/:id/suspend", suspendRealtor);

// Property management removed - realtors manage their own properties

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get platform analytics
 *     description: Get comprehensive platform analytics and metrics
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         overview:
 *                           type: object
 *                           properties:
 *                             totalUsers:
 *                               type: number
 *                             totalRealtors:
 *                               type: number
 *                             approvedRealtors:
 *                               type: number
 *                             pendingRealtors:
 *                               type: number
 *                             totalProperties:
 *                               type: number
 *                             approvedProperties:
 *                               type: number
 *                             totalBookings:
 *                               type: number
 *                             completedBookings:
 *                               type: number
 *                             totalRevenue:
 *                               type: number
 *                         monthlyTrends:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               month:
 *                                 type: string
 *                               bookings:
 *                                 type: number
 *                         topRealtors:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               businessName:
 *                                 type: string
 *                               totalRevenue:
 *                                 type: number
 *       403:
 *         description: Admin access required
 */
router.get("/analytics", getPlatformAnalytics);

// Commission management routes
/**
 * @swagger
 * /admin/commission/platform-report:
 *   get:
 *     summary: Get platform commission report
 *     tags: [Admin Commission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report period
 *     responses:
 *       200:
 *         description: Platform commission report retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get("/commission/platform-report", getPlatformCommissionReport);

/**
 * @swagger
 * /admin/commission/realtor/{realtorId}:
 *   get:
 *     summary: Get realtor commission report
 *     tags: [Admin Commission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: realtorId
 *         required: true
 *         schema:
 *           type: string
 *         description: Realtor ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report period
 *     responses:
 *       200:
 *         description: Realtor commission report retrieved successfully
 *       404:
 *         description: Realtor not found
 *       403:
 *         description: Admin access required
 */
router.get("/commission/realtor/:realtorId", getRealtorCommissionReport);

/**
 * @swagger
 * /admin/commission/pending-payouts:
 *   get:
 *     summary: Get pending payouts
 *     tags: [Admin Commission]
 *     security:
 *       - bearerAuth: []
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
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: realtorId
 *         schema:
 *           type: string
 *         description: Filter by realtor ID
 *     responses:
 *       200:
 *         description: Pending payouts retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get("/commission/pending-payouts", getPendingPayouts);

/**
 * @swagger
 * /admin/commission/payout/{paymentId}:
 *   post:
 *     summary: Process payout to realtor
 *     tags: [Admin Commission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payoutReference:
 *                 type: string
 *                 description: Optional payout reference
 *     responses:
 *       200:
 *         description: Payout processed successfully
 *       404:
 *         description: Payment not found
 *       400:
 *         description: Invalid payout request
 *       403:
 *         description: Admin access required
 */
router.post("/commission/payout/:paymentId", processRealtorPayout);

/**
 * @swagger
 * /admin/audit-logs:
 *   get:
 *     summary: Get audit logs
 *     tags: [Admin Audit]
 *     security:
 *       - bearerAuth: []
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
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *         description: Filter by entity type
 *       - in: query
 *         name: adminId
 *         schema:
 *           type: string
 *         description: Filter by admin ID
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get("/audit-logs", getAuditLogs);

// Booking management - only batch operations for realtor suspension

/**
 * @swagger
 * /admin/bookings/batch-suspend:
 *   put:
 *     summary: Batch suspend bookings when realtor is suspended
 *     tags: [Admin Realtor Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - realtorId
 *               - reason
 *             properties:
 *               realtorId:
 *                 type: string
 *                 description: Realtor ID whose bookings to suspend
 *               reason:
 *                 type: string
 *                 description: Reason for suspension (suspicious activities)
 *     responses:
 *       200:
 *         description: Bookings suspended and guests notified
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Admin access required
 */
router.put("/bookings/batch-suspend", batchSuspendRealtorBookings);

export default router;
