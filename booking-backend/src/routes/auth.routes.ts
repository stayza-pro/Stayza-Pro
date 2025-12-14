import express, { Request, Response } from "express";
import { prisma } from "@/config/database";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import {
  generateTokens,
  hashPassword,
  comparePassword,
  generateRandomToken,
  verifyRefreshToken,
} from "@/utils/auth";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "@/utils/validation";
import {
  sendWelcomeEmail,
  sendEmailVerification,
  sendPasswordReset,
} from "@/services/email";
import { config } from "@/config";
import { getEmailVerificationUrl, getDashboardUrl } from "@/utils/domains";
import { authenticate } from "@/middleware/auth";
import { authLimiter } from "@/middleware/rateLimiter";
import { uploadSinglePhoto } from "@/services/photoUpload";
import { logger } from "@/utils/logger";

const router = express.Router();

/**
 * Helper function to clean up expired pending registrations
 */
async function cleanupExpiredPendingRegistrations() {
  try {
    const deleted = await prisma.pendingRegistration.deleteMany({
      where: {
        otpExpires: {
          lt: new Date(),
        },
      },
    });
    if (deleted.count > 0) {
      logger.info(
        `🧹 Cleaned up ${deleted.count} expired pending registrations`
      );
    }
  } catch (error) {
    logger.error("Error cleaning up expired pending registrations:", error);
  }
}

/**
 * Helper function to build main domain URLs
 */
function buildMainDomainUrl(path: string, host?: string): string {
  const isDev = config.NODE_ENV === "development";
  const baseUrl = isDev ? config.DEV_DOMAIN : "https://stayza.pro";
  return `${baseUrl}${path}`;
}

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: User ID
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         firstName:
 *           type: string
 *           description: User first name
 *         lastName:
 *           type: string
 *           description: User last name
 *         fullName:
 *           type: string
 *           description: User full name
 *         phone:
 *           type: string
 *           description: User phone number
 *         role:
 *           type: string
 *           enum: [GUEST, REALTOR, ADMIN]
 *           description: User role
 *         avatar:
 *           type: string
 *           description: User avatar URL
 *         isEmailVerified:
 *           type: boolean
 *           description: Email verification status
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: User creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: User last update date
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           minLength: 6
 *           example: password123
 *         firstName:
 *           type: string
 *           example: John
 *         lastName:
 *           type: string
 *           example: Doe
 *         phone:
 *           type: string
 *           example: "+2348012345678"
 *         role:
 *           type: string
 *           enum: [GUEST, REALTOR]
 *           default: GUEST
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           example: password123
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: User registered successfully
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             accessToken:
 *               type: string
 *               description: JWT access token (1 hour expiry)
 *             refreshToken:
 *               type: string
 *               description: JWT refresh token (7 days expiry)
 *     PasswordlessRegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - firstName
 *         - lastName
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         role:
 *           type: string
 *           enum: [GUEST, REALTOR]
 *           default: GUEST
 *     OTPRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *     OTPVerifyRequest:
 *       type: object
 *       required:
 *         - email
 *         - otp
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         otp:
 *           type: string
 *           example: "123456"
 *     RefreshTokenRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *     ForgotPasswordRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *     ResetPasswordRequest:
 *       type: object
 *       required:
 *         - token
 *         - email
 *         - password
 *       properties:
 *         token:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *     UpdateProfileRequest:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         phone:
 *           type: string
 *         avatar:
 *           type: string
 *           format: binary
 */

