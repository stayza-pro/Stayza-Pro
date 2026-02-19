import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "@/config";
import { prisma } from "@/config/database";
import { sendEmail } from "@/services/email";
import { logger } from "@/utils/logger";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  realtorId?: string;
}

interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  priority: string;
  createdAt: Date;
  bookingId?: string;
  propertyId?: string;
  paymentId?: string;
  reviewId?: string;
}

export class NotificationService {
  private static instance: NotificationService | null = null;
  private io: SocketIOServer;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(server: HTTPServer) {
    // Allow all production subdomains and dev URLs
    const allowedOrigins = [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "https://stayza.pro",
      "https://www.stayza.pro",
      /^https:\/\/.*\.stayza\.pro$/,
      "http://localhost:3000",
      "http://localhost:3001",
    ];

    this.io = new SocketIOServer(server, {
      cors: {
        origin: (origin, callback) => {
          // Allow requests with no origin (like mobile apps or curl)
          if (!origin) return callback(null, true);

          // Check if origin matches any allowed pattern
          const isAllowed = allowedOrigins.some((allowed) => {
            if (typeof allowed === "string") return origin === allowed;
            if (allowed instanceof RegExp) return allowed.test(origin);
            return false;
          });

          if (isAllowed) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        },
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupSocketHandlers();
    NotificationService.instance = this;
  }

  public static initialize(server: HTTPServer): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService(server);
    }
    return NotificationService.instance;
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      throw new Error(
        "NotificationService not initialized. Call initialize() first.",
      );
    }
    return NotificationService.instance;
  }

  private setupSocketHandlers(): void {
    this.io.use(this.authenticateSocket.bind(this));

    this.io.on("connection", (socket: AuthenticatedSocket) => {
      // Add user to connected users map
      if (socket.userId) {
        if (!this.connectedUsers.has(socket.userId)) {
          this.connectedUsers.set(socket.userId, new Set());
        }
        this.connectedUsers.get(socket.userId)!.add(socket.id);
      }

      // Join user to their personal room
      if (socket.userId) {
        socket.join(`user:${socket.userId}`);
      }

      // Join realtor to their realtor room
      if (socket.realtorId) {
        socket.join(`realtor:${socket.realtorId}`);
      }

      // Handle marking notifications as read
      socket.on("mark_notification_read", async (notificationId: string) => {
        await this.markNotificationAsRead(notificationId, socket.userId!);
      });

      // Handle marking all notifications as read
      socket.on("mark_all_read", async () => {
        await this.markAllNotificationsAsRead(socket.userId!);
      });

      // Handle getting unread count
      socket.on("get_unread_count", async () => {
        const count = await this.getUnreadCount(socket.userId!);
        socket.emit("unread_count", count);
      });

      // Handle requesting notification history
      socket.on(
        "get_notification_history",
        async (data: { page?: number; limit?: number }) => {
          const notifications = await this.getNotificationHistory(
            socket.userId!,
            data.page || 1,
            data.limit || 20,
          );
          socket.emit("notification_history", notifications);
        },
      );

      // Handle disconnect
      socket.on("disconnect", () => {
        if (socket.userId && this.connectedUsers.has(socket.userId)) {
          const userSockets = this.connectedUsers.get(socket.userId)!;
          userSockets.delete(socket.id);

          if (userSockets.size === 0) {
            this.connectedUsers.delete(socket.userId);
          }
        }
      });

      // Send pending notifications for this user
      this.sendPendingNotifications(socket.userId!);
    });
  }

  private async authenticateSocket(
    socket: AuthenticatedSocket,
    next: (error?: Error) => void,
  ): Promise<void> {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, config.JWT_SECRET) as any;

