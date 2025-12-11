import { logger } from "@/utils/logger";
import { Request, Response } from "express";
import { prisma } from "@/config/database";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import * as emailService from "@/services/email";
import {
  getPlatformCommissionReport as generatePlatformReport,
  getRealtorCommissionReport as generateRealtorReport,
} from "@/services/commission";
import {
  logRealtorApproval,
  logRealtorRejection,
  logRealtorSuspension,
  logPropertyApproval,
  logPropertyRejection,
  logPayoutProcessed,
} from "@/services/auditLogger";
import { createAdminNotification } from "@/services/notificationService";

/**
 * @desc    Get all realtors (admin view)
 * @route   GET /api/admin/realtors
 * @access  Private (Admin only)
 */
export const getAllRealtors = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { status, page = 1, limit = 20, search } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status && typeof status === "string") {
      where.status = status.toUpperCase();
    }

    if (search && typeof search === "string") {
      where.OR = [
        { businessName: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [realtors, total] = await Promise.all([
      prisma.realtor.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              properties: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.realtor.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      message: "Realtors retrieved successfully",
      data: {
        realtors,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount: total,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
    });
  }
);

/**
 * @desc    Approve realtor account
 * @route   POST /api/admin/realtors/:id/approve
 * @access  Private (Admin only)
 */
export const approveRealtor = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const realtor = await prisma.realtor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!realtor) {
      throw new AppError("Realtor not found", 404);
    }

    if (realtor.status === "APPROVED") {
      throw new AppError("Realtor is already approved", 400);
    }

    // Update status to APPROVED
    const updatedRealtor = await prisma.realtor.update({
      where: { id },
      data: {
        status: "APPROVED",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    try {
      // Send approval email notification
      const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;
      await emailService.sendRealtorApproval(
        updatedRealtor.user.email,
        updatedRealtor.businessName,
        dashboardUrl
      );
    } catch (emailError) {
      logger.error("Failed to send approval email:", emailError);
      // Don't fail the approval process if email fails
    }

    // Log admin action
    try {
      await logRealtorApproval(
        req.user!.id,
        updatedRealtor.id,
        updatedRealtor.businessName,
        req
      );
    } catch (auditError) {
      logger.error("Failed to log realtor approval:", auditError);
    }

    res.json({
      success: true,
      message: "Realtor approved successfully",
      data: { realtor: updatedRealtor },
    });
  }
);

/**
 * @desc    Reject realtor account
 * @route   POST /api/admin/realtors/:id/reject
 * @access  Private (Admin only)
 */
export const rejectRealtor = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    const realtor = await prisma.realtor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!realtor) {
      throw new AppError("Realtor not found", 404);
    }

    if (realtor.status === "REJECTED") {
      throw new AppError("Realtor is already rejected", 400);
    }

    // Update status to REJECTED
    const updatedRealtor = await prisma.realtor.update({
      where: { id },
      data: {
        status: "REJECTED",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    try {
      // Send rejection email notification
      await emailService.sendRealtorRejection(
        updatedRealtor.user.email,
        updatedRealtor.businessName,
        reason || "Application does not meet our requirements"
      );
    } catch (emailError) {
      logger.error("Failed to send rejection email:", emailError);
      // Don't fail the rejection process if email fails
    }

    // Log admin action
    try {
      await logRealtorRejection(
        req.user!.id,
        updatedRealtor.id,
        updatedRealtor.businessName,
        reason || "Application does not meet our requirements",
        req
      );
    } catch (auditError) {
      logger.error("Failed to log realtor rejection:", auditError);
    }

    res.json({
      success: true,
      message: "Realtor application rejected",
      data: { realtor: updatedRealtor },
    });
  }
);

/**
 * @desc    Suspend realtor account with booking cancellation
 * @route   POST /api/admin/realtors/:id/suspend
 * @access  Private (Admin only)
 */
export const suspendRealtor = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      throw new AppError("Suspension reason is required", 400);
    }

    const realtor = await prisma.realtor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        properties: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!realtor) {
      throw new AppError("Realtor not found", 404);
    }

    if (!realtor.isActive) {
      throw new AppError("Realtor is already suspended", 400);
    }

    // Get all active bookings for this realtor's properties
    const activeBookings = await prisma.booking.findMany({
      where: {
        property: {
          realtorId: id,
        },
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
      include: {
        guest: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        property: {
          select: {
            title: true,
          },
        },
      },
    });

    // Suspend realtor account
    const updatedRealtor = await prisma.realtor.update({
      where: { id },
      data: {
        isActive: false,
        suspendedAt: new Date(),
        status: "SUSPENDED",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Deactivate all realtor properties
    await prisma.property.updateMany({
      where: { realtorId: id },
      data: { isActive: false },
    });

    // Suspend all active bookings
    if (activeBookings.length > 0) {
      const bookingIds = activeBookings.map((booking) => booking.id);

      // Import batch booking suspension
      const { batchUpdateBookingStatus } = await import(
        "@/services/bookingStatus"
      );

      await batchUpdateBookingStatus(bookingIds, "CANCELLED", {
        adminId: req.user!.id,
        reason: `Booking suspended due to realtor account suspension: ${reason}`,
        skipValidation: true,
      });

      // Send suspension notifications to guests
      try {
        const { sendBookingSuspensionNotification } = await import(
          "@/services/email"
        );

        for (const booking of activeBookings) {
          await sendBookingSuspensionNotification(
            booking.guest.email,
            {
              firstName: booking.guest.firstName,
              lastName: booking.guest.lastName,
            },
            {
              bookingId: booking.id,
              propertyTitle: booking.property.title,
              realtorBusinessName: realtor.businessName,
              reason: "suspicious activities detected",
            }
          );
        }
      } catch (emailError) {
        logger.error("Failed to send suspension notifications:", emailError);
        // Don't fail the suspension process if notifications fail
      }
    }

    // Send suspension email to realtor
    try {
      const { sendRealtorSuspension } = await import("@/services/email");
      await sendRealtorSuspension(
        realtor.user.email,
        realtor.businessName,
        reason
      );
    } catch (emailError) {
      logger.error("Failed to send realtor suspension email:", emailError);
    }

    // Log admin action
    try {
      await logRealtorSuspension(
        req.user!.id,
        realtor.id,
        realtor.businessName,
        reason,
        req
      );
    } catch (auditError) {
      logger.error("Failed to log realtor suspension:", auditError);
    }

    res.json({
      success: true,
      message: "Realtor suspended and bookings cancelled successfully",
      data: {
        realtor: updatedRealtor,
        suspendedBookings: activeBookings.length,
        affectedProperties: realtor.properties.length,
        notificationsSent: activeBookings.length,
      },
    });
  }
);

/**
 * @desc    Reinstate a suspended realtor
 * @route   POST /api/admin/realtors/:id/reinstate
 * @access  Private (Admin only)
 */
export const reinstateRealtor = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { notes } = req.body;

    const realtor = await prisma.realtor.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        properties: {
          select: { id: true, title: true },
        },
      },
    });

    if (!realtor) {
      throw new AppError("Realtor not found", 404);
    }

    if (realtor.isActive) {
      throw new AppError("Realtor is already active", 400);
    }

    // Reactivate realtor account
    const updatedRealtor = await prisma.realtor.update({
      where: { id },
      data: {
        isActive: true,
        suspendedAt: null,
        status: "APPROVED",
      },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    // Reactivate properties that were deactivated by suspension
    await prisma.property.updateMany({
      where: { realtorId: id, isActive: false },
      data: { isActive: true },
    });

    // Send reinstatement email to realtor
    try {
      const { sendRealtorApproval } = await import("@/services/email");
      await sendRealtorApproval(
        realtor.user.email,
        realtor.businessName,
        notes || "Your account has been reinstated and is now active."
      );
    } catch (emailError) {
      logger.error("Failed to send realtor reinstatement email:", emailError);
    }

    // Log admin action
    try {
      await logRealtorApproval(
        req.user!.id,
        realtor.id,
        realtor.businessName,
        req
      );
    } catch (auditError) {
      logger.error("Failed to log realtor reinstatement:", auditError);
    }

    // Create admin notification
    try {
      await createAdminNotification({
        type: "REALTOR_REINSTATED",
        title: `Realtor reinstated: ${realtor.businessName}`,
        message: `${realtor.businessName} has been reinstated by an admin. ${
          notes || ""
        }`,
        data: { realtorId: id, realtorName: realtor.businessName },
      });
    } catch (notificationError) {
      logger.error("Failed to create admin notification:", notificationError);
    }

    res.json({
      success: true,
      message: "Realtor reinstated successfully",
      data: {
        realtor: updatedRealtor,
        reactivatedProperties: realtor.properties.length,
      },
    });
  }
);

