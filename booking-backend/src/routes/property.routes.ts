import express, { Response } from "express";
import "multer";
import { PropertyType } from "@prisma/client";
import { prisma } from "@/config/database";
import {
  AuthenticatedRequest,
  PropertySearchQuery,
  ApiResponse,
} from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { createPropertySchema, updatePropertySchema } from "@/utils/validation";
import { uploadMultipleImages, deleteImage } from "@/utils/upload";
import {
  authenticate,
  authorize,
  requireApprovedRealtor,
} from "@/middleware/auth";
import { upload } from "@/utils/upload";

const router = express.Router();

const MAX_PROPERTY_IMAGES = 8;

/**
 * @swagger
 * tags:
 *   - name: Properties
 *     description: Property management and search endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Property:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         type:
 *           type: string
 *           enum: [APARTMENT, HOUSE, VILLA, CONDO, STUDIO, LOFT]
 *         address:
 *           type: string
 *         city:
 *           type: string
 *         country:
 *           type: string
 *         latitude:
 *           type: number
 *         longitude:
 *           type: number
 *         pricePerNight:
 *           type: number
 *         currency:
 *           type: string
 *         bedrooms:
 *           type: integer
 *         bathrooms:
 *           type: integer
 *         maxGuests:
 *           type: integer
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *         images:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               url:
 *                 type: string
 *               order:
 *                 type: integer
 *         status:
 *           type: string
 *           enum: [DRAFT, ACTIVE, INACTIVE]
 *         averageRating:
 *           type: number
 *         reviewCount:
 *           type: integer
 *         realtorId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/properties:
 *   get:
 *     summary: Get all properties with search and filtering
 *     description: Search and filter properties with pagination, availability checking
 *     tags: [Properties]
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
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [APARTMENT, HOUSE, VILLA, CONDO, STUDIO, LOFT]
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxGuests
 *         schema:
 *           type: integer
 *       - in: query
 *         name: checkIn
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: checkOut
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: amenities
 *         schema:
 *           type: string
 *         description: Comma-separated list of amenities
 *     responses:
 *       200:
 *         description: Properties retrieved successfully
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Property'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 */
router.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      sortOrder = "desc",
      city,
      country,
      type,
      minPrice,
      maxPrice,
      maxGuests,
      checkIn,
      checkOut,
      amenities,
    } = req.query as PropertySearchQuery;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      isActive: true,
    };

    if (city) where.city = { contains: city, mode: "insensitive" };
    if (country) where.country = { contains: country, mode: "insensitive" };
    if (type) where.type = type as PropertyType;
    if (minPrice || maxPrice) {
      where.pricePerNight = {};
      if (minPrice) where.pricePerNight.gte = parseFloat(minPrice);
      if (maxPrice) where.pricePerNight.lte = parseFloat(maxPrice);
    }
    if (maxGuests) where.maxGuests = { gte: parseInt(maxGuests, 10) };
    if (amenities) {
      const amenitiesArray = amenities.split(",");
      where.amenities = { hasEvery: amenitiesArray };
    }

    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      where.AND = [
        {
          bookings: {
            none: {
              AND: [
                { status: { in: ["ACTIVE", "PENDING"] } },
                {
                  OR: [
                    {
                      AND: [
                        { checkInDate: { lte: checkInDate } },
                        { checkOutDate: { gt: checkInDate } },
                      ],
                    },
                    {
                      AND: [
                        { checkInDate: { lt: checkOutDate } },
                        { checkOutDate: { gte: checkOutDate } },
                      ],
                    },
                    {
                      AND: [
                        { checkInDate: { gte: checkInDate } },
                        { checkOutDate: { lte: checkOutDate } },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
        {
          unavailableDates: {
            none: {
              date: {
                gte: checkInDate,
                lt: checkOutDate,
              },
            },
          },
        },
      ];
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          images: {
            orderBy: {
              order: "asc",
            },
          },
          realtor: {
            select: {
              id: true,
            },
          },
          reviews: false,
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limitNum,
      }),
      prisma.property.count({ where }),
    ]);

    const propertiesWithRatings = properties.map((property) => ({
      ...property,
      averageRating: property.averageRating
        ? Number(property.averageRating)
        : 0,
      reviewCount: property.reviewCount,
    }));

    const response: ApiResponse = {
      success: true,
      message: "Properties retrieved successfully",
      data: propertiesWithRatings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };

    res.json(response);
  })
);

/**
 * @swagger
 * /api/properties/{id}:
 *   get:
 *     summary: Get single property by ID
 *     description: Get detailed information about a specific property
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property retrieved successfully
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
 *                   $ref: '#/components/schemas/Property'
 *       404:
 *         description: Property not found
 */
router.get(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
        realtor: {
          select: {
            id: true,
            createdAt: true,
          },
        },
        reviews: {
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
          where: {},
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    const propertyWithRating = {
      ...property,
      pricePerNight: Math.round(Number(property.pricePerNight) * 100) / 100,
      cleaningFee: property.cleaningFee
        ? Math.round(Number(property.cleaningFee) * 100) / 100
        : null,
      securityDeposit: property.securityDeposit
        ? Math.round(Number(property.securityDeposit) * 100) / 100
        : null,
      serviceFee: property.serviceFee
        ? Math.round(Number(property.serviceFee) * 100) / 100
        : null,
      averageRating: property.averageRating
        ? Number(property.averageRating)
        : 0,
      reviewCount: property.reviewCount,
    };

    res.json({
      success: true,
      message: "Property retrieved successfully",
      data: propertyWithRating,
    });
  })
);

