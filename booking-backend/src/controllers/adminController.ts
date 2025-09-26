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
              country: true,
              city: true,
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
    const { notes } = req.body;

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

    if (realtor.status === "APPROVED") {
      throw new AppError("Realtor is already approved", 400);
    }

    const updatedRealtor = await prisma.realtor.update({
      where: { id },
      data: {
        status: "APPROVED",
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: "REALTOR_APPROVED",
        entity: "Realtor",
        entityId: id,
        details: {
          approvedBy: req.user!.email,
          realtorEmail: realtor.user.email,
          businessName: realtor.businessName,
          notes: notes || null,
        },
      },
    });

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

    if (!reason) {
      throw new AppError("Rejection reason is required", 400);
    }

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

    if (realtor.status === "REJECTED") {
      throw new AppError("Realtor is already rejected", 400);
    }

    const updatedRealtor = await prisma.realtor.update({
      where: { id },
      data: {
        status: "REJECTED",
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

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: "REALTOR_REJECTED",
        entity: "Realtor",
        entityId: id,
        details: {
          rejectedBy: req.user!.email,
          realtorEmail: realtor.user.email,
          businessName: realtor.businessName,
          reason,
        },
      },
    });

    res.json({
      success: true,
      message: "Realtor rejected successfully",
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
          },
        },
      },
    });

    if (!realtor) {
      throw new AppError("Realtor not found", 404);
    }

    const updatedRealtor = await prisma.realtor.update({
      where: { id },
      data: {
        status: "SUSPENDED",
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

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: "REALTOR_SUSPENDED",
        entity: "Realtor",
        entityId: id,
        details: {
          suspendedBy: req.user!.email,
          realtorEmail: realtor.user.email,
          businessName: realtor.businessName,
          reason,
        },
      },
    });

    res.json({
      success: true,
      message: "Realtor suspended successfully",
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
              status: true,
              user: {
                select: {
                },
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

    if (property.isApproved) {
      throw new AppError("Property is already approved", 400);
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        isApproved: true,
        approvedBy: req.user!.id,
        approvedAt: new Date(),
        rejectionReason: null,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: "PROPERTY_APPROVED",
        entity: "Property",
        entityId: id,
        details: {
          approvedBy: req.user!.email,
          propertyTitle: property.title,
          realtorBusiness: property.realtor.businessName,
          notes: notes || null,
        },
      },
    });

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
        isApproved: false,
        rejectionReason: reason,
        isActive: false, // Also deactivate
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: "PROPERTY_REJECTED",
        entity: "Property",
        entityId: id,
        details: {
          rejectedBy: req.user!.email,
          propertyTitle: property.title,
          realtorBusiness: property.realtor.businessName,
          reason,
        },
      },
    });

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
      prisma.realtor.count({ where: { status: "APPROVED" } }),
      prisma.realtor.count({ where: { status: "PENDING" } }),
      prisma.property.count(),
      prisma.property.count({ where: { isApproved: true } }),
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
        user: {
          select: {
          },
        },
        properties: {
          select: {
            bookings: {
              where: { status: "COMPLETED" },
              select: {
                realtorPayout: true,
              },
            },
          },
        },
      },
      take: 10,
    });

    const realtorsWithRevenue = topRealtors
      .map((realtor) => {
        const totalRevenue = realtor.properties.reduce((sum, property) => {
          const propertyRevenue = property.bookings.reduce((pSum, booking) => {
            return pSum + Number(booking.realtorPayout || 0);
          }, 0);
          return sum + propertyRevenue;
        }, 0);

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