/**
 * @desc    Batch suspend bookings for realtor suspension
 * @route   PUT /api/admin/bookings/batch-suspend
 * @access  Private (Admin only)
 */
export const batchSuspendRealtorBookings = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { realtorId, reason } = req.body;

    if (!realtorId || !reason) {
      throw new AppError("Realtor ID and reason are required", 400);
    }

    // Get realtor details
    const realtor = await prisma.realtor.findUnique({
      where: { id: realtorId },
      select: {
        id: true,
        businessName: true,
        isActive: true,
      },
    });

    if (!realtor) {
      throw new AppError("Realtor not found", 404);
    }

    // Get all active bookings for this realtor
    const activeBookings = await prisma.booking.findMany({
      where: {
        property: {
          realtorId,
        },
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
      include: {
        guest: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        property: {
          select: {
            title: true,
          },
        },
      },
    });

    if (activeBookings.length === 0) {
      res.json({
        success: true,
        message: "No active bookings found for this realtor",
        data: {
          suspendedBookings: 0,
          notificationsSent: 0,
        },
      });
      return;
    }

    const bookingIds = activeBookings.map((booking) => booking.id);

    // Batch suspend bookings
    const { batchUpdateBookingStatus } = await import(
      "@/services/bookingStatus"
    );

    const result = await batchUpdateBookingStatus(bookingIds, "CANCELLED", {
      adminId: req.user!.id,
      reason: `Realtor suspension: ${reason}`,
      skipValidation: true,
    });

    // Send notifications to affected guests
    let notificationsSent = 0;
    try {
      const { sendBookingSuspensionNotification } = await import(
        "@/services/email"
      );

      for (const booking of activeBookings) {
        try {
          await sendBookingSuspensionNotification(
            booking.guest.email,
            {
              firstName: booking.guest.firstName,
              lastName: booking.guest.lastName,
            },
            {
              bookingId: booking.id,
              propertyTitle: booking.property.title,
              realtorBusinessName: realtor.businessName,
              reason: "suspicious activities detected from the property host",
            }
          );
          notificationsSent++;
        } catch (emailError) {
          logger.error(
            `Failed to notify guest ${booking.guest.email}:`,
            emailError
          );
        }
      }
    } catch (emailError) {
      logger.error("Failed to send suspension notifications:", emailError);
    }

    res.json({
      success: true,
      message: `Successfully suspended ${result.successful.length} bookings and notified ${notificationsSent} guests`,
      data: {
        successful: result.successful,
        failed: result.failed,
        suspendedBookings: result.successful.length,
        notificationsSent,
        realtorBusinessName: realtor.businessName,
      },
    });
  }
);

