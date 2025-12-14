import express, { Response } from "express";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { prisma } from "@/config/database";
import { authenticate } from "@/middleware/auth";

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   - name: Notifications
 *     description: Notification management and preferences
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get paginated notifications
 *     description: Get all notifications for the authenticated user with filtering
 *     tags: [Notifications]
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
 *           maximum: 50
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { page = 1, limit = 20, unreadOnly = false, type } = req.query;

    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const whereClause: any = {
      userId,
    };

    if (unreadOnly === "true") {
      whereClause.isRead = false;
    }

    if (type) {
      whereClause.type = type;
    }

    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
        include: {
          booking: {
            select: {
              id: true,
              checkInDate: true,
              checkOutDate: true,
              property: {
                select: {
                  title: true,
                  images: {
                    take: 1,
                    orderBy: { order: "asc" },
                  },
                },
              },
            },
          },
          property: {
            select: {
              id: true,
              title: true,
              images: {
                take: 1,
                orderBy: { order: "asc" },
              },
            },
          },
          payment: {
            select: {
              id: true,
              amount: true,
              currency: true,
              status: true,
            },
          },
          review: {
            select: {
              id: true,
              rating: true,
              comment: true,
              property: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      }),
      prisma.notification.count({
        where: whereClause,
      }),
      prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / Number(limit));

    res.json({
      success: true,
      message: "Notifications retrieved successfully",
      data: {
        notifications,
        unreadCount,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalItems: totalCount,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1,
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     description: Get the count of unread notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get(
  "/unread-count",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    res.json({
      success: true,
      data: {
        unreadCount,
      },
    });
  })
);

/**
 * @swagger
 * /api/notifications/stats:
 *   get:
 *     summary: Get notification statistics
 *     description: Get statistics about user's notifications
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get(
  "/stats",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const [totalCount, unreadCount, recentCount, typeDistribution] =
      await Promise.all([
        // Total notifications
        prisma.notification.count({
          where: { userId },
        }),

        // Unread notifications
        prisma.notification.count({
          where: { userId, isRead: false },
        }),

        // Recent notifications (last 7 days)
        prisma.notification.count({
          where: {
            userId,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),

        // Type distribution
        prisma.notification.groupBy({
          by: ["type"],
          where: { userId },
          _count: {
            type: true,
          },
          orderBy: {
            _count: {
              type: "desc",
            },
          },
        }),
      ]);

    res.json({
      success: true,
      message: "Notification statistics retrieved successfully",
      data: {
        totalCount,
        unreadCount,
        recentCount,
        typeDistribution: typeDistribution.reduce((acc, item) => {
          acc[item.type] = item._count.type;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  })
);

/**
 * @swagger
 * /api/notifications/preferences:
 *   get:
 *     summary: Get notification preferences
 *     description: Get notification preferences for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Preferences retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get(
  "/preferences",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: { userId },
      });
    }

    res.json({
      success: true,
      message: "Notification preferences retrieved successfully",
      data: preferences,
    });
  })
);

/**
 * @swagger
 * /api/notifications/preferences:
 *   put:
 *     summary: Update notification preferences
 *     description: Update notification preferences for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailEnabled:
 *                 type: boolean
 *               emailBookingUpdates:
 *                 type: boolean
 *               emailPaymentUpdates:
 *                 type: boolean
 *               emailReviews:
 *                 type: boolean
 *               emailMarketing:
 *                 type: boolean
 *               emailSystemAlerts:
 *                 type: boolean
 *               pushEnabled:
 *                 type: boolean
 *               pushBookingUpdates:
 *                 type: boolean
 *               pushPaymentUpdates:
 *                 type: boolean
 *               pushReviews:
 *                 type: boolean
 *               pushSystemAlerts:
 *                 type: boolean
 *               smsEnabled:
 *                 type: boolean
 *               smsBookingUpdates:
 *                 type: boolean
 *               smsPaymentUpdates:
 *                 type: boolean
 *               smsSystemAlerts:
 *                 type: boolean
 *               digestFrequency:
 *                 type: string
 *               quietHoursStart:
 *                 type: string
 *               quietHoursEnd:
 *                 type: string
 *               timezone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *       401:
 *         description: Authentication required
 */
router.put(
  "/preferences",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const {
      emailEnabled,
      emailBookingUpdates,
      emailPaymentUpdates,
      emailReviews,
      emailMarketing,
      emailSystemAlerts,
      pushEnabled,
      pushBookingUpdates,
      pushPaymentUpdates,
      pushReviews,
      pushSystemAlerts,
      smsEnabled,
      smsBookingUpdates,
      smsPaymentUpdates,
      smsSystemAlerts,
      digestFrequency,
      quietHoursStart,
      quietHoursEnd,
      timezone,
    } = req.body;

    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    // Upsert preferences
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId },
      update: {
        ...(emailEnabled !== undefined && { emailEnabled }),
        ...(emailBookingUpdates !== undefined && { emailBookingUpdates }),
        ...(emailPaymentUpdates !== undefined && { emailPaymentUpdates }),
        ...(emailReviews !== undefined && { emailReviews }),
        ...(emailMarketing !== undefined && { emailMarketing }),
        ...(emailSystemAlerts !== undefined && { emailSystemAlerts }),
        ...(pushEnabled !== undefined && { pushEnabled }),
        ...(pushBookingUpdates !== undefined && { pushBookingUpdates }),
        ...(pushPaymentUpdates !== undefined && { pushPaymentUpdates }),
        ...(pushReviews !== undefined && { pushReviews }),
        ...(pushSystemAlerts !== undefined && { pushSystemAlerts }),
        ...(smsEnabled !== undefined && { smsEnabled }),
        ...(smsBookingUpdates !== undefined && { smsBookingUpdates }),
        ...(smsPaymentUpdates !== undefined && { smsPaymentUpdates }),
        ...(smsSystemAlerts !== undefined && { smsSystemAlerts }),
        ...(digestFrequency !== undefined && { digestFrequency }),
        ...(quietHoursStart !== undefined && { quietHoursStart }),
        ...(quietHoursEnd !== undefined && { quietHoursEnd }),
        ...(timezone !== undefined && { timezone }),
      },
      create: {
        userId,
        emailEnabled: emailEnabled ?? true,
        emailBookingUpdates: emailBookingUpdates ?? true,
        emailPaymentUpdates: emailPaymentUpdates ?? true,
        emailReviews: emailReviews ?? true,
        emailMarketing: emailMarketing ?? false,
        emailSystemAlerts: emailSystemAlerts ?? true,
        pushEnabled: pushEnabled ?? true,
        pushBookingUpdates: pushBookingUpdates ?? true,
        pushPaymentUpdates: pushPaymentUpdates ?? true,
        pushReviews: pushReviews ?? true,
        pushSystemAlerts: pushSystemAlerts ?? true,
        smsEnabled: smsEnabled ?? false,
        smsBookingUpdates: smsBookingUpdates ?? false,
        smsPaymentUpdates: smsPaymentUpdates ?? true,
        smsSystemAlerts: smsSystemAlerts ?? false,
        digestFrequency: digestFrequency ?? "daily",
        quietHoursStart: quietHoursStart ?? "22:00",
        quietHoursEnd: quietHoursEnd ?? "08:00",
        timezone: timezone ?? "UTC",
      },
    });

    res.json({
      success: true,
      message: "Notification preferences updated successfully",
      data: preferences,
    });
  })
);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     description: Mark a specific notification as read
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Notification not found
 */
router.patch(
  "/:id/read",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    // Verify notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!notification) {
      throw new AppError("Notification not found", 404);
    }

    // Mark as read
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    // Get updated unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    res.json({
      success: true,
      message: "Notification marked as read",
      data: {
        notification: updatedNotification,
        unreadCount,
      },
    });
  })
);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     description: Mark all user's notifications as read
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Authentication required
 */
router.patch(
  "/read-all",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    // Mark all unread notifications as read
    const updateResult = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.json({
      success: true,
      message: `${updateResult.count} notifications marked as read`,
      data: {
        updatedCount: updateResult.count,
        unreadCount: 0,
      },
    });
  })
);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     description: Delete a specific notification
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Notification not found
 */
router.delete(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    // Verify notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!notification) {
      throw new AppError("Notification not found", 404);
    }

    // Delete notification
    await prisma.notification.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  })
);

export default router;