// DEPRECATED: Traditional password registration removed
// Guests now use /register-passwordless (OTP-based)
// Realtors use /api/realtors/register (full business onboarding)

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post(
  "/login",
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = loginSchema.validate(req.body);

    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { email, password } = value;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        realtor: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    if (!user || !(await comparePassword(password, user.password))) {
      throw new AppError("Invalid email or password", 401);
    }

    const { accessToken, refreshToken } = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info("✅ Login successful:", {
      userId: user.id,
      email: user.email,
      role: user.role,
      hasRealtor: !!user.realtor,
      realtorSlug: user.realtor?.slug,
    });

    let dashboardUrl = "/";
    let loginRedirectUrl = "/";

    if (user.role === "REALTOR" && user.realtor && user.isEmailVerified) {
      dashboardUrl = getDashboardUrl("realtor", user.realtor.slug, true);
      loginRedirectUrl = dashboardUrl;
    } else if (
      user.role === "REALTOR" &&
      user.realtor &&
      !user.isEmailVerified
    ) {
      loginRedirectUrl = buildMainDomainUrl(
        "/realtor/check-email",
        req.headers.host
      );
    } else if (user.role === "ADMIN") {
      dashboardUrl = getDashboardUrl("admin");
      loginRedirectUrl = dashboardUrl;
    } else {
      loginRedirectUrl = buildMainDomainUrl("/", req.headers.host);
    }

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
        redirectUrl: loginRedirectUrl,
      },
      redirectUrls: {
        dashboard: dashboardUrl,
        primary: loginRedirectUrl,
      },
    });
  })
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      message: "User profile retrieved successfully",
      data: { user: req.user },
    });
  })
);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put(
  "/profile",
  authenticate,
  uploadSinglePhoto.single("avatar"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { error, value } = updateProfileSchema.validate(req.body);

    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const updateData: any = { ...value };
    if (req.file) {
      updateData.avatar = req.file.path;
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        fullName: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user },
    });
  })
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post(
  "/logout",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  })
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       400:
 *         description: Refresh token required
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post(
  "/refresh",
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError("Refresh token required", 400);
    }

    let userId, userEmail, userRole;

    try {
      const decoded = verifyRefreshToken(refreshToken);
      userId = decoded.id;
      userEmail = decoded.email;
      userRole = decoded.role;
    } catch (error) {
      logger.error("❌ Refresh token verification failed:", error);
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      id: userId,
      email: userEmail,
      role: userRole,
    });

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  })
);

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: Verify email using token
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 *       404:
 *         description: User not found
 */
router.get(
  "/verify-email",
  asyncHandler(async (req: Request, res: Response) => {
    const { token, email } = req.query;

    logger.info("🔍 Email verification request:", {
      token: token ? `${String(token).substring(0, 10)}...` : "missing",
      email: email,
    });

    if (!token || !email) {
      throw new AppError("Verification token and email are required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: email as string },
      include: {
        realtor: true,
      },
    });

    if (!user) {
      logger.info("❌ User not found for email:", email);
      throw new AppError("User not found", 404);
    }

    if (user.isEmailVerified) {
      let dashboardUrl = "/";
      if (user.role === "REALTOR" && user.realtor) {
        dashboardUrl = getDashboardUrl("realtor", user.realtor.slug, true);
      } else if (user.role === "ADMIN") {
        dashboardUrl = getDashboardUrl("admin");
      }

      return res.json({
        success: true,
        message: "Email is already verified",
        redirectUrl: dashboardUrl,
      });
    }

    if (!user.emailVerificationToken || user.emailVerificationToken !== token) {
      throw new AppError("Invalid verification token", 400);
    }

    if (
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      throw new AppError("Verification token has expired", 400);
    }

    const verifiedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
      include: {
        realtor: true,
      },
    });

    const { accessToken, refreshToken } = generateTokens({
      id: verifiedUser.id,
      email: verifiedUser.email,
      role: verifiedUser.role,
    });

    sendWelcomeEmail(
      verifiedUser.email,
      verifiedUser.firstName || "User"
    ).catch((err) => logger.error("Welcome email failed", err));

    let dashboardUrl = "/";
    if (verifiedUser.role === "REALTOR" && verifiedUser.realtor) {
      dashboardUrl = getDashboardUrl(
        "realtor",
        verifiedUser.realtor.slug,
        true
      );
    } else if (verifiedUser.role === "ADMIN") {
      dashboardUrl = getDashboardUrl("admin");
    }

    return res.json({
      success: true,
      message: "Email verified successfully",
      redirectUrl: dashboardUrl,
      authTokens: {
        accessToken,
        refreshToken,
      },
      user: {
        id: verifiedUser.id,
        email: verifiedUser.email,
        firstName: verifiedUser.firstName,
        lastName: verifiedUser.lastName,
        role: verifiedUser.role,
        isEmailVerified: true,
      },
    });
  })
);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *       400:
 *         description: Email already verified
 *       404:
 *         description: User not found
 */
