import { Response } from "express";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/config/database";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import {
  safeTransitionBookingStatus,
  batchUpdateBookingStatus,
  canCancelBooking,
  getNextAllowedStatuses,
  BOOKING_STATUS_TRANSITIONS,
} from "@/services/bookingStatus";

/**
 * @desc    Update booking status (Admin only)
 * @route   PUT /api/admin/bookings/:id/status
 * @access  Private (Admin only)
 */
export const updateBookingStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { status, reason, skipValidation = false } = req.body;

    if (!Object.values(BookingStatus).includes(status)) {
      throw new AppError("Invalid booking status", 400);
    }

    const result = await safeTransitionBookingStatus(id, status, {
      adminId: req.user!.id,
      reason,
      skipValidation,
    });

    if (!result.success) {
      throw new AppError(
        result.error || "Failed to update booking status",
        400
      );
    }

    res.json({
      success: true,
      message: "Booking status updated successfully",
      data: {
        booking: result.booking,
        statusChange: {
          to: status,
          reason,
          updatedBy: req.user!.id,
          timestamp: new Date(),
        },
      },
    });
  }
);

/**
 * @desc    Batch update booking statuses (Admin only)
 * @route   PUT /api/admin/bookings/batch-status
 * @access  Private (Admin only)
 */
export const batchUpdateBookingStatuses = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookingIds, status, reason, skipValidation = false } = req.body;

    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      throw new AppError("Booking IDs array is required", 400);
    }

    if (!Object.values(BookingStatus).includes(status)) {
      throw new AppError("Invalid booking status", 400);
    }

    if (!reason) {
      throw new AppError("Reason is required for batch status updates", 400);
    }

    const result = await batchUpdateBookingStatus(bookingIds, status, {
      adminId: req.user!.id,
      reason,
      skipValidation,
    });

    res.json({
      success: true,
      message: `Batch status update completed: ${result.successful.length} successful, ${result.failed.length} failed`,
      data: {
        successful: result.successful,
        failed: result.failed,
        summary: {
          totalAttempted: bookingIds.length,
          successful: result.successful.length,
          failed: result.failed.length,
        },
      },
    });
  }
);

/**
 * @desc    Get booking status workflow information
 * @route   GET /api/admin/bookings/:id/status-info
 * @access  Private (Admin only)
 */
export const getBookingStatusInfo = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        payment: true,
        property: {
          include: {
            realtor: {
              select: {
                id: true,
                businessName: true,
              },
            },
          },
        },
        guest: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    const currentStatus = booking.status as BookingStatus;
    const nextAllowedStatuses = getNextAllowedStatuses(currentStatus);
    const cancellationInfo = await canCancelBooking(id);

    res.json({
      success: true,
      data: {
        booking: {
          id: booking.id,
          status: currentStatus,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          totalPrice: booking.totalPrice,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
          property: booking.property,
          guest: booking.guest,
          payment: booking.payment
            ? {
                id: booking.payment.id,
                status: booking.payment.status,
                amount: booking.payment.amount,
                currency: booking.payment.currency,
                paidAt: booking.payment.paidAt,
              }
            : null,
        },
        statusWorkflow: {
          current: currentStatus,
          nextAllowed: nextAllowedStatuses,
          allTransitions: BOOKING_STATUS_TRANSITIONS,
          isTerminal: nextAllowedStatuses.length === 0,
        },
        cancellation: cancellationInfo,
      },
    });
  }
);

/**
 * @desc    Get booking status statistics
 * @route   GET /api/admin/bookings/status-stats
 * @access  Private (Admin only)
 */
export const getBookingStatusStats = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { startDate, endDate, realtorId, propertyId } = req.query;

    const where: any = {};

    if (startDate) {
      where.createdAt = { gte: new Date(startDate as string) };
    }

    if (endDate) {
      if (!where.createdAt) where.createdAt = {};
      where.createdAt.lte = new Date(endDate as string);
    }

    if (realtorId) {
      where.property = { realtorId: realtorId as string };
    }

    if (propertyId) {
      where.propertyId = propertyId as string;
    }

    // Get status distribution
    const statusStats = await prisma.booking.groupBy({
      by: ["status"],
      where,
      _count: {
        status: true,
      },
    });

    // Get total bookings count
    const totalBookings = await prisma.booking.count({ where });

    // Get recent status changes (from audit logs)
    const recentStatusChanges = await prisma.auditLog.findMany({
      where: {
        action: "BOOKING_STATUS_UPDATE",
        ...(startDate && { timestamp: { gte: new Date(startDate as string) } }),
        ...(endDate && { timestamp: { lte: new Date(endDate as string) } }),
      },
      include: {
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
      take: 20,
    });

    // Calculate conversion rates
    const confirmedBookings =
      statusStats.find((s) => s.status === "CONFIRMED")?._count.status || 0;
    const completedBookings =
      statusStats.find((s) => s.status === "COMPLETED")?._count.status || 0;
    const cancelledBookings =
      statusStats.find((s) => s.status === "CANCELLED")?._count.status || 0;

    const metrics = {
      conversionRate:
        totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0,
      completionRate:
        confirmedBookings > 0
          ? (completedBookings / confirmedBookings) * 100
          : 0,
      cancellationRate:
        totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0,
    };

    res.json({
      success: true,
      data: {
        overview: {
          totalBookings,
          statusDistribution: statusStats.map((stat) => ({
            status: stat.status,
            count: stat._count.status,
            percentage:
              totalBookings > 0
                ? (stat._count.status / totalBookings) * 100
                : 0,
          })),
          metrics,
        },
        recentChanges: recentStatusChanges.map((change) => ({
          id: change.id,
          bookingId: change.entityId,
          timestamp: change.timestamp,
          details: change.details,
          admin: change.admin,
        })),
        period: {
          startDate: (startDate as string) || "All time",
          endDate: (endDate as string) || "Present",
        },
      },
    });
  }
);
