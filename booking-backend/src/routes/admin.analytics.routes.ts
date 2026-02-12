import express, { Response } from "express";
import { prisma } from "@/config/database";
import { AuthenticatedRequest } from "@/types";
import { asyncHandler } from "@/middleware/errorHandler";
import { PaymentStatus, Prisma } from "@prisma/client";
import { loadFinanceConfig } from "@/services/financeConfig";

const router = express.Router();

const COMMISSION_REPORT_STATUSES: PaymentStatus[] = [
  PaymentStatus.PARTIALLY_RELEASED,
  PaymentStatus.SETTLED,
];

const paymentReportSelect = {
  amount: true,
  roomFeeSplitRealtorAmount: true,
  realtorEarnings: true,
  roomFeeSplitPlatformAmount: true,
  platformFeeAmount: true,
  platformCommission: true,
  roomFeeSplitDone: true,
  commissionPaidOut: true,
  booking: {
    select: {
      property: {
        select: {
          realtorId: true,
        },
      },
    },
  },
} as const;

type PaymentReportRow = Prisma.PaymentGetPayload<{
  select: typeof paymentReportSelect;
}>;

const toNumber = (value: unknown): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const getRealtorEarningsAmount = (payment: PaymentReportRow): number => {
  return toNumber(
    payment.roomFeeSplitRealtorAmount ?? payment.realtorEarnings ?? 0
  );
};

const getPlatformCommissionAmount = (payment: PaymentReportRow): number => {
  return toNumber(
    payment.roomFeeSplitPlatformAmount ??
      payment.platformFeeAmount ??
      payment.platformCommission ??
      0
  );
};

const generatePlatformReport = async (startDate?: Date, endDate?: Date) => {
  const whereClause: Prisma.PaymentWhereInput = {
    status: {
      in: COMMISSION_REPORT_STATUSES,
    },
  };

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = startDate;
    if (endDate) whereClause.createdAt.lte = endDate;
  }

  const payments = await prisma.payment.findMany({
    where: whereClause,
    select: paymentReportSelect,
  });

  const totalRevenue = payments.reduce(
    (sum, payment) => sum + toNumber(payment.amount),
    0
  );
  const totalCommissions = payments.reduce(
    (sum, payment) => sum + getPlatformCommissionAmount(payment),
    0
  );
  const totalPayouts = payments.reduce((sum, payment) => {
    if (payment.roomFeeSplitDone || payment.commissionPaidOut) {
      return sum + getRealtorEarningsAmount(payment);
    }
    return sum;
  }, 0);
  const pendingPayouts = payments.reduce((sum, payment) => {
    if (!payment.roomFeeSplitDone && !payment.commissionPaidOut) {
      return sum + getRealtorEarningsAmount(payment);
    }
    return sum;
  }, 0);
  const activeRealtors = new Set(
    payments.map((payment) => payment.booking.property.realtorId)
  ).size;

  return {
    totalRevenue,
    totalCommissions,
    totalPayouts,
    pendingPayouts,
    totalBookings: payments.length,
    activeRealtors,
  };
};