router.post(
  "/resend-verification",
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      throw new AppError("Email is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.isEmailVerified) {
      throw new AppError("Email is already verified", 400);
    }

    const emailVerificationToken = generateRandomToken();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken,
        emailVerificationExpires,
      },
    });

    const userWithRealtor = await prisma.user.findUnique({
      where: { id: user.id },
      include: { realtor: true },
    });

    let userType: "admin" | "realtor" | "guest" = "guest";
    let realtorSlug: string | undefined;

    if (userWithRealtor?.role === "ADMIN") {
      userType = "admin";
    } else if (userWithRealtor?.role === "REALTOR" && userWithRealtor.realtor) {
      userType = "realtor";
      realtorSlug = userWithRealtor.realtor.slug;
    }

    const verificationUrl = getEmailVerificationUrl(
      emailVerificationToken,
      userType,
      realtorSlug,
      user.email
    );

    await sendEmailVerification(
      user.email,
      user.firstName || "User",
      verificationUrl
    );

    res.json({
      success: true,
      message: "Verification email sent successfully",
    });
  })
);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Reset link sent if email exists
 */
router.post(
  "/forgot-password",
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = forgotPasswordSchema.validate(req.body);

    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: value.email.toLowerCase() },
    });

    if (!user) {
      return res.json({
        success: true,
        message: "If that email exists, a reset link has been sent",
      });
    }

    const resetToken = generateRandomToken();
    const resetUrl = `${
      config.FRONTEND_URL
    }/reset-password?token=${resetToken}&email=${encodeURIComponent(
      user.email
    )}`;

    await sendPasswordReset(user.email, user.firstName || "User", resetUrl);

    return res.json({
      success: true,
      message: "If that email exists, a reset link has been sent",
    });
  })
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  "/reset-password",
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = resetPasswordSchema.validate(req.body);

    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { token, email, password } = value;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new AppError("Invalid reset request", 400);
    }

    if (!token) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  })
);

/**
 * @swagger
 * /api/auth/register-passwordless:
 *   post:
 *     summary: Register without password (sends OTP)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordlessRegisterRequest'
 *     responses:
 *       201:
 *         description: Verification code sent
 *       400:
 *         description: User already exists
 */
