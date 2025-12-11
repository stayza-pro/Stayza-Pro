import { logger } from "@/utils/logger";
import { Request, Response } from "express";
import { prisma } from "@/config/database";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { config } from "@/config";
import { sendCacApprovalEmail, sendCacRejectionEmail } from "@/services/email";
import {
  hashPassword,
  generateTokens,
  generateRandomToken,
} from "@/utils/auth";
import {
  sendEmailVerification,
  sendRealtorWelcomeEmail,
} from "@/services/email";
import { createAdminNotification } from "@/services/notificationService";
import {
  getEmailVerificationUrl,
  getRegistrationSuccessUrl,
  getDashboardUrl,
} from "@/utils/domains";

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
 * @desc    Upload temporary logo during registration
 * @route   POST /api/realtors/upload-temp-logo
 * @access  Public
 */
export const uploadTempLogo = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError("Please upload a logo image", 400);
    }

    try {
      // Upload to Cloudinary with temporary prefix
      const base64Data = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString("base64")}`;
      const result = await cloudinary.uploader.upload(base64Data, {
        resource_type: "image",
        folder: "temp-logos",
        public_id: `temp-${Date.now()}-logo`,
        format: "webp",
        transformation: [
          { width: 200, height: 200, crop: "limit" },
          { quality: "auto" },
        ],
      });

      res.json({
        success: true,
        message: "Temporary logo uploaded successfully",
        data: {
          url: result.secure_url,
          id: result.public_id,
        },
      });
    } catch (error) {
      logger.error("Cloudinary upload error:", error);
      throw new AppError("Failed to upload logo", 500);
    }
  }
);

/**
 * @desc    Upload temporary CAC certificate during registration
 * @route   POST /api/realtors/upload-temp-cac
 * @access  Public
 */
export const uploadTempCac = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError("Please upload a CAC certificate", 400);
    }

    try {
      let resourceType = "auto";
      let transformation = {};

      // Handle different file types
      if (req.file.mimetype.startsWith("image/")) {
        resourceType = "image";
        transformation = {
          width: 1200,
          height: 1600,
          crop: "limit",
          quality: "auto",
        };
      } else if (req.file.mimetype === "application/pdf") {
        resourceType = "raw"; // For PDFs, use raw upload
      }

      // Create base64 data URL
      const base64Data = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString("base64")}`;

      const uploadOptions: any = {
        resource_type: resourceType,
        folder: "temp-cac-certificates",
        public_id: `temp-cac-${Date.now()}`,
      };

      // Add transformation only for images
      if (resourceType === "image") {
        uploadOptions.transformation = [transformation];
      }

      const result = await cloudinary.uploader.upload(
        base64Data,
        uploadOptions
      );

      res.json({
        success: true,
        message: "Temporary CAC certificate uploaded successfully",
        data: {
          url: result.secure_url,
          id: result.public_id,
        },
      });
    } catch (error) {
      logger.error("Cloudinary upload error:", error);
      throw new AppError("Failed to upload CAC certificate", 500);
    }
  }
);

/**
 * @desc    Check subdomain availability
 * @route   GET /api/realtors/subdomain/check
 * @access  Public
 */