/**
 * @swagger
 * /api/properties:
 *   post:
 *     summary: Create new property
 *     description: Create a new property listing (realtor only)
 *     tags: [Properties]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - type
 *               - address
 *               - city
 *               - country
 *               - pricePerNight
 *               - bedrooms
 *               - bathrooms
 *               - maxGuests
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [APARTMENT, HOUSE, VILLA, CONDO, STUDIO, LOFT]
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               country:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               pricePerNight:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: NGN
 *               bedrooms:
 *                 type: integer
 *               bathrooms:
 *                 type: integer
 *               maxGuests:
 *                 type: integer
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Property created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Not authorized
 */
router.post(
  "/",
  authenticate,
  authorize("REALTOR", "ADMIN"),
  requireApprovedRealtor,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { error, value } = createPropertySchema.validate(req.body);

    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const realtorId = req.realtor?.id || req.user!.id;

    const property = await prisma.property.create({
      data: {
        ...value,
        realtorId,
      },
      include: {
        realtor: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Property created successfully",
      data: property,
    });
  })
);

/**
 * @swagger
 * /api/properties/{id}:
 *   put:
 *     summary: Update property
 *     description: Update an existing property (owner or admin only)
 *     tags: [Properties]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               pricePerNight:
 *                 type: number
 *               bedrooms:
 *                 type: integer
 *               bathrooms:
 *                 type: integer
 *               maxGuests:
 *                 type: integer
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Property updated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Property not found
 */
