import express from "express";
import { Request, Response } from "express";
import { AppError } from "@/middleware/errorHandler";
import { authenticate, authorize, optionalAuth } from "@/middleware/auth";
import {
  createReview,
  getPropertyReviews,
  getMyReviews,
  getHostReviews,
  updateReview,
  deleteReview,
  respondToReview,
  getReviewAnalytics,
} from "@/controllers/reviewController";
import {
  uploadReviewPhotos,
  processReviewPhotos,
} from "@/services/photoUpload";

const getReview = (req: Request, res: Response) => {
  throw new AppError("Individual review retrieval coming soon", 501);
};

const toggleReviewVisibility = (req: Request, res: Response) => {
  throw new AppError("Review moderation coming soon", 501);
};

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Review ID
 *         guestId:
 *           type: string
 *           description: Guest user ID who wrote the review
 *         propertyId:
 *           type: string
 *           description: Property ID being reviewed
 *         bookingId:
 *           type: string
 *           description: Associated booking ID
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Rating from 1 to 5 stars
 *         comment:
 *           type: string
 *           description: Review comment text
 *         cleanliness:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Cleanliness rating
 *         communication:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Host communication rating
 *         checkIn:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Check-in experience rating
 *         accuracy:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Property accuracy rating
 *         location:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Location rating
 *         value:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Value for money rating
 *         isVisible:
 *           type: boolean
 *           description: Whether review is visible to public
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         guest:
 *           $ref: '#/components/schemas/User'
 *         property:
 *           $ref: '#/components/schemas/Property'
 *         booking:
 *           $ref: '#/components/schemas/Booking'
 *     CreateReviewRequest:
 *       type: object
 *       required:
 *         - bookingId
 *         - rating
 *         - comment
 *       properties:
 *         bookingId:
 *           type: string
 *           description: Booking ID to review
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Overall rating from 1 to 5 stars
 *         comment:
 *           type: string
 *           minLength: 10
 *           maxLength: 1000
 *           description: Review comment (10-1000 characters)
 *         cleanliness:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Cleanliness rating
 *         communication:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Host communication rating
 *         checkIn:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Check-in experience rating
 *         accuracy:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Property accuracy rating
 *         location:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Location rating
 *         value:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Value for money rating
 *     UpdateReviewRequest:
 *       type: object
 *       properties:
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Overall rating from 1 to 5 stars
 *         comment:
 *           type: string
 *           minLength: 10
 *           maxLength: 1000
 *           description: Review comment (10-1000 characters)
 *         cleanliness:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Cleanliness rating
 *         communication:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Host communication rating
 *         checkIn:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Check-in experience rating
 *         accuracy:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Property accuracy rating
 *         location:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Location rating
 *         value:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Value for money rating
 *     PaginatedReviews:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Review'
 *         pagination:
 *           type: object
 *           properties:
 *             currentPage:
 *               type: integer
 *             totalPages:
 *               type: integer
 *             totalItems:
 *               type: integer
 *             hasNext:
 *               type: boolean
 *             hasPrev:
 *               type: boolean
 *     ToggleVisibilityRequest:
 *       type: object
 *       required:
 *         - isVisible
 *       properties:
 *         isVisible:
 *           type: boolean
 *           description: Whether review should be visible to public
 */

/**
 * @swagger
 * /api/reviews/property/{propertyId}:
 *   get:
 *     summary: Get all reviews for a property (public)
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, rating]
 *           default: createdAt
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Property reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedReviews'
 *       404:
 *         description: Property not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get("/property/:propertyId", getPropertyReviews);

/**
 * @swagger
 * /api/reviews/{id}:
 *   get:
 *     summary: Get review by ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Review retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Review'
 *       404:
 *         description: Review not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   put:
 *     summary: Update review (by author only)
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateReviewRequest'
 *     responses:
 *       200:
 *         description: Review updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Review updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Review'
 *       400:
 *         description: Bad request - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - Can only update your own reviews
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Review not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   delete:
 *     summary: Delete review (by author only)
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Review deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - Can only delete your own reviews
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Review not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get("/:id", optionalAuth, getReview);

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a new review (GUEST only)
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReviewRequest'
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Review created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Review'
 *       400:
 *         description: Bad request - Validation error or booking not eligible for review
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - Only guests can create reviews
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post("/", authenticate, authorize("GUEST"), createReview);

/**
 * @swagger
 * /api/reviews/my/reviews:
 *   get:
 *     summary: Get current user's reviews
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: User reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedReviews'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get("/my/reviews", authenticate, getMyReviews);

/**
 * @swagger
 * /api/reviews/host/reviews:
 *   get:
 *     summary: Get reviews for host's properties (HOST only)
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *         description: Filter by specific property
 *     responses:
 *       200:
 *         description: Host reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedReviews'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - Host access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get(
  "/realtor/reviews",
  authenticate,
  authorize("REALTOR"),
  getHostReviews
);

router.put("/:id", authenticate, updateReview);
router.delete("/:id", authenticate, deleteReview);

/**
 * @swagger
 * /api/reviews/{id}/visibility:
 *   patch:
 *     summary: Toggle review visibility (ADMIN only)
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ToggleVisibilityRequest'
 *     responses:
 *       200:
 *         description: Review visibility updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Review visibility updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Review'
 *       400:
 *         description: Bad request - Invalid visibility value
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Review not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.patch(
  "/:id/visibility",
  authenticate,
  authorize("ADMIN"),
  toggleReviewVisibility
);

/**
 * @swagger
 * /api/reviews/{id}/respond:
 *   post:
 *     summary: Respond to a review (REALTOR only)
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
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
 *                 description: Response comment
 *     responses:
 *       201:
 *         description: Review response created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Review response created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     comment:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - Realtor access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Review not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: Response already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post(
  "/:id/respond",
  authenticate,
  authorize("REALTOR"),
  respondToReview
);

/**
 * @swagger
 * /api/reviews/analytics:
 *   get:
 *     summary: Get review analytics for realtor (REALTOR only)
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Review analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Review analytics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalReviews:
 *                       type: integer
 *                     averageRating:
 *                       type: number
 *                     ratingDistribution:
 *                       type: object
 *                       properties:
 *                         5:
 *                           type: integer
 *                         4:
 *                           type: integer
 *                         3:
 *                           type: integer
 *                         2:
 *                           type: integer
 *                         1:
 *                           type: integer
 *                     recentReviews:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Review'
 *                     responseRate:
 *                       type: integer
 *                       description: Percentage of reviews with responses
 *                     responsesGiven:
 *                       type: integer
 *                       description: Total number of responses given
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - Realtor access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get(
  "/analytics",
  authenticate,
  authorize("REALTOR"),
  getReviewAnalytics
);

/**
 * @swagger
 * /api/reviews/upload-photos:
 *   post:
 *     summary: Upload photos for review
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
 *                 description: Up to 5 photos (max 5MB each)
 *     responses:
 *       200:
 *         description: Photos uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Photos uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     photos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           url:
 *                             type: string
 *                           caption:
 *                             type: string
 *       400:
 *         description: Bad request - Invalid file type or size
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post("/upload-photos", authenticate, (req: Request, res: Response) => {
  uploadReviewPhotos(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Failed to upload photos",
      });
    }

    const files = req.files as Express.Multer.File[];
    const photos = processReviewPhotos(files);

    return res.json({
      success: true,
      message: "Photos uploaded successfully",
      data: { photos },
    });
  });
});

export default router;
