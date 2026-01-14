import express, { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { prisma } from "@/config/database";
import { deleteImage, extractPublicId } from "@/utils/upload";
import {
  NotificationService,
  notificationHelpers,
} from "@/services/notificationService";
import { updateAllRatings } from "@/utils/ratingCalculator";
import { authenticate, authorize, optionalAuth } from "@/middleware/auth";
import {
  uploadReviewPhotos,
  processReviewPhotos,
} from "@/services/photoUpload";
import { logger } from "@/utils/logger";

const router = express.Router();

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

/**
 * @swagger
 * tags:
 *   - name: Reviews
 *     description: Review management and rating endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         guestId:
 *           type: string
 *         propertyId:
 *           type: string
 *         bookingId:
 *           type: string
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *         cleanlinessRating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         communicationRating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         checkInRating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         accuracyRating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         locationRating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         valueRating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         isVisible:
 *           type: boolean
 *         isVerified:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a review
 *     description: Create a review for a completed booking
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - rating
 *             properties:
 *               bookingId:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *               cleanlinessRating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               communicationRating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               checkInRating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               accuracyRating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               locationRating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               valueRating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               photos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     caption:
 *                       type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Booking not found
 *       409:
 *         description: Review already exists
 */
router.post(
  "/",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
      // Create the review (auto-published)
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
          isVisible: true, // Auto-publish reviews without moderation
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
                userId: true,
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
        completeReview!.property.realtor.userId,
        completeReview!.id,
        completeReview!.property.title,
        rating
      );
      await notificationService.createAndSendNotification(realtorNotification);
    } catch (notificationError) {
      logger.error("Failed to send review notification:", notificationError);
      // Don't fail the review creation if notifications fail
    }

    // Update property and realtor ratings
    try {
      await updateAllRatings(
        booking.propertyId,
        completeReview!.property.realtor.id
      );
    } catch (ratingError) {
      logger.error("Failed to update ratings:", ratingError);
      // Don't fail the review creation if rating calculation fails
    }

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: completeReview,
    });
  })
);

/**
 * @swagger
 * /api/reviews/upload-photos:
 *   post:
 *     summary: Upload review photos
 *     description: Upload photos for a review
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Photos uploaded successfully
 *       400:
 *         description: Invalid request
 */
router.post(
  "/upload-photos",
  authenticate,
  uploadReviewPhotos,
  processReviewPhotos
);

/**
 * @swagger
 * /api/reviews/property/{propertyId}:
 *   get:
 *     summary: Get property reviews
 *     description: Get all visible reviews for a property
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *       404:
 *         description: Property not found
 */
router.get(
  "/property/:propertyId",
  asyncHandler(async (req: Request, res: Response) => {
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
  })
);

/**
 * @swagger
 * /api/reviews/my-reviews:
 *   get:
 *     summary: Get my reviews
 *     description: Get all reviews written by the authenticated user
 *     tags: [Reviews]
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
 *           default: 10
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 */
router.get(
  "/my-reviews",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  })
);

/**
 * @swagger
 * /api/reviews/host-reviews:
 *   get:
 *     summary: Get host reviews
 *     description: Get all reviews for properties owned by the realtor
 *     tags: [Reviews]
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
 *           default: 10
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *       403:
 *         description: Realtor access required
 */
router.get(
  "/host-reviews",
  authenticate,
  authorize("REALTOR", "ADMIN"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  })
);

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: Update review
 *     description: Update an existing review (author only)
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *               cleanlinessRating:
 *                 type: integer
 *               communicationRating:
 *                 type: integer
 *               checkInRating:
 *                 type: integer
 *               accuracyRating:
 *                 type: integer
 *               locationRating:
 *                 type: integer
 *               valueRating:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Review not found
 */
