import express, { Response } from "express";
import { prisma } from "@/config/database";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";

const router = express.Router();

/**
 * @swagger
 * /api/admin/system/notifications:
 *   get:
 *     summary: Get admin notifications
 *     description: Get list of admin-specific notifications
 *     tags: [Admin - System]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: Fetch only unread notifications
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           type:
 *                             type: string
 *                           title:
 *                             type: string
 *                           message:
 *                             type: string
 *                           isRead:
 *                             type: boolean
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           metadata:
 *                             type: object
 *       403:
 *         description: Admin access required
 */
router.get(
  "/notifications",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { limit = 20, unreadOnly } = req.query;

    const limitNum = parseInt(limit as string, 10);

    const where: any = {
      type: {
        in: [
          "REALTOR_REGISTRATION",
          "CAC_VERIFICATION",
          "PAYOUT_COMPLETED",
          "PROPERTY_SUBMISSION",
          "BOOKING_CANCELLED",
          "REVIEW_FLAGGED",
          "DISPUTE_OPENED",
        ],
      },
    };

    if (unreadOnly === "true") {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limitNum,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        isRead: true,
        createdAt: true,
        data: true,
      },
    });

    res.json({
      success: true,
      data: {
        notifications: notifications.map((notif) => ({
          id: notif.id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          isRead: notif.isRead,
          createdAt: notif.createdAt,
          metadata: notif.data,
        })),
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/system/notifications/read:
 *   patch:
 *     summary: Mark notification(s) as read
 *     description: |
 *       Mark specific notification or all notifications as read.
 *       - If notificationId provided: mark single notification as read
 *       - If no notificationId: mark all admin notifications as read
 *     tags: [Admin - System]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notificationId:
 *                 type: string
 *                 description: Optional notification ID. If omitted, marks all as read
 *           examples:
 *             single:
 *               value:
 *                 notificationId: clxyz123456789
 *             all:
 *               value: {}
 *     responses:
 *       200:
 *         description: Notification(s) marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: number
 *                       description: Number of notifications marked as read
 *       404:
 *         description: Notification not found (when notificationId provided)
 *       403:
 *         description: Admin access required
 */
router.patch(
  "/notifications/read",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { notificationId } = req.body;

    if (notificationId) {
      // Mark single notification as read
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        throw new AppError("Notification not found", 404);
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      res.json({
        success: true,
        message: "Notification marked as read",
        data: { count: 1 },
      });
    } else {
      // Mark all admin notifications as read
      const result = await prisma.notification.updateMany({
        where: {
          type: {
            in: [
              "REALTOR_REGISTRATION",
              "CAC_VERIFICATION",
              "PAYOUT_COMPLETED",
              "PROPERTY_SUBMISSION",
              "BOOKING_CANCELLED",
              "REVIEW_FLAGGED",
              "DISPUTE_OPENED",
            ],
          },
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      res.json({
        success: true,
        message: "All notifications marked as read",
        data: { count: result.count },
      });
    }
  })
);

/**
 * @swagger
 * /api/admin/system/audit-logs:
 *   get:
 *     summary: Get audit logs
 *     description: Get paginated list of system audit logs with filtering
 *     tags: [Admin - System]
 *     security:
 *       - BearerAuth: []
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
 *           default: 20
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     logs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           action:
 *                             type: string
 *                           entityType:
 *                             type: string
 *                           entityId:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           ipAddress:
 *                             type: string
 *                           userAgent:
 *                             type: string
 *                           details:
 *                             type: object
 *                           user:
 *                             type: object
 *                           admin:
 *                             type: object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         hasMore:
 *                           type: boolean
 *                     filters:
 *                       type: object
 *       403:
 *         description: Admin access required
 */
router.get(
  "/audit-logs",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 20, action, entityType, adminId } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (action && typeof action === "string") {
      where.action = action;
    }

    if (entityType && typeof entityType === "string") {
      where.entityType = entityType;
    }

    if (adminId && typeof adminId === "string") {
      where.adminId = adminId;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          admin: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { timestamp: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        logs: logs.map((log) => ({
          id: log.id,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          timestamp: log.timestamp,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          details: log.details,
          user: log.user,
          admin: log.admin,
        })),
        pagination: {
          page: pageNum,
          pages: totalPages,
          total,
          hasMore: pageNum < totalPages,
        },
        filters: {
          action,
          entityType,
          adminId,
        },
      },
    });
  })
);

export default router;
