import { Request, Response } from "express";
import { prisma } from "@/config/database";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import * as emailService from "@/services/email";
import {
  logRealtorApproval,
  logRealtorRejection,
  logRealtorSuspension,
  logPropertyApproval,
  logPropertyRejection,
  logPayoutProcessed,
} from "@/services/auditLogger";

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
      console.error("Failed to send approval email:", emailError);
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
      console.error("Failed to log realtor approval:", auditError);
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
      console.error("Failed to send rejection email:", emailError);
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
      console.error("Failed to log realtor rejection:", auditError);
    }

    res.json({
      success: true,
      message: "Realtor application rejected",
      data: { realtor: updatedRealtor },
    });
  }
);

/**
 * @desc    Suspend realtor account
 * @route   POST /api/admin/realtors/:id/suspend
 * @access  Private (Admin only)
 */
export const suspendRealtor = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const realtor = await prisma.realtor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!realtor) {
      throw new AppError("Realtor not found", 404);
    }

    // MVP: Deactivate realtor and properties instead of suspension workflow
    const updatedRealtor = await prisma.realtor.update({
      where: { id },
      data: {
        isActive: false,
      },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    // Deactivate all realtor properties
    await prisma.property.updateMany({
      where: { realtorId: id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: "Realtor and properties deactivated successfully",
      data: { realtor: updatedRealtor },
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
                return pSum + Number(booking.totalPrice || 0); // MVP: Use totalPrice for revenue
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
            total: Number(totalRevenue._sum.amount || 0),
            growth: calculateGrowth(
              Number(totalRevenue._sum.amount || 0),
              Number(previousRevenue._sum.amount || 0)
            ),
          },
          performance: {
            averageRating: averageRating._avg.rating || 0,
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

    const { getPlatformCommissionReport: generateReport } = await import(
      "@/services/commission"
    );

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const report = await generateReport(start, end);

    res.json({
      success: true,
      data: {
        report: {
          ...report,
          totalRevenue: report.totalRevenue.toString(),
          totalCommissions: report.totalCommissions.toString(),
          totalPayouts: report.totalPayouts.toString(),
          pendingPayouts: report.pendingPayouts.toString(),
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

    const { getRealtorCommissionReport: generateReport } = await import(
      "@/services/commission"
    );

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const report = await generateReport(realtorId, start, end);

    res.json({
      success: true,
      data: {
        report: {
          ...report,
          totalEarnings: report.totalEarnings.toString(),
          totalCommissionPaid: report.totalCommissionPaid.toString(),
          pendingPayouts: report.pendingPayouts.toString(),
          completedPayouts: report.completedPayouts.toString(),
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
      console.error("Failed to log payout processing:", auditError);
    }

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