router.put(
  "/:id",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

    // Update property and realtor ratings after review update
    try {
      const property = await prisma.property.findUnique({
        where: { id: review.propertyId },
        select: { realtorId: true },
      });
      if (property) {
        await updateAllRatings(review.propertyId, property.realtorId);
      }
    } catch (ratingError) {
      logger.error("Failed to update ratings:", ratingError);
    }

    res.json({
      success: true,
      message: "Review updated successfully",
      data: updatedReview,
    });
  })
);

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete review
 *     description: Delete a review (author, property owner, or admin)
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Review not found
 */
router.delete(
  "/:id",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
            logger.error("Failed to delete photo from cloudinary:", error);
          }
        })
      );
    }

    // Delete review (cascade will handle relations)
    await prisma.review.delete({
      where: { id },
    });

    // Update property and realtor ratings after review deletion
    try {
      await updateAllRatings(review.propertyId, review.property.realtorId);
    } catch (ratingError) {
      logger.error("Failed to update ratings:", ratingError);
    }

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  })
);

/**
 * @swagger
 * /api/reviews/{id}/respond:
 *   post:
 *     summary: Respond to review
 *     description: Create a response to a review (realtor only)
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Response created successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Review not found
 *       409:
 *         description: Response already exists
 */
router.post(
  "/:id/respond",
  authenticate,
  authorize("REALTOR", "ADMIN"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
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
      logger.error(
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
  })
);

/**
 * @swagger
 * /api/reviews/analytics:
 *   get:
 *     summary: Get review analytics
 *     description: Get review statistics for realtor's properties
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *       403:
 *         description: Realtor access required
 */
router.get(
  "/analytics",
  authenticate,
  authorize("REALTOR", "ADMIN"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
        averageRating: averageRating._avg.rating ?? 0,
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
  })
);

/**
 * @swagger
 * /api/reviews/{id}/visibility:
 *   patch:
 *     summary: Toggle review visibility
 *     description: Toggle visibility of a review (realtor only)
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isVisible
 *             properties:
 *               isVisible:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Visibility updated successfully
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Review not found
 */