      // Get user details from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          realtor: true,
        },
      });

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.userId = user.id;
      socket.userRole = user.role;
      socket.realtorId = user.realtor?.id;

      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  }

  // Send notification to specific user
  public async sendToUser(
    userId: string,
    notification: NotificationData,
  ): Promise<void> {
    this.io.to(`user:${userId}`).emit("notification", notification);
  }

  // Emit non-notification real-time events to a specific user room
  public emitToUserRoom(userId: string, event: string, payload: unknown): void {
    this.io.to(`user:${userId}`).emit(event, payload);
  }

  // Send notification to all realtors
  public async sendToRealtors(notification: NotificationData): Promise<void> {
    // Get all realtor IDs
    const realtors = await prisma.realtor.findMany({
      select: { id: true },
    });

    realtors.forEach((realtor) => {
      this.io.to(`realtor:${realtor.id}`).emit("notification", notification);
    });
  }

  // Send notification to specific realtor
  public async sendToRealtor(
    realtorId: string,
    notification: NotificationData,
  ): Promise<void> {
    this.io.to(`realtor:${realtorId}`).emit("notification", notification);
  }

  // Send system-wide notification
  public async sendSystemNotification(
    notification: NotificationData,
  ): Promise<void> {
    this.io.emit("system_notification", notification);
  }

  // Create and send notification
  public async createAndSendNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    priority?: string;
    bookingId?: string;
    propertyId?: string;
    paymentId?: string;
    reviewId?: string;
    emailEnabled?: boolean;
    pushEnabled?: boolean;
  }): Promise<void> {
    try {
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type as any,
          title: data.title,
          message: data.message,
          data: data.data,
          priority: data.priority || "normal",
          bookingId: data.bookingId,
          propertyId: data.propertyId,
          paymentId: data.paymentId,
          reviewId: data.reviewId,
          emailSent: false,
          pushSent: false,
        },
      });

      // Send real-time notification
      const notificationData: NotificationData = {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data as any,
        priority: notification.priority,
        createdAt: notification.createdAt,
        bookingId: notification.bookingId || undefined,
        propertyId: notification.propertyId || undefined,
        paymentId: notification.paymentId || undefined,
        reviewId: notification.reviewId || undefined,
      };

      await this.sendToUser(data.userId, notificationData);

      // Update unread count
      const unreadCount = await this.getUnreadCount(data.userId);
      this.io.to(`user:${data.userId}`).emit("unread_count", unreadCount);

      // Send email/push notifications asynchronously (non-blocking)
      if (data.emailEnabled !== false) {
        // Fire and forget - don't wait for email to complete
        this.sendEmailNotification(data.userId, notification).catch((error) => {
          logger.error(`Failed to send email notification: ${error.message}`);
        });
      }
    } catch (error) {
      logger.error("Failed to create and send notification", {
        userId: data.userId,
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  // Mark notification as read
  private async markNotificationAsRead(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: userId,
        },
        data: {
          isRead: true,
        },
      });

      // Send updated unread count
      const unreadCount = await this.getUnreadCount(userId);
      this.io.to(`user:${userId}`).emit("unread_count", unreadCount);
    } catch (error) {
      logger.warn("Failed to mark notification as read", {
        notificationId,
        userId,
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  // Mark all notifications as read for user
  private async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          userId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      this.io.to(`user:${userId}`).emit("unread_count", 0);
    } catch (error) {
      logger.warn("Failed to mark all notifications as read", {
        userId,
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  // Get unread notification count
  private async getUnreadCount(userId: string): Promise<number> {
    try {
      return await prisma.notification.count({
        where: {
          userId: userId,
          isRead: false,
        },
      });
    } catch (error) {
      return 0;
    }
  }

  // Get notification history
  private async getNotificationHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    try {
      const skip = (page - 1) * limit;

      const [notifications, totalCount] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          include: {
            booking: {
              select: {
                id: true,
                checkInDate: true,
                checkOutDate: true,
                property: {
                  select: {
                    title: true,
                  },
                },
              },
            },
            property: {
              select: {
                id: true,
                title: true,
              },
            },
            payment: {
              select: {
                id: true,
                amount: true,
                status: true,
              },
            },
            review: {
              select: {
                id: true,
                rating: true,
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
          where: { userId },
        }),
      ]);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      return {
        notifications: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      };
    }
  }

  // Send pending notifications when user connects
  private async sendPendingNotifications(userId: string): Promise<void> {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          userId,
          isRead: false,
        },
        orderBy: { createdAt: "desc" },
        take: 10, // Limit to most recent 10 unread notifications
      });

      notifications.forEach((notification) => {
        const notificationData: NotificationData = {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data as any,
          priority: notification.priority,
          createdAt: notification.createdAt,
          bookingId: notification.bookingId || undefined,
          propertyId: notification.propertyId || undefined,
          paymentId: notification.paymentId || undefined,
          reviewId: notification.reviewId || undefined,
        };

        this.io.to(`user:${userId}`).emit("notification", notificationData);
      });
    } catch (error) {
      logger.warn("Failed to send pending notifications", {
        userId,
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  // Send email notification
  private async sendEmailNotification(
    userId: string,
    notification: any,
  ): Promise<void> {
    try {
      const hasResendConfig = Boolean(config.RESEND_API_KEY);
      const hasSmtpConfig = Boolean(
        config.SMTP_HOST &&
        config.SMTP_PORT &&
        config.SMTP_USER &&
        config.SMTP_PASS,
      );

      // Skip email notifications only when neither provider is configured.
      if (!hasResendConfig && !hasSmtpConfig) {
        logger.info(
          "Skipping email notification (no email provider configured)",
        );
        return;
      }

      // Get user email
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true },
      });

      if (!user || !user.email) {
        logger.warn(`No email found for user ${userId}`);
        return;
      }

      // Construct email content based on notification type
      const emailSubject = notification.title;
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
              .priority-${notification.priority.toLowerCase()} { border-left: 4px solid ${
                notification.priority === "HIGH"
                  ? "#ef4444"
                  : notification.priority === "MEDIUM"
                    ? "#f59e0b"
                    : "#3b82f6"
              }; padding-left: 15px; margin: 20px 0; }
              .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Stayza Notification</h1>
              </div>
              <div class="content">
                <h2>Hi ${user.firstName || "there"},</h2>
                <div class="priority-${notification.priority.toLowerCase()}">
                  <h3>${notification.title}</h3>
                  <p>${notification.message}</p>
                </div>
                ${
                  notification.bookingId
                    ? `<a href="${config.FRONTEND_URL}/guest/bookings/${notification.bookingId}" class="button">View Booking</a>`
                    : ""
                }
                ${
                  notification.propertyId
                    ? `<a href="${config.FRONTEND_URL}/guest/browse/${notification.propertyId}" class="button">View Property</a>`
                    : ""
                }
              </div>
              <div class="footer">
                <p>You're receiving this email because you have notifications enabled.</p>
                <p>© ${new Date().getFullYear()} Stayza. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      await sendEmail(user.email, {
        subject: emailSubject,
        html: emailHtml,
      });

      logger.info(
        `Email notification sent to user ${userId}: ${notification.title}`,
      );
    } catch (error) {
      logger.error(
        `Error sending email notification to user ${userId}:`,
        error,
      );
      // Don't throw - email delivery failure shouldn't break notification creation
    }
  }

  // Check if user is online
  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Get online users count
  public getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get connected sockets for user
  public getUserSockets(userId: string): Set<string> | undefined {
    return this.connectedUsers.get(userId);
  }

  // Clean up expired notifications (can be called periodically)
  public async cleanupExpiredNotifications(): Promise<void> {
    try {
      await prisma.notification.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
    } catch (error) {
      logger.warn("Failed to cleanup expired notifications", {
        error: error instanceof Error ? error.message : error,
      });
    }
  }
}

