import express from "express";
import {
  getAllRealtors,
  approveRealtor,
  rejectRealtor,
  suspendRealtor,
  getAllProperties,
  approveProperty,
  rejectProperty,
  getPlatformAnalytics,
} from "@/controllers/adminController";
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

/**
 * @swagger
 * /api/admin/properties:
 *   get:
 *     summary: Get all properties (admin)
 *     description: Get paginated list of all properties with filtering options
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isApproved
 *         schema:
 *           type: boolean
 *         description: Filter by approval status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title, city, or realtor business name
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
 *         description: Properties retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get("/properties", getAllProperties);

/**
 * @swagger
 * /api/admin/properties/{id}/approve:
 *   post:
 *     summary: Approve property
 *     description: Approve a property listing
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
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
 *         description: Property approved successfully
 *       400:
 *         description: Property already approved
 *       404:
 *         description: Property not found
 */
router.post("/properties/:id/approve", approveProperty);

/**
 * @swagger
 * /api/admin/properties/{id}/reject:
 *   post:
 *     summary: Reject property
 *     description: Reject a property listing with reason
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
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
 *         description: Property rejected successfully
 *       400:
 *         description: Missing rejection reason
 *       404:
 *         description: Property not found
 */
router.post("/properties/:id/reject", rejectProperty);

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

export default router;