/**
 * @desc    Get all properties (admin view)
 * @route   GET /api/admin/properties
 * @access  Private (Admin only)
 */
export const getAllProperties = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { isApproved, page = 1, limit = 20, search } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (isApproved !== undefined) {
      where.isApproved = isApproved === "true";
    }

    if (search && typeof search === "string") {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        {
          realtor: { businessName: { contains: search, mode: "insensitive" } },
        },
      ];
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          realtor: {
            select: {
              id: true,
              slug: true,
              // status field not available in MVP
              user: {
                select: {},
              },
            },
          },
          images: {
            select: {
              url: true,
              order: true,
            },
            orderBy: { order: "asc" },
            take: 1,
          },
          _count: {
            select: {
              bookings: true,
              reviews: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.property.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      message: "Properties retrieved successfully",
      data: {
        properties,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount: total,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
    });
  }
);

/**
 * @desc    Approve property
 * @route   POST /api/admin/properties/:id/approve
 * @access  Private (Admin only)
 */
export const approveProperty = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { notes } = req.body;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        realtor: {
          select: {
            businessName: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    // MVP: All properties are auto-approved, just ensure it's active
    if (!property.isActive) {
      throw new AppError("Property is already inactive", 400);
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        // MVP: Properties are auto-approved, no approvedBy or approvedAt fields
      },
    });

    // Create audit log
    // MVP: Audit logging not implemented

    res.json({
      success: true,
      message: "Property approved successfully",
      data: { property: updatedProperty },
    });
  }
);

/**
 * @desc    Reject property
 * @route   POST /api/admin/properties/:id/reject
 * @access  Private (Admin only)
 */
export const rejectProperty = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      throw new AppError("Rejection reason is required", 400);
    }

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        realtor: {
          select: {
            businessName: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        isActive: false, // MVP: Deactivate instead of reject
      },
    });

    // MVP: Audit logging not implemented

    res.json({
      success: true,
      message: "Property rejected successfully",
      data: { property: updatedProperty },
    });
  }
);