// Notification helper functions for different event types
export const notificationHelpers = {
  // Booking notifications
  bookingConfirmed: (
    userId: string,
    bookingId: string,
    propertyTitle: string,
  ) => ({
    userId,
    type: "BOOKING_CONFIRMED",
    title: "Booking Confirmed",
    message: `Your booking for "${propertyTitle}" has been confirmed!`,
    bookingId,
    priority: "high",
  }),

  bookingCancelled: (
    userId: string,
    bookingId: string,
    propertyTitle: string,
  ) => ({
    userId,
    type: "BOOKING_CANCELLED",
    title: "Booking Cancelled",
    message: `Your booking for "${propertyTitle}" has been cancelled.`,
    bookingId,
    priority: "high",
  }),

  // Payment notifications
  paymentCompleted: (
    userId: string,
    paymentId: string,
    amount: number,
    currency: string,
  ) => ({
    userId,
    type: "PAYMENT_COMPLETED",
    title: "Payment Successful",
    message: `Your payment of ${currency} ${amount} has been processed successfully.`,
    paymentId,
    priority: "high",
  }),

  paymentFailed: (
    userId: string,
    paymentId: string,
    amount: number,
    currency: string,
  ) => ({
    userId,
    type: "PAYMENT_FAILED",
    title: "Payment Failed",
    message: `Your payment of ${currency} ${amount} could not be processed. Please try again.`,
    paymentId,
    priority: "urgent",
  }),

  // Review notifications
  reviewReceived: (
    userId: string,
    reviewId: string,
    propertyTitle: string,
    rating: number,
  ) => ({
    userId,
    type: "REVIEW_RECEIVED",
    title: "New Review Received",
    message: `You received a ${rating}-star review for "${propertyTitle}".`,
    reviewId,
    priority: "normal",
  }),

  reviewResponse: (
    userId: string,
    reviewId: string,
    propertyTitle: string,
  ) => ({
    userId,
    type: "REVIEW_RESPONSE",
    title: "Host Responded to Your Review",
    message: `The host responded to your review for "${propertyTitle}".`,
    reviewId,
    priority: "normal",
  }),

  createReviewModerationNotification: (
    propertyTitle: string,
    action: string,
    businessName?: string,
  ) => ({
    type: "REVIEW_MODERATION",
    title: "Review Status Updated",
    message: `Your review for "${propertyTitle}" has been ${action}${
      businessName ? ` by ${businessName}` : ""
    }.`,
    priority: "normal" as const,
  }),

  // Refund notifications
  refundRequested: (
    userId: string,
    amount: number,
    currency: string,
    propertyTitle: string,
    guestName: string,
  ) => ({
    userId,
    type: "REFUND_REQUEST",
    title: "New Refund Request",
    message: `${guestName} requested a refund of ${currency} ${amount} for "${propertyTitle}".`,
    priority: "high",
  }),

  refundApprovedByRealtor: (
    userId: string,
    amount: number,
    currency: string,
    propertyTitle: string,
  ) => ({
    userId,
    type: "REFUND_APPROVED_BY_REALTOR",
    title: "Refund Request Approved",
    message: `Your refund request of ${currency} ${amount} for "${propertyTitle}" has been approved by the realtor and is now pending admin processing.`,
    priority: "high",
  }),

  refundRejectedByRealtor: (
    userId: string,
    amount: number,
    currency: string,
    propertyTitle: string,
    reason: string,
  ) => ({
    userId,
    type: "REFUND_REJECTED_BY_REALTOR",
    title: "Refund Request Rejected",
    message: `Your refund request of ${currency} ${amount} for "${propertyTitle}" has been rejected by the realtor. Reason: ${reason}`,
    priority: "high",
  }),

  refundPendingAdminApproval: (
    userId: string,
    amount: number,
    currency: string,
    propertyTitle: string,
  ) => ({
    userId,
    type: "REFUND_PENDING_ADMIN_APPROVAL",
    title: "Refund Request Pending Admin Processing",
    message: `A refund request of ${currency} ${amount} for "${propertyTitle}" has been approved by the realtor and is pending your processing.`,
    priority: "normal",
  }),

  refundProcessed: (
    userId: string,
    amount: number,
    currency: string,
    propertyTitle: string,
  ) => ({
    userId,
    type: "REFUND_PROCESSED",
    title: "Refund Processed",
    message: `Your refund of ${currency} ${amount} for "${propertyTitle}" has been processed successfully. The funds should appear in your account within 3-7 business days.`,
    priority: "high",
  }),

  // System notifications
  systemAlert: (userId: string, title: string, message: string) => ({
    userId,
    type: "SYSTEM_ALERT",
    title,
    message,
    priority: "high",
  }),

  // CAC status notifications
  cacApproved: (userId: string) => ({
    userId,
    type: "CAC_STATUS_UPDATE",
    title: "CAC Verification Approved",
    message:
      "Your CAC verification has been approved. You can now list properties.",
    priority: "high",
  }),

  cacRejected: (userId: string, reason?: string) => ({
    userId,
    type: "CAC_STATUS_UPDATE",
    title: "CAC Verification Rejected",
    message:
      reason ||
      "Your CAC verification was rejected. Please contact support for more information.",
    priority: "high",
  }),

  // Admin booking management notifications
  bookingStatusChanged: (data: {
    bookingId: string;
    propertyTitle: string;
    newStatus: string;
    reason: string;
    adminName: string;
  }) => ({
    type: "BOOKING_STATUS_ADMIN_UPDATE",
    title: "Booking Status Updated",
    message: `Your booking for "${data.propertyTitle}" has been updated to ${data.newStatus} by admin ${data.adminName}. Reason: ${data.reason}`,
    bookingId: data.bookingId,
    priority: "high",
    data: {
      newStatus: data.newStatus,
      reason: data.reason,
      adminName: data.adminName,
    },
  }),

  adminBookingCancelled: (data: {
    bookingId: string;
    propertyTitle: string;
    reason: string;
    refundAmount: number;
    adminName: string;
  }) => ({
    type: "BOOKING_ADMIN_CANCELLED",
    title: "Booking Cancelled by Admin",
    message: `Your booking for "${
      data.propertyTitle
    }" has been cancelled by admin ${data.adminName}. ${
      data.refundAmount > 0
        ? `A refund of ₦${data.refundAmount.toLocaleString()} has been processed.`
        : "No refund applicable."
    } Reason: ${data.reason}`,
    bookingId: data.bookingId,
    priority: "urgent",
    data: {
      reason: data.reason,
      refundAmount: data.refundAmount,
      adminName: data.adminName,
    },
  }),
};

