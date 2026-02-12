import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  authenticate,
  AuthenticatedRequest,
  requireRole,
} from "@/middleware/auth";
import { asyncHandler } from "@/middleware/errorHandler";

const router = Router();
const prisma = new PrismaClient();

const getErrorDetails = (error: unknown): string => {
  return error instanceof Error ? error.message : "Unknown error";
};

const sanitizeFavoriteProperty = <T extends Record<string, unknown>>(
  property: T
): T & { sensitiveDetailsUnlocked: false } => {
  return {
    ...property,
    address: null,
    accessInstructions: null,
    wifiName: null,
    wifiPassword: null,
    parkingInstructions: null,
    sensitiveDetailsUnlocked: false as const,
  };
};

/**
 * Add a property to favorites
 * POST /favorites
 */
router.post(
  "/",
  authenticate,
  requireRole("GUEST"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { propertyId } = req.body;
    const userId = req.user!.id;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        error: "Property ID is required",
      });
    }

    // Check if property exists and is active
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        title: true,
        isActive: true,
        status: true,
      },
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        error: "Property not found",
      });
    }

    if (!property.isActive || property.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        error: "This property is not available",
      });
    }

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    });

    if (existingFavorite) {
      return res.status(200).json({
        success: true,
        message: "Property is already in favorites",
        data: existingFavorite,
      });
    }

    // Create favorite
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        propertyId,
      },
      include: {
        property: {
          include: {
            images: {
              orderBy: { order: "asc" },
              take: 1,
            },
            realtor: {
              select: {
                businessName: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    const sanitizedFavorite = {
      ...favorite,
      property: sanitizeFavoriteProperty(favorite.property),
    };

    return res.status(201).json({
      success: true,
      message: "Property added to favorites",
      data: sanitizedFavorite,
    });
  })
);

/**
 * Remove a property from favorites
 * DELETE /favorites/:propertyId
 */
router.delete(
  "/:propertyId",
  authenticate,
  requireRole("GUEST"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { propertyId } = req.params;
    const userId = req.user!.id;

    // Check if favorite exists
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        error: "Favorite not found",
      });
    }

    // Delete favorite
    await prisma.favorite.delete({
      where: {
        id: favorite.id,
      },
    });

    return res.json({
      success: true,
      message: "Property removed from favorites",
    });
  })
);

/**
 * Get all user favorites
 * GET /favorites
 */
router.get(
  "/",
  authenticate,
  requireRole("GUEST"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      const favorites = await prisma.favorite.findMany({
        where: { userId },
        include: {
          property: {
            include: {
              images: {
                orderBy: { order: "asc" },
              },
              realtor: {
                select: {
                  id: true,
                  businessName: true,
                  slug: true,
                  logoUrl: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Filter out properties that are no longer active
      const activeFavorites = favorites
        .filter((fav) => fav.property.isActive && fav.property.status === "ACTIVE")
        .map((fav) => ({
          ...fav,
          property: sanitizeFavoriteProperty(fav.property),
        }));

      res.json({
        success: true,
        data: activeFavorites,
      });
    } catch (error: unknown) {
      
      res.status(500).json({
        success: false,
        error: "Failed to fetch favorites",
        details:
          process.env.NODE_ENV === "development"
            ? getErrorDetails(error)
            : undefined,
      });
    }
  }
);

/**
 * Check if a property is favorited
 * GET /favorites/check/:propertyId
 */
router.get(
  "/check/:propertyId",
  authenticate,
  requireRole("GUEST"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { propertyId } = req.params;
      const userId = req.user!.id;

      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_propertyId: {
            userId,
            propertyId,
          },
        },
      });

      res.json({
        success: true,
        data: {
          isFavorited: !!favorite,
          favoriteId: favorite?.id,
        },
      });
    } catch (error: unknown) {
      
      res.status(500).json({
        success: false,
        error: "Failed to check favorite status",
        details:
          process.env.NODE_ENV === "development"
            ? getErrorDetails(error)
            : undefined,
      });
    }
  }
);

export default router;
