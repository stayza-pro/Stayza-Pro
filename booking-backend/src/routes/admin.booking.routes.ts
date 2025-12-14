import express, { Response } from "express";
import {
  BookingStatus,
  Prisma,
  RefundRequestStatus,
  PaymentStatus,
} from "@prisma/client";
import { prisma } from "@/config/database";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { auditLogger } from "@/services/auditLogger";
import {
  safeTransitionBookingStatus,
  BookingStatusConflictError,
  InvalidStatusTransitionError,
} from "@/services/bookingStatus";
import {
  NotificationService,
  notificationHelpers,
} from "@/services/notificationService";
import { logger } from "@/utils/logger";
import disputeService from "@/services/disputeService";

const router = express.Router();

interface AdminBookingSearchQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: BookingStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  realtorId?: string;
  guestId?: string;
  minAmount?: string;
  maxAmount?: string;
}

/**
 * @swagger
 * /api/admin/bookings:
 *   get:
 *     summary: Get all bookings with advanced filtering
 *     description: Get paginated list of all bookings with comprehensive filtering and search
 *     tags: [Admin - Booking Management]
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
 *           maximum: 100
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, checkInDate, totalPrice, status]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by guest name, property title, or booking ID
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: realtorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: guestId
 *         schema:
 *           type: string
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
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
 *                     bookings:
 *                       type: array
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalItems:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *       403:
 *         description: Admin access required
 */