export const checkSubdomainAvailability = asyncHandler(
  async (req: Request, res: Response) => {
    const { subdomain } = req.query;

    if (!subdomain || typeof subdomain !== "string") {
      throw new AppError("Subdomain is required", 400);
    }

    // Normalize subdomain
    const normalizedSubdomain = subdomain.toLowerCase().trim();

    // Check format - only letters, numbers, and hyphens
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
    if (!subdomainRegex.test(normalizedSubdomain)) {
      return res.json({
        success: true,
        data: {
          available: false,
          reason: "Invalid format. Use only letters, numbers, and hyphens.",
        },
      });
    }

    // Check if subdomain is reserved
    const reserved = [
      "admin",
      "api",
      "www",
      "stayza",
      "app",
      "mail",
      "support",
      "help",
      "blog",
      "news",
      "docs",
      "status",
      "dev",
      "test",
      "staging",
      "prod",
      "production",
      "dashboard",
      "portal",
    ];

    if (reserved.includes(normalizedSubdomain)) {
      return res.json({
        success: true,
        data: {
          available: false,
          reason: "This subdomain is reserved and cannot be used.",
        },
      });
    }

    // Check if subdomain is already taken
    const existingRealtor = await prisma.realtor.findUnique({
      where: { slug: normalizedSubdomain },
    });

    if (existingRealtor) {
      return res.json({
        success: true,
        data: {
          available: false,
          reason: "This subdomain is already taken.",
        },
      });
    }

    // Subdomain is available
    return res.json({
      success: true,
      data: {
        available: true,
        subdomain: normalizedSubdomain,
      },
    });
  }
);

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
      // File uploads (URLs from temporary storage)
      logoUrl,
      cacDocumentUrl,
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
    const hashedPassword = await hashPassword(password);

    // Generate email verification token
    const emailVerificationToken = generateRandomToken();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user and realtor profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user with REALTOR role and email verification
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
          isEmailVerified: false,
          emailVerificationToken,
          emailVerificationExpires,
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
          description: tagline, // Use tagline as initial description
          corporateRegNumber,
          businessPhone: phoneNumber, // Map phone to businessPhone
          status: "PENDING", // All new realtors start as pending
          // Branding colors
          primaryColor: primaryColor || brandColorHex || "#3B82F6",
          secondaryColor: secondaryColor || "#1E40AF",
          accentColor: accentColor || "#F59E0B",
          // File uploads
          logoUrl: logoUrl || null,
          cacDocumentUrl: cacDocumentUrl || null,
          // Generate website URL from subdomain
          websiteUrl: `https://${slug}.stayza.pro`,
          // Social media URLs
          instagramUrl: socials?.instagram || socials?.instagramUrl,
          twitterUrl: socials?.twitter || socials?.twitterUrl,
          linkedinUrl: socials?.linkedin || socials?.linkedinUrl,
          facebookUrl: socials?.facebook || socials?.facebookUrl,
          youtubeUrl: socials?.youtube || socials?.youtubeUrl,
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
    const { accessToken, refreshToken } = generateTokens({
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
    });

    // Generate domain-aware URLs for email verification and dashboard
    const verificationUrl = getEmailVerificationUrl(
      emailVerificationToken,
      "realtor",
      slug,
      result.user.email
    );
    const dashboardUrl = getDashboardUrl("realtor", slug, false); // Not verified yet
    const registrationSuccessUrl = getRegistrationSuccessUrl("realtor", slug);

    // Send realtor welcome email with verification link
    sendRealtorWelcomeEmail(
      result.user.email,
      firstName,
      agencyName,
      dashboardUrl,
      verificationUrl
    ).catch((err) => logger.error("Realtor welcome email failed", err));

    // Create admin notification for new realtor registration
    createAdminNotification({
      type: "REALTOR_REGISTRATION",
      title: "New Realtor Registration",
      message: `${agencyName} (${businessEmail}) has registered and is awaiting approval.`,
      data: {
        realtorId: result.realtor.id,
        businessName: agencyName,
        email: businessEmail,
        subdomain: slug,
      },
      priority: "normal",
    }).catch((err) => logger.error("Admin notification failed", err));

    // Store refresh token
    // MVP: refreshToken model not supported

    res.status(201).json({
      success: true,
      message:
        "Realtor registration completed successfully. Your application is pending admin approval.",
      data: {
        id: result.realtor.id,
        email: result.user.email,
        subdomain: slug,
        status: result.realtor.status,
        createdAt: result.realtor.createdAt,
        user: result.user,
        realtor: result.realtor,
        accessToken,
        refreshToken,
      },
      redirectUrls: {
        success: registrationSuccessUrl,
        verification: verificationUrl,
        dashboard: dashboardUrl,
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
      const base64Data = `data:${
        req.file.mimetype
      };base64,${req.file.buffer.toString("base64")}`;
      const result = await cloudinary.uploader.upload(base64Data, {
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
      });

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
      logger.error("Cloudinary upload error:", error);
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
      tagline,
      description,
      businessPhone,
      corporateRegNumber,
      logoUrl,
      brandColorHex,
      primaryColor,
      secondaryColor,
      accentColor,
      websiteUrl,
      instagramUrl,
      twitterUrl,
      linkedinUrl,
      facebookUrl,
      youtubeUrl,
      whatsappType,
    } = req.body;

    const realtor = await prisma.realtor.findUnique({
      where: { userId: req.user!.id },
    });

    if (!realtor) {
      throw new AppError("Realtor profile not found", 404);
    }

    // Validate color hex formats if provided
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (brandColorHex && !colorRegex.test(brandColorHex)) {
      throw new AppError("Invalid brand color hex format", 400);
    }
    if (primaryColor && !colorRegex.test(primaryColor)) {
      throw new AppError("Invalid primary color hex format", 400);
    }
    if (secondaryColor && !colorRegex.test(secondaryColor)) {
      throw new AppError("Invalid secondary color hex format", 400);
    }
    if (accentColor && !colorRegex.test(accentColor)) {
      throw new AppError("Invalid accent color hex format", 400);
    }

    const updateData: any = {};
    if (businessName) updateData.businessName = businessName;
    if (tagline !== undefined) updateData.tagline = tagline;
    if (description !== undefined) updateData.description = description;
    if (businessPhone !== undefined) updateData.businessPhone = businessPhone;
    if (corporateRegNumber !== undefined)
      updateData.corporateRegNumber = corporateRegNumber;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;

    // Social media URLs
    if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl;
    if (instagramUrl !== undefined) updateData.instagramUrl = instagramUrl;
    if (twitterUrl !== undefined) updateData.twitterUrl = twitterUrl;
    if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl;
    if (facebookUrl !== undefined) updateData.facebookUrl = facebookUrl;
    if (youtubeUrl !== undefined) updateData.youtubeUrl = youtubeUrl;
    if (whatsappType !== undefined) updateData.whatsappType = whatsappType;

    // Support both old brandColorHex and new color system
    if (brandColorHex) updateData.primaryColor = brandColorHex;
    if (primaryColor) updateData.primaryColor = primaryColor;
    if (secondaryColor) updateData.secondaryColor = secondaryColor;
    if (accentColor) updateData.accentColor = accentColor;

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

// CAC certificate upload middleware (accepts images and PDFs)
export const cacUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPG, PNG) and PDF files are allowed"));
    }
  },
}).single("cacCertificate");