router.post(
  "/register-passwordless",
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const {
      email,
      firstName,
      lastName,
      role = "GUEST",
      realtorId,
      referralSource,
    } = req.body;

    cleanupExpiredPendingRegistrations().catch(console.error);

    if (!email || !firstName || !lastName) {
      throw new AppError("Email, first name, and last name are required", 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError("Please provide a valid email address", 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.isEmailVerified) {
        throw new AppError(
          "User with this email already exists. Please login instead.",
          400
        );
      }

      logger.info(`🧹 Cleaning up unverified user: ${email}`);
      await prisma.user.delete({
        where: { id: existingUser.id },
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.pendingRegistration.deleteMany({
      where: { email },
    });

    await prisma.pendingRegistration.create({
      data: {
        email,
        firstName,
        lastName,
        role,
        referredByRealtorId: realtorId || null,
        referralSource: referralSource || null,
        otp,
        otpExpires,
      },
    });

    try {
      await sendEmailVerification(email, otp, `${firstName} ${lastName}`);
    } catch (emailError) {
      if (config.NODE_ENV === "development") {
        logger.info("\n========================================");
        logger.info("📧 EMAIL SENDING FAILED - DEVELOPMENT MODE");
        logger.info("========================================");
        logger.info(`Email: ${email}`);
        logger.info(`OTP Code: ${otp}`);
        logger.info(`Expires: ${otpExpires.toLocaleString()}`);
        logger.info("========================================\n");
      }
    }

    res.status(201).json({
      success: true,
      message:
        config.NODE_ENV === "development"
          ? `Verification code: ${otp} (Check console - email service unavailable)`
          : "Verification code sent to your email",
      data: {
        email,
        expiresIn: "10 minutes",
        ...(config.NODE_ENV === "development" && { otp }),
      },
    });
  })
);

/**
 * @swagger
 * /api/auth/request-otp:
 *   post:
 *     summary: Request OTP for passwordless login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OTPRequest'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       404:
 *         description: User not found
 */
router.post(
  "/request-otp",
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, type = "login" } = req.body;

    if (!email) {
      throw new AppError("Email is required", 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError("Please provide a valid email address", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError("No account found with this email address", 404);
    }

    if (user.role !== "GUEST") {
      throw new AppError(
        "Passwordless login is only available for guest accounts",
        400
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: otp,
        emailVerificationExpires: otpExpires,
      },
    });

    try {
      await sendEmailVerification(
        email,
        otp,
        user.fullName || `${user.firstName} ${user.lastName}`
      );
    } catch (emailError) {
      if (config.NODE_ENV === "development") {
        logger.info("\n========================================");
        logger.info("📧 EMAIL SENDING FAILED - DEVELOPMENT MODE");
        logger.info("========================================");
        logger.info(`Email: ${email}`);
        logger.info(`OTP Code: ${otp}`);
        logger.info(`Expires: ${otpExpires.toLocaleString()}`);
        logger.info("========================================\n");
      }
    }

    res.json({
      success: true,
      message:
        config.NODE_ENV === "development"
          ? `Verification code: ${otp} (Check console - email service unavailable)`
          : "Verification code sent to your email",
      data: {
        email,
        expiresIn: "10 minutes",
        ...(config.NODE_ENV === "development" && { otp }),
      },
    });
  })
);

/**
 * @swagger
 * /api/auth/verify-registration:
 *   post:
 *     summary: Verify OTP for registration
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OTPVerifyRequest'
 *     responses:
 *       200:
 *         description: Account verified successfully
 *       400:
 *         description: Invalid or expired OTP
 */
router.post(
  "/verify-registration",
  asyncHandler(async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new AppError("Email and OTP are required", 400);
    }

    const pendingReg = await prisma.pendingRegistration.findFirst({
      where: {
        email,
        otp,
      },
    });

    if (!pendingReg) {
      throw new AppError("Invalid or expired verification code", 400);
    }

    if (pendingReg.otpExpires < new Date()) {
      throw new AppError("Verification code has expired", 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      await prisma.pendingRegistration.delete({
        where: { id: pendingReg.id },
      });
      throw new AppError("User with this email already exists", 400);
    }

    const user = await prisma.user.create({
      data: {
        email: pendingReg.email,
        password: "",
        firstName: pendingReg.firstName,
        lastName: pendingReg.lastName,
        fullName: `${pendingReg.firstName} ${pendingReg.lastName}`,
        role: pendingReg.role,
        isEmailVerified: true,
        referredByRealtorId: pendingReg.referredByRealtorId,
        referralSource: pendingReg.referralSource,
      },
      include: {
        realtor: {
          select: {
            status: true,
            businessName: true,
            slug: true,
          },
        },
      },
    });

    await prisma.pendingRegistration.delete({
      where: { id: pendingReg.id },
    });

    const { accessToken, refreshToken } = generateTokens(user);

    try {
      await sendWelcomeEmail(
        email,
        user.fullName || `${user.firstName} ${user.lastName}`
      );
    } catch (emailError) {
      logger.info(
        "⚠️  Welcome email failed to send, but registration completed successfully"
      );
    }

    res.status(200).json({
      success: true,
      message: "Account verified successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          realtor: user.realtor,
        },
        accessToken,
        refreshToken,
      },
    });
  })
);