router.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      page = "1",
      limit = "20",
      sortBy = "createdAt",
      sortOrder = "desc",
      status,
      search,
      dateFrom,
      dateTo,
      realtorId,
      guestId,
      minAmount,
      maxAmount,
    } = req.query as AdminBookingSearchQuery;

    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.BookingWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.checkInDate = {};
      if (dateFrom) where.checkInDate.gte = new Date(dateFrom);
      if (dateTo) where.checkInDate.lte = new Date(dateTo);
    }

    if (realtorId) {
      where.property = {
        realtorId: realtorId,
      };
    }
    if (guestId) {
      where.guestId = guestId;
    }

    if (minAmount || maxAmount) {
      where.totalPrice = {};
      if (minAmount) where.totalPrice.gte = parseFloat(minAmount);
      if (maxAmount) where.totalPrice.lte = parseFloat(maxAmount);
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        {
          guest: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
        {
          property: {
            title: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true,
              country: true,
              pricePerNight: true,
              realtor: {
                select: {
                  id: true,
                  businessName: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
          guest: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          payment: {
            select: {
              id: true,
              amount: true,
              status: true,
              method: true,
              paidAt: true,
              refundAmount: true,
              refundedAt: true,
            },
          },
          review: {
            select: {
              id: true,
              rating: true,
              comment: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limitNum,
      }),
      prisma.booking.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

    await auditLogger.log("ADMIN_ACTION", "BOOKING", {
      adminId: req.user!.id,
      entityId: "bookings_list",
      details: { action: "VIEW_BOOKINGS", filters: req.query, total },
      req,
    });

    res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: total,
          hasNext,
          hasPrev,
          limit: limitNum,
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/bookings/stats:
 *   get:
 *     summary: Get booking statistics
 *     description: Get comprehensive booking statistics for admin dashboard
 *     tags: [Admin - Booking Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to look back
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                     overview:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                         confirmed:
 *                           type: integer
 *                         cancelled:
 *                           type: integer
 *                         completed:
 *                           type: integer
 *                         recent:
 *                           type: integer
 *                     metrics:
 *                       type: object
 *                       properties:
 *                         totalRevenue:
 *                           type: number
 *                         averageBookingValue:
 *                           type: number
 *                         conversionRate:
 *                           type: number
 *                         cancellationRate:
 *                           type: number
 *       403:
 *         description: Admin access required
 */
router.get(
  "/stats",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { period = "30" } = req.query;
    const daysBack = parseInt(period as string, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      completedBookings,
      recentBookings,
      totalRevenue,
      averageBookingValue,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({
        where: { status: BookingStatus.PENDING },
      }),
      prisma.booking.count({
        where: { status: BookingStatus.CONFIRMED },
      }),
      prisma.booking.count({
        where: { status: BookingStatus.CANCELLED },
      }),
      prisma.booking.count({
        where: { status: BookingStatus.COMPLETED },
      }),
      prisma.booking.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
      prisma.payment.aggregate({
        where: {
          status: "COMPLETED",
          booking: {
            status: BookingStatus.COMPLETED,
          },
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.booking.aggregate({
        _avg: {
          totalPrice: true,
        },
      }),
    ]);

    const conversionRate =
      totalBookings > 0
        ? ((confirmedBookings + completedBookings) / totalBookings) * 100
        : 0;

    const cancellationRate =
      totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

    await auditLogger.log("ADMIN_ACTION", "BOOKING", {
      adminId: req.user!.id,
      entityId: "booking_stats",
      details: { action: "VIEW_BOOKING_STATS", period: daysBack },
      req,
    });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          total: totalBookings,
          pending: pendingBookings,
          confirmed: confirmedBookings,
          cancelled: cancelledBookings,
          completed: completedBookings,
          recent: recentBookings,
        },
        metrics: {
          totalRevenue: totalRevenue._sum.amount || 0,
          averageBookingValue: averageBookingValue._avg.totalPrice || 0,
          conversionRate: Math.round(conversionRate * 100) / 100,
          cancellationRate: Math.round(cancellationRate * 100) / 100,
        },
        period: {
          days: daysBack,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/bookings/{id}:
 *   get:
 *     summary: Get single booking details
 *     description: Get comprehensive details for a specific booking
 *     tags: [Admin - Booking Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking details retrieved successfully
 *       404:
 *         description: Booking not found
 *       403:
 *         description: Admin access required
 */
router.get(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            realtor: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
            images: true,
          },
        },
        guest: true,
        payment: true,
        review: true,
        notifications: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        refundRequests: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    await auditLogger.log("ADMIN_ACTION", "BOOKING", {
      adminId: req.user!.id,
      entityId: id,
      details: { action: "VIEW_BOOKING_DETAILS" },
      req,
    });

    res.status(200).json({
      success: true,
      data: { booking },
    });
  })
);

/**
 * @swagger
 * /api/admin/bookings/{id}/status:
 *   put:
 *     summary: Update booking status (admin override)
 *     description: Update booking status with admin privileges, bypassing normal validation
 *     tags: [Admin - Booking Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *               - reason
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED]
 *                 description: New booking status
 *               reason:
 *                 type: string
 *                 description: Reason for status change
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 *       400:
 *         description: Invalid status or missing reason
 *       404:
 *         description: Booking not found
 */
router.put(
  "/:id/status",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!Object.values(BookingStatus).includes(status)) {
      throw new AppError("Invalid booking status", 400);
    }

    if (!reason || reason.trim().length === 0) {
      throw new AppError("Reason for status change is required", 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            realtor: {
              include: {
                user: true,
              },
            },
          },
        },
        guest: true,
        payment: true,
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    try {
      const updatedBooking = await safeTransitionBookingStatus(
        booking.id,
        status,
        {
          adminId: req.user!.id,
          reason,
          skipValidation: true,
        }
      );

      const notificationData = {
        bookingId: booking.id,
        propertyTitle: booking.property.title,
        newStatus: status,
        reason,
        adminName: `${req.user!.firstName} ${req.user!.lastName}`,
      };

      const guestNotificationData =
        notificationHelpers.bookingStatusChanged(notificationData);
      await NotificationService.getInstance().createAndSendNotification({
        userId: booking.guestId,
        ...guestNotificationData,
      });

      const realtorNotificationData =
        notificationHelpers.bookingStatusChanged(notificationData);
      await NotificationService.getInstance().createAndSendNotification({
        userId: booking.property.realtor.userId,
        ...realtorNotificationData,
      });

      await auditLogger.log("BOOKING_STATUS_UPDATE", "BOOKING", {
        adminId: req.user!.id,
        entityId: id,
        details: {
          action: "UPDATE_BOOKING_STATUS",
          fromStatus: booking.status,
          toStatus: status,
          reason,
        },
        req,
      });

      res.status(200).json({
        success: true,
        data: { booking: updatedBooking },
        message: `Booking status updated to ${status}`,
      });
    } catch (error) {
      if (
        error instanceof BookingStatusConflictError ||
        error instanceof InvalidStatusTransitionError
      ) {
        throw new AppError(error.message, 400);
      }
      throw error;
    }
  })
);

/**
 * @swagger
 * /api/admin/bookings/{id}/cancel:
 *   post:
 *     summary: Cancel booking with refund processing
 *     description: Cancel a booking and process refund based on specified percentage
 *     tags: [Admin - Booking Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
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
 *                 description: Cancellation reason
 *               refundPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 default: 100
 *                 description: Percentage of booking amount to refund
 *     responses:
 *       200:
 *         description: Booking cancelled and refund processed
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
 *                     booking:
 *                       type: object
 *                     refundAmount:
 *                       type: number
 *       400:
 *         description: Invalid request or booking cannot be cancelled
 *       404:
 *         description: Booking not found
 */
router.post(
  "/:id/cancel",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { reason, refundPercentage = 100 } = req.body;

    if (!reason || reason.trim().length === 0) {
      throw new AppError("Cancellation reason is required", 400);
    }

    if (refundPercentage < 0 || refundPercentage > 100) {
      throw new AppError("Refund percentage must be between 0 and 100", 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            realtor: {
              include: { user: true },
            },
          },
        },
        guest: true,
        payment: true,
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new AppError("Booking is already cancelled", 400);
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new AppError("Cannot cancel completed booking", 400);
    }

    try {
      const refundAmount = booking.payment
        ? (Number(booking.payment.amount) * refundPercentage) / 100
        : 0;

      const updatedBooking = await safeTransitionBookingStatus(
        booking.id,
        BookingStatus.CANCELLED,
        {
          adminId: req.user!.id,
          reason,
          skipValidation: true,
        }
      );

      if (booking.payment && refundAmount > 0) {
        await prisma.payment.update({
          where: { id: booking.payment.id },
          data: {
            refundAmount,
            refundedAt: new Date(),
          },
        });

        logger.info(`Refund of ${refundAmount} processed for booking ${id}`);
      }

      const notificationData = {
        bookingId: booking.id,
        propertyTitle: booking.property.title,
        reason,
        refundAmount,
        adminName: `${req.user!.firstName} ${req.user!.lastName}`,
      };

      const guestNotificationData =
        notificationHelpers.adminBookingCancelled(notificationData);
      await NotificationService.getInstance().createAndSendNotification({
        userId: booking.guestId,
        ...guestNotificationData,
      });

      const realtorNotificationData =
        notificationHelpers.adminBookingCancelled(notificationData);
      await NotificationService.getInstance().createAndSendNotification({
        userId: booking.property.realtor.userId,
        ...realtorNotificationData,
      });

      await auditLogger.log("BOOKING_CANCEL", "BOOKING", {
        adminId: req.user!.id,
        entityId: id,
        details: {
          action: "CANCEL_BOOKING",
          reason,
          refundAmount,
          refundPercentage,
        },
        req,
      });

      res.status(200).json({
        success: true,
        data: {
          booking: updatedBooking,
          refundAmount,
        },
        message: `Booking cancelled successfully. Refund of ₦${refundAmount.toLocaleString()} processed.`,
      });
    } catch (error) {
      if (
        error instanceof BookingStatusConflictError ||
        error instanceof InvalidStatusTransitionError
      ) {
        throw new AppError(error.message, 400);
      }
      throw error;
    }
  })
);

/**
 * @swagger
 * /api/admin/bookings/disputes/all:
 *   get:
 *     summary: Get all open disputes
 *     description: Admin endpoint to view all open booking disputes
 *     tags: [Admin - Booking Management]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Disputes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 disputes:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: number
 *       403:
 *         description: Admin access required
 */
router.get(
  "/disputes/all",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || userRole !== "ADMIN") {
      throw new AppError("Admin access required", 403);
    }

    const disputes = await disputeService.getAllOpenDisputes();

    res.status(200).json({
      disputes,
      total: disputes.length,
    });
  })
);