/**
 * @desc    Approve realtor CAC number (Admin only)
 * @route   POST /api/realtors/:id/approve-cac
 * @access  Private (Admin only)
 */
export const approveCac = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const realtor = await prisma.realtor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            fullName: true,
          },
        },
      },
    });

    if (!realtor) {
      throw new AppError("Realtor not found", 404);
    }

    if (realtor.cacStatus === "APPROVED") {
      throw new AppError("CAC number is already approved", 400);
    }

    // Update CAC status to approved
    const updatedRealtor = await prisma.realtor.update({
      where: { id },
      data: {
        cacStatus: "APPROVED",
        cacVerifiedAt: new Date(),
        cacRejectedAt: null,
        cacRejectionReason: null,
        suspendedAt: null,
        suspensionExpiresAt: null,
        canAppeal: true,
        status: "APPROVED", // Also approve the realtor for property uploads
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            fullName: true,
          },
        },
      },
    });

    // Send CAC approval email notification
    try {
      await sendCacApprovalEmail(
        updatedRealtor.user.email,
        updatedRealtor.businessName,
        `${config.FRONTEND_URL}/dashboard`
      );
    } catch (emailError) {
      logger.error("Error sending CAC approval email:", emailError);
      // Don't fail the approval if email fails
    }

    res.json({
      success: true,
      message: "CAC number approved successfully",
      data: {
        realtor: updatedRealtor,
      },
    });
  }
);

/**
 * @desc    Reject realtor CAC number (Admin only)
 * @route   POST /api/realtors/:id/reject-cac
 * @access  Private (Admin only)
 */
export const rejectCac = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      throw new AppError("Rejection reason is required", 400);
    }

    const realtor = await prisma.realtor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            fullName: true,
          },
        },
      },
    });

    if (!realtor) {
      throw new AppError("Realtor not found", 404);
    }

    if (realtor.cacStatus === "REJECTED") {
      throw new AppError("CAC number is already rejected", 400);
    }

    // Set suspension expiry to 5 days from now
    const suspensionExpires = new Date();
    suspensionExpires.setDate(suspensionExpires.getDate() + 5);

    // Update CAC status to rejected and suspend account
    const updatedRealtor = await prisma.realtor.update({
      where: { id },
      data: {
        cacStatus: "REJECTED",
        cacRejectedAt: new Date(),
        cacRejectionReason: reason,
        suspendedAt: new Date(),
        suspensionExpiresAt: suspensionExpires,
        canAppeal: true,
        status: "REJECTED", // Block property uploads
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            fullName: true,
          },
        },
      },
    });

    // Send CAC rejection email notification with appeal process
    try {
      const appealUrl = `${process.env.FRONTEND_URL}/settings?tab=business&appeal=true`;
      await sendCacRejectionEmail(
        updatedRealtor.user.email,
        updatedRealtor.user.firstName || "Realtor",
        updatedRealtor.businessName,
        reason,
        appealUrl
      );
    } catch (emailError) {
      logger.error("Error sending CAC rejection email:", emailError);
      // Don't fail the rejection if email fails
    }

    res.json({
      success: true,
      message: "CAC number rejected and account suspended",
      data: {
        realtor: updatedRealtor,
        suspensionExpiresAt: suspensionExpires,
      },
    });
  }
);

