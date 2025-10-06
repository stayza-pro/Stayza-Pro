import { Response } from "express";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { prisma } from "@/config/database";

export const getNotifications = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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
  }
);

export const markNotificationAsRead = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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
  }
);

export const markAllNotificationsAsRead = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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
  }
);

export const deleteNotification = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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
  }
);

export const getUnreadCount = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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
  }
);

export const getNotificationPreferences = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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
  }
);

export const updateNotificationPreferences = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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
  }
);

export const getNotificationStats = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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
  }
);

export default {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
  getNotificationPreferences,
  updateNotificationPreferences,
  getNotificationStats,
};