router.put(
  "/:id",
  authenticate,
  authorize("REALTOR", "ADMIN"),
  requireApprovedRealtor,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { error, value } = updatePropertySchema.validate(req.body);

    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const existingProperty = await prisma.property.findUnique({
      where: { id },
    });

    if (!existingProperty) {
      throw new AppError("Property not found", 404);
    }

    if (existingProperty.realtorId !== req.realtor!.id) {
      throw new AppError("Not authorized to update this property", 403);
    }

    const property = await prisma.property.update({
      where: { id },
      data: value,
      include: {
        realtor: {
          select: {
            id: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Property updated successfully",
      data: property,
    });
  })
);

/**
 * @swagger
 * /api/properties/{id}/status:
 *   patch:
 *     summary: Toggle property status
 *     description: Change property status between DRAFT, ACTIVE, INACTIVE (owner only)
 *     tags: [Properties]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [DRAFT, ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Property status updated successfully
 *       400:
 *         description: Invalid status or property incomplete
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Property not found
 */
router.patch(
  "/:id/status",
  authenticate,
  authorize("REALTOR", "ADMIN"),
  requireApprovedRealtor,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["DRAFT", "ACTIVE", "INACTIVE"];
    if (!status || !validStatuses.includes(status)) {
      throw new AppError(
        `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        400
      );
    }

    const existingProperty = await prisma.property.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existingProperty) {
      throw new AppError("Property not found", 404);
    }

    if (existingProperty.realtorId !== req.realtor!.id) {
      throw new AppError("Not authorized to update this property", 403);
    }

    if (status === "ACTIVE") {
      const errors: string[] = [];

      if (!existingProperty.title) errors.push("Title is required");
      if (!existingProperty.description) errors.push("Description is required");
      if (
        !existingProperty.pricePerNight ||
        Number(existingProperty.pricePerNight) <= 0
      ) {
        errors.push("Price per night must be greater than 0");
      }
      if (!existingProperty.images || existingProperty.images.length === 0) {
        errors.push("At least one image is required");
      }
      if (!existingProperty.address) errors.push("Address is required");
      if (!existingProperty.city) errors.push("City is required");
      if (!existingProperty.country) errors.push("Country is required");

      if (errors.length > 0) {
        throw new AppError(
          `Cannot activate property. Please complete the following: ${errors.join(
            ", "
          )}`,
          400
        );
      }
    }

    const property = await prisma.property.update({
      where: { id },
      data: {
        status,
        isActive: status === "ACTIVE",
      },
      include: {
        realtor: {
          select: {
            id: true,
            businessName: true,
          },
        },
        images: true,
      },
    });

    res.json({
      success: true,
      message: `Property ${status.toLowerCase()} successfully`,
      data: property,
    });
  })
);

/**
 * @swagger
 * /api/properties/{id}/images:
 *   post:
 *     summary: Upload property images
 *     description: Upload multiple images for a property (max 8 images total)
 *     tags: [Properties]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *       400:
 *         description: Invalid request or max images exceeded
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Property not found
 */
router.post(
  "/:id/images",
  authenticate,
  authorize("REALTOR", "ADMIN"),
  requireApprovedRealtor,
  upload.array("images", MAX_PROPERTY_IMAGES),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      throw new AppError("Please upload at least one image", 400);
    }

    if (files.length > MAX_PROPERTY_IMAGES) {
      throw new AppError("You can upload a maximum of 8 images at once", 400);
    }

    const property = await prisma.property.findUnique({
      where: { id },
      include: { images: { orderBy: { order: "asc" } }, realtor: true },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    if (property.realtorId !== req.realtor!.id) {
      throw new AppError("Not authorized to modify this property", 403);
    }

    if (property.images.length + files.length > MAX_PROPERTY_IMAGES) {
      throw new AppError(
        `You can only have up to ${MAX_PROPERTY_IMAGES} images per property`,
        400
      );
    }

    const buffers = files.map((file) => file.buffer);
    const uploads = await uploadMultipleImages(
      buffers,
      `properties/${property.realtor.slug || property.realtorId}`
    );

    const startingOrder = property.images.length;

    await prisma.propertyImage.createMany({
      data: uploads.map((upload, index) => ({
        propertyId: property.id,
        url: upload.secure_url,
        order: startingOrder + index,
      })),
    });

    const updatedImages = await prisma.propertyImage.findMany({
      where: { propertyId: property.id },
      orderBy: { order: "asc" },
    });

    res.json({
      success: true,
      message: "Images uploaded successfully",
      data: { images: updatedImages },
    });
  })
);

/**
 * @swagger
 * /api/properties/{id}/images/{imageId}:
 *   delete:
 *     summary: Delete a property image
 *     description: Delete a specific property image (owner only)
 *     tags: [Properties]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Property or image not found
 */
router.delete(
  "/:id/images/:imageId",
  authenticate,
  authorize("REALTOR", "ADMIN"),
  requireApprovedRealtor,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id, imageId } = req.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: { images: { orderBy: { order: "asc" } } },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    if (property.realtorId !== req.realtor!.id) {
      throw new AppError("Not authorized to modify this property", 403);
    }

    const image = property.images.find((img) => img.id === imageId);

    if (!image) {
      throw new AppError("Image not found", 404);
    }

    await prisma.propertyImage.delete({ where: { id: image.id } });

    const remainingImages = await prisma.propertyImage.findMany({
      where: { propertyId: property.id },
      orderBy: { order: "asc" },
    });

    await Promise.all(
      remainingImages.map((img, index) =>
        prisma.propertyImage.update({
          where: { id: img.id },
          data: { order: index },
        })
      )
    );

    const refreshed = await prisma.propertyImage.findMany({
      where: { propertyId: property.id },
      orderBy: { order: "asc" },
    });

    res.json({
      success: true,
      message: "Image deleted successfully",
      data: { images: refreshed },
    });
  })
);

/**
 * @swagger
 * /api/properties/{id}/images/reorder:
 *   put:
 *     summary: Reorder property images
 *     description: Change the display order of property images
 *     tags: [Properties]
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
 *               - imageOrder
 *             properties:
 *               imageOrder:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of image IDs in desired order
 *     responses:
 *       200:
 *         description: Images reordered successfully
 *       400:
 *         description: Invalid image order
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Property not found
 */
router.put(
  "/:id/images/reorder",
  authenticate,
  authorize("REALTOR", "ADMIN"),
  requireApprovedRealtor,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { imageOrder } = req.body as { imageOrder?: string[] };

    if (!Array.isArray(imageOrder) || imageOrder.length === 0) {
      throw new AppError("imageOrder must be a non-empty array", 400);
    }

    const property = await prisma.property.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    if (property.realtorId !== req.realtor!.id) {
      throw new AppError("Not authorized to modify this property", 403);
    }

    if (imageOrder.length !== property.images.length) {
      throw new AppError("imageOrder must include all property images", 400);
    }

    const uniqueIds = new Set(imageOrder);
    if (uniqueIds.size !== imageOrder.length) {
      throw new AppError("Duplicate image IDs in order payload", 400);
    }

    const propertyImageIds = property.images.map((img) => img.id);
    const missing = imageOrder.filter((id) => !propertyImageIds.includes(id));
    if (missing.length > 0) {
      throw new AppError("imageOrder contains invalid image IDs", 400);
    }

    await prisma.$transaction(
      imageOrder.map((imageId, index) =>
        prisma.propertyImage.update({
          where: { id: imageId },
          data: { order: index },
        })
      )
    );

    const reordered = await prisma.propertyImage.findMany({
      where: { propertyId: property.id },
      orderBy: { order: "asc" },
    });

    res.json({
      success: true,
      message: "Images reordered successfully",
      data: { images: reordered },
    });
  })
);

/**
 * @swagger
 * /api/properties/{id}:
 *   delete:
 *     summary: Delete property
 *     description: Delete a property (owner or admin only, no active bookings)
 *     tags: [Properties]
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
 *         description: Property deleted successfully
 *       400:
 *         description: Cannot delete property with active bookings
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Property not found
 */
router.delete(
  "/:id",
  authenticate,
  authorize("REALTOR", "ADMIN"),
  requireApprovedRealtor,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        bookings: {
          where: {
            status: { in: ["ACTIVE", "PENDING"] },
          },
        },
      },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    if (property.realtorId !== req.realtor!.id) {
      throw new AppError("Not authorized to delete this property", 403);
    }

    if (property.bookings.length > 0) {
      throw new AppError("Cannot delete property with active bookings", 400);
    }

    await prisma.property.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Property deleted successfully",
    });
  })
);

/**
 * @swagger
 * /api/properties/host/{realtorId}:
 *   get:
 *     summary: Get properties by host/realtor
 *     description: Get all properties belonging to a specific realtor
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: realtorId
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
 *         description: Host properties retrieved successfully
 *       400:
 *         description: Realtor ID is required
 */
router.get(
  "/host/:realtorId",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    let realtorId = req.params.realtorId || req.realtor?.id;

    if (!realtorId) {
      return res.status(400).json({
        success: false,
        message: "Realtor ID is required",
      });
    }

    // If the provided ID is a user ID, look up the corresponding realtor ID
    const realtor = await prisma.realtor.findFirst({
      where: {
        OR: [{ id: realtorId }, { userId: realtorId }],
      },
      select: {
        id: true,
      },
    });

    if (realtor) {
      realtorId = realtor.id;
    }

    const {
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      sortOrder = "desc",
      location,
      checkIn,
      checkOut,
    } = req.query as PropertySearchQuery;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const where: any = { realtorId };

    if (location) {
      where.OR = [
        { title: { contains: location, mode: "insensitive" } },
        { address: { contains: location, mode: "insensitive" } },
        { city: { contains: location, mode: "insensitive" } },
        { state: { contains: location, mode: "insensitive" } },
        { country: { contains: location, mode: "insensitive" } },
      ];
    }

    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
        throw new AppError("Invalid check-in or check-out date", 400);
      }

      if (checkOutDate <= checkInDate) {
        throw new AppError("Check-out date must be after check-in date", 400);
      }

      where.AND = [
        {
          bookings: {
            none: {
              AND: [
                { status: { in: ["ACTIVE", "PENDING"] } },
                {
                  OR: [
                    {
                      AND: [
                        { checkInDate: { lte: checkInDate } },
                        { checkOutDate: { gt: checkInDate } },
                      ],
                    },
                    {
                      AND: [
                        { checkInDate: { lt: checkOutDate } },
                        { checkOutDate: { gte: checkOutDate } },
                      ],
                    },
                    {
                      AND: [
                        { checkInDate: { gte: checkInDate } },
                        { checkOutDate: { lte: checkOutDate } },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
        {
          unavailableDates: {
            none: {
              date: {
                gte: checkInDate,
                lt: checkOutDate,
              },
            },
          },
        },
      ];
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          realtor: {
            select: {
              id: true,
            },
          },
          images: {
            select: {
              id: true,
              url: true,
              order: true,
            },
            orderBy: {
              order: "asc",
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limitNum,
      }),
      prisma.property.count({
        where,
      }),
    ]);

    const propertiesWithRatings = properties.map((property: any) => {
      const averageRating =
        property.reviews && property.reviews.length > 0
          ? property.reviews.reduce(
              (sum: number, review: any) => sum + review.rating,
              0
            ) / property.reviews.length
          : 0;

      return {
        ...property,
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: 0,
      };
    });

    res.json({
      success: true,
      message: "Host properties retrieved successfully",
      data: propertiesWithRatings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });

    return;
  })
);

export default router;