router.patch(
  "/:id/visibility",
  authenticate,
  authorize("REALTOR", "ADMIN"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { isVisible } = req.body;
    const user = req.user!;

    if (typeof isVisible !== "boolean") {
      throw new AppError("isVisible must be a boolean value", 400);
    }

    // Find the review and check if it belongs to realtor's property
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            realtor: {
              select: {
                id: true,
                userId: true,
                businessName: true,
              },
            },
          },
        },
        author: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!review) {
      throw new AppError("Review not found", 404);
    }

    // Check if the user is the realtor who owns the property
    if (review.property.realtor.userId !== user.id) {
      throw new AppError(
        "You can only moderate reviews for your own properties",
        403
      );
    }

    // Update review visibility
    const updatedReview = await prisma.review.update({
      where: { id },
      data: { isVisible },
      include: {
        author: {
          select: {
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

    // Send notification to guest about visibility change
    try {
      const notificationService = NotificationService.getInstance();
      const action = isVisible ? "made visible" : "hidden";
      const notification =
        notificationHelpers.createReviewModerationNotification(
          updatedReview.property.title,
          action,
          review.property.realtor.businessName
        );

      await notificationService.createAndSendNotification({
        userId: updatedReview.authorId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        reviewId: updatedReview.id,
        priority: notification.priority,
      });
    } catch (notificationError) {
      logger.error(
        "Failed to send review moderation notification:",
        notificationError
      );
      // Don't fail the visibility update if notification fails
    }

    res.json({
      success: true,
      message: `Review visibility ${
        isVisible ? "enabled" : "disabled"
      } successfully`,
      data: {
        id: updatedReview.id,
        isVisible: updatedReview.isVisible,
        propertyTitle: updatedReview.property.title,
        authorName:
          `${updatedReview.author.firstName} ${updatedReview.author.lastName}`.trim(),
      },
    });
  })
);

/**
 * @swagger
 * /api/reviews/realtor/manage:
 *   get:
 *     summary: Get reviews for moderation
 *     description: Get all reviews for realtor's properties with moderation options
 *     tags: [Reviews]
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
 *         name: isVisible
 *         schema:
 *           type: string
 *           enum: [true, false]
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *       403:
 *         description: Realtor access required
 *       404:
 *         description: Realtor profile not found
 */
router.get(
  "/realtor/manage",
  authenticate,
  authorize("REALTOR", "ADMIN"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const {
      page = 1,
      limit = 20,
      isVisible,
      propertyId,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get realtor record
    const realtor = await prisma.realtor.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!realtor) {
      throw new AppError("Realtor profile not found", 404);
    }

    const where: any = {
      property: {
        realtorId: realtor.id,
      },
    };

    // Filter by visibility
    if (isVisible !== undefined) {
      where.isVisible = isVisible === "true";
    }

    // Filter by specific property
    if (propertyId) {
      where.propertyId = propertyId as string;
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          property: {
            select: {
              id: true,
              title: true,
            },
          },
          photos: {
            select: {
              url: true,
              caption: true,
            },
          },
          hostResponse: {
            select: {
              id: true,
              comment: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          [sortBy as string]: sortOrder,
        },
        skip,
        take: limitNum,
      }),
      prisma.review.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      message: "Reviews retrieved for moderation",
      data: reviews,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount: total,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  })
);

/**
 * @swagger
 * /api/reviews/{id}/response:
 *   post:
 *     summary: Add host response to review
 *     description: Allows realtor to respond to a review on their property
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Response added successfully
 *       400:
 *         description: Validation error or response already exists
 *       403:
 *         description: Not authorized to respond to this review
 *       404:
 *         description: Review not found
 */
router.post(
  "/:id/response",
  authenticate,
  authorize("REALTOR", "ADMIN"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: reviewId } = req.params;
    const { comment } = req.body;
    const userId = req.user!.id;

    if (!comment || comment.trim().length === 0) {
      throw new AppError("Response comment is required", 400);
    }

    if (comment.length > 1000) {
      throw new AppError("Response comment cannot exceed 1000 characters", 400);
    }

    // Get review with property and existing response
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        property: {
          include: {
            realtor: true,
          },
        },
        hostResponse: true,
        author: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!review) {
      throw new AppError("Review not found", 404);
    }

    // Check if response already exists
    if (review.hostResponse) {
      throw new AppError(
        "A response already exists for this review. Use PUT to update it.",
        400
      );
    }

    // Verify user is the property owner
    if (review.property.realtor.userId !== userId) {
      throw new AppError(
        "You can only respond to reviews on your properties",
        403
      );
    }

    // Create response
    const response = await prisma.reviewResponse.create({
      data: {
        reviewId,
        authorId: userId,
        comment: comment.trim(),
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Send notification to review author
    try {
      const notificationService = NotificationService.getInstance();
      await notificationService.createAndSendNotification({
        userId: review.authorId,
        type: "REVIEW_RESPONSE",
        title: "Host Responded to Your Review",
        message: `${review.property.realtor.businessName} has responded to your review of ${review.property.title}`,
        data: {
          reviewId: review.id,
          propertyId: review.propertyId,
          responseId: response.id,
        },
        priority: "normal",
      });
    } catch (error) {
      logger.error("Failed to send review response notification:", error);
    }

    res.status(201).json({
      success: true,
      message: "Response added successfully",
      data: response,
    });
  })
);

/**
 * @swagger
 * /api/reviews/{id}/response:
 *   put:
 *     summary: Update host response to review
 *     description: Allows realtor to update their response to a review
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Response updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Not authorized to update this response
 *       404:
 *         description: Review or response not found
 */
router.put(
  "/:id/response",
  authenticate,
  authorize("REALTOR", "ADMIN"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: reviewId } = req.params;
    const { comment } = req.body;
    const userId = req.user!.id;

    if (!comment || comment.trim().length === 0) {
      throw new AppError("Response comment is required", 400);
    }

    if (comment.length > 1000) {
      throw new AppError("Response comment cannot exceed 1000 characters", 400);
    }

    // Get review with property and existing response
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        property: {
          include: {
            realtor: true,
          },
        },
        hostResponse: true,
      },
    });

    if (!review) {
      throw new AppError("Review not found", 404);
    }

    if (!review.hostResponse) {
      throw new AppError(
        "No response exists for this review. Use POST to create one.",
        404
      );
    }

    // Verify user is the property owner or the response author
    if (
      review.property.realtor.userId !== userId &&
      review.hostResponse.authorId !== userId
    ) {
      throw new AppError("You can only update your own responses", 403);
    }

    // Update response
    const updatedResponse = await prisma.reviewResponse.update({
      where: { id: review.hostResponse.id },
      data: {
        comment: comment.trim(),
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Response updated successfully",
      data: updatedResponse,
    });
  })
);