/**
 * @desc    Appeal CAC rejection
 * @route   POST /api/realtors/appeal-cac
 * @access  Private (Realtor only)
 */
export const appealCacRejection = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { corporateRegNumber, appealMessage } = req.body;

    if (!corporateRegNumber) {
      throw new AppError("New CAC number is required for appeal", 400);
    }

    const realtor = await prisma.realtor.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            fullName: true,
          },
        },
      },
    });

    if (!realtor) {
      throw new AppError("Realtor profile not found", 404);
    }

    if (realtor.cacStatus !== "REJECTED") {
      throw new AppError("No CAC rejection to appeal", 400);
    }

    if (!realtor.canAppeal) {
      throw new AppError("Appeal period has expired", 400);
    }

    // Update CAC details and reset to pending
    const updatedRealtor = await prisma.realtor.update({
      where: { id: realtor.id },
      data: {
        corporateRegNumber,
        cacStatus: "PENDING",
        cacRejectedAt: null,
        cacRejectionReason: null,
        suspendedAt: null,
        suspensionExpiresAt: null,
        canAppeal: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            fullName: true,
          },
        },
      },
    });

    // TODO: Send appeal submitted email notification
    // await sendCacAppealSubmittedEmail(
    //   realtor.user.email,
    //   realtor.user.fullName,
    //   corporateRegNumber
    // );

    // Create admin notification for CAC re-verification
    createAdminNotification({
      type: "CAC_VERIFICATION",
      title: "CAC Re-Verification Request",
      message: `${realtor.businessName} has submitted a CAC appeal and is awaiting re-verification.`,
      data: {
        realtorId: realtor.id,
        businessName: realtor.businessName,
        corporateRegNumber,
        isAppeal: true,
      },
      priority: "normal",
    }).catch((err) => logger.error("Admin notification failed", err));

    res.json({
      success: true,
      message:
        "CAC appeal submitted successfully. Your account is under review again.",
      data: {
        realtor: updatedRealtor,
      },
    });
  }
);

/**
 * @desc    Get all realtors for admin review (Admin only)
 * @route   GET /api/realtors/admin/all
 * @access  Private (Admin only)
 */
export const getAllRealtorsForAdmin = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { page = "1", limit = "10", status, cacStatus } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (cacStatus) {
      where.cacStatus = cacStatus;
    }

    const [realtors, total] = await Promise.all([
      prisma.realtor.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              fullName: true,
              isEmailVerified: true,
              createdAt: true,
            },
          },
          properties: {
            select: {
              id: true,
              title: true,
              isActive: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.realtor.count({ where }),
    ]);

    res.json({
      success: true,
      data: realtors,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  }
);

