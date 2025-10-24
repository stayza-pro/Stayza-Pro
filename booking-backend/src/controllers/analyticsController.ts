import { Request, Response } from "express";
import { prisma } from "@/config/database";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";

/**
 * @desc    Get realtor-specific analytics
 * @route   GET /api/realtors/analytics
 * @access  Private (Realtor only)
 */
export const getRealtorAnalytics = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const realtorId = req.realtor?.id;
    if (!realtorId) {
      throw new AppError("Realtor profile not found", 404);
    }

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

    // Get realtor's properties
    const properties = await prisma.property.findMany({
      where: { realtorId, isActive: true },
      select: { id: true },
    });

    const propertyIds = properties.map((p) => p.id);

    const [
      // Current period metrics
      totalBookings,
      completedBookings,
      pendingBookings,
      cancelledBookings,
      totalRevenue,
      totalProperties,
      activeProperties,

      // Previous period
      previousBookings,
      previousRevenue,

      // Reviews and ratings
      totalReviews,
      averageRating,

      // Property performance
      topProperties,
    ] = await Promise.all([
      // Current period
      prisma.booking.count({
        where: {
          propertyId: { in: propertyIds },
          createdAt: { gte: startDate },
        },
      }),
      prisma.booking.count({
        where: {
          propertyId: { in: propertyIds },
          status: "COMPLETED",
          createdAt: { gte: startDate },
        },
      }),
      prisma.booking.count({
        where: {
          propertyId: { in: propertyIds },
          status: "PENDING",
          createdAt: { gte: startDate },
        },
      }),
      prisma.booking.count({
        where: {
          propertyId: { in: propertyIds },
          status: "CANCELLED",
          createdAt: { gte: startDate },
        },
      }),
      prisma.payment.aggregate({
        where: {
          booking: { propertyId: { in: propertyIds } },
          status: "COMPLETED",
          createdAt: { gte: startDate },
        },
        _sum: { amount: true },
      }),
      prisma.property.count({ where: { realtorId } }),
      prisma.property.count({ where: { realtorId, isActive: true } }),

      // Previous period
      prisma.booking.count({
        where: {
          propertyId: { in: propertyIds },
          createdAt: { gte: previousPeriodStart, lt: startDate },
        },
      }),
      prisma.payment.aggregate({
        where: {
          booking: { propertyId: { in: propertyIds } },
          status: "COMPLETED",
          createdAt: { gte: previousPeriodStart, lt: startDate },
        },
        _sum: { amount: true },
      }),

      // Reviews
      prisma.review.count({
        where: {
          propertyId: { in: propertyIds },
          createdAt: { gte: startDate },
        },
      }),
      prisma.review.aggregate({
        where: {
          propertyId: { in: propertyIds },
          createdAt: { gte: startDate },
        },
        _avg: { rating: true },
      }),

      // Top performing properties
      prisma.property.findMany({
        where: { realtorId, isActive: true },
        select: {
          id: true,
          title: true,
          city: true,
          pricePerNight: true,
          _count: {
            select: {
              bookings: {
                where: {
                  status: "COMPLETED",
                  createdAt: { gte: startDate },
                },
              },
              reviews: true,
            },
          },
          reviews: {
            select: { rating: true },
            where: { createdAt: { gte: startDate } },
          },
        },
        orderBy: {
          bookings: {
            _count: "desc",
          },
        },
        take: 5,
      }),
    ]);

    // Calculate growth rates
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Get monthly trends for realtor
    const monthsBack = timeRange === "1y" ? 12 : timeRange === "90d" ? 3 : 1;
    const monthlyTrendsStart = new Date();
    monthlyTrendsStart.setMonth(monthlyTrendsStart.getMonth() - monthsBack);

    const monthlyBookings = await prisma.booking.findMany({
      where: {
        propertyId: { in: propertyIds },
        createdAt: { gte: monthlyTrendsStart },
      },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: "asc" },
    });

    const monthlyRevenue = await prisma.payment.findMany({
      where: {
        booking: { propertyId: { in: propertyIds } },
        status: "COMPLETED",
        createdAt: { gte: monthlyTrendsStart },
      },
      select: { createdAt: true, amount: true },
      orderBy: { createdAt: "asc" },
    });

    // Process monthly data for realtor
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

    // Process top properties with calculated metrics
    const topPropertiesWithMetrics = topProperties.map((property) => {
      const avgRating =
        property.reviews.length > 0
          ? property.reviews.reduce((sum, r) => sum + r.rating, 0) /
            property.reviews.length
          : 0;

      return {
        id: property.id,
        title: property.title,
        city: property.city,
        pricePerNight: Number(property.pricePerNight),
        bookings: property._count.bookings,
        reviews: property._count.reviews,
        averageRating: Math.round(avgRating * 10) / 10,
        revenue: property._count.bookings * Number(property.pricePerNight),
      };
    });

    res.json({
      success: true,
      message: "Realtor analytics retrieved successfully",
      data: {
        timeRange,
        overview: {
          properties: {
            total: totalProperties,
            active: activeProperties,
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
            average:
              totalBookings > 0
                ? Number(totalRevenue._sum.amount ?? 0) / totalBookings
                : 0,
          },
          performance: {
            averageRating: Number(averageRating._avg.rating ?? 0),
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
        topProperties: topPropertiesWithMetrics,
      },
    });
  }
);

