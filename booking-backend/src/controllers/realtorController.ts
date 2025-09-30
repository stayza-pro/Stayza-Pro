import { Request, Response } from "express";
import { prisma } from "@/config/database";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { config } from "@/config";

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
 * @desc    Complete realtor registration (User + Realtor profile)
 * @route   POST /api/realtors/register
 * @access  Public
 */
export const registerRealtor = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      // User data
      fullName,
      businessEmail,
      phoneNumber,
      password,
      // Business data
      agencyName,
      tagline,
      customSubdomain,
      corporateRegNumber,
      businessAddress,
      // Branding
      primaryColor,
      secondaryColor,
      accentColor,
      brandColorHex, // Legacy support
      // Social media
      socials,
      whatsappType,
    } = req.body;

    if (
      !fullName ||
      !businessEmail ||
      !password ||
      !agencyName ||
      !customSubdomain
    ) {
      throw new AppError("Required fields are missing", 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: businessEmail },
    });

    if (existingUser) {
      throw new AppError("User with this email already exists", 400);
    }

    // Generate unique slug from subdomain
    const slug = customSubdomain.toLowerCase();

    // Check if subdomain/slug is already taken
    const existingRealtor = await prisma.realtor.findUnique({
      where: { slug },
    });

    if (existingRealtor) {
      throw new AppError("Subdomain is already taken", 400);
    }

    // Split fullName into firstName and lastName
    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Hash password
    const { hashPassword } = await import("@/utils/auth");
    const hashedPassword = await hashPassword(password);

    // Create user and realtor profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user with REALTOR role
      const user = await tx.user.create({
        data: {
          email: businessEmail,
          businessEmail,
          password: hashedPassword,
          fullName: fullName || `${firstName} ${lastName}`,
          firstName,
          lastName,
          phone: phoneNumber,
          businessAddress,
          role: "REALTOR",
        },
      });

      // Validate brand color hex
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      const validBrandColor = primaryColor || brandColorHex;
      if (validBrandColor && !colorRegex.test(validBrandColor)) {
        throw new AppError("Invalid brand color hex format", 400);
      }

      // Create realtor profile
      const realtor = await tx.realtor.create({
        data: {
          userId: user.id,
          businessName: agencyName,
          slug,
          tagline,
          corporateRegNumber,
          // Branding colors
          primaryColor: primaryColor || brandColorHex || "#3B82F6",
          secondaryColor: secondaryColor || "#1E40AF",
          accentColor: accentColor || "#F59E0B",
          // Social media URLs
          websiteUrl: socials?.websiteUrl,
          instagramUrl: socials?.instagramUrl,
          twitterUrl: socials?.twitterUrl,
          linkedinUrl: socials?.linkedinUrl,
          facebookUrl: socials?.facebookUrl,
          youtubeUrl: socials?.youtubeUrl,
          whatsappType: whatsappType || "business",
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              createdAt: true,
            },
          },
        },
      });

      return { user, realtor };
    });

    // Generate tokens for the new user
    const { generateTokens } = await import("@/utils/auth");
    const { accessToken, refreshToken } = generateTokens({
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
    });

    // Store refresh token
    // MVP: refreshToken model not supported

    res.status(201).json({
      success: true,
      message: "Realtor registration completed successfully",
      data: {
        id: result.realtor.id,
        email: result.user.email,
        subdomain: slug,
        // MVP: status field not supported
        createdAt: result.realtor.createdAt,
        user: result.user,
        realtor: result.realtor,
        accessToken,
        refreshToken,
      },
    });
  }
);

/**
 * @desc    Create realtor profile for existing user
 * @route   POST /api/realtors/profile/create
 * @access  Private (USER with REALTOR role)
 */
export const createRealtorProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      businessName,
      tagline,
      corporateRegNumber,
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
        tagline,
        slug,
        corporateRegNumber,
        primaryColor: brandColorHex || "#3B82F6",
        // MVP: status field not supported - auto-approved in MVP
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Realtor profile created successfully",
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
    // MVP: Stripe integration not available
    return res.status(501).json({
      success: false,
      message: "Payment integration not available in MVP",
      data: {
        available: false,
        reason: "MVP version does not include payment processing",
      },
    });
  }
);

export const getStripeAccountStatusController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    // MVP: Stripe integration not available
    return res.status(501).json({
      success: false,
      message: "Payment integration not available in MVP",
      data: {
        available: false,
        reason: "MVP version does not include payment processing",
      },
    });
  }
);

export const getStripeDashboardLinkController = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    // MVP: Stripe integration not available
    return res.status(501).json({
      success: false,
      message: "Payment integration not available in MVP",
      data: {
        available: false,
        reason: "MVP version does not include payment processing",
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
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
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
            // MVP: isApproved field not supported - all active properties visible
            createdAt: true,
          },
        },
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
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
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
      where: { slug, isActive: true }, // MVP: status field removed
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        properties: {
          where: { isActive: true },
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
              where: { isActive: true },
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
