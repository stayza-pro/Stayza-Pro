import { Response } from "express";
import { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/config/database";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { auditLogger } from "@/services/auditLogger";
import {
  safeTransitionBookingStatus,
  canCancelBooking,
  BookingStatusConflictError,
  InvalidStatusTransitionError,
} from "@/services/bookingStatus";
import {
  NotificationService,
  notificationHelpers,
} from "@/services/notificationService";

interface AdminBookingSearchQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: BookingStatus;
  search?: string; // Search by guest name, property title, or booking ID
  dateFrom?: string;
  dateTo?: string;
  realtorId?: string;
  guestId?: string;
  minAmount?: string;
  maxAmount?: string;
}

/**
 * @desc    Get all bookings for admin dashboard
 * @route   GET /api/admin/bookings
 * @access  Admin
 */
export const getAdminBookings = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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
    const limitNum = Math.min(parseInt(limit, 10), 100); // Max 100 per page
    const skip = (pageNum - 1) * limitNum;

    // Build where clause for advanced filtering
    const where: Prisma.BookingWhereInput = {};

    // Status filter
    if (status) {
      where.status = status;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.checkInDate = {};
      if (dateFrom) where.checkInDate.gte = new Date(dateFrom);
      if (dateTo) where.checkInDate.lte = new Date(dateTo);
    }

    // Realtor/Guest filter
    if (realtorId) {
      where.property = {
        realtorId: realtorId,
      };
    }
    if (guestId) {
      where.guestId = guestId;
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      where.totalPrice = {};
      if (minAmount) where.totalPrice.gte = parseFloat(minAmount);
      if (maxAmount) where.totalPrice.lte = parseFloat(maxAmount);
    }

    // Search functionality (guest name, property title, booking ID)
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

    // Execute queries
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

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

    // Log admin action
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
  }
);

/**
 * @desc    Get booking statistics for admin dashboard
 * @route   GET /api/admin/bookings/stats
 * @access  Admin
 */
export const getBookingStats = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { period = "30" } = req.query; // Days to look back
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
      // Total bookings
      prisma.booking.count(),

      // Pending bookings
      prisma.booking.count({
        where: { status: BookingStatus.PENDING },
      }),

      // Confirmed bookings
      prisma.booking.count({
        where: { status: BookingStatus.CONFIRMED },
      }),

      // Cancelled bookings
      prisma.booking.count({
        where: { status: BookingStatus.CANCELLED },
      }),

      // Completed bookings
      prisma.booking.count({
        where: { status: BookingStatus.COMPLETED },
      }),

      // Recent bookings (last N days)
      prisma.booking.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),

      // Total revenue from completed bookings
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

      // Average booking value
      prisma.booking.aggregate({
        _avg: {
          totalPrice: true,
        },
      }),
    ]);

    // Calculate conversion rates
    const conversionRate =
      totalBookings > 0
        ? ((confirmedBookings + completedBookings) / totalBookings) * 100
        : 0;

    const cancellationRate =
      totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

    // Log admin action
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
  }
);

/**
 * @desc    Get single booking details for admin
 * @route   GET /api/admin/bookings/:id
 * @access  Admin
 */
export const getAdminBookingById = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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

    // Log admin action
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
  }
);

/**
 * @desc    Update booking status (admin override)
 * @route   PUT /api/admin/bookings/:id/status
 * @access  Admin
 */
export const updateAdminBookingStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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
      // Use safe transition service with admin override
      const updatedBooking = await safeTransitionBookingStatus(
        booking.id,
        status,
        {
          adminId: req.user!.id,
          reason,
          skipValidation: true, // Admin override
        }
      );

      // Send notifications to relevant parties
      const notificationData = {
        bookingId: booking.id,
        propertyTitle: booking.property.title,
        newStatus: status,
        reason,
        adminName: `${req.user!.firstName} ${req.user!.lastName}`,
      };

      // Notify guest
      const guestNotificationData =
        notificationHelpers.bookingStatusChanged(notificationData);
      await NotificationService.getInstance().createAndSendNotification({
        userId: booking.guestId,
        ...guestNotificationData,
      });

      // Notify realtor
      const realtorNotificationData =
        notificationHelpers.bookingStatusChanged(notificationData);
      await NotificationService.getInstance().createAndSendNotification({
        userId: booking.property.realtor.userId,
        ...realtorNotificationData,
      });

      // Log admin action
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
  }
);

/**
 * @desc    Cancel booking with refund processing
 * @route   POST /api/admin/bookings/:id/cancel
 * @access  Admin
 */
export const adminCancelBooking = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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
      // Calculate refund amount
      const refundAmount = booking.payment
        ? (Number(booking.payment.amount) * refundPercentage) / 100
        : 0;

      // Update booking status
      const updatedBooking = await safeTransitionBookingStatus(
        booking.id,
        BookingStatus.CANCELLED,
        {
          adminId: req.user!.id,
          reason,
          skipValidation: true, // Admin override
        }
      );

      // Process refund if payment exists and refund percentage > 0
      if (booking.payment && refundAmount > 0) {
        await prisma.payment.update({
          where: { id: booking.payment.id },
          data: {
            refundAmount,
            refundedAt: new Date(),
          },
        });

        // Here you would integrate with actual payment processor for refund
        // For now, we'll log the refund action
        console.log(`Refund of ${refundAmount} processed for booking ${id}`);
      }

      // Send notifications
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

      // Log admin action
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
  }
);