/**
 * @desc    Get property-specific analytics for realtor
 * @route   GET /api/realtors/properties/:id/analytics
 * @access  Private (Realtor only)
 */
export const getPropertyAnalytics = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id: propertyId } = req.params;
    const realtorId = req.realtor?.id;

    if (!realtorId) {
      throw new AppError("Realtor profile not found", 404);
    }

    // Verify property belongs to realtor
    const property = await prisma.property.findFirst({
      where: { id: propertyId, realtorId },
      select: { id: true, title: true, pricePerNight: true },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

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

    const [
      totalBookings,
      completedBookings,
      pendingBookings,
      totalRevenue,
      totalReviews,
      averageRating,
      recentReviews,
      bookingTrends,
    ] = await Promise.all([
      prisma.booking.count({
        where: {
          propertyId,
          createdAt: { gte: startDate },
        },
      }),
      prisma.booking.count({
        where: {
          propertyId,
          status: "COMPLETED",
          createdAt: { gte: startDate },
        },
      }),
      prisma.booking.count({
        where: {
          propertyId,
          status: "PENDING",
          createdAt: { gte: startDate },
        },
      }),
      prisma.payment.aggregate({
        where: {
          booking: { propertyId },
          status: "COMPLETED",
          createdAt: { gte: startDate },
        },
        _sum: { amount: true },
      }),
      prisma.review.count({
        where: {
          propertyId,
          createdAt: { gte: startDate },
        },
      }),
      prisma.review.aggregate({
        where: {
          propertyId,
          createdAt: { gte: startDate },
        },
        _avg: { rating: true },
      }),
      prisma.review.findMany({
        where: {
          propertyId,
          createdAt: { gte: startDate },
        },
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.booking.findMany({
        where: {
          propertyId,
          createdAt: { gte: startDate },
        },
        select: {
          createdAt: true,
          status: true,
          checkInDate: true,
          checkOutDate: true,
          totalPrice: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    res.json({
      success: true,
      message: "Property analytics retrieved successfully",
      data: {
        property: {
          id: property.id,
          title: property.title,
          pricePerNight: Number(property.pricePerNight),
        },
        timeRange,
        overview: {
          bookings: {
            total: totalBookings,
            completed: completedBookings,
            pending: pendingBookings,
          },
          revenue: {
            total: Number(totalRevenue._sum.amount ?? 0),
            average:
              totalBookings > 0
                ? Number(totalRevenue._sum.amount ?? 0) / totalBookings
                : 0,
          },
          performance: {
            averageRating: Number(averageRating._avg.rating ?? 0),
            totalReviews,
            occupancyRate: completedBookings,
            conversionRate:
              totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
          },
        },
        recentReviews: recentReviews.map((review) => ({
          rating: review.rating,
          comment: review.comment,
          date: review.createdAt,
          guestName: `${review.author.firstName} ${review.author.lastName}`,
        })),
        bookingTrends: bookingTrends.map((booking) => ({
          date: booking.createdAt,
          status: booking.status,
          checkIn: booking.checkInDate,
          checkOut: booking.checkOutDate,
          revenue: Number(booking.totalPrice),
        })),
      },
    });
  }
);