/**
 * @desc    Get platform analytics
 * @route   GET /api/admin/analytics
 * @access  Private (Admin only)
 */
export const getPlatformAnalytics = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { timeRange = "30d" } = req.query;

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const previousPeriodStart = new Date(startDate);
    const daysDifference = Math.ceil(
      (now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
    );
    previousPeriodStart.setDate(previousPeriodStart.getDate() - daysDifference);

    const [
      // Current period metrics
      totalUsers,
      totalRealtors,
      activeRealtors,
      pendingRealtors,
      totalProperties,
      activeProperties,
      totalBookings,
      completedBookings,
      pendingBookings,
      cancelledBookings,
      totalRevenue,

      // Previous period metrics for growth calculation
      previousUsers,
      previousRealtors,
      previousProperties,
      previousBookings,
      previousRevenue,

      // Reviews and ratings
      totalReviews,
      averageRating,
    ] = await Promise.all([
      // Current period
      prisma.user.count({ where: { createdAt: { gte: startDate } } }),
      prisma.realtor.count({ where: { createdAt: { gte: startDate } } }),
      prisma.realtor.count({
        where: { isActive: true, createdAt: { gte: startDate } },
      }),
      prisma.realtor.count({
        where: { isActive: false, createdAt: { gte: startDate } },
      }),
      prisma.property.count({ where: { createdAt: { gte: startDate } } }),
      prisma.property.count({
        where: { isActive: true, createdAt: { gte: startDate } },
      }),
      prisma.booking.count({ where: { createdAt: { gte: startDate } } }),
      prisma.booking.count({
        where: { status: "COMPLETED", createdAt: { gte: startDate } },
      }),
      prisma.booking.count({
        where: { status: "PENDING", createdAt: { gte: startDate } },
      }),
      prisma.booking.count({
        where: { status: "CANCELLED", createdAt: { gte: startDate } },
      }),
      prisma.payment.aggregate({
        where: { status: "COMPLETED", createdAt: { gte: startDate } },
        _sum: { amount: true },
      }),

      // Previous period
      prisma.user.count({
        where: { createdAt: { gte: previousPeriodStart, lt: startDate } },
      }),
      prisma.realtor.count({
        where: { createdAt: { gte: previousPeriodStart, lt: startDate } },
      }),
      prisma.property.count({
        where: { createdAt: { gte: previousPeriodStart, lt: startDate } },
      }),
      prisma.booking.count({
        where: { createdAt: { gte: previousPeriodStart, lt: startDate } },
      }),
      prisma.payment.aggregate({
        where: {
          status: "COMPLETED",
          createdAt: { gte: previousPeriodStart, lt: startDate },
        },
        _sum: { amount: true },
      }),

      // Reviews and ratings
      prisma.review.count({ where: { createdAt: { gte: startDate } } }),
      prisma.review.aggregate({
        where: { createdAt: { gte: startDate } },
        _avg: { rating: true },
      }),
    ]);

    // Calculate growth rates
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Get property type distribution
    const propertyTypes = await prisma.property.groupBy({
      by: ["type"],
      where: { createdAt: { gte: startDate } },
      _count: true,
    });

    // Get location performance
    const locationData = await prisma.property.groupBy({
      by: ["city"],
      where: {
        createdAt: { gte: startDate },
        isActive: true,
      },
      _count: true,
      orderBy: {
        _count: {
          city: "desc",
        },
      },
      take: 10,
    });

    // Get booking status distribution
    const bookingStatusData = await prisma.booking.groupBy({
      by: ["status"],
      where: { createdAt: { gte: startDate } },
      _count: true,
    });

    // Get monthly trends
    const monthsBack = timeRange === "1y" ? 12 : timeRange === "90d" ? 3 : 1;
    const monthlyTrendsStart = new Date();
    monthlyTrendsStart.setMonth(monthlyTrendsStart.getMonth() - monthsBack);

    const monthlyBookings = await prisma.booking.findMany({
      where: { createdAt: { gte: monthlyTrendsStart } },
      select: { createdAt: true, totalPrice: true, status: true },
      orderBy: { createdAt: "asc" },
    });

    const monthlyRevenue = await prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: monthlyTrendsStart },
      },
      select: { createdAt: true, amount: true },
      orderBy: { createdAt: "asc" },
    });

    // Process monthly data
    const monthlyData = [];
    for (let i = monthsBack; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const monthBookings = monthlyBookings.filter(
        (b) => b.createdAt >= monthStart && b.createdAt < monthEnd
      );
      const monthRev = monthlyRevenue.filter(
        (r) => r.createdAt >= monthStart && r.createdAt < monthEnd
      );

      monthlyData.push({
        month: monthStart.toLocaleString("default", { month: "short" }),
        bookings: monthBookings.length,
        revenue: monthRev.reduce((sum, r) => sum + Number(r.amount), 0),
        completed: monthBookings.filter((b) => b.status === "COMPLETED").length,
      });
    }

    // Get top realtors by revenue
    const topRealtors = await prisma.realtor.findMany({
      select: {
        id: true,
        businessName: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        properties: {
          select: {
            bookings: {
              where: { status: "COMPLETED" },
              select: {
                totalPrice: true, // MVP: Use totalPrice for revenue calculation
              },
            },
          },
        },
      },
      take: 10,
    });

    const realtorsWithRevenue = topRealtors
      .map((realtor) => {
        const totalRevenue = realtor.properties.reduce(
          (sum: number, property: any) => {
            const propertyRevenue = property.bookings.reduce(
              (pSum: number, booking: any) => {
                return pSum + Number(booking.totalPrice ?? 0); // MVP: Use totalPrice for revenue
              },
              0
            );
            return sum + propertyRevenue;
          },
          0
        );

        return {
          ...realtor,
          totalRevenue,
          properties: undefined, // Remove nested data
        };
      })
      .sort((a, b) => Number(b.totalRevenue) - Number(a.totalRevenue));

    res.json({
      success: true,
      message: "Platform analytics retrieved successfully",
      data: {
        timeRange,
        overview: {
          users: {
            total: totalUsers,
            growth: calculateGrowth(totalUsers, previousUsers),
          },
          realtors: {
            total: totalRealtors,
            active: activeRealtors,
            pending: pendingRealtors,
            growth: calculateGrowth(totalRealtors, previousRealtors),
          },
          properties: {
            total: totalProperties,
            active: activeProperties,
            growth: calculateGrowth(totalProperties, previousProperties),
          },
          bookings: {
            total: totalBookings,
            completed: completedBookings,
            pending: pendingBookings,
            cancelled: cancelledBookings,
            growth: calculateGrowth(totalBookings, previousBookings),
          },
          revenue: {
            total: Number(totalRevenue._sum.amount ?? 0),
            growth: calculateGrowth(
              Number(totalRevenue._sum.amount ?? 0),
              Number(previousRevenue._sum.amount ?? 0)
            ),
          },
          performance: {
            averageRating: averageRating._avg.rating ?? 0,
            totalReviews,
            occupancyRate:
              activeProperties > 0
                ? (completedBookings / activeProperties) * 100
                : 0,
            conversionRate:
              totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
          },
        },
        trends: {
          monthly: monthlyData,
        },
        breakdowns: {
          propertyTypes: propertyTypes.map((type) => ({
            type: type.type,
            count: type._count,
            percentage:
              totalProperties > 0 ? (type._count / totalProperties) * 100 : 0,
          })),
          locations: locationData.map((location) => ({
            city: location.city,
            count: location._count,
          })),
          bookingStatus: bookingStatusData.map((status) => ({
            status: status.status,
            count: status._count,
            percentage:
              totalBookings > 0 ? (status._count / totalBookings) * 100 : 0,
          })),
        },
      },
    });
  }
);

