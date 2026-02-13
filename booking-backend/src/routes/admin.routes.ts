import express from "express";
import { authenticate, requireRole } from "@/middleware/auth";
import realtorRoutes from "./admin.realtor.routes";
import bookingRoutes from "./admin.booking.routes";
import analyticsRoutes from "./admin.analytics.routes";
import systemRoutes from "./admin.system.routes";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Admin - Realtor Management
 *     description: Realtor account management endpoints
 *   - name: Admin - Booking Management
 *     description: Booking oversight and management endpoints
 *   - name: Admin - Analytics
 *     description: Platform analytics, commission reports, and payouts
 *   - name: Admin - System
 *     description: Notifications and audit logs
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           type: object
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *         errors:
 *           type: array
 *           items:
 *             type: object
 */

// Apply admin authentication to all routes
router.use(authenticate, requireRole("ADMIN"));

/**
 * Admin Routes Structure:
 *
 * Realtor Management:
 *   - GET    /api/admin/realtors                      - List all realtors
 *   - GET    /api/admin/realtors/all                  - List all realtors (legacy endpoint)
 *   - PATCH  /api/admin/realtors/:id/status           - Update realtor status (approve/reject/suspend/reinstate)
 *   - PATCH  /api/admin/realtors/:realtorId/cac       - Approve or reject CAC verification
 *   - PUT    /api/admin/realtors/batch-suspend-bookings - Batch suspend bookings
 *
 * Booking Management:
 *   - GET    /api/admin/bookings                      - List all bookings
 *   - GET    /api/admin/bookings/stats                - Booking statistics
 *   - GET    /api/admin/bookings/:id                  - Get booking details
 *   - PUT    /api/admin/bookings/:id/status           - Disabled (read-only policy)
 *   - POST   /api/admin/bookings/:id/cancel           - Disabled (read-only policy)
 *   - GET    /api/admin/bookings/disputes/all         - Get all open disputes
 *   - GET    /api/admin/bookings/refunds/pending      - Get pending refund requests
 *   - POST   /api/admin/bookings/refunds/:id/process  - Process refund request
 *
 * Analytics & Commission:
 *   - GET    /api/admin/analytics                     - Platform analytics
 *   - GET    /api/admin/analytics/commission/platform-report    - Platform commission report
 *   - GET    /api/admin/analytics/commission/realtor/:realtorId - Realtor commission report
 *   - GET    /api/admin/analytics/commission/pending-payouts    - Pending payouts
 *   - POST   /api/admin/analytics/commission/payout/:paymentId  - Process payout
 *   - POST   /api/admin/analytics/payouts/process               - Manual payout trigger
 *
 * System Management:
 *   - GET    /api/admin/system/notifications          - Admin notifications
 *   - PATCH  /api/admin/system/notifications/read     - Mark notification(s) as read
 *   - GET    /api/admin/system/audit-logs             - System audit logs
 */

// Mount sub-routers
router.use("/realtors", realtorRoutes);
router.use("/bookings", bookingRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/system", systemRoutes);

export default router;