/**
 * @swagger
 * /api/auth/verify-login:
 *   post:
 *     summary: Verify OTP for login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OTPVerifyRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid or expired OTP
 */
router.post(
  "/verify-login",
  asyncHandler(async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    logger.info("🔍 Verify Login Request:", { email, otp });

    if (!email || !otp) {
      throw new AppError("Email and OTP are required", 400);
    }

    const user = await prisma.user.findFirst({
      where: {
        email,
        emailVerificationToken: otp,
        role: "GUEST",
      },
      include: {
        realtor: {
          select: {
            status: true,
            businessName: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      const userCheck = await prisma.user.findUnique({
        where: { email },
      });

      if (!userCheck) {
        throw new AppError("No account found with this email address", 404);
      }
      if (userCheck.role !== "GUEST") {
        throw new AppError(
          "Passwordless login is only available for guest accounts",
          400
        );
      }
      throw new AppError("Invalid verification code", 400);
    }

    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires < new Date()
    ) {
      throw new AppError("Verification code has expired", 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    const { accessToken, refreshToken } = generateTokens(user);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          realtor: user.realtor,
        },
        accessToken,
        refreshToken,
      },
    });
  })
);

/**
 * @swagger
 * /api/auth/change-password:
 *   patch:
 *     summary: Change password (when logged in)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       401:
 *         description: Current password is incorrect
 */
router.patch(
  "/change-password",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    if (!currentPassword || !newPassword) {
      throw new AppError("Current password and new password are required", 400);
    }

    if (newPassword.length < 8) {
      throw new AppError("New password must be at least 8 characters", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const isValidPassword = await comparePassword(
      currentPassword,
      user.password
    );

    if (!isValidPassword) {
      throw new AppError("Current password is incorrect", 401);
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    logger.info("Password changed", { userId });

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  })
);

/**
 * @swagger
 * /api/auth/delete-account:
 *   delete:
 *     summary: Delete user account (GDPR compliance)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account deletion scheduled
 *       400:
 *         description: Cannot delete account with active bookings
 */
router.delete(
  "/delete-account",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { password, reason } = req.body;
    const userId = req.user!.id;

    if (!password) {
      throw new AppError("Password is required to delete account", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        bookings: {
          where: {
            checkOutDate: { gte: new Date() },
            status: { in: ["CONFIRMED", "PENDING"] },
          },
        },
        realtor: {
          include: {
            properties: {
              where: { status: "ACTIVE" },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new AppError("Invalid password", 401);
    }

    // Check for active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        guestId: userId,
        checkOutDate: { gte: new Date() },
        status: { in: ["CONFIRMED", "PENDING"] },
      },
    });

    if (activeBookings > 0) {
      throw new AppError(
        "Cannot delete account with active bookings. Please cancel or complete all bookings first.",
        400
      );
    }

    // Check if realtor has active properties
    if (user.role === "REALTOR") {
      const activeProperties = await prisma.property.count({
        where: {
          realtorId: userId,
          status: "ACTIVE",
        },
      });

      if (activeProperties > 0) {
        throw new AppError(
          "Realtors cannot delete account while having active properties. Please remove all properties first.",
          400
        );
      }
    }

    // Log deletion request
    await prisma.auditLog.create({
      data: {
        action: "ACCOUNT_DELETION_REQUESTED",
        userId,
        entityType: "User",
        entityId: userId,
        details: {
          reason,
        },
      },
    });

    // Soft delete - anonymize data
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${userId}@stayza.com`,
        firstName: "Deleted",
        lastName: "User",
        phone: null,
        avatar: null,
        password: await hashPassword(generateRandomToken()),
      },
    });

    logger.info("Account deleted", {
      userId,
      details: { reason },
    });

    return res.json({
      success: true,
      message: "Account successfully deleted",
    });
  })
);

export default router;