// Dashboard Statistics Endpoint
export const getDashboardStats = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    // Get realtor profile
    const realtor = await prisma.realtor.findUnique({
      where: { userId },
      include: {
        properties: {
          include: {
            bookings: {
              include: {
                review: true,
              },
            },
          },
        },
      },
    });

    if (!realtor) {
      throw new AppError("Realtor profile not found", 404);
    }

    // Check if realtor is fully approved
    const isApproved =
      realtor.status === "APPROVED" &&
      realtor.cacStatus === "APPROVED" &&
      !realtor.suspendedAt;

    // If not approved, return minimal stats with approval info
    if (!isApproved) {
      return res.json({
        success: true,
        message: "Dashboard stats retrieved successfully",
        data: {
          isPendingApproval: true,
          approvalStatus: {
            businessStatus: realtor.status,
            cacStatus: realtor.cacStatus,
            businessName: realtor.businessName,
          },
          stats: {
            totalProperties: 0,
            totalBookings: 0,
            totalRevenue: 0,
            averageRating: 0,
            occupancyRate: 0,
          },
          recentActivity: [],
          message:
            "Complete your approval process to access full dashboard features.",
        },
      });
    }

    const now = new Date();
    const lastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate()
    );

    // Calculate stats
    const totalBookings = await prisma.booking.count({
      where: {
        property: {
          realtorId: realtor.id,
        },
      },
    });

    const activeBookings = await prisma.booking.count({
      where: {
        property: {
          realtorId: realtor.id,
        },
        status: {
          in: ["CONFIRMED", "COMPLETED"],
        },
      },
    });

    const totalRevenue = await prisma.booking.aggregate({
      where: {
        property: {
          realtorId: realtor.id,
        },
        status: "COMPLETED",
      },
      _sum: {
        totalPrice: true,
      },
    });

    const lastMonthRevenue = await prisma.booking.aggregate({
      where: {
        property: {
          realtorId: realtor.id,
        },
        status: "COMPLETED",
        createdAt: {
          gte: lastMonth,
        },
      },
      _sum: {
        totalPrice: true,
      },
    });

    // Calculate ratings
    const allReviews = await prisma.review.findMany({
      where: {
        booking: {
          property: {
            realtorId: realtor.id,
          },
        },
      },
    });

    const averageRating =
      allReviews.length > 0
        ? allReviews.reduce((sum, review) => sum + review.rating, 0) /
          allReviews.length
        : 0;

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBookings = await prisma.booking.count({
      where: {
        property: {
          realtorId: realtor.id,
        },
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const todayCheckIns = await prisma.booking.count({
      where: {
        property: {
          realtorId: realtor.id,
        },
        checkInDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Mock unread messages for now
    const unreadMessages = 0;

    return res.json({
      success: true,
      data: {
        totalRevenue: parseFloat(
          totalRevenue._sum.totalPrice?.toString() || "0"
        ),
        revenueChange: {
          value: 12.5, // Calculate actual percentage change
          type: "increase",
        },
        activeBookings,
        bookingsChange: {
          value: 8.3,
          type: "increase",
        },
        propertiesCount: realtor?.properties?.length || 0,
        propertiesChange: {
          value: 2,
          type: "increase",
        },
        averageRating,
        ratingChange: {
          value: 0.2,
          type: "increase",
        },
        todayBookings,
        todayCheckIns,
        unreadMessages,
      },
    });
  }
);

// Get Recent Bookings
export const getRecentBookings = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const limit = parseInt(req.query.limit as string) || 5;

    const realtor = await prisma.realtor.findUnique({
      where: { userId },
    });

    if (!realtor) {
      throw new AppError("Realtor profile not found", 404);
    }

    const bookings = await prisma.booking.findMany({
      where: {
        property: {
          realtorId: realtor.id,
        },
      },
      include: {
        guest: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        property: {
          select: {
            title: true,
            address: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    res.json({
      success: true,
      data: {
        bookings: bookings.map((booking) => ({
          id: booking.id,
          guest: booking.guest,
          property: booking.property,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          status: booking.status,
          totalAmount: parseFloat(booking.totalPrice.toString()),
          nights: Math.ceil(
            (new Date(booking.checkOutDate).getTime() -
              new Date(booking.checkInDate).getTime()) /
              (1000 * 60 * 60 * 24)
          ),
        })),
      },
    });
  }
);

/**
 * @desc    Delete realtor account and all associated data
 * @route   DELETE /api/realtors/profile
 * @access  Private (Realtor only)
 */
export const deleteRealtorAccount = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    // Get the realtor to ensure they exist
    const realtor = await prisma.realtor.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            fullName: true,
          },
        },
        properties: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!realtor) {
      throw new AppError("Realtor profile not found", 404);
    }

    // Log the deletion for audit purposes before deletion
    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: "ACCOUNT_DELETION",
        entityType: "User",
        entityId: userId,
        details: {
          realtorId: realtor.id,
          businessName: realtor.businessName,
          email: realtor.user.email,
          propertiesCount: realtor.properties.length,
          deletedAt: new Date().toISOString(),
        },
      },
    });

    // Delete the user (which will cascade delete everything else due to schema relations)
    // This includes:
    // - Realtor profile
    // - All properties
    // - All bookings
    // - All reviews
    // - All payments
    // - All notifications
    // - All audit logs
    // - All refund requests
    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({
      success: true,
      message: "Account and all associated data deleted successfully",
      data: {
        deletedAt: new Date().toISOString(),
        email: realtor.user.email,
        businessName: realtor.businessName,
      },
    });
  }
);
