import express from "express";
import {
  registerRealtor,
  createRealtorProfile,
  uploadLogo,
  uploadMiddleware,
  getRealtorProfile,
  updateRealtorProfile,
  getPublicRealtorProfile,
  startStripeOnboarding,
  getStripeAccountStatusController,
  getStripeDashboardLinkController,
} from "@/controllers/realtorController";
import { authenticate, requireRole } from "@/middleware/auth";

const router = express.Router();

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
 *     StripeOnboardingResponse:
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
 *               description: Stripe onboarding url to redirect the realtor
 *             expiresAt:
 *               type: string
 *               format: date-time
 *               description: Expiration timestamp for the onboarding link
 *     StripeStatusResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             connected:
 *               type: boolean
 *             stripeAccountId:
 *               type: string
 *             chargesEnabled:
 *               type: boolean
 *             payoutsEnabled:
 *               type: boolean
 *             detailsSubmitted:
 *               type: boolean
 *             disabledReason:
 *               type: string
 *               nullable: true
 *             outstandingRequirements:
 *               type: array
 *               items:
 *                 type: string
 *             releaseOffsetHours:
 *               type: integer
 *             requiresOnboarding:
 *               type: boolean
 *     StripeDashboardLinkResponse:
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
router.post("/register", registerRealtor);
router.post(
  "/profile/create",
  authenticate,
  requireRole("REALTOR"),
  createRealtorProfile
);

/**
 * @swagger
 * /api/realtors/upload-logo:
 *   post:
 *     summary: Upload realtor logo
 *     description: Upload and set business logo (max 10MB)
 *     tags: [Realtors]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Logo image file (JPG, PNG, JPEG, WebP)
 *     responses:
 *       200:
 *         description: Logo uploaded successfully
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
 *         description: Bad request (no file or invalid format)
 *       404:
 *         description: Realtor profile not found
 *       500:
 *         description: Upload failed
 */
router.post(
  "/upload-logo",
  authenticate,
  requireRole("REALTOR"),
  uploadMiddleware,
  uploadLogo
);

/**
 * @swagger
 * /api/realtors/stripe/onboarding:
 *   post:
 *     summary: Start or resume Stripe Connect onboarding
 *     tags: [Realtors]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Stripe onboarding link generated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StripeOnboardingResponse'
 *       400:
 *         description: Missing required business information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Realtor profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post(
  "/stripe/onboarding",
  authenticate,
  requireRole("REALTOR"),
  startStripeOnboarding
);

/**
 * @swagger
 * /api/realtors/stripe/status:
 *   get:
 *     summary: Get Stripe Connect account status
 *     tags: [Realtors]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Stripe account status retrieved (connected or not)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StripeStatusResponse'
 *       404:
 *         description: Realtor profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get(
  "/stripe/status",
  authenticate,
  requireRole("REALTOR"),
  getStripeAccountStatusController
);

/**
 * @swagger
 * /api/realtors/stripe/dashboard-link:
 *   post:
 *     summary: Generate Stripe dashboard link
 *     tags: [Realtors]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Stripe dashboard link generated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StripeDashboardLinkResponse'
 *       400:
 *         description: Realtor has not completed onboarding
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Realtor profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post(
  "/stripe/dashboard-link",
  authenticate,
  requireRole("REALTOR"),
  getStripeDashboardLinkController
);

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
router.get("/profile", authenticate, requireRole("REALTOR"), getRealtorProfile);
router.put(
  "/profile",
  authenticate,
  requireRole("REALTOR"),
  updateRealtorProfile
);

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
router.get("/:slug", getPublicRealtorProfile);

export default router;