// COMMISSION MANAGEMENT ENDPOINTS

/**
 * @desc    Get platform commission report
 * @route   GET /api/admin/commission/platform-report
 * @access  Private (Admin only)
 */
export const getPlatformCommissionReport = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const report = await generatePlatformReport(start, end);

    res.json({
      success: true,
      data: {
        report: {
          totalRevenue: report.totalRevenue?.toString() || "0",
          totalCommissions: report.totalCommissions?.toString() || "0",
          totalPayouts: report.totalPayouts?.toString() || "0",
          pendingPayouts: report.pendingPayouts?.toString() || "0",
          totalBookings: report.totalBookings ?? 0,
          activeRealtors: report.activeRealtors ?? 0,
        },
        period: {
          startDate: start?.toISOString() || "All time",
          endDate: end?.toISOString() || "Present",
        },
      },
    });
  }
);

/**
 * @desc    Get realtor commission report
 * @route   GET /api/admin/commission/realtor/:realtorId
 * @access  Private (Admin only)
 */
export const getRealtorCommissionReport = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { realtorId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const report = await generateRealtorReport(realtorId, start, end);

    res.json({
      success: true,
      data: {
        report: {
          realtorId: report.realtorId,
          totalEarnings: report.totalEarnings?.toString() || "0",
          totalCommissionPaid: report.totalCommissionPaid?.toString() || "0",
          pendingPayouts: report.pendingPayouts?.toString() || "0",
          completedPayouts: report.completedPayouts?.toString() || "0",
          payoutCount: report.payoutCount ?? 0,
          bookingCount: report.bookingCount ?? 0,
        },
        period: {
          startDate: start?.toISOString() || "All time",
          endDate: end?.toISOString() || "Present",
        },
      },
    });
  }
);

