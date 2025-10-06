import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { prisma } from "@/config/database";
import { deleteImage, extractPublicId } from "@/utils/upload";
import {
  NotificationService,
  notificationHelpers,
} from "@/services/notificationService";

interface CreateReviewRequest {
  bookingId: string;
  rating: number;
  comment?: string;
  cleanlinessRating?: number;
  communicationRating?: number;
  checkInRating?: number;
  accuracyRating?: number;
  locationRating?: number;
  valueRating?: number;
  photos?: Array<{
    url: string;
    caption?: string;
  }>;
}

interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
  cleanlinessRating?: number;
  communicationRating?: number;
  checkInRating?: number;
  accuracyRating?: number;
  locationRating?: number;
  valueRating?: number;
}

export const createReview = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      bookingId,
      rating,
      comment,
      cleanlinessRating,
      communicationRating,
      checkInRating,
      accuracyRating,
      locationRating,
      valueRating,
      photos,
    }: CreateReviewRequest = req.body;

    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new AppError("Rating must be between 1 and 5", 400);
    }

    // Validate optional detailed ratings
    const detailedRatings = [
      cleanlinessRating,
      communicationRating,
      checkInRating,
      accuracyRating,
      locationRating,
      valueRating,
    ];

    detailedRatings.forEach((detailRating) => {
      if (
        detailRating !== undefined &&
        (detailRating < 1 || detailRating > 5)
      ) {
        throw new AppError("All detailed ratings must be between 1 and 5", 400);
      }
    });

    // Verify booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: true,
        review: true,
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    if (booking.guestId !== userId) {
      throw new AppError("You can only review your own bookings", 403);
    }

    if (booking.status !== "COMPLETED") {
      throw new AppError("You can only review completed bookings", 400);
    }

    if (booking.review) {
      throw new AppError("Review already exists for this booking", 409);
    }

    // Create review with transaction
    const review = await prisma.$transaction(async (tx) => {
      // Create the review
      const newReview = await tx.review.create({
        data: {
          bookingId,
          propertyId: booking.propertyId,
          authorId: userId,
          rating,
          comment,
          cleanlinessRating,
          communicationRating,
          checkInRating,
          accuracyRating,
          locationRating,
          valueRating,
          isVerified: true, // Mark as verified since booking is completed
        },
      });

      // Add photos if provided
      if (photos && photos.length > 0) {
        await tx.reviewPhoto.createMany({
          data: photos.map((photo, index) => ({
            reviewId: newReview.id,
            url: photo.url,
            caption: photo.caption,
            order: index,
          })),
        });
      }

      return newReview;
    });

    // Fetch the complete review with relations
    const completeReview = await prisma.review.findUnique({
      where: { id: review.id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            realtor: {
              select: {
                id: true,
                businessName: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        photos: true,
        hostResponse: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Send notification to realtor about new review
    try {
      const notificationService = NotificationService.getInstance();
      const realtorNotification = notificationHelpers.reviewReceived(
        completeReview!.property.realtor.id,
        completeReview!.id,
        completeReview!.property.title,
        rating
      );
      await notificationService.createAndSendNotification(realtorNotification);
    } catch (notificationError) {
      console.error("Failed to send review notification:", notificationError);
      // Don't fail the review creation if notifications fail
    }

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: completeReview,
    });
  }
);

export const getPropertyReviews = asyncHandler(
  async (req: Request, res: Response) => {
    const { propertyId } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where: {
          propertyId,
          isVisible: true,
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          photos: {
            orderBy: { order: "asc" },
          },
          hostResponse: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: {
          [sortBy as string]: sortOrder,
        },
        skip,
        take: Number(limit),
      }),
      prisma.review.count({
        where: {
          propertyId,
          isVisible: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / Number(limit));

    res.json({
      success: true,
      message: "Property reviews retrieved successfully",
      data: reviews,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems: totalCount,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1,
      },
    });
  }
);

export const updateReview = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const {
      rating,
      comment,
      cleanlinessRating,
      communicationRating,
      checkInRating,
      accuracyRating,
      locationRating,
      valueRating,
    }: UpdateReviewRequest = req.body;

    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    // Find review
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new AppError("Review not found", 404);
    }

    if (review.authorId !== userId) {
      throw new AppError("You can only update your own reviews", 403);
    }

    // Validate ratings if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      throw new AppError("Rating must be between 1 and 5", 400);
    }

    const detailedRatings = [
      cleanlinessRating,
      communicationRating,
      checkInRating,
      accuracyRating,
      locationRating,
      valueRating,
    ];

    detailedRatings.forEach((detailRating) => {
      if (
        detailRating !== undefined &&
        (detailRating < 1 || detailRating > 5)
      ) {
        throw new AppError("All detailed ratings must be between 1 and 5", 400);
      }
    });

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        ...(rating !== undefined && { rating }),
        ...(comment !== undefined && { comment }),
        ...(cleanlinessRating !== undefined && { cleanlinessRating }),
        ...(communicationRating !== undefined && { communicationRating }),
        ...(checkInRating !== undefined && { checkInRating }),
        ...(accuracyRating !== undefined && { accuracyRating }),
        ...(locationRating !== undefined && { locationRating }),
        ...(valueRating !== undefined && { valueRating }),
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
          },
        },
        photos: true,
        hostResponse: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Review updated successfully",
      data: updatedReview,
    });
  }
);