/**
 * Create admin notification for system events
 * Admin notifications are stored with a specific set of types that the admin frontend filters for
 */
export async function createAdminNotification(data: {
  type: string;
  title: string;
  message: string;
  data?: any;
  priority?: string;
}): Promise<void> {
  try {
    // Get all admin users
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (admins.length === 0) {
      return;
    }

    // Create notification for each admin
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        type: data.type as any,
        title: data.title,
        message: data.message,
        data: data.data,
        priority: data.priority || "normal",
        isRead: false,
        emailSent: false,
        pushSent: false,
      })),
    });

    // Send real-time notification via WebSocket if service is initialized
    try {
      const notificationService = NotificationService.getInstance();
      for (const admin of admins) {
        notificationService["io"]
          .to(`user:${admin.id}`)
          .emit("admin_notification", {
            type: data.type,
            title: data.title,
            message: data.message,
            data: data.data,
            priority: data.priority || "normal",
            createdAt: new Date(),
          });
      }
    } catch (wsError) {
      logger.warn("Failed to broadcast admin notification via websocket", {
        error: wsError instanceof Error ? wsError.message : wsError,
      });
    }
  } catch (error) {
    logger.error("Failed to create admin notifications", {
      error: error instanceof Error ? error.message : error,
    });
  }
}

export default NotificationService;
