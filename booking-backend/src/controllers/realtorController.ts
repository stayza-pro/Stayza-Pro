import { Request, Response } from "express";
import { prisma } from "@/config/database";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { config } from "@/config";
import {
  createAccountLink,
  createConnectAccount,
  createDashboardLink,
  getAccountStatus,
} from "@/services/stripe";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * @desc    Generate unique slug for realtor
 * @param   businessName - The business name
 * @returns Promise<string> - Unique slug
 */
const generateUniqueSlug = async (businessName: string): Promise<string> => {
  const baseSlug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let slug = baseSlug;
  let counter = 1;

  // Continue generating slugs until we find one that isn't taken
  while (await prisma.realtor.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
};

/**
 * @desc    Register realtor account (complete onboarding)
 * @route   POST /api/realtors/register
 * @access  Private (USER with REALTOR role)
 */
export const registerRealtor = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      businessName,
      description,
      website,
      businessPhone,
      businessEmail,
      businessAddress,
      brandColorHex,
    } = req.body;

    if (!businessName) {
      throw new AppError("Business name is required", 400);
    }

    // Check if user already has a realtor profile
    const existingRealtor = await prisma.realtor.findUnique({
      where: { userId: req.user!.id },
    });

    if (existingRealtor) {
      throw new AppError("Realtor profile already exists", 400);
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(businessName);

    // Validate brand color hex
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (brandColorHex && !colorRegex.test(brandColorHex)) {
      throw new AppError("Invalid brand color hex format", 400);
    }

    // Create realtor profile
    const realtor = await prisma.realtor.create({
      data: {
        userId: req.user!.id,
        businessName,
        slug,
        description,
        website,
        businessPhone,
        businessEmail,
        businessAddress,
        brandColorHex: brandColorHex || "#3B82F6",
        status: "PENDING", // Requires admin approval
      },
      include: {
        user: {
          select: {
            id: true,

            role: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: "REALTOR_REGISTER",
        entity: "Realtor",
        entityId: realtor.id,
        details: {
          businessName,
          slug,
          status: "PENDING",
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Realtor registration submitted for approval",
      data: { realtor },
    });
  }
);

/**
 * @desc    Upload realtor logo
 * @route   POST /api/realtors/upload-logo
 * @access  Private (Realtor only)
 */
export const uploadLogo = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      throw new AppError("Please upload a logo image", 400);
    }

    // Get realtor profile
    const realtor = await prisma.realtor.findUnique({
      where: { userId: req.user!.id },
    });

    if (!realtor) {
      throw new AppError("Realtor profile not found", 404);
    }

    try {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(
        req.file.buffer.toString("base64"),
        {
          resource_type: "image",
          folder: "realtor-logos",
          public_id: `${realtor.slug}-logo`,
          transformation: [
            {
              width: 300,
              height: 300,
              crop: "fill",
              quality: "auto",
              format: "auto",
            },
          ],
          allowed_formats: ["jpg", "png", "jpeg", "webp"],
        }
      );

      // Update realtor with logo URL
      const updatedRealtor = await prisma.realtor.update({
        where: { id: realtor.id },
        data: { logoUrl: result.secure_url },
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
          action: "REALTOR_LOGO_UPDATE",
          entity: "Realtor",
          entityId: realtor.id,
          details: {
            logoUrl: result.secure_url,
            publicId: result.public_id,
          },
        },
      });

      res.json({
        success: true,
        message: "Logo uploaded successfully",
        data: { realtor: updatedRealtor },
      });
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new AppError("Failed to upload logo", 500);
    }
  }
);

export const startStripeOnboarding = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const realtor = await prisma.realtor.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: {
          select: {
            email: true,
            country: true,
          },
        },
      },
    });

    if (!realtor) {
      throw new AppError("Realtor profile not found", 404);
    }

    if (!realtor.businessEmail && !realtor.user?.email) {
      throw new AppError(
        "Realtor must have a business or account email before onboarding",
        400
      );
    }

    let stripeAccountId = realtor.stripeAccountId;

    if (!stripeAccountId) {
      const account = await createConnectAccount({
        id: realtor.id,
        businessName: realtor.businessName,
        businessEmail: realtor.businessEmail || realtor.user!.email!,
        country: realtor.user?.country || "US",
      });

      stripeAccountId = account.id;

      await prisma.realtor.update({
        where: { id: realtor.id },
        data: { stripeAccountId },
      });
    }

    const refreshUrl = `${config.FRONTEND_URL}/dashboard/payments/stripe/onboarding?refresh=true`;
    const returnUrl = `${config.FRONTEND_URL}/dashboard/payments/stripe/onboarding?completed=true`;

    const link = await createAccountLink(
      stripeAccountId,
      refreshUrl,
      returnUrl
    );

    return res.json({
      success: true,
      message: "Stripe onboarding link generated",
      data: {
        url: link.url,
        expiresAt: link.expiresAt,
      },
    });
  }
);