export const deleteReview = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    // Find review
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        photos: true,
        property: {
          select: {
            realtorId: true,
          },
        },
      },
    });

    if (!review) {
      throw new AppError("Review not found", 404);
    }

    // Check permissions (author, property owner, or admin)
    const canDelete =
      review.authorId === userId ||
      review.property.realtorId === req.realtor?.id ||
      userRole === "ADMIN";

    if (!canDelete) {
      throw new AppError("Permission denied", 403);
    }

    // Delete photos from cloudinary
    if (review.photos.length > 0) {
      await Promise.all(
        review.photos.map(async (photo) => {
          try {
            const publicId = extractPublicId(photo.url);
            await deleteImage(publicId);
          } catch (error) {
            console.error("Failed to delete photo from cloudinary:", error);
          }
        })
      );
    }

    // Delete review (cascade will handle relations)
    await prisma.review.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  }
);

export const getMyReviews = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where: { authorId: userId },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              images: {
                take: 1,
                orderBy: { order: "asc" },
              },
            },
          },
          photos: {
            orderBy: { order: "asc" },
          },
          hostResponse: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.review.count({
        where: { authorId: userId },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / Number(limit));

    res.json({
      success: true,
      message: "Your reviews retrieved successfully",
      data: reviews,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems: totalCount,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1,
      },
    });
  }
);

export const getHostReviews = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const realtorId = req.realtor?.id;
    const { page = 1, limit = 10, propertyId } = req.query;

    if (!realtorId) {
      throw new AppError("Realtor access required", 403);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const whereClause: any = {
      property: {
        realtorId,
      },
    };

    if (propertyId) {
      whereClause.propertyId = propertyId as string;
    }

    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where: whereClause,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          property: {
            select: {
              id: true,
              title: true,
              images: {
                take: 1,
                orderBy: { order: "asc" },
              },
            },
          },
          photos: {
            orderBy: { order: "asc" },
          },
          hostResponse: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.review.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / Number(limit));

    res.json({
      success: true,
      message: "Reviews retrieved successfully",
      data: reviews,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems: totalCount,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1,
      },
    });
  }
);

// New enhanced functionality

export const respondToReview = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params; // review id
    const { comment } = req.body;
    const realtorId = req.realtor?.id;
    const userId = req.user?.id;

    if (!realtorId || !userId) {
      throw new AppError("Realtor access required", 403);
    }

    if (!comment || comment.trim().length === 0) {
      throw new AppError("Response comment is required", 400);
    }

    // Find review and verify it belongs to realtor's property
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            realtorId: true,
            title: true,
          },
        },
        author: {
          select: {
            id: true,
          },
        },
        hostResponse: true,
      },
    });

    if (!review) {
      throw new AppError("Review not found", 404);
    }

    if (review.property.realtorId !== realtorId) {
      throw new AppError(
        "You can only respond to reviews on your properties",
        403
      );
    }

    if (review.hostResponse) {
      throw new AppError("Response already exists for this review", 409);
    }

    // Create response
    const response = await prisma.reviewResponse.create({
      data: {
        reviewId: id,
        authorId: userId,
        comment,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Send notification to review author about response
    try {
      const notificationService = NotificationService.getInstance();
      const reviewResponseNotification = notificationHelpers.reviewResponse(
        review.author.id,
        review.id,
        review.property.title
      );
      await notificationService.createAndSendNotification(
        reviewResponseNotification
      );
    } catch (notificationError) {
      console.error(
        "Failed to send review response notification:",
        notificationError
      );
      // Don't fail the response creation if notifications fail
    }

    res.status(201).json({
      success: true,
      message: "Review response created successfully",
      data: response,
    });
  }
);

export const getReviewAnalytics = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const realtorId = req.realtor?.id;

    if (!realtorId) {
      throw new AppError("Realtor access required", 403);
    }

    const [
      totalReviews,
      averageRating,
      ratingDistribution,
      recentReviews,
      responseRate,
    ] = await Promise.all([
      // Total reviews
      prisma.review.count({
        where: {
          property: {
            realtorId,
          },
        },
      }),

      // Average rating
      prisma.review.aggregate({
        where: {
          property: {
            realtorId,
          },
        },
        _avg: {
          rating: true,
        },
      }),

      // Rating distribution
      prisma.$transaction([
        prisma.review.count({
          where: { property: { realtorId }, rating: 5 },
        }),
        prisma.review.count({
          where: { property: { realtorId }, rating: 4 },
        }),
        prisma.review.count({
          where: { property: { realtorId }, rating: 3 },
        }),
        prisma.review.count({
          where: { property: { realtorId }, rating: 2 },
        }),
        prisma.review.count({
          where: { property: { realtorId }, rating: 1 },
        }),
      ]),

      // Recent reviews
      prisma.review.findMany({
        where: {
          property: {
            realtorId,
          },
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          property: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // Response rate
      prisma.$transaction([
        prisma.review.count({
          where: {
            property: { realtorId },
          },
        }),
        prisma.review.count({
          where: {
            property: { realtorId },
            hostResponse: {
              isNot: null,
            },
          },
        }),
      ]),
    ]);

    const responseRatePercentage =
      totalReviews > 0
        ? Math.round((responseRate[1] / responseRate[0]) * 100)
        : 0;

    res.json({
      success: true,
      message: "Review analytics retrieved successfully",
      data: {
        totalReviews,
        averageRating: averageRating._avg.rating || 0,
        ratingDistribution: {
          5: ratingDistribution[0],
          4: ratingDistribution[1],
          3: ratingDistribution[2],
          2: ratingDistribution[3],
          1: ratingDistribution[4],
        },
        recentReviews,
        responseRate: responseRatePercentage,
        responsesGiven: responseRate[1],
      },
    });
  }
);

export default {
  createReview,
  getPropertyReviews,
  updateReview,
  deleteReview,
  getMyReviews,
  getHostReviews,
  respondToReview,
  getReviewAnalytics,
};