/**
 * @swagger
 * /api/reviews/{id}/response:
 *   delete:
 *     summary: Delete host response to review
 *     description: Allows realtor to delete their response to a review
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Response deleted successfully
 *       403:
 *         description: Not authorized to delete this response
 *       404:
 *         description: Review or response not found
 */
router.delete(
  "/:id/response",
  authenticate,
  authorize("REALTOR", "ADMIN"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: reviewId } = req.params;
    const userId = req.user!.id;

    // Get review with property and existing response
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        property: {
          include: {
            realtor: true,
          },
        },
        hostResponse: true,
      },
    });

    if (!review) {
      throw new AppError("Review not found", 404);
    }

    if (!review.hostResponse) {
      throw new AppError("No response exists for this review", 404);
    }

    // Verify user is the property owner or the response author
    if (
      review.property.realtor.userId !== userId &&
      review.hostResponse.authorId !== userId
    ) {
      throw new AppError("You can only delete your own responses", 403);
    }

    // Delete response
    await prisma.reviewResponse.delete({
      where: { id: review.hostResponse.id },
    });

    res.json({
      success: true,
      message: "Response deleted successfully",
    });
  })
);

/**
 * @swagger
 * /api/reviews/{id}/helpful:
 *   post:
 *     summary: Mark review as helpful
 *     description: Allows users to mark a review as helpful (upvote)
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review marked as helpful
 *       404:
 *         description: Review not found
 *       409:
 *         description: Already marked as helpful
 */
router.post(
  "/:id/helpful",
  authenticate,
  asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const { id: reviewId } = req.params;
      const userId = req.user!.id;

      // Check if review exists
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
      });

      if (!review) {
        throw new AppError("Review not found", 404);
      }

      // Check if user already marked this as helpful
      const existingHelpful = await prisma.reviewHelpful.findUnique({
        where: {
          reviewId_userId: {
            reviewId,
            userId,
          },
        },
      });

      if (existingHelpful) {
        // If already marked, remove the mark (toggle behavior)
        await prisma.reviewHelpful.delete({
          where: {
            reviewId_userId: {
              reviewId,
              userId,
            },
          },
        });

        // Decrement helpfulCount
        const updatedReview = await prisma.review.update({
          where: { id: reviewId },
          data: {
            helpfulCount: {
              decrement: 1,
            },
          },
        });

        res.json({
          success: true,
          message: "Helpful mark removed",
          data: {
            reviewId,
            helpfulCount: updatedReview.helpfulCount,
            isHelpful: false,
          },
        });
        return;
      }

      // Create helpful mark
      await prisma.reviewHelpful.create({
        data: {
          reviewId,
          userId,
        },
      });

      // Increment helpfulCount
      const updatedReview = await prisma.review.update({
        where: { id: reviewId },
        data: {
          helpfulCount: {
            increment: 1,
          },
        },
      });

      res.json({
        success: true,
        message: "Review marked as helpful",
        data: {
          reviewId,
          helpfulCount: updatedReview.helpfulCount,
          isHelpful: true,
        },
      });
    }
  )
);

export default router;