const generateRealtorReport = async (
  realtorId: string,
  startDate?: Date,
  endDate?: Date
) => {
  const whereClause: Prisma.PaymentWhereInput = {
    booking: {
      property: {
        realtorId,
      },
    },
    status: {
      in: COMMISSION_REPORT_STATUSES,
    },
  };

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = startDate;
    if (endDate) whereClause.createdAt.lte = endDate;
  }

  const payments = await prisma.payment.findMany({
    where: whereClause,
    select: paymentReportSelect,
  });

  const totalEarnings = payments.reduce(
    (sum, payment) => sum + getRealtorEarningsAmount(payment),
    0
  );
  const totalCommissionPaid = payments.reduce(
    (sum, payment) => sum + getPlatformCommissionAmount(payment),
    0
  );
  const completedPayouts = payments.reduce((sum, payment) => {
    if (payment.roomFeeSplitDone || payment.commissionPaidOut) {
      return sum + getRealtorEarningsAmount(payment);
    }
    return sum;
  }, 0);
  const pendingPayouts = payments.reduce((sum, payment) => {
    if (!payment.roomFeeSplitDone && !payment.commissionPaidOut) {
      return sum + getRealtorEarningsAmount(payment);
    }
    return sum;
  }, 0);

  return {
    realtorId,
    totalEarnings,
    totalCommissionPaid,
    pendingPayouts,
    completedPayouts,
    payoutCount: payments.filter((payment) => payment.commissionPaidOut).length,
    bookingCount: payments.length,
  };
};

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get platform analytics
 *     description: Get comprehensive platform analytics including users, realtors, properties, bookings, and revenue metrics
 *     tags: [Admin - Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Time range for analytics
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
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
 *                     timeRange:
 *                       type: string
 *                     overview:
 *                       type: object
 *                       properties:
 *                         users:
 *                           type: object
 *                         realtors:
 *                           type: object
 *                         properties:
 *                           type: object
 *                         bookings:
 *                           type: object
 *                         revenue:
 *                           type: object
 *                         performance:
 *                           type: object
 *                     trends:
 *                       type: object
 *                     breakdowns:
 *                       type: object
 *       403:
 *         description: Admin access required
 */
router.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { timeRange = "30d" } = req.query;

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
      totalUsers,
      totalRealtors,
      activeRealtors,
      pendingRealtors,
      suspendedRealtors,
      totalProperties,
      activeProperties,
      totalBookings,
      completedBookings,
      pendingBookings,
      cancelledBookings,
      totalRevenue,
      previousUsers,
      previousRealtors,
      previousProperties,
      previousBookings,
      previousRevenue,
      totalReviews,
      averageRating,
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: startDate } } }),
      prisma.realtor.count({ where: { createdAt: { gte: startDate } } }),
      prisma.realtor.count({
        where: { isActive: true, createdAt: { gte: startDate } },
      }),
      prisma.realtor.count({
        where: { isActive: false, createdAt: { gte: startDate } },
      }),
      prisma.realtor.count({
        where: { status: "SUSPENDED", createdAt: { gte: startDate } },
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
        where: {
          status: { in: ["PARTIALLY_RELEASED", "SETTLED"] },
          createdAt: { gte: startDate },
        },
        _sum: { amount: true },
      }),
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
          status: { in: ["PARTIALLY_RELEASED", "SETTLED"] },
          createdAt: { gte: previousPeriodStart, lt: startDate },
        },
        _sum: { amount: true },
      }),
      prisma.review.count({ where: { createdAt: { gte: startDate } } }),
      prisma.review.aggregate({
        where: { createdAt: { gte: startDate } },
        _avg: { rating: true },
      }),
    ]);
    const inactiveProperties = Math.max(totalProperties - activeProperties, 0);

    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const propertyTypes = await prisma.property.groupBy({
      by: ["type"],
      where: { createdAt: { gte: startDate } },
      _count: true,
    });

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

    const bookingStatusData = await prisma.booking.groupBy({
      by: ["status"],
      where: { createdAt: { gte: startDate } },
      _count: true,
    });

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
        status: {
          in: [PaymentStatus.PARTIALLY_RELEASED, PaymentStatus.SETTLED],
        }, // Only completed payments count as revenue
        createdAt: { gte: monthlyTrendsStart },
      },
      select: { createdAt: true, amount: true },
      orderBy: { createdAt: "asc" },
    });

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
                totalPrice: true,
              },
            },
          },
        },
      },
      take: 10,
    });

    const topRealtorsBreakdown = topRealtors
      .map((realtor) => {
        const aggregated = realtor.properties.reduce(
          (sum, property) => {
            const propertyRevenue = property.bookings.reduce(
              (pSum, booking) => {
                return pSum + Number(booking.totalPrice ?? 0);
              },
              0
            );
            return {
              totalRevenue: sum.totalRevenue + propertyRevenue,
              bookingCount: sum.bookingCount + property.bookings.length,
            };
          },
          { totalRevenue: 0, bookingCount: 0 }
        );

        return {
          id: realtor.id,
          businessName: realtor.businessName,
          totalRevenue: Number(aggregated.totalRevenue.toFixed(2)),
          bookingCount: aggregated.bookingCount,
          propertyCount: realtor.properties.length,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    const commissionReport = await generatePlatformReport(startDate, now);
    const totalRevenueValue = Number(totalRevenue._sum.amount ?? 0);
    const previousRevenueValue = Number(previousRevenue._sum.amount ?? 0);

    const monthlyBookingsTrend = monthlyData.map((row) => ({
      month: row.month,
      bookings: row.bookings,
    }));
    const monthlyRevenueTrend = monthlyData.map((row) => ({
      month: row.month,
      revenue: row.revenue,
    }));
    const monthlyCompletedTrend = monthlyData.map((row) => ({
      month: row.month,
      completed: row.completed,
    }));

    const flatOverview = {
      totalUsers,
      totalRealtors,
      activeRealtors,
      pendingRealtors,
      suspendedRealtors,
      totalProperties,
      activeProperties,
      inactiveProperties,
      totalBookings,
      completedBookings,
      pendingBookings,
      cancelledBookings,
      totalRevenue: totalRevenueValue.toFixed(2),
      platformCommission: commissionReport.totalCommissions.toFixed(2),
      totalCommissions: commissionReport.totalCommissions.toFixed(2),
      revenueGrowth: calculateGrowth(totalRevenueValue, previousRevenueValue),
      averageRating: averageRating._avg.rating ?? 0,
      totalReviews,
      occupancyRate:
        activeProperties > 0 ? (completedBookings / activeProperties) * 100 : 0,
      conversionRate:
        totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
    };

    res.json({
      success: true,
      message: "Platform analytics retrieved successfully",
      data: {
        timeRange,
        overview: flatOverview,
        legacyOverview: {
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
            total: totalRevenueValue,
            growth: calculateGrowth(totalRevenueValue, previousRevenueValue),
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
          monthlyBookings: monthlyBookingsTrend,
          monthlyRevenue: monthlyRevenueTrend,
          completedBookings: monthlyCompletedTrend,
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
          topLocations: locationData.map((location) => ({
            city: location.city,
            count: location._count,
          })),
          bookingStatus: bookingStatusData.map((status) => ({
            status: status.status,
            count: status._count,
            percentage:
              totalBookings > 0 ? (status._count / totalBookings) * 100 : 0,
          })),
          topRealtors: topRealtorsBreakdown,
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/analytics/commission/platform-report:
 *   get:
 *     summary: Get platform commission report
 *     description: Get comprehensive commission report for the entire platform
 *     tags: [Admin - Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Platform commission report retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get(
  "/commission/platform-report",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  })
);

/**
 * @swagger
 * /api/admin/analytics/commission/realtor/{realtorId}:
 *   get:
 *     summary: Get realtor commission report
 *     description: Get commission report for a specific realtor
 *     tags: [Admin - Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: realtorId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Realtor commission report retrieved successfully
 *       404:
 *         description: Realtor not found
 *       403:
 *         description: Admin access required
 */
router.get(
  "/commission/realtor/:realtorId",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  })
);

/**
 * @swagger
 * /api/admin/analytics/commission/pending-payouts:
 *   get:
 *     summary: Get pending payouts
 *     description: Get list of all pending payouts to realtors
 *     tags: [Admin - Analytics]
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
 *         name: realtorId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pending payouts retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get(
  "/commission/pending-payouts",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 20, realtorId } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      status: { in: [PaymentStatus.PARTIALLY_RELEASED, PaymentStatus.SETTLED] },
      roomFeeSplitDone: true,
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
          realtorEarnings: (
            payment.roomFeeSplitRealtorAmount ||
            payment.realtorEarnings ||
            0
          ).toString(),
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
  })
);

/**
 * @swagger
 * /api/admin/analytics/commission/payout/{paymentId}:
 *   post:
 *     summary: Process payout to realtor
 *     description: Process a pending payout to a realtor
 *     tags: [Admin - Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payoutReference:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payout processed successfully
 *       404:
 *         description: Payment not found
 *       400:
 *         description: Invalid payout request
 *       403:
 *         description: Admin access required
 */
router.post(
  "/commission/payout/:paymentId",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    res.status(400).json({
      success: false,
      message:
        "Manual payout is disabled. Stayza now uses wallet-first automatic settlement for booking payouts.",
    });
  })
);

/**
 * @swagger
 * /api/admin/analytics/payouts/process:
 *   post:
 *     summary: Manually trigger payout processing
 *     description: Process all eligible payouts (bookings where check-in time has passed)
 *     tags: [Admin - Analytics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Payouts processed successfully
 *       403:
 *         description: Admin access required
 */
router.post(
  "/payouts/process",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    res.status(400).json({
      success: false,
      message:
        "Legacy payout cron processing is disabled. Escrow release jobs now settle payouts directly into wallets.",
    });
  })
);