/**
 * @swagger
 * /api/admin/bookings/refunds/pending:
 *   get:
 *     summary: Get refund requests pending admin processing
 *     description: Admin endpoint to view refund requests that have been approved by realtors and are awaiting final processing
 *     tags: [Admin - Booking Management]
 *     security:
 *       - BearerAuth: []
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
 *           default: 10
 *         description: Number of results per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING_REALTOR_APPROVAL, REALTOR_APPROVED, REALTOR_REJECTED, ADMIN_PROCESSING, COMPLETED, FAILED]
 *         description: Filter by refund status
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
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *       403:
 *         description: Admin access required
 */
router.get(
  "/refunds/pending",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 10, status } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status) {
      where.status = status as RefundRequestStatus;
    } else {
      // Default to approved requests pending admin processing
      where.status = "REALTOR_APPROVED";
    }

    const [refundRequests, total] = await Promise.all([
      prisma.refundRequest.findMany({
        where,
        include: {
          booking: {
            include: {
              property: {
                select: {
                  title: true,
                },
              },
            },
          },
          payment: {
            select: {
              amount: true,
              currency: true,
              refundAmount: true,
              method: true,
            },
          },
          requester: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          realtor: {
            select: {
              businessName: true,
            },
          },
        },
        orderBy: {
          realtorApprovedAt: "asc",
        },
        skip,
        take: limitNum,
      }),
      prisma.refundRequest.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      message: "Admin refund requests retrieved successfully",
      data: refundRequests,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount: total,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/bookings/refunds/{id}/process:
 *   post:
 *     summary: Process refund (Admin final approval)
 *     description: Admin endpoint to process refund requests that have been approved by realtors
 *     tags: [Admin - Booking Management]
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
 *             type: object
 *             properties:
 *               actualRefundAmount:
 *                 type: number
 *                 description: Actual refund amount (defaults to requested amount)
 *               adminNotes:
 *                 type: string
 *                 description: Admin notes for the refund processing
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
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       404:
 *         description: Refund request not found or not ready for processing
 *       400:
 *         description: Invalid refund amount
 *       403:
 *         description: Admin access required
 */
router.post(
  "/refunds/:id/process",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { actualRefundAmount, adminNotes } = req.body;
    const user = req.user!;

    const refundRequest = await prisma.refundRequest.findFirst({
      where: {
        id,
        status: "REALTOR_APPROVED",
      },
      include: {
        booking: {
          include: {
            property: {
              select: {
                title: true,
              },
            },
          },
        },
        payment: true,
        requester: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!refundRequest) {
      throw new AppError(
        "Refund request not found or not ready for processing",
        404
      );
    }

    const finalAmount =
      actualRefundAmount || Number(refundRequest.requestedAmount);
    const currentRefundAmount = Number(refundRequest.payment.refundAmount ?? 0);
    const availableForRefund =
      Number(refundRequest.payment.amount) - currentRefundAmount;

    if (finalAmount > availableForRefund) {
      throw new AppError(
        `Refund amount cannot exceed available balance of ${refundRequest.currency} ${availableForRefund}`,
        400
      );
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Update payment record
        const newRefundAmount = currentRefundAmount + finalAmount;
        const isFullyRefunded = newRefundAmount >= refundRequest.payment.amount;

        await tx.payment.update({
          where: { id: refundRequest.paymentId },
          data: {
            refundAmount: newRefundAmount,
            refundedAt: new Date(),
            status: isFullyRefunded
              ? PaymentStatus.REFUNDED_TO_CUSTOMER
              : PaymentStatus.REFUNDED_TO_CUSTOMER,
            metadata: {
              ...((refundRequest.payment.metadata as any) || {}),
              refunds: [
                ...((refundRequest.payment.metadata as any)?.refunds || []),
                {
                  refundRequestId: refundRequest.id,
                  amount: finalAmount,
                  processedBy: user.id,
                  processedAt: new Date().toISOString(),
                  reason: refundRequest.reason,
                },
              ],
            } as any,
          },
        });

        // Update refund request
        await tx.refundRequest.update({
          where: { id },
          data: {
            status: "COMPLETED",
            adminId: user.id,
            adminProcessedAt: new Date(),
            adminNotes,
            actualRefundAmount: finalAmount,
            completedAt: new Date(),
            providerRefundId: `refund_${Date.now()}`,
          },
        });
      });

      // Send notification to guest
      try {
        await prisma.notification.create({
          data: {
            userId: refundRequest.requestedBy,
            type: "SYSTEM_ALERT",
            title: "Refund Processed",
            message: `Your refund of ${refundRequest.currency} ${finalAmount} for "${refundRequest.booking.property.title}" has been processed successfully. The funds should appear in your account within 3-7 business days.`,
          },
        });
      } catch (notificationError) {
        logger.error(
          "Failed to send refund processed notification:",
          notificationError
        );
      }

      res.json({
        success: true,
        message: "Refund processed successfully",
        data: {
          refundRequestId: refundRequest.id,
          actualRefundAmount: finalAmount,
          currency: refundRequest.currency,
          processedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error("Refund processing error:", error);
      throw new AppError("Failed to process refund", 500);
    }
  })
);

export default router;
