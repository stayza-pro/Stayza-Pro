import { Response } from "express";
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

/**
 * @desc    Get all properties with search and filtering
 * @route   GET /api/properties
 * @access  Public
 */
export const getProperties = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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

    // Build where clause
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

    // Check availability if dates are provided
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      // Properties that don't have conflicting bookings or unavailable dates
      where.AND = [
        {
          bookings: {
            none: {
              AND: [
                { status: { in: ["CONFIRMED", "PENDING"] } },
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

    // Get properties
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          realtor: {
            select: {
              id: true,
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
      prisma.property.count({ where }),
    ]);

    // Calculate average ratings
    const propertiesWithRatings = properties.map((property) => {
      const averageRating =
        property.reviews.length > 0
          ? property.reviews.reduce((sum, review) => sum + review.rating, 0) /
            property.reviews.length
          : 0;

      return {
        ...property,
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: property._count.reviews,
      };
    });

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
  }
);

/**
 * @desc    Get single property by ID
 * @route   GET /api/properties/:id
 * @access  Public
 */
export const getProperty = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
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
              },
            },
          },
          where: { isVisible: true },
          orderBy: { createdAt: "desc" },
        },
        unavailableDates: {
          select: {
            date: true,
            reason: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    // Calculate average rating
    const averageRating =
      property.reviews.length > 0
        ? property.reviews.reduce((sum, review) => sum + review.rating, 0) /
          property.reviews.length
        : 0;

    const propertyWithRating = {
      ...property,
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: property._count.reviews,
    };

    res.json({
      success: true,
      message: "Property retrieved successfully",
      data: propertyWithRating,
    });
  }
);

/**
 * @desc    Create new property
 * @route   POST /api/properties
 * @access  Private (HOST only)
 */
export const createProperty = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { error, value } = createPropertySchema.validate(req.body);

    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const property = await prisma.property.create({
      data: {
        ...value,
        realtorId: req.user!.id,
      },
      include: {
        realtor: {
          select: {
            id: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Property created successfully",
      data: property,
    });
  }
);

/**
 * @desc    Update property
 * @route   PUT /api/properties/:id
 * @access  Private (Owner or ADMIN)
 */
export const updateProperty = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { error, value } = updatePropertySchema.validate(req.body);

    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    // Find property
    const existingProperty = await prisma.property.findUnique({
      where: { id },
    });

    if (!existingProperty) {
      throw new AppError("Property not found", 404);
    }

    // Check ownership
    if (
      existingProperty.realtorId !== req.user!.id &&
      req.user!.role !== "ADMIN"
    ) {
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
  }
);

const MAX_PROPERTY_IMAGES = 8;

/**
 * @desc    Upload property images
 * @route   POST /api/properties/:id/images
 * @access  Private (Owner or ADMIN)
 */
export const uploadPropertyImages = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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

    if (property.realtorId !== req.user!.id && req.user!.role !== "ADMIN") {
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
        width: upload.width || null,
        height: upload.height || null,
        order: startingOrder + index,
        publicId: upload.public_id,
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
  }
);

/**
 * @desc    Delete a property image
 * @route   DELETE /api/properties/:id/images/:imageId
 * @access  Private (Owner or ADMIN)
 */
export const deletePropertyImage = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id, imageId } = req.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: { images: { orderBy: { order: "asc" } } },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    if (property.realtorId !== req.user!.id && req.user!.role !== "ADMIN") {
      throw new AppError("Not authorized to modify this property", 403);
    }

    const image = property.images.find((img) => img.id === imageId);

    if (!image) {
      throw new AppError("Image not found", 404);
    }

    if (image.publicId) {
      await deleteImage(image.publicId);
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
  }
);

/**
 * @desc    Reorder property images
 * @route   PUT /api/properties/:id/images/reorder
 * @access  Private (Owner or ADMIN)
 */
export const reorderPropertyImages = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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

    if (property.realtorId !== req.user!.id && req.user!.role !== "ADMIN") {
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
  }
);

/**
 * @desc    Delete property
 * @route   DELETE /api/properties/:id
 * @access  Private (Owner or ADMIN)
 */
export const deleteProperty = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Find property
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        bookings: {
          where: {
            status: { in: ["CONFIRMED", "PENDING"] },
          },
        },
      },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    // Check ownership
    if (property.realtorId !== req.user!.id && req.user!.role !== "ADMIN") {
      throw new AppError("Not authorized to delete this property", 403);
    }

    // Check for active bookings
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
  }
);

/**
 * @desc    Get properties by host
 * @route   GET /api/properties/host/:realtorId
 * @access  Public
 */
export const getPropertiesByHost = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { realtorId } = req.params;
    const {
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query as PropertySearchQuery;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where: {
          realtorId,
          isActive: true,
        },
        include: {
          realtor: {
            select: {
              id: true,
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
        where: {
          realtorId,
          isActive: true,
        },
      }),
    ]);

    // Calculate average ratings
    const propertiesWithRatings = properties.map((property) => {
      const averageRating =
        property.reviews.length > 0
          ? property.reviews.reduce((sum, review) => sum + review.rating, 0) /
            property.reviews.length
          : 0;

      return {
        ...property,
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: property._count.reviews,
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
  }
);

// /**
//  * @desc    Upload property images
//  * @route   POST /api/properties/:id/images
//  * @access  Private (Owner or ADMIN)
//  */
// export const uploadPropertyImages = asyncHandler(
//   async (req: AuthenticatedRequest, res: Response) => {
//     const { id } = req.params;
//     const { images } = req.body;

//     if (!images || !Array.isArray(images)) {
//       throw new AppError("Images array is required", 400);
//     }

//     // Find property
//     const property = await prisma.property.findUnique({
//       where: { id },
//       include: {
//         images: true,
//       },
//     });

//     if (!property) {
//       throw new AppError("Property not found", 404);
//     }

//     // Check ownership
//     if (property.realtorId !== req.user!.id && req.user!.role !== "ADMIN") {
//       throw new AppError("Not authorized to update this property", 403);
//     }

//     // Update property with new images
//     const updatedProperty = await prisma.property.update({
//       where: { id },
//       data: {
//         images: {
//           create: images.map((image, index) => ({
//             url: image.url,
//             width: image.width,
//             height: image.height,
//             order: property.images.length + index,
//           })),
//         },
//       },
//       include: {
//         images: true,
//       },
//     });

//     res.json({
//       success: true,
//       message: "Images uploaded successfully",
//       data: { images: updatedProperty.images },
//     });
//   }
// );
