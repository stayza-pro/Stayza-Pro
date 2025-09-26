import { Response } from "express";
import { prisma } from "@/config/database";
import { AuthenticatedRequest, PaginationQuery } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { createReviewSchema, updateReviewSchema } from "@/utils/validation";

/**
 * @desc    Create new review
 * @route   POST /api/reviews
 * @access  Private (GUEST only, for completed bookings)
 */
export const createReview = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { error, value } = createReviewSchema.validate(req.body);

    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { bookingId, rating, comment } = value;

    // Get booking with all necessary relations
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: {
          select: {
            id: true,
            realtorId: true,
            title: true,
          },
        },
        review: true,
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    // Check if user owns the booking
    if (booking.guestId !== req.user!.id) {
      throw new AppError("You can only review your own bookings", 403);
    }

    // Check if booking is completed
    if (booking.status !== "COMPLETED") {
      throw new AppError("You can only review completed bookings", 400);
    }

    // Check if review already exists
    if (booking.review) {
      throw new AppError("Review already exists for this booking", 400);
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        bookingId,
        authorId: req.user!.id,
        propertyId: booking.property.id,
        targetId: booking.property.realtorId,
      },
      include: {
        author: {
          select: {
            id: true,
            
            
            
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
        booking: {
          select: {
            checkInDate: true,
            checkOutDate: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: review,
    });
  }
);

/**
 * @desc    Get reviews for a property
 * @route   GET /api/reviews/property/:propertyId
 * @access  Public
 */
export const getPropertyReviews = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { propertyId } = req.params;
    const {
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query as PaginationQuery;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get reviews with pagination
    const [reviews, total, averageRating] = await Promise.all([
      prisma.review.findMany({
        where: {
          propertyId,
          isVisible: true,
        },
        include: {
          author: {
            select: {
              id: true,
              
              
              
            },
          },
          booking: {
            select: {
              checkInDate: true,
              checkOutDate: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limitNum,
      }),
      prisma.review.count({
        where: {
          propertyId,
          isVisible: true,
        },
      }),
      prisma.review.aggregate({
        where: {
          propertyId,
          isVisible: true,
        },
        _avg: {
          rating: true,
        },
      }),
    ]);

    // Calculate rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ["rating"],
      where: {
        propertyId,
        isVisible: true,
      },
      _count: {
        rating: true,
      },
    });

    const distribution = ratingDistribution.reduce((acc, item) => {
      acc[item.rating] = item._count.rating;
      return acc;
    }, {} as Record<number, number>);

    res.json({
      success: true,
      message: "Property reviews retrieved successfully",
      data: {
        reviews,
        averageRating: averageRating._avg.rating
          ? Math.round(averageRating._avg.rating * 10) / 10
          : 0,
        totalReviews: total,
        ratingDistribution: distribution,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  }
);

/**
 * @desc    Get reviews by user (as author)
 * @route   GET /api/reviews/my-reviews
 * @access  Private
 */
export const getMyReviews = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query as PaginationQuery;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          authorId: req.user!.id,
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              images: true,
              city: true,
              country: true,
            },
          },
          booking: {
            select: {
              checkInDate: true,
              checkOutDate: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limitNum,
      }),
      prisma.review.count({
        where: {
          authorId: req.user!.id,
        },
      }),
    ]);

    res.json({
      success: true,
      message: "Your reviews retrieved successfully",
      data: reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  }
);

/**
 * @desc    Get reviews for host (reviews about their properties)
 * @route   GET /api/reviews/host-reviews
 * @access  Private (HOST only)
 */
export const getHostReviews = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query as PaginationQuery;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          targetId: req.user!.id,
        },
        include: {
          author: {
            select: {
              id: true,
              
              
              
            },
          },
          property: {
            select: {
              id: true,
              title: true,
              images: true,
            },
          },
          booking: {
            select: {
              checkInDate: true,
              checkOutDate: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limitNum,
      }),
      prisma.review.count({
        where: {
          targetId: req.user!.id,
        },
      }),
    ]);

    // Calculate average rating for host
    const averageRating = await prisma.review.aggregate({
      where: {
        targetId: req.user!.id,
        isVisible: true,
      },
      _avg: {
        rating: true,
      },
    });

    res.json({
      success: true,
      message: "Host reviews retrieved successfully",
      data: {
        reviews,
        averageRating: averageRating._avg.rating
          ? Math.round(averageRating._avg.rating * 10) / 10
          : 0,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  }
);

/**
 * @desc    Get single review
 * @route   GET /api/reviews/:id
 * @access  Public (if visible) / Private (if owner/target/admin)
 */
export const getReview = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            
            
            
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            images: true,
            realtorId: true,
          },
        },
        booking: {
          select: {
            checkInDate: true,
            checkOutDate: true,
          },
        },
      },
    });

    if (!review) {
      throw new AppError("Review not found", 404);
    }

    // Check visibility
    if (!review.isVisible) {
      const isAuthor = req.user && review.authorId === req.user.id;
      const isTarget = req.user && review.targetId === req.user.id;
      const isAdmin = req.user && req.user.role === "ADMIN";

      if (!isAuthor && !isTarget && !isAdmin) {
        throw new AppError("Review not found", 404);
      }
    }

    res.json({
      success: true,
      message: "Review retrieved successfully",
      data: review,
    });
  }
);

/**
 * @desc    Update review
 * @route   PUT /api/reviews/:id
 * @access  Private (Author only)
 */
export const updateReview = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { error, value } = updateReviewSchema.validate(req.body);

    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    // Find review
    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      throw new AppError("Review not found", 404);
    }

    // Check if user is the author
    if (
      existingReview.authorId !== req.user!.id &&
      req.user!.role !== "ADMIN"
    ) {
      throw new AppError("You can only update your own reviews", 403);
    }

    // Update review
    const review = await prisma.review.update({
      where: { id },
      data: value,
      include: {
        author: {
          select: {
            id: true,
            
            
            
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
        booking: {
          select: {
            checkInDate: true,
            checkOutDate: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Review updated successfully",
      data: review,
    });
  }
);

/**
 * @desc    Delete review
 * @route   DELETE /api/reviews/:id
 * @access  Private (Author or ADMIN)
 */
export const deleteReview = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new AppError("Review not found", 404);
    }

    // Check authorization
    if (review.authorId !== req.user!.id && req.user!.role !== "ADMIN") {
      throw new AppError("You can only delete your own reviews", 403);
    }

    await prisma.review.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  }
);

/**
 * @desc    Hide/Show review (ADMIN only)
 * @route   PATCH /api/reviews/:id/visibility
 * @access  Private (ADMIN only)
 */
export const toggleReviewVisibility = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { isVisible } = req.body;

    if (typeof isVisible !== "boolean") {
      throw new AppError("isVisible must be a boolean value", 400);
    }

    const review = await prisma.review.update({
      where: { id },
      data: { isVisible },
      include: {
        author: {
          select: {
            id: true,
            
            
          },
        },
        property: {
          select: {
            title: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: `Review ${isVisible ? "shown" : "hidden"} successfully`,
      data: review,
    });
  }
);
