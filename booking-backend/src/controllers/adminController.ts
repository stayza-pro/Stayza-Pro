import { Request, Response } from "express";
import { prisma } from "@/config/database";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";

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
          },
        },
      },
    });

    if (!realtor) {
      throw new AppError("Realtor not found", 404);
    }

    // MVP: All realtors are auto-approved on registration
    res.json({
      success: true,
      message: "Realtor is already active - MVP has auto-approval",
      data: { realtor },
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

    // MVP: Rejection workflow not implemented - use isActive instead
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

    res.json({
      success: true,
      message: "Realtor deactivated successfully (MVP rejection)",
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
    const [
      totalUsers,
      totalRealtors,
      approvedRealtors,
      pendingRealtors,
      totalProperties,
      approvedProperties,
      totalBookings,
      completedBookings,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.realtor.count(),
      prisma.realtor.count({ where: { isActive: true } }),
      prisma.realtor.count({ where: { isActive: false } }),
      prisma.property.count(),
      prisma.property.count({ where: { isActive: true } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "COMPLETED" } }),
      prisma.payment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
    ]);

    // Get monthly booking trends
    const currentDate = new Date();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(currentDate.getMonth() - 12);

    const monthlyBookings = await prisma.booking.groupBy({
      by: ["createdAt"],
      where: {
        createdAt: {
          gte: twelveMonthsAgo,
        },
      },
      _count: true,
    });

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
        overview: {
          totalUsers,
          totalRealtors,
          approvedRealtors,
          pendingRealtors,
          totalProperties,
          approvedProperties,
          totalBookings,
          completedBookings,
          totalRevenue: totalRevenue._sum.amount || 0,
        },
        monthlyTrends: monthlyBookings,
        topRealtors: realtorsWithRevenue,
      },
    });
  }
);