/**
 * @desc    Process payout to realtor
 * @route   POST /api/admin/commission/payout/:paymentId
 * @access  Private (Admin only)
 */
export const processRealtorPayout = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { paymentId } = req.params;
    const { payoutReference } = req.body;

    // Get payment details for audit logging
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            property: {
              include: { realtor: true },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    const { processRealtorPayout: processPayout } = await import(
      "@/services/commission"
    );

    await processPayout(paymentId, payoutReference);

    // Log admin action
    try {
      await logPayoutProcessed(
        req.user!.id,
        paymentId,
        payment.booking.property.realtorId,
        payment.realtorEarnings?.toString() || "0",
        payment.currency,
        req
      );
    } catch (auditError) {
      logger.error("Failed to log payout processing:", auditError);
    }

    // Create admin notification for payout completion
    createAdminNotification({
      type: "PAYOUT_COMPLETED",
      title: "Payout Completed",
      message: `Payout of ${payment.currency} ${
        payment.realtorEarnings?.toString() || "0"
      } to ${
        payment.booking.property.realtor.businessName
      } has been processed.`,
      data: {
        paymentId,
        realtorId: payment.booking.property.realtorId,
        realtorName: payment.booking.property.realtor.businessName,
        amount: payment.realtorEarnings?.toString() || "0",
        currency: payment.currency,
        payoutReference,
      },
      priority: "low",
    }).catch((err) => logger.error("Admin notification failed", err));

    res.json({
      success: true,
      message: "Payout processed successfully",
      data: {
        paymentId,
        payoutReference,
        processedAt: new Date().toISOString(),
      },
    });
  }
);

/**
 * @desc    Get pending payouts
 * @route   GET /api/admin/commission/pending-payouts
 * @access  Private (Admin only)
 */
export const getPendingPayouts = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 20, realtorId } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      status: "COMPLETED",
      commissionPaidOut: false,
      realtorEarnings: { not: null },
    };

    if (realtorId) {
      where.booking = {
        property: {
          realtorId: realtorId as string,
        },
      };
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          booking: {
            include: {
              property: {
                include: {
                  realtor: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          email: true,
                          firstName: true,
                          lastName: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.payment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        payments: payments.map((payment) => ({
          id: payment.id,
          bookingId: payment.bookingId,
          amount: payment.amount.toString(),
          realtorEarnings: payment.realtorEarnings?.toString(),
          currency: payment.currency,
          paidAt: payment.paidAt,
          realtor: {
            id: payment.booking.property.realtor.id,
            businessName: payment.booking.property.realtor.businessName,
            user: payment.booking.property.realtor.user,
          },
          property: {
            id: payment.booking.property.id,
            title: payment.booking.property.title,
          },
        })),
        pagination: {
          page: pageNum,
          pages: totalPages,
          total,
          hasMore: pageNum < totalPages,
        },
      },
    });
  }
);

/**
 * @desc    Get admin notifications
 * @route   GET /api/admin/notifications
 * @access  Private (Admin only)
 */
export const getAdminNotifications = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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
  }
);

/**
 * @desc    Mark admin notification as read
 * @route   PUT /api/admin/notifications/:notificationId/read
 * @access  Private (Admin only)
 */
export const markAdminNotificationAsRead = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { notificationId } = req.params;

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
    });
  }
);

/**
 * @desc    Mark all admin notifications as read
 * @route   PUT /api/admin/notifications/mark-all-read
 * @access  Private (Admin only)
 */
export const markAllAdminNotificationsAsRead = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await prisma.notification.updateMany({
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
    });
  }
);