export const getStripeAccountStatusController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const realtor = await prisma.realtor.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: {
          select: {
            country: true,
            email: true,
          },
        },
      },
    });

    if (!realtor) {
      throw new AppError("Realtor profile not found", 404);
    }

    if (!realtor.stripeAccountId) {
      return res.json({
        success: true,
        message: "Stripe account not connected",
        data: {
          connected: false,
          requiresOnboarding: true,
          detailsSubmitted: false,
          payoutsEnabled: false,
          chargesEnabled: false,
          outstandingRequirements: [],
          releaseOffsetHours: config.ESCROW_RELEASE_OFFSET_HOURS,
        },
      });
    }

    const status = await getAccountStatus(realtor.stripeAccountId);
    const requirements = status.requirements;
    const outstandingRequirements = [
      ...(requirements?.currently_due || []),
      ...(requirements?.past_due || []),
      ...(requirements?.pending_verification || []),
    ];

    return res.json({
      success: true,
      message: "Stripe account status retrieved",
      data: {
        connected: true,
        stripeAccountId: status.id,
        chargesEnabled: status.chargesEnabled,
        payoutsEnabled: status.payoutsEnabled,
        detailsSubmitted: status.detailsSubmitted,
        disabledReason: requirements?.disabled_reason || null,
        outstandingRequirements,
        releaseOffsetHours: config.ESCROW_RELEASE_OFFSET_HOURS,
        requiresOnboarding: !status.detailsSubmitted,
      },
    });
  }
);

export const getStripeDashboardLinkController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const realtor = await prisma.realtor.findUnique({
      where: { userId: req.user!.id },
    });

    if (!realtor) {
      throw new AppError("Realtor profile not found", 404);
    }

    if (!realtor.stripeAccountId) {
      throw new AppError("Realtor has not started Stripe onboarding", 400);
    }

    const link = await createDashboardLink(realtor.stripeAccountId);

    return res.json({
      success: true,
      message: "Stripe dashboard link generated",
      data: {
        url: link.url,
        expiresAt: link.expiresAt,
      },
    });
  }
);

/**
 * @desc    Get realtor profile
 * @route   GET /api/realtors/profile
 * @access  Private (Realtor only)
 */
export const getRealtorProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const realtor = await prisma.realtor.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: {
          select: {
            id: true,

            country: true,
            city: true,
            createdAt: true,
          },
        },
        properties: {
          select: {
            id: true,
            title: true,
            type: true,
            pricePerNight: true,
            currency: true,
            isActive: true,
            isApproved: true,
            createdAt: true,
          },
        },
        refundPolicies: true,
        _count: {
          select: {
            properties: true,
          },
        },
      },
    });

    if (!realtor) {
      throw new AppError("Realtor profile not found", 404);
    }

    res.json({
      success: true,
      message: "Realtor profile retrieved successfully",
      data: { realtor },
    });
  }
);

/**
 * @desc    Update realtor profile
 * @route   PUT /api/realtors/profile
 * @access  Private (Realtor only)
 */
export const updateRealtorProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      businessName,
      description,
      website,
      businessPhone,
      businessEmail,
      businessAddress,
      brandColorHex,
    } = req.body;

    const realtor = await prisma.realtor.findUnique({
      where: { userId: req.user!.id },
    });

    if (!realtor) {
      throw new AppError("Realtor profile not found", 404);
    }

    // Validate brand color hex if provided
    if (brandColorHex) {
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!colorRegex.test(brandColorHex)) {
        throw new AppError("Invalid brand color hex format", 400);
      }
    }

    const updateData: any = {};
    if (businessName) updateData.businessName = businessName;
    if (description !== undefined) updateData.description = description;
    if (website !== undefined) updateData.website = website;
    if (businessPhone !== undefined) updateData.businessPhone = businessPhone;
    if (businessEmail !== undefined) updateData.businessEmail = businessEmail;
    if (businessAddress !== undefined)
      updateData.businessAddress = businessAddress;
    if (brandColorHex) updateData.brandColorHex = brandColorHex;

    // Generate new slug if business name changed
    if (businessName && businessName !== realtor.businessName) {
      updateData.slug = await generateUniqueSlug(businessName);
    }

    const updatedRealtor = await prisma.realtor.update({
      where: { id: realtor.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,

            country: true,
            city: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: "REALTOR_PROFILE_UPDATE",
        entity: "Realtor",
        entityId: realtor.id,
        details: updateData,
      },
    });

    res.json({
      success: true,
      message: "Realtor profile updated successfully",
      data: { realtor: updatedRealtor },
    });
  }
);

/**
 * @desc    Get public realtor profile by slug
 * @route   GET /api/realtors/:slug
 * @access  Public
 */
export const getPublicRealtorProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { slug } = req.params;

    const realtor = await prisma.realtor.findUnique({
      where: { slug, status: "APPROVED", isActive: true },
      include: {
        user: {
          select: {
            city: true,
            country: true,
          },
        },
        properties: {
          where: { isActive: true, isApproved: true },
          include: {
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
                reviews: true,
              },
            },
            reviews: {
              select: {
                rating: true,
              },
            },
          },
        },
        _count: {
          select: {
            properties: {
              where: { isActive: true, isApproved: true },
            },
          },
        },
      },
    });

    if (!realtor) {
      throw new AppError("Realtor not found or not approved", 404);
    }

    // Calculate average rating for each property
    const propertiesWithRating = realtor.properties.map((property) => {
      const totalRating = property.reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const averageRating =
        property.reviews.length > 0 ? totalRating / property.reviews.length : 0;

      return {
        ...property,
        averageRating: Math.round(averageRating * 10) / 10,
        reviews: undefined, // Remove individual reviews from response
      };
    });

    res.json({
      success: true,
      message: "Public realtor profile retrieved successfully",
      data: {
        realtor: {
          ...realtor,
          properties: propertiesWithRating,
        },
      },
    });
  }
);

// Configure multer for file upload
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
}).single("logo");
