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
import { logger } from "@/utils/logger";
import disputeService from "@/services/disputeService";
import { config } from "@/config";

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

const BOOKING_PAYMENT_TIMEOUT_MS =
  config.BOOKING_PAYMENT_TIMEOUT_MINUTES * 60 * 1000;

const getStaleUnpaidBookingFilter = (): Prisma.BookingWhereInput => {
  const paymentUnpaidOrFailed: Prisma.BookingWhereInput["OR"] = [
    { payment: { is: null } },
    {
      payment: {
        is: {
          paidAt: null,
          status: {
            in: [PaymentStatus.INITIATED, PaymentStatus.FAILED],
          },
        },
      },
    },
  ];

  return {
    NOT: {
      OR: [
        {
          status: BookingStatus.PENDING,
          createdAt: {
            lt: new Date(Date.now() - BOOKING_PAYMENT_TIMEOUT_MS),
          },
          OR: paymentUnpaidOrFailed,
        },
        {
          status: BookingStatus.CANCELLED,
          OR: paymentUnpaidOrFailed,
        },
      ],
    },
  };
};

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

    const where: Prisma.BookingWhereInput = {
      ...getStaleUnpaidBookingFilter(),
    };

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
              // phone: true,
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

    const statsWhereBase: Prisma.BookingWhereInput = {
      ...getStaleUnpaidBookingFilter(),
    };

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
      prisma.booking.count({
        where: statsWhereBase,
      }),
      prisma.booking.count({
        where: {
          ...statsWhereBase,
          status: BookingStatus.PENDING,
        },
      }),
      prisma.booking.count({
        where: {
          ...statsWhereBase,
          status: BookingStatus.ACTIVE,
        },
      }),
      prisma.booking.count({
        where: {
          ...statsWhereBase,
          status: BookingStatus.CANCELLED,
        },
      }),
      prisma.booking.count({
        where: {
          ...statsWhereBase,
          status: BookingStatus.COMPLETED,
        },
      }),
      prisma.booking.count({
        where: {
          ...statsWhereBase,
          createdAt: { gte: startDate },
        },
      }),
      prisma.payment.aggregate({
        where: {
          status: { in: ["PARTIALLY_RELEASED", "SETTLED"] },
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
                    // phone: true,
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
 *     summary: Disabled endpoint (admin status update)
 *     description: Manual admin status updates are disabled. Booking state is system-managed.
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
  asyncHandler(async (_req: AuthenticatedRequest, _res: Response) => {
    throw new AppError(
      "Manual admin booking status updates are disabled. Booking state is managed automatically by payment, stay, and dispute flows.",
      410
    );
  })
);

/**
 * @swagger
 * /api/admin/bookings/{id}/cancel:
 *   post:
 *     summary: Disabled endpoint (admin cancellation)
 *     description: Manual admin cancellation is disabled. Use refunds/disputes workflows.
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
  asyncHandler(async (_req: AuthenticatedRequest, _res: Response) => {
    throw new AppError(
      "Manual admin booking cancellations are disabled. Use refund and dispute workflows instead.",
      410
    );
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
              ? PaymentStatus.REFUNDED
              : PaymentStatus.REFUNDED,
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

