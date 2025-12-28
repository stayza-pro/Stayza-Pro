import express, { Response } from "express";
import { AuthenticatedRequest } from "@/types";
import { prisma } from "@/config/database";
import { asyncHandler, AppError } from "@/middleware/errorHandler";
import { authenticate } from "@/middleware/auth";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Branding
 *     description: Realtor branding and customization endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RealtorBranding:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Realtor ID
 *         userId:
 *           type: string
 *           description: User ID
 *         businessName:
 *           type: string
 *           description: Business name
 *         businessEmail:
 *           type: string
 *           description: Business email
 *         subdomain:
 *           type: string
 *           description: Realtor subdomain/slug
 *         logo:
 *           type: string
 *           description: Logo URL
 *         tagline:
 *           type: string
 *           description: Business tagline
 *         description:
 *           type: string
 *           description: Business description
 *         colors:
 *           type: object
 *           properties:
 *             primary:
 *               type: string
 *               description: Primary brand color (hex)
 *             secondary:
 *               type: string
 *               description: Secondary brand color (hex)
 *             accent:
 *               type: string
 *               description: Accent brand color (hex)
 *         social:
 *           type: object
 *           properties:
 *             website:
 *               type: string
 *             instagram:
 *               type: string
 *             twitter:
 *               type: string
 *             linkedin:
 *               type: string
 *             facebook:
 *               type: string
 *             youtube:
 *               type: string
 *             whatsappType:
 *               type: string
 *         stats:
 *           type: object
 *           properties:
 *             totalProperties:
 *               type: number
 *             totalGuests:
 *               type: number
 *             totalReviews:
 *               type: number
 *             averageRating:
 *               type: number
 */

/**
 * @swagger
 * /api/branding/subdomain/{subdomain}:
 *   get:
 *     summary: Get realtor branding by subdomain
 *     description: Get realtor branding data for guest landing pages (public endpoint)
 *     tags: [Branding]
 *     parameters:
 *       - in: path
 *         name: subdomain
 *         required: true
 *         schema:
 *           type: string
 *         description: Realtor subdomain/slug
 *         example: luxury-homes
 *     responses:
 *       200:
 *         description: Branding retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/RealtorBranding'
 *       400:
 *         description: Subdomain is required
 *       403:
 *         description: Realtor website is not available (inactive or not approved)
 *       404:
 *         description: Realtor not found with this subdomain
 */
router.get(
  "/subdomain/:subdomain",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { subdomain } = req.params;

    if (!subdomain) {
      throw new AppError("Subdomain is required", 400);
    }

    const realtor = await prisma.realtor.findUnique({
      where: {
        slug: subdomain,
      },
      select: {
        id: true,
        userId: true,
        businessName: true,
        tagline: true,
        description: true,
        slug: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        websiteUrl: true,
        status: true,
        isActive: true,
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
      throw new AppError("Realtor not found with this subdomain", 404);
    }

    if (!realtor.isActive || realtor.status !== "APPROVED") {
      throw new AppError("This realtor's website is not available", 403);
    }

    const properties = await prisma.property.findMany({
      where: {
        realtorId: realtor.id,
        status: "ACTIVE",
        isActive: true,
      },
      select: {
        id: true,
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    const propertyIds = properties.map((p) => p.id);

    const uniqueGuests = await prisma.booking.groupBy({
      by: ["guestId"],
      where: {
        propertyId: { in: propertyIds },
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
      _count: {
        guestId: true,
      },
    });

    let totalReviews = 0;
    let totalRatingSum = 0;

    properties.forEach((property) => {
      totalReviews += property.reviews.length;
      property.reviews.forEach((review) => {
        totalRatingSum += review.rating;
      });
    });

    const avgRating = totalReviews > 0 ? totalRatingSum / totalReviews : 0;

    const branding = {
      id: realtor.id,
      userId: realtor.userId,
      businessName: realtor.businessName,
      businessEmail: realtor.user.email,
      subdomain: realtor.slug,
      logo: realtor.logoUrl,
      tagline: realtor.tagline,
      description: realtor.description,
      colors: {
        primary: realtor.primaryColor,
        secondary: realtor.secondaryColor || "#10B981",
        accent: realtor.accentColor || "#F59E0B",
      },
      social: {
        website: realtor.websiteUrl,
      },
      stats: {
        totalProperties: properties.length,
        totalGuests: uniqueGuests.length,
        totalReviews: totalReviews,
        averageRating: avgRating,
      },
      user: realtor.user,
    };

    res.status(200).json({
      success: true,
      data: branding,
    });
  })
);

/**
 * @swagger
 * /api/branding/me:
 *   get:
 *     summary: Get current realtor's branding
 *     description: Get authenticated realtor's branding data (for dashboard customization)
 *     tags: [Branding]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Branding retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     businessName:
 *                       type: string
 *                     subdomain:
 *                       type: string
 *                     logo:
 *                       type: string
 *                     tagline:
 *                       type: string
 *                     description:
 *                       type: string
 *                     colors:
 *                       type: object
 *                       properties:
 *                         primary:
 *                           type: string
 *                         secondary:
 *                           type: string
 *                         accent:
 *                           type: string
 *                     social:
 *                       type: object
 *                       properties:
 *                         website:
 *                           type: string
 *                         instagram:
 *                           type: string
 *                         twitter:
 *                           type: string
 *                         linkedin:
 *                           type: string
 *                         facebook:
 *                           type: string
 *                         youtube:
 *                           type: string
 *                         whatsappType:
 *                           type: string
 *                     status:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: Realtor profile not found
 */
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const realtor = await prisma.realtor.findUnique({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        userId: true,
        businessName: true,
        tagline: true,
        description: true,
        slug: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        websiteUrl: true,
        status: true,
        isActive: true,
      },
    });

    if (!realtor) {
      throw new AppError("Realtor profile not found", 404);
    }

    const branding = {
      id: realtor.id,
      userId: realtor.userId,
      businessName: realtor.businessName,
      subdomain: realtor.slug,
      logo: realtor.logoUrl,
      tagline: realtor.tagline,
      description: realtor.description,
      colors: {
        primary: realtor.primaryColor,
        secondary: realtor.secondaryColor || "#10B981",
        accent: realtor.accentColor || "#F59E0B",
      },
      social: {
        website: realtor.websiteUrl,
      },
      status: realtor.status,
      isActive: realtor.isActive,
    };

    res.status(200).json({
      success: true,
      data: branding,
    });
  })
);

export default router;
