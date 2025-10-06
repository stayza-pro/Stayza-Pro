import express from "express";
import { authenticate } from "@/middleware/auth";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
  getNotificationPreferences,
  updateNotificationPreferences,
  getNotificationStats,
} from "@/controllers/notificationController";

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get paginated notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *         description: Number of notifications per page
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Filter to show only unread notifications
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [BOOKING_CONFIRMED, BOOKING_CANCELLED, BOOKING_COMPLETED, PAYMENT_SUCCESSFUL, PAYMENT_FAILED, PAYMENT_REFUNDED, REVIEW_RECEIVED, REVIEW_RESPONSE, CAC_APPROVED, CAC_REJECTED, SYSTEM_MAINTENANCE, MARKETING]
 *         description: Filter notifications by type
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get("/", getNotifications);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get count of unread notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get("/unread-count", getUnreadCount);

/**
 * @swagger
 * /api/notifications/stats:
 *   get:
 *     summary: Get notification statistics for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification statistics retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get("/stats", getNotificationStats);

/**
 * @swagger
 * /api/notifications/preferences:
 *   get:
 *     summary: Get notification preferences for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification preferences retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get("/preferences", getNotificationPreferences);

/**
 * @swagger
 * /api/notifications/preferences:
 *   put:
 *     summary: Update notification preferences
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailEnabled:
 *                 type: boolean
 *                 description: Enable/disable email notifications
 *               emailBookingUpdates:
 *                 type: boolean
 *                 description: Receive booking updates via email
 *               emailPaymentUpdates:
 *                 type: boolean
 *                 description: Receive payment updates via email
 *               emailReviews:
 *                 type: boolean
 *                 description: Receive review notifications via email
 *               emailMarketing:
 *                 type: boolean
 *                 description: Receive marketing emails
 *               emailSystemAlerts:
 *                 type: boolean
 *                 description: Receive system alerts via email
 *               pushEnabled:
 *                 type: boolean
 *                 description: Enable/disable push notifications
 *               pushBookingUpdates:
 *                 type: boolean
 *                 description: Receive booking updates via push
 *               pushPaymentUpdates:
 *                 type: boolean
 *                 description: Receive payment updates via push
 *               pushReviews:
 *                 type: boolean
 *                 description: Receive review notifications via push
 *               pushSystemAlerts:
 *                 type: boolean
 *                 description: Receive system alerts via push
 *               smsEnabled:
 *                 type: boolean
 *                 description: Enable/disable SMS notifications
 *               smsBookingUpdates:
 *                 type: boolean
 *                 description: Receive booking updates via SMS
 *               smsPaymentUpdates:
 *                 type: boolean
 *                 description: Receive payment updates via SMS
 *               smsSystemAlerts:
 *                 type: boolean
 *                 description: Receive system alerts via SMS
 *               digestFrequency:
 *                 type: string
 *                 enum: [never, daily, weekly]
 *                 description: Frequency for digest emails
 *               quietHoursStart:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 description: Start of quiet hours (HH:MM format)
 *               quietHoursEnd:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 description: End of quiet hours (HH:MM format)
 *               timezone:
 *                 type: string
 *                 description: User's timezone
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *       400:
 *         description: Invalid preference values
 *       401:
 *         description: Authentication required
 */
router.put("/preferences", updateNotificationPreferences);

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Authentication required
 */
router.put("/mark-all-read", markAllNotificationsAsRead);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark a specific notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Authentication required
 */
router.put("/:id/read", markNotificationAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a specific notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Authentication required
 */
router.delete("/:id", deleteNotification);

export default router;