/**
 * @swagger
 * /api/admin/analytics/commission/settings:
 *   get:
 *     summary: Get commission settings
 *     description: Get current platform commission rates
 *     tags: [Admin - Analytics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Commission settings retrieved
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
 *                     platformCommissionRate:
 *                       type: number
 *                       description: Commission rate charged to realtors (e.g., 0.10 = 10%)
 *                     guestServiceFeeRate:
 *                       type: number
 *                       description: Service fee charged to guests (locked at 2%)
 */
router.get(
  "/commission/settings",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const financeConfig = await loadFinanceConfig();
    const defaultTierRate = financeConfig.commission.tiers[0]?.rate ?? 0.1;

    return res.json({
      success: true,
      data: {
        platformCommissionRate: defaultTierRate,
        guestServiceFeeRate:
          financeConfig.serviceFee.stayza.percent +
          financeConfig.serviceFee.processing.local.percent,
        commissionTiers: financeConfig.commission.tiers,
        monthlyDiscounts: financeConfig.commission.monthlyDiscounts,
        monthlyDiscountCapRate: financeConfig.commission.monthlyDiscountCapRate,
        serviceFee: financeConfig.serviceFee,
        withdrawalFee: financeConfig.withdrawalFee,
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/analytics/commission/settings:
 *   patch:
 *     summary: Update commission rate
 *     description: Update platform commission rate with required reason. Sends email to all active realtors.
 *     tags: [Admin - Analytics]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newCommissionRate
 *               - reason
 *             properties:
 *               newCommissionRate:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 0.5
 *                 description: New commission rate (e.g., 0.12 for 12%)
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 description: Reason for commission change
 *               effectiveDate:
 *                 type: string
 *                 format: date
 *                 description: When the new rate takes effect (defaults to now)
 *     responses:
 *       200:
 *         description: Commission rate updated and realtors notified
 *       400:
 *         description: Invalid rate or missing reason
 */
router.patch(
  "/commission/settings",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    return res.status(400).json({
      success: false,
      message:
        "This endpoint is deprecated. Update finance configuration via /api/admin/settings using finance.* keys.",
    });
  })
);

/**
 * @swagger
 * /api/admin/analytics/commission/history:
 *   get:
 *     summary: Get commission rate change history
 *     description: Retrieve history of all commission rate changes with reasons
 *     tags: [Admin - Analytics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Commission history retrieved
 */
router.get(
  "/commission/history",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const history = await prisma.auditLog.findMany({
      where: {
        action: "COMMISSION_RATE_CHANGED",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const formattedHistory = history.map((entry) => {
      const details = entry.details as any;
      return {
        id: entry.id,
        changedBy: entry.user
          ? `${entry.user.firstName} ${entry.user.lastName}`
          : "System",
        changedByEmail: entry.user?.email,
        oldRate: details?.oldRate,
        newRate: details?.newRate,
        reason: details?.reason,
        effectiveDate: details?.effectiveDate,
        changedAt: entry.createdAt,
      };
    });

    return res.json({
      success: true,
      data: formattedHistory,
    });
  })
);

export default router;
