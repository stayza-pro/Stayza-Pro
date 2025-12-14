import express, { Request, Response } from "express";
import { prisma } from "@/config/database";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { config } from "@/config";
import {
  sendCacApprovalEmail,
  sendCacRejectionEmail,
  sendEmailVerification,
  sendRealtorWelcomeEmail,
} from "@/services/email";
import {
  hashPassword,
  generateTokens,
  generateRandomToken,
} from "@/utils/auth";
import { createAdminNotification } from "@/services/notificationService";
import {
  getEmailVerificationUrl,
  getRegistrationSuccessUrl,
  getDashboardUrl,
} from "@/utils/domains";
import { createSubAccount } from "@/services/paystack";
import axios from "axios";
import jwt from "jsonwebtoken";
import { logger } from "@/utils/logger";
import {
  authenticate,
  requireRole,
  requireApprovedRealtor,
  requireRealtorDashboardAccess,
} from "@/middleware/auth";
import {
  cacSubmissionLimiter,
  cacAppealLimiter,
} from "@/middleware/rateLimiter";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ===========================
// Helper Functions
// ===========================

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

// ===========================
// Multer Middleware Configuration
// ===========================

// Configure multer for logo upload
const uploadMiddleware = multer({
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
const cacUploadMiddleware = multer({
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

const router = express.Router();

// ═══════════════════════════════════════════════════════════════════════════════
// SWAGGER SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * components:
 *   schemas:
 *     Realtor:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Realtor ID
 *         businessName:
 *           type: string
 *           description: Business name
 *         slug:
 *           type: string
 *           description: Unique SEO-friendly slug
 *         logoUrl:
 *           type: string
 *           description: Logo image URL
 *         brandColorHex:
 *           type: string
 *           description: Brand color in hex format
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, SUSPENDED]
 *           description: Account status
 *         description:
 *           type: string
 *           description: Business description
 *         website:
 *           type: string
 *           description: Business website URL
 *         businessPhone:
 *           type: string
 *           description: Business phone number
 *         businessEmail:
 *           type: string
 *           description: Business email address
 *         businessAddress:
 *           type: string
 *           description: Business address
 *         commissionRate:
 *           type: number
 *           description: Platform commission rate (decimal)
 *         subscriptionPlan:
 *           type: string
 *           enum: [FREE, PRO]
 *           description: Subscription plan
 *         isActive:
 *           type: boolean
 *           description: Whether account is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     RealtorRegistration:
 *       type: object
 *       required:
 *         - businessName
 *       properties:
 *         businessName:
 *           type: string
 *           description: Business name (required)
 *         description:
 *           type: string
 *           description: Business description
 *         website:
 *           type: string
 *           description: Business website URL
 *         businessPhone:
 *           type: string
 *           description: Business phone number
 *         businessEmail:
 *           type: string
 *           description: Business email address
 *         businessAddress:
 *           type: string
 *           description: Business address
 *         brandColorHex:
 *           type: string
 *           pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'
 *           description: Brand color in hex format (e.g., #3B82F6)
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *               format: uri
 *             expiresAt:
 *               type: string
 *               format: date-time
 */

/**
 * @swagger
 * /api/realtors/subdomain/check:
 *   get:
 *     summary: Check subdomain availability
 *     description: Check if a custom subdomain is available for registration
 *     tags: [Realtors]
 *     parameters:
 *       - in: query
 *         name: subdomain
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'
 *         description: Subdomain to check
 *     responses:
 *       200:
 *         description: Subdomain availability checked
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         available:
 *                           type: boolean
 *                         subdomain:
 *                           type: string
 *                         reason:
 *                           type: string
 *       400:
 *         description: Invalid subdomain format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ENDPOINTS (No Authentication Required)
// ═══════════════════════════════════════════════════════════════════════════════

router.get(
  "/subdomain/check",
  asyncHandler(async (req: Request, res: Response) => {
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
  })
);

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRATION & ONBOARDING (Mixed Auth - Temp uploads public, Realtor registration requires auth)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/realtors/upload:
 *   post:
 *     summary: Upload files (logo, CAC, or temp files)
 *     description: Unified endpoint for uploading logo, CAC certificate, or temporary files during registration
 *     tags: [Realtors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [logo, temp-logo, temp-cac]
 *         description: Type of file to upload
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (logo image or CAC certificate)
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         url:
 *                           type: string
 *                         id:
 *                           type: string
 *       400:
 *         description: Bad request (invalid type or no file)
 *       500:
 *         description: Upload failed
 */
router.post(
  "/upload",
  asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.query;

    if (!type || !["logo", "temp-logo", "temp-cac"].includes(type as string)) {
      throw new AppError(
        "Invalid type. Must be 'logo', 'temp-logo', or 'temp-cac'",
        400
      );
    }

    // Use appropriate middleware based on type
    const middleware =
      type === "temp-cac" ? cacUploadMiddleware : uploadMiddleware;

    return new Promise((resolve, reject) => {
      middleware(req, res, async (err: any) => {
        if (err) {
          reject(new AppError("File upload failed", 400));
          return;
        }

        if (!req.file) {
          reject(new AppError("Please upload a file", 400));
          return;
        }

        try {
          let config: any = {};
          let message = "";

          // Configure upload based on type
          if (type === "logo") {
            // Permanent logo upload (requires auth)
            if (!(req as AuthenticatedRequest).user) {
              reject(
                new AppError(
                  "Authentication required for permanent logo upload",
                  401
                )
              );
              return;
            }

            const realtor = await prisma.realtor.findUnique({
              where: { userId: (req as AuthenticatedRequest).user!.id },
            });

            if (!realtor) {
              reject(new AppError("Realtor profile not found", 404));
              return;
            }

            config = {
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
            };
            message = "Logo uploaded successfully";
          } else if (type === "temp-logo") {
            config = {
              resource_type: "image",
              folder: "temp-logos",
              public_id: `temp-${Date.now()}-logo`,
              format: "webp",
              transformation: [
                { width: 200, height: 200, crop: "limit" },
                { quality: "auto" },
              ],
            };
            message = "Temporary logo uploaded successfully";
          } else {
            // temp-cac
            let resourceType = "auto";
            if (req.file.mimetype.startsWith("image/")) {
              resourceType = "image";
              config.transformation = [
                {
                  width: 1200,
                  height: 1600,
                  crop: "limit",
                  quality: "auto",
                },
              ];
            } else if (req.file.mimetype === "application/pdf") {
              resourceType = "raw";
            }

            config = {
              ...config,
              resource_type: resourceType,
              folder: "temp-cac-certificates",
              public_id: `temp-cac-${Date.now()}`,
            };
            message = "Temporary CAC certificate uploaded successfully";
          }

          // Upload to Cloudinary
          const base64Data = `data:${
            req.file.mimetype
          };base64,${req.file.buffer.toString("base64")}`;
          const result = await cloudinary.uploader.upload(base64Data, config);

          // For permanent logo, update realtor record
          if (type === "logo") {
            const realtor = await prisma.realtor.findUnique({
              where: { userId: (req as AuthenticatedRequest).user!.id },
            });

            await prisma.realtor.update({
              where: { id: realtor!.id },
              data: { logoUrl: result.secure_url },
            });
          }

          res.json({
            success: true,
            message,
            data: {
              url: result.secure_url,
              id: result.public_id,
            },
          });

          resolve(true);
        } catch (error) {
          logger.error("Cloudinary upload error:", error);
          reject(new AppError("Failed to upload file", 500));
        }
      });
    });
  })
);

/**
 * @swagger
 * /api/realtors/register:
 *   post:
 *     summary: Register as a realtor
 *     description: Complete realtor onboarding with business details
 *     tags: [Realtors]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RealtorRegistration'
 *     responses:
 *       201:
 *         description: Realtor registration submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         realtor:
 *                           $ref: '#/components/schemas/Realtor'
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
 */
router.post(
  "/register",
  asyncHandler(async (req: Request, res: Response) => {
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
  })
);
router.post(
  "/profile/create",
  authenticate,
  requireRole("REALTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  })
);

// Stripe integration removed - using Paystack/Flutterwave only

// ═══════════════════════════════════════════════════════════════════════════════
// REALTOR ENDPOINTS (Requires requireRole("REALTOR"))
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// Profile Management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/realtors/profile:
 *   get:
 *     summary: Get realtor profile (private)
 *     description: Get complete realtor profile with sensitive information
 *     tags: [Realtors]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Realtor profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         realtor:
 *                           $ref: '#/components/schemas/Realtor'
 *       404:
 *         description: Realtor profile not found
 *   put:
 *     summary: Update realtor profile
 *     description: Update realtor business information
 *     tags: [Realtors]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RealtorRegistration'
 *     responses:
 *       200:
 *         description: Realtor profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         realtor:
 *                           $ref: '#/components/schemas/Realtor'
 *       404:
 *         description: Realtor profile not found
 */
router.get(
  "/profile",
  authenticate,
  requireRole("REALTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
            createdAt: true,
          },
        },
        _count: {
          select: {
            properties: true,
            referredGuests: true,
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
  })
);
router.put(
  "/profile",
  authenticate,
  requireRole("REALTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Approval & Status (Realtor)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/realtors/approval-status:
 *   get:
 *     summary: Get realtor approval status
 *     description: Get detailed approval status including business and CAC verification stages
 *     tags: [Realtors]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Approval status retrieved successfully
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
 *                   type: object
 *                   properties:
 *                     approvalStage:
 *                       type: string
 *                       enum: [pending, business_review, cac_review, cac_rejected, approved, rejected, suspended]
 *                     isFullyApproved:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                     nextSteps:
 *                       type: array
 *                       items:
 *                         type: string
 *                     estimatedTimeframe:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Realtor profile not found
 */
router.get(
  "/approval-status",
  authenticate,
  requireRole("REALTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || req.user.role !== "REALTOR") {
      throw new AppError("Realtor access required", 403);
    }

    const realtor = await prisma.realtor.findUnique({
      where: { userId: req.user.id },
      select: {
        id: true,
        status: true,
        businessName: true,
        cacStatus: true,
        suspendedAt: true,
        suspensionExpiresAt: true,
        canAppeal: true,
        cacRejectionReason: true,
        cacVerifiedAt: true,
        createdAt: true,
      },
    });

    if (!realtor) {
      throw new AppError("Realtor profile not found", 404);
    }

    const now = new Date();
    const isPermanentlySuspended =
      realtor.suspendedAt &&
      realtor.suspensionExpiresAt &&
      now > realtor.suspensionExpiresAt;

    const isFullyApproved =
      realtor.status === "APPROVED" &&
      realtor.cacStatus === "APPROVED" &&
      !realtor.suspendedAt;

    let approvalStage = "pending";
    let message = "";
    let nextSteps = [];

    if (isPermanentlySuspended) {
      approvalStage = "suspended";
      message =
        "Your account has been permanently suspended. Please contact support.";
    } else if (realtor.suspendedAt) {
      approvalStage = "suspended";
      message =
        "Your account is temporarily suspended due to CAC verification issues.";
      if (realtor.canAppeal) {
        nextSteps.push("Appeal the CAC rejection with correct documentation");
      } else {
        nextSteps.push("Contact support for assistance");
      }
    } else if (realtor.status === "REJECTED") {
      approvalStage = "rejected";
      message =
        "Your realtor application was rejected. Please contact support or submit a new application.";
      nextSteps.push("Contact support to understand rejection reasons");
      nextSteps.push("Submit a new application with correct information");
    } else if (realtor.status === "PENDING") {
      approvalStage = "business_review";
      message = "Your business registration is under review by our admin team.";
      nextSteps.push("Wait for admin approval (usually 1-2 business days)");
      nextSteps.push(
        "Ensure your business information is complete and accurate"
      );
    } else if (realtor.cacStatus === "REJECTED") {
      approvalStage = "cac_rejected";
      message = "Your CAC documentation was rejected.";
      nextSteps.push("Review the rejection reason below");
      if (realtor.canAppeal) {
        nextSteps.push("Submit an appeal with correct CAC documentation");
      } else {
        nextSteps.push("Contact support for assistance");
      }
    } else if (realtor.cacStatus === "PENDING") {
      approvalStage = "cac_review";
      message = "Your CAC documentation is under review.";
      nextSteps.push("Wait for CAC verification (usually 1-2 business days)");
      nextSteps.push("Ensure your CAC document is clear and readable");
    } else if (isFullyApproved) {
      approvalStage = "approved";
      message = "Your account is fully approved and active!";
    }

    const estimatedTimeframes: Record<string, string> = {
      business_review: "1-2 business days",
      cac_review: "1-2 business days",
      cac_rejected: "Immediate (after appeal submission)",
      approved: "Complete",
      rejected: "Requires new application",
      suspended: "Requires appeal or support contact",
    };

    res.json({
      success: true,
      message: "Approval status retrieved successfully",
      data: {
        approvalStage,
        isFullyApproved,
        message,
        nextSteps,
        estimatedTimeframe: estimatedTimeframes[approvalStage] || "Unknown",
        details: {
          businessName: realtor.businessName,
          businessStatus: realtor.status,
          cacStatus: realtor.cacStatus,
          cacRejectionReason: realtor.cacRejectionReason,
          canAppeal: realtor.canAppeal,
          accountCreated: realtor.createdAt,
          cacVerifiedAt: realtor.cacVerifiedAt,
        },
        supportInfo: {
          email: "support@stayza.com",
          phone: "+234-800-STAYZA",
          businessHours: "Monday - Friday, 9:00 AM - 6:00 PM WAT",
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/realtors/profile:
 *   delete:
 *     summary: Delete realtor account and all associated data
 *     description: Permanently deletes the realtor account, all properties, bookings, reviews, and related data. This action cannot be undone.
 *     tags: [Realtors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account successfully deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Realtor profile not found
 */
router.delete(
  "/profile",
  authenticate,
  requireRole("REALTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  })
);

// Dashboard endpoints - Allow access for pending approval
router.get(
  "/dashboard/stats",
  authenticate,
  requireRole("REALTOR"),
  requireRealtorDashboardAccess,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Bookings Management (Realtor)
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/bookings/recent",
  authenticate,
  requireRole("REALTOR"),
  requireRealtorDashboardAccess,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// CAC Verification (Realtor)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/realtors/cac:
 *   post:
 *     summary: Submit CAC verification
 *     description: Submit Corporate Affairs Commission number and document for verification
 *     tags: [Realtors]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cacNumber
 *               - cacDocumentUrl
 *             properties:
 *               cacNumber:
 *                 type: string
 *                 description: CAC registration number
 *               cacDocumentUrl:
 *                 type: string
 *                 description: URL of the uploaded CAC document
 *     responses:
 *       200:
 *         description: CAC verification submitted successfully
 *       400:
 *         description: CAC already approved or invalid data
 *       404:
 *         description: Realtor profile not found
 *   get:
 *     summary: Get CAC verification status
 *     description: Get current CAC verification status and details
 *     tags: [Realtors]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: CAC status retrieved successfully
 *       404:
 *         description: Realtor profile not found
 */
router.post(
  "/cac",
  cacSubmissionLimiter,
  authenticate,
  requireRole("REALTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { cacNumber, cacDocumentUrl } = req.body;

    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    if (req.user.role !== "REALTOR") {
      throw new AppError("Only realtors can submit CAC verification", 403);
    }

    // Get realtor record
    const realtor = await prisma.realtor.findUnique({
      where: { userId: req.user.id },
    });

    if (!realtor) {
      throw new AppError("Realtor profile not found", 404);
    }

    // Check if already approved
    if (realtor.cacStatus === "APPROVED") {
      throw new AppError("CAC verification already approved", 400);
    }

    // Update realtor with CAC details
    const updatedRealtor = await prisma.realtor.update({
      where: { id: realtor.id },
      data: {
        corporateRegNumber: cacNumber,
        cacDocumentUrl: cacDocumentUrl,
        cacStatus: "PENDING",
        cacRejectedAt: null,
        cacRejectionReason: null,
        canAppeal: false, // Reset appeal flag
      },
    });

    res.status(200).json({
      success: true,
      message: "CAC verification submitted successfully",
      data: {
        cacStatus: updatedRealtor.cacStatus,
        cacNumber: updatedRealtor.corporateRegNumber,
      },
    });
  })
);
router.get(
  "/cac/status",
  authenticate,
  requireRole("REALTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    if (req.user.role !== "REALTOR") {
      throw new AppError("Only realtors can check CAC status", 403);
    }

    // Get realtor record
    const realtor = await prisma.realtor.findUnique({
      where: { userId: req.user.id },
      select: {
        cacStatus: true,
        corporateRegNumber: true,
        cacDocumentUrl: true,
        cacVerifiedAt: true,
        cacRejectedAt: true,
        cacRejectionReason: true,
        canAppeal: true,
      },
    });

    if (!realtor) {
      throw new AppError("Realtor profile not found", 404);
    }

    res.status(200).json({
      success: true,
      data: {
        cacStatus: realtor.cacStatus,
        cacNumber: realtor.corporateRegNumber,
        cacDocumentUrl: realtor.cacDocumentUrl,
        cacVerifiedAt: realtor.cacVerifiedAt,
        cacRejectedAt: realtor.cacRejectedAt,
        cacRejectionReason: realtor.cacRejectionReason,
        canAppeal: realtor.canAppeal,
      },
    });
  })
);

/**
 * @swagger
 * /api/realtors/cac/resubmit:
 *   put:
 *     summary: Resubmit CAC verification after rejection
 *     description: Resubmit CAC documentation after appeal process
 *     tags: [Realtors]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cacNumber
 *               - cacDocumentUrl
 *             properties:
 *               cacNumber:
 *                 type: string
 *                 description: Updated CAC registration number
 *               cacDocumentUrl:
 *                 type: string
 *                 description: URL of the new/updated CAC document
 *     responses:
 *       200:
 *         description: CAC verification resubmitted successfully
 *       400:
 *         description: Appeal not verified or invalid status
 *       404:
 *         description: Realtor profile not found
 */
router.put(
  "/cac/resubmit",
  cacSubmissionLimiter,
  authenticate,
  requireRole("REALTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { cacNumber, cacDocumentUrl } = req.body;

    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    if (req.user.role !== "REALTOR") {
      throw new AppError("Only realtors can resubmit CAC verification", 403);
    }

    // Get realtor record
    const realtor = await prisma.realtor.findUnique({
      where: { userId: req.user.id },
    });

    if (!realtor) {
      throw new AppError("Realtor profile not found", 404);
    }

    // Check if CAC was rejected
    if (realtor.cacStatus !== "REJECTED") {
      throw new AppError("CAC resubmission only allowed after rejection", 400);
    }

    // Check if appeal is verified
    if (!realtor.canAppeal) {
      throw new AppError(
        "Please complete the appeal process before resubmitting",
        400
      );
    }

    // Update realtor with new CAC details
    const updatedRealtor = await prisma.realtor.update({
      where: { id: realtor.id },
      data: {
        corporateRegNumber: cacNumber,
        cacDocumentUrl: cacDocumentUrl,
        cacStatus: "PENDING",
        cacRejectedAt: null,
        cacRejectionReason: null,
        canAppeal: false, // Reset appeal flag after resubmission
      },
    });

    res.status(200).json({
      success: true,
      message: "CAC verification resubmitted successfully",
      data: {
        cacStatus: updatedRealtor.cacStatus,
        cacNumber: updatedRealtor.corporateRegNumber,
      },
    });
  })
);

/**
 * @swagger
 * /api/realtors/cac/appeal/{token}:
 *   get:
 *     summary: Process CAC appeal from email link
 *     description: Verify appeal token from rejection email and enable resubmission
 *     tags: [Realtors]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Appeal token from rejection email
 *     responses:
 *       302:
 *         description: Redirects to dashboard with appeal success message
 *       400:
 *         description: Invalid token or appeal not allowed
 *       404:
 *         description: Realtor not found
 */
router.get(
  "/cac/appeal/:token",
  cacAppealLimiter,
  asyncHandler(async (req, res: Response) => {
    const { token } = req.params;

    if (!token) {
      throw new AppError("Invalid appeal token", 400);
    }

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET);
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw new AppError(
          "Appeal link has expired. Please contact support.",
          410
        );
      }
      throw new AppError("Invalid or tampered appeal token", 400);
    }

    // Ensure token is for CAC appeal
    if (decoded.type !== "CAC_APPEAL") {
      throw new AppError("Invalid token type", 400);
    }

    const realtorId = decoded.realtorId;

    // Get realtor record
    const realtor = await prisma.realtor.findUnique({
      where: { id: realtorId },
      include: { user: true },
    });

    if (!realtor) {
      throw new AppError("Realtor not found", 404);
    }

    // Check if CAC was rejected
    if (realtor.cacStatus !== "REJECTED") {
      throw new AppError(
        "Appeal only allowed for rejected CAC verification",
        400
      );
    }

    // Enable appeal
    await prisma.realtor.update({
      where: { id: realtor.id },
      data: {
        canAppeal: true,
      },
    });

    // Redirect to dashboard with success message
    const dashboardUrl =
      config.NODE_ENV === "development"
        ? `http://${realtor.slug}.localhost:3000/settings?tab=business&appeal=success`
        : `https://${realtor.slug}.stayza.pro/settings?tab=business&appeal=success`;

    res.redirect(dashboardUrl);
  })
);

// CAC Appeal Route (Realtor only) - Old route
router.post(
  "/appeal-cac",
  authenticate,
  requireRole("REALTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Analytics & Reporting (Realtor)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/realtors/analytics:
 *   get:
 *     summary: Get realtor analytics
 *     description: Get comprehensive analytics for the authenticated realtor's properties and bookings
 *     tags:
 *       - Realtors
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Time range for analytics data
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
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
 *                   type: object
 *                   properties:
 *                     timeRange:
 *                       type: string
 *                     overview:
 *                       type: object
 *                     trends:
 *                       type: object
 *                     topProperties:
 *                       type: array
 *       401:
 *         description: Unauthorized - Invalid token
 *       403:
 *         description: Forbidden - Not a realtor
 *       404:
 *         description: Realtor profile not found
 */
router.get(
  "/analytics",
  authenticate,
  requireRole("REALTOR"),
  requireRealtorDashboardAccess,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const realtorId = req.realtor?.id;
    if (!realtorId) {
      throw new AppError("Realtor profile not found", 404);
    }

    const { timeRange = "30d" } = req.query;

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const previousPeriodStart = new Date(startDate);
    const daysDifference = Math.ceil(
      (now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
    );
    previousPeriodStart.setDate(previousPeriodStart.getDate() - daysDifference);

    // Get realtor's properties
    const properties = await prisma.property.findMany({
      where: { realtorId, isActive: true },
      select: { id: true },
    });

    const propertyIds = properties.map((p) => p.id);

    const [
      // Current period metrics
      totalBookings,
      completedBookings,
      pendingBookings,
      cancelledBookings,
      totalRevenue,
      totalProperties,
      activeProperties,

      // Previous period
      previousBookings,
      previousRevenue,

      // Reviews and ratings
      totalReviews,
      averageRating,

      // Property performance
      topProperties,
    ] = await Promise.all([
      // Current period
      prisma.booking.count({
        where: {
          propertyId: { in: propertyIds },
          createdAt: { gte: startDate },
        },
      }),
      prisma.booking.count({
        where: {
          propertyId: { in: propertyIds },
          status: "COMPLETED",
          createdAt: { gte: startDate },
        },
      }),
      prisma.booking.count({
        where: {
          propertyId: { in: propertyIds },
          status: "PENDING",
          createdAt: { gte: startDate },
        },
      }),
      prisma.booking.count({
        where: {
          propertyId: { in: propertyIds },
          status: "CANCELLED",
          createdAt: { gte: startDate },
        },
      }),
      prisma.payment.aggregate({
        where: {
          booking: { propertyId: { in: propertyIds } },
          status: "COMPLETED",
          createdAt: { gte: startDate },
        },
        _sum: { amount: true },
      }),
      prisma.property.count({ where: { realtorId } }),
      prisma.property.count({ where: { realtorId, isActive: true } }),

      // Previous period
      prisma.booking.count({
        where: {
          propertyId: { in: propertyIds },
          createdAt: { gte: previousPeriodStart, lt: startDate },
        },
      }),
      prisma.payment.aggregate({
        where: {
          booking: { propertyId: { in: propertyIds } },
          status: "COMPLETED",
          createdAt: { gte: previousPeriodStart, lt: startDate },
        },
        _sum: { amount: true },
      }),

      // Reviews
      prisma.review.count({
        where: {
          propertyId: { in: propertyIds },
          createdAt: { gte: startDate },
        },
      }),
      prisma.review.aggregate({
        where: {
          propertyId: { in: propertyIds },
          createdAt: { gte: startDate },
        },
        _avg: { rating: true },
      }),

      // Top performing properties
      prisma.property.findMany({
        where: { realtorId, isActive: true },
        select: {
          id: true,
          title: true,
          city: true,
          pricePerNight: true,
          _count: {
            select: {
              bookings: {
                where: {
                  status: "COMPLETED",
                  createdAt: { gte: startDate },
                },
              },
              reviews: true,
            },
          },
          reviews: {
            select: { rating: true },
            where: { createdAt: { gte: startDate } },
          },
        },
        orderBy: {
          bookings: {
            _count: "desc",
          },
        },
        take: 5,
      }),
    ]);

    // Calculate growth rates
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Get monthly trends for realtor
    const monthsBack = timeRange === "1y" ? 12 : timeRange === "90d" ? 3 : 1;
    const monthlyTrendsStart = new Date();
    monthlyTrendsStart.setMonth(monthlyTrendsStart.getMonth() - monthsBack);

    const monthlyBookings = await prisma.booking.findMany({
      where: {
        propertyId: { in: propertyIds },
        createdAt: { gte: monthlyTrendsStart },
      },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: "asc" },
    });

    const monthlyRevenue = await prisma.payment.findMany({
      where: {
        booking: { propertyId: { in: propertyIds } },
        status: "COMPLETED",
        createdAt: { gte: monthlyTrendsStart },
      },
      select: { createdAt: true, amount: true },
      orderBy: { createdAt: "asc" },
    });

    // Process monthly data for realtor
    const monthlyData = [];
    for (let i = monthsBack; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const monthBookings = monthlyBookings.filter(
        (b) => b.createdAt >= monthStart && b.createdAt < monthEnd
      );
      const monthRev = monthlyRevenue.filter(
        (r) => r.createdAt >= monthStart && r.createdAt < monthEnd
      );

      monthlyData.push({
        month: monthStart.toLocaleString("default", { month: "short" }),
        bookings: monthBookings.length,
        revenue: monthRev.reduce((sum, r) => sum + Number(r.amount), 0),
        completed: monthBookings.filter((b) => b.status === "COMPLETED").length,
      });
    }

    // Process top properties with calculated metrics
    const topPropertiesWithMetrics = topProperties.map((property) => {
      const avgRating =
        property.reviews.length > 0
          ? property.reviews.reduce((sum, r) => sum + r.rating, 0) /
            property.reviews.length
          : 0;

      return {
        id: property.id,
        title: property.title,
        city: property.city,
        pricePerNight: Number(property.pricePerNight),
        bookings: property._count.bookings,
        reviews: property._count.reviews,
        averageRating: Math.round(avgRating * 10) / 10,
        revenue: property._count.bookings * Number(property.pricePerNight),
      };
    });

    // Get referred guests count
    const [referredGuestsTotal, referredGuestsCurrent] = await Promise.all([
      prisma.user.count({
        where: {
          referredByRealtorId: realtorId,
          role: "GUEST",
        },
      }),
      prisma.user.count({
        where: {
          referredByRealtorId: realtorId,
          role: "GUEST",
          createdAt: { gte: startDate },
        },
      }),
    ]);

    res.json({
      success: true,
      message: "Realtor analytics retrieved successfully",
      data: {
        timeRange,
        overview: {
          properties: {
            total: totalProperties,
            active: activeProperties,
          },
          bookings: {
            total: totalBookings,
            completed: completedBookings,
            pending: pendingBookings,
            cancelled: cancelledBookings,
            growth: calculateGrowth(totalBookings, previousBookings),
          },
          revenue: {
            total: Number(totalRevenue._sum.amount ?? 0),
            growth: calculateGrowth(
              Number(totalRevenue._sum.amount ?? 0),
              Number(previousRevenue._sum.amount ?? 0)
            ),
            average:
              totalBookings > 0
                ? Number(totalRevenue._sum.amount ?? 0) / totalBookings
                : 0,
          },
          guests: {
            total: referredGuestsTotal,
            newInPeriod: referredGuestsCurrent,
          },
          performance: {
            averageRating: Number(averageRating._avg.rating ?? 0),
            totalReviews,
            occupancyRate:
              activeProperties > 0
                ? (completedBookings / activeProperties) * 100
                : 0,
            conversionRate:
              totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
          },
        },
        trends: {
          monthly: monthlyData,
        },
        topProperties: topPropertiesWithMetrics,
      },
    });
  })
);

/**
 * @swagger
 * /api/realtors/properties/{id}/analytics:
 *   get:
 *     summary: Get property-specific analytics
 *     description: Get detailed analytics for a specific property owned by the realtor
 *     tags:
 *       - Realtors
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Time range for analytics data
 *     responses:
 *       200:
 *         description: Property analytics retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid token
 *       403:
 *         description: Forbidden - Not a realtor
 *       404:
 *         description: Property not found or not owned by realtor
 */
router.get(
  "/properties/:id/analytics",
  authenticate,
  requireRole("REALTOR"),
  requireApprovedRealtor,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: propertyId } = req.params;
    const realtorId = req.realtor?.id;

    if (!realtorId) {
      throw new AppError("Realtor profile not found", 404);
    }

    // Verify property belongs to realtor
    const property = await prisma.property.findFirst({
      where: { id: propertyId, realtorId },
      select: { id: true, title: true, pricePerNight: true },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    const { timeRange = "30d" } = req.query;

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const [
      totalBookings,
      completedBookings,
      pendingBookings,
      totalRevenue,
      totalReviews,
      averageRating,
      recentReviews,
      bookingTrends,
    ] = await Promise.all([
      prisma.booking.count({
        where: {
          propertyId,
          createdAt: { gte: startDate },
        },
      }),
      prisma.booking.count({
        where: {
          propertyId,
          status: "COMPLETED",
          createdAt: { gte: startDate },
        },
      }),
      prisma.booking.count({
        where: {
          propertyId,
          status: "PENDING",
          createdAt: { gte: startDate },
        },
      }),
      prisma.payment.aggregate({
        where: {
          booking: { propertyId },
          status: "COMPLETED",
          createdAt: { gte: startDate },
        },
        _sum: { amount: true },
      }),
      prisma.review.count({
        where: {
          propertyId,
          createdAt: { gte: startDate },
        },
      }),
      prisma.review.aggregate({
        where: {
          propertyId,
          createdAt: { gte: startDate },
        },
        _avg: { rating: true },
      }),
      prisma.review.findMany({
        where: {
          propertyId,
          createdAt: { gte: startDate },
        },
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.booking.findMany({
        where: {
          propertyId,
          createdAt: { gte: startDate },
        },
        select: {
          createdAt: true,
          status: true,
          checkInDate: true,
          checkOutDate: true,
          totalPrice: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    res.json({
      success: true,
      message: "Property analytics retrieved successfully",
      data: {
        property: {
          id: property.id,
          title: property.title,
          pricePerNight: Number(property.pricePerNight),
        },
        timeRange,
        overview: {
          bookings: {
            total: totalBookings,
            completed: completedBookings,
            pending: pendingBookings,
          },
          revenue: {
            total: Number(totalRevenue._sum.amount ?? 0),
            average:
              totalBookings > 0
                ? Number(totalRevenue._sum.amount ?? 0) / totalBookings
                : 0,
          },
          performance: {
            averageRating: Number(averageRating._avg.rating ?? 0),
            totalReviews,
            occupancyRate: completedBookings,
            conversionRate:
              totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
          },
        },
        recentReviews: recentReviews.map((review) => ({
          rating: review.rating,
          comment: review.comment,
          date: review.createdAt,
          guestName: `${review.author.firstName} ${review.author.lastName}`,
        })),
        bookingTrends: bookingTrends.map((booking) => ({
          date: booking.createdAt,
          status: booking.status,
          checkIn: booking.checkInDate,
          checkOut: booking.checkOutDate,
          revenue: Number(booking.totalPrice),
        })),
      },
    });
  })
);

/**
 * @swagger
 * /api/realtors/revenue-analytics:
 *   get:
 *     summary: Get revenue analytics
 *     description: Get revenue analytics for the authenticated realtor with time-based data
 *     tags: [Realtors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Time period for revenue analytics
 *     responses:
 *       200:
 *         description: Revenue analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRevenue:
 *                       type: number
 *                     revenueChange:
 *                       type: number
 *                     chartData:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                           revenue:
 *                             type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a realtor
 */
router.get(
  "/revenue-analytics",
  authenticate,
  requireRole("REALTOR"),
  requireRealtorDashboardAccess,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const realtor = await prisma.realtor.findUnique({
      where: { userId },
    });

    if (!realtor) {
      throw new AppError("Realtor profile not found", 404);
    }

    const { period = "30d" } = req.query;

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get completed bookings within the time range
    const bookings = await prisma.booking.findMany({
      where: {
        property: {
          realtorId: realtor.id,
        },
        status: "COMPLETED",
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      select: {
        totalPrice: true,
        createdAt: true,
        checkInDate: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Group data by date for chart
    const revenueByDate: { [key: string]: number } = {};

    bookings.forEach((booking) => {
      const date = booking.createdAt.toISOString().split("T")[0];
      revenueByDate[date] =
        (revenueByDate[date] || 0) + parseFloat(booking.totalPrice.toString());
    });

    // Convert to array format
    const chartData = Object.entries(revenueByDate).map(([date, revenue]) => ({
      date,
      revenue,
      amount: revenue,
    }));

    // Calculate totals
    const totalRevenue = bookings.reduce(
      (sum, booking) => sum + parseFloat(booking.totalPrice.toString()),
      0
    );
    const totalBookings = bookings.length;

    // Calculate previous period for comparison
    const previousStartDate = new Date(startDate);
    const previousEndDate = new Date(startDate);
    const daysDiff = Math.ceil(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    previousStartDate.setDate(previousStartDate.getDate() - daysDiff);

    const previousBookings = await prisma.booking.findMany({
      where: {
        property: {
          realtorId: realtor.id,
        },
        status: "COMPLETED",
        createdAt: {
          gte: previousStartDate,
          lt: previousEndDate,
        },
      },
      select: {
        totalPrice: true,
      },
    });

    const previousRevenue = previousBookings.reduce(
      (sum, booking) => sum + parseFloat(booking.totalPrice.toString()),
      0
    );

    // Calculate percentage change
    const revenueChange =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : totalRevenue > 0
        ? 100
        : 0;

    res.json({
      success: true,
      data: {
        period,
        totalRevenue,
        totalBookings,
        revenueChange: {
          value: Math.abs(revenueChange),
          type: revenueChange >= 0 ? "increase" : "decrease",
        },
        chartData:
          chartData.length > 0
            ? chartData
            : [
                {
                  date: startDate.toISOString().split("T")[0],
                  revenue: 0,
                  amount: 0,
                },
              ],
      },
    });
  })
);

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC PROFILE ENDPOINTS (No Auth Required)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/realtors/{slug}:
 *   get:
 *     summary: Get public realtor profile by slug
 *     description: Get public realtor profile and their approved properties
 *     tags: [Realtors]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Realtor's unique slug
 *     responses:
 *       200:
 *         description: Public realtor profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         realtor:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             businessName:
 *                               type: string
 *                             slug:
 *                               type: string
 *                             logoUrl:
 *                               type: string
 *                             brandColorHex:
 *                               type: string
 *                             description:
 *                               type: string
 *                             website:
 *                               type: string
 *                             properties:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 description: Property details with average rating
 *       404:
 *         description: Realtor not found or not approved
 */
router.get(
  "/:slug",
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;

    const realtor = await prisma.realtor.findUnique({
      where: { slug, isActive: true },
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
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Payout & Payment Configuration (Realtor)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/realtors/payout/banks:
 *   get:
 *     summary: Get list of Nigerian banks
 *     tags: [Realtors]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Banks list retrieved successfully
 */
router.get(
  "/payout/banks",
  authenticate,
  requireRole("REALTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const response = await axios.get("https://api.paystack.co/bank", {
        headers: {
          Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
        },
        timeout: 5000, // 5 second timeout
      });

      // Filter out duplicate bank codes (keep first occurrence)
      const banks = response.data.data || [];
      const uniqueBanks = banks.reduce((acc: any[], bank: any) => {
        if (!acc.find((b) => b.code === bank.code)) {
          acc.push(bank);
        }
        return acc;
      }, []);

      res.status(200).json({
        success: true,
        data: uniqueBanks,
      });
    } catch (error: any) {
      logger.error(
        "Error fetching banks from Paystack:",
        error.response?.data || error.message
      );

      // Return mock bank list for MVP if Paystack is unavailable
      const mockBanks = [
        {
          id: 1,
          name: "Access Bank",
          code: "044",
          active: true,
          country: "Nigeria",
        },
        {
          id: 2,
          name: "Guaranty Trust Bank",
          code: "058",
          active: true,
          country: "Nigeria",
        },
        {
          id: 3,
          name: "United Bank For Africa",
          code: "033",
          active: true,
          country: "Nigeria",
        },
        {
          id: 4,
          name: "Zenith Bank",
          code: "057",
          active: true,
          country: "Nigeria",
        },
        {
          id: 5,
          name: "First Bank of Nigeria",
          code: "011",
          active: true,
          country: "Nigeria",
        },
        {
          id: 6,
          name: "Fidelity Bank",
          code: "070",
          active: true,
          country: "Nigeria",
        },
        {
          id: 7,
          name: "Stanbic IBTC Bank",
          code: "221",
          active: true,
          country: "Nigeria",
        },
        {
          id: 8,
          name: "Union Bank of Nigeria",
          code: "032",
          active: true,
          country: "Nigeria",
        },
        {
          id: 9,
          name: "Wema Bank",
          code: "035",
          active: true,
          country: "Nigeria",
        },
        {
          id: 10,
          name: "Ecobank Nigeria",
          code: "050",
          active: true,
          country: "Nigeria",
        },
        {
          id: 11,
          name: "Polaris Bank",
          code: "076",
          active: true,
          country: "Nigeria",
        },
        {
          id: 12,
          name: "Sterling Bank",
          code: "232",
          active: true,
          country: "Nigeria",
        },
        {
          id: 13,
          name: "Kuda Bank",
          code: "50211",
          active: true,
          country: "Nigeria",
        },
        {
          id: 14,
          name: "ALAT by WEMA",
          code: "035A",
          active: true,
          country: "Nigeria",
        },
        {
          id: 15,
          name: "Opay",
          code: "999992",
          active: true,
          country: "Nigeria",
        },
        {
          id: 16,
          name: "PalmPay",
          code: "999991",
          active: true,
          country: "Nigeria",
        },
      ];

      logger.info("⚠️ Returning mock bank list - Paystack API unavailable");

      res.status(200).json({
        success: true,
        data: mockBanks,
        _mock: true,
        _message:
          "Using cached bank list - Paystack API temporarily unavailable",
      });
    }
  })
);

/**
 * @swagger
 * /api/realtors/payout/verify:
 *   post:
 *     summary: Verify bank account details
 *     tags: [Realtors]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountNumber
 *               - bankCode
 *             properties:
 *               accountNumber:
 *                 type: string
 *               bankCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account verified successfully
 *       400:
 *         description: Invalid account details
 */
router.post(
  "/payout/verify",
  authenticate,
  requireRole("REALTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { accountNumber, bankCode } = req.body;

    if (!accountNumber || !bankCode) {
      throw new AppError("Account number and bank code are required", 400);
    }

    try {
      const response = await axios.get(
        `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          headers: {
            Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
          },
          timeout: 10000, // 10 second timeout for verification
        }
      );

      return res.status(200).json({
        success: true,
        data: response.data.data,
      });
    } catch (error: any) {
      logger.error(
        "Error verifying account:",
        error.response?.data || error.message
      );

      // Return mock verification for MVP/development
      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        logger.info("⚠️ Returning mock verification - Paystack API timeout");
        return res.status(200).json({
          success: true,
          data: {
            account_number: accountNumber,
            account_name: "Test Account Holder", // Mock name
            bank_id: bankCode,
          },
          _mock: true,
          _message: "Mock verification - Paystack API timeout",
        });
      }

      throw new AppError(
        error.response?.data?.message || "Failed to verify bank account",
        400
      );
    }
  })
);

/**
 * @swagger
 * /api/realtors/payout/account:
 *   post:
 *     summary: Save bank account and create Paystack subaccount
 *     tags: [Realtors]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bankCode
 *               - bankName
 *               - accountNumber
 *               - accountName
 *             properties:
 *               bankCode:
 *                 type: string
 *               bankName:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               accountName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bank account set up successfully
 *       403:
 *         description: CAC verification required
 */
router.post(
  "/payout/account",
  authenticate,
  requireRole("REALTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { bankCode, bankName, accountNumber, accountName } = req.body;

    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    if (req.user.role !== "REALTOR") {
      throw new AppError("Only realtors can set up payout accounts", 403);
    }

    // Validate required fields
    if (!bankCode || !bankName || !accountNumber || !accountName) {
      throw new AppError("All bank account fields are required", 400);
    }

    // Get realtor record
    const realtor = await prisma.realtor.findUnique({
      where: { userId: req.user.id },
      include: { user: true },
    });

    if (!realtor) {
      throw new AppError("Realtor profile not found", 404);
    }

    // Check if CAC is approved
    if (realtor.cacStatus !== "APPROVED") {
      throw new AppError(
        "CAC verification must be approved before setting up payout account",
        403
      );
    }

    try {
      // Create Paystack subaccount
      const subAccountData = await createSubAccount({
        id: realtor.id,
        businessName: realtor.businessName,
        businessEmail: realtor.user.email,
        bankCode: bankCode,
        accountNumber: accountNumber,
        percentageCharge: 93, // Realtor gets 93% (7% platform commission)
      });

      // Save bank details and subaccount code to database
      const updatedRealtor = await prisma.realtor.update({
        where: { id: realtor.id },
        data: {
          paystackSubAccountCode: subAccountData.subaccount_code,
        },
      });

      res.status(200).json({
        success: true,
        message: "Bank account set up successfully",
        data: {
          subAccountCode: subAccountData.subaccount_code,
          bankName,
          accountNumber,
          accountName,
        },
      });
    } catch (error: any) {
      logger.error("Error creating subaccount:", error);
      throw new AppError(
        error.message || "Failed to set up payout account",
        500
      );
    }
  })
);

/**
 * @swagger
 * /api/realtors/payout/settings:
 *   get:
 *     summary: Get payout settings
 *     tags: [Realtors]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Payout settings retrieved successfully
 */
router.get(
  "/payout/settings",
  authenticate,
  requireRole("REALTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    if (req.user.role !== "REALTOR") {
      throw new AppError("Access denied", 403);
    }

    const realtor = await prisma.realtor.findUnique({
      where: { userId: req.user.id },
    });

    if (!realtor) {
      throw new AppError("Realtor profile not found", 404);
    }

    res.status(200).json({
      success: true,
      data: {
        hasPayoutAccount: !!realtor.paystackSubAccountCode,
        subAccountCode: realtor.paystackSubAccountCode,
      },
    });
  })
);

export default router;
