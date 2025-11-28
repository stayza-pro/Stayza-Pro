import { Request, Response } from "express";
import { prisma } from "@/config/database";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import {
  generateTokens,
  hashPassword,
  comparePassword,
  generateRandomToken,
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

/**
 * Helper function to clean up expired pending registrations
 * This prevents the database from filling up with unverified registrations
 */
async function cleanupExpiredPendingRegistrations() {
  try {
    const deleted = await prisma.pendingRegistration.deleteMany({
      where: {
        otpExpires: {
          lt: new Date(), // Less than current time = expired
        },
      },
    });
    if (deleted.count > 0) {
      console.log(
        `🧹 Cleaned up ${deleted.count} expired pending registrations`
      );
    }
  } catch (error) {
    console.error("Error cleaning up expired pending registrations:", error);
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
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = registerSchema.validate(req.body);

  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    role = "GUEST",
    realtorId, // The realtor ID if registering via subdomain
    referralSource, // e.g., "subdomain:akin-ma-lofa"
  } = value;

  // Validate role
  if (!["GUEST", "REALTOR", "ADMIN"].includes(role)) {
    throw new AppError("Invalid role specified", 400);
  }

  // Only admin can create admin accounts
  if (role === "ADMIN") {
    throw new AppError(
      "Admin accounts cannot be created through registration",
      403
    );
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError("User with this email already exists", 400);
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Generate email verification token
  const emailVerificationToken = generateRandomToken();
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Create user with email verification fields
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      phone,
      role,
      isEmailVerified: false,
      emailVerificationToken,
      emailVerificationExpires,
      referredByRealtorId: realtorId || null, // Link guest to realtor
      referralSource: referralSource || null, // Track referral source
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      phone: true,
      isEmailVerified: true,
      referredByRealtorId: true,
      referralSource: true,
      createdAt: true,
    },
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  // Send email verification
  const verificationUrl = `${
    config.FRONTEND_URL
  }/verify-email?token=${emailVerificationToken}&email=${encodeURIComponent(
    user.email
  )}`;
  sendEmailVerification(user.email, firstName || "User", verificationUrl).catch(
    (err) => console.error("Email verification failed", err)
  );

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      user,
      accessToken,
      refreshToken,
    },
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = loginSchema.validate(req.body);

  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const { email, password } = value;

  // Find user with password and include realtor data for role-based routing
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

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  console.log("✅ Login successful:", {
    userId: user.id,
    email: user.email,
    role: user.role,
    hasRealtor: !!user.realtor,
    realtorSlug: user.realtor?.slug,
  });

  // Generate domain-aware redirect URLs for different user types
  let dashboardUrl = "/";
  let loginRedirectUrl = "/";

  if (user.role === "REALTOR" && user.realtor && user.isEmailVerified) {
    // Verified realtors go to their subdomain dashboard
    dashboardUrl = getDashboardUrl("realtor", user.realtor.slug, true);
    loginRedirectUrl = dashboardUrl;
  } else if (user.role === "REALTOR" && user.realtor && !user.isEmailVerified) {
    // Unverified realtors stay on main domain
    loginRedirectUrl = buildMainDomainUrl(
      "/realtor/check-email",
      req.headers.host
    );
  } else if (user.role === "ADMIN") {
    dashboardUrl = getDashboardUrl("admin");
    loginRedirectUrl = dashboardUrl;
  } else {
    // Guests typically stay on main domain
    loginRedirectUrl = buildMainDomainUrl("/", req.headers.host);
  }

  // Remove password from response
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
    // Additional navigation URLs for frontend
    redirectUrls: {
      dashboard: dashboardUrl,
      primary: loginRedirectUrl,
    },
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      message: "User profile retrieved successfully",
      data: { user: req.user },
    });
  }
);

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { error, value } = updateProfileSchema.validate(req.body);

    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: value,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        fullName: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user },
    });
  }
);

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { refreshToken } = req.body;

    // MVP: Stateless tokens, no database cleanup needed
    // Client should simply discard the tokens

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  }
);

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError("Refresh token required", 400);
    }

    // MVP: Simple stateless token refresh - just validate and regenerate
    // In production, you'd want to verify the refresh token properly
    let userId, userEmail, userRole;

    try {
      // For MVP, we'll do a basic token check (in production, use JWT verification)
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_SECRET || "fallback-secret"
      );
      userId = decoded.id;
      userEmail = decoded.email;
      userRole = decoded.role;
    } catch (error) {
      throw new AppError("Invalid refresh token", 401);
    }

    // Generate new tokens
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
  }
);

/**
 * @desc    Verify email using token
 * @route   GET /api/auth/verify-email
 * @access  Public
 */
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token, email } = req.query;

  console.log("🔍 Email verification request:", {
    token: token ? `${String(token).substring(0, 10)}...` : "missing",
    email: email,
    url: req.url,
    query: req.query,
  });

  if (!token || !email) {
    throw new AppError("Verification token and email are required", 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: email as string },
    include: {
      realtor: true, // Include realtor data if user is a realtor
    },
  });

  if (!user) {
    console.log("❌ User not found for email:", email);
    throw new AppError("User not found", 404);
  }

  console.log("✅ User found:", {
    id: user.id,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    hasVerificationToken: !!user.emailVerificationToken,
    tokenMatch: user.emailVerificationToken === token,
    tokenExpires: user.emailVerificationExpires,
    isTokenExpired: user.emailVerificationExpires
      ? user.emailVerificationExpires < new Date()
      : "no expiry",
    currentTime: new Date(),
  });

  if (user.isEmailVerified) {
    // Get appropriate dashboard URL for verified user
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

  // Detailed token validation
  if (!user.emailVerificationToken) {
    console.log("❌ No verification token stored for user");
    throw new AppError("No verification token found for this user", 400);
  }

  if (user.emailVerificationToken !== token) {
    console.log("❌ Token mismatch:", {
      storedToken: user.emailVerificationToken
        ? `${user.emailVerificationToken.substring(0, 10)}...`
        : "null",
      providedToken: `${String(token).substring(0, 10)}...`,
      match: user.emailVerificationToken === token,
    });
    throw new AppError("Invalid verification token", 400);
  }

  if (!user.emailVerificationExpires) {
    console.log("❌ No expiration date set for verification token");
    throw new AppError("Verification token has no expiration date", 400);
  }

  if (user.emailVerificationExpires < new Date()) {
    console.log("❌ Verification token expired:", {
      expires: user.emailVerificationExpires,
      now: new Date(),
      expiredMinutesAgo: Math.round(
        (new Date().getTime() - user.emailVerificationExpires.getTime()) /
          (1000 * 60)
      ),
    });
    throw new AppError("Verification token has expired", 400);
  }

  console.log("✅ Token validation passed");

  // Update user as verified
  const verifiedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
    include: {
      realtor: true, // Include realtor data for token generation
    },
  });

  console.log("✅ User email verified successfully:", {
    id: verifiedUser.id,
    email: verifiedUser.email,
    role: verifiedUser.role,
  });

  // Generate authentication tokens for auto-login
  const { accessToken, refreshToken } = generateTokens({
    id: verifiedUser.id,
    email: verifiedUser.email,
    role: verifiedUser.role,
  });

  console.log("🔐 Generated authentication tokens for auto-login");

  // Send welcome email after successful verification
  sendWelcomeEmail(verifiedUser.email, verifiedUser.firstName || "User").catch(
    (err) => console.error("Welcome email failed", err)
  );

  // Get appropriate dashboard URL for newly verified user
  let dashboardUrl = "/";
  if (verifiedUser.role === "REALTOR" && verifiedUser.realtor) {
    dashboardUrl = getDashboardUrl("realtor", verifiedUser.realtor.slug, true);
  } else if (verifiedUser.role === "ADMIN") {
    dashboardUrl = getDashboardUrl("admin");
  }

  return res.json({
    success: true,
    message: "Email verified successfully",
    redirectUrl: dashboardUrl,
    // Auto-login tokens
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
});

/**
 * @desc    Resend verification email
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
export const resendVerification = asyncHandler(
  async (req: Request, res: Response) => {
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

    // Generate new verification token
    const emailVerificationToken = generateRandomToken();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken,
        emailVerificationExpires,
      },
    });

    // Get user's realtor data if they are a realtor
    const userWithRealtor = await prisma.user.findUnique({
      where: { id: user.id },
      include: { realtor: true },
    });

    // Generate domain-aware verification URL
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
  }
);

/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { error, value } = forgotPasswordSchema.validate(req.body);

    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: value.email.toLowerCase() },
    });

    if (!user) {
      // Do not reveal user existence
      return res.json({
        success: true,
        message: "If that email exists, a reset link has been sent",
      });
    }

    const resetToken = generateRandomToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // MVP: Password reset tokens not stored in database
    // In production, you'd store these securely

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
  }
);

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
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

    // MVP: Simplified token validation (in production, verify stored tokens)
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
  }
);

/**
 * @desc    Register user without password (passwordless) - sends OTP
 * @route   POST /api/auth/register-passwordless
 * @access  Public
 */
export const registerPasswordless = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      email,
      firstName,
      lastName,
      role = "GUEST",
      realtorId,
      referralSource,
    } = req.body;

    // Clean up expired pending registrations (run asynchronously, don't wait)
    cleanupExpiredPendingRegistrations().catch(console.error);

    // Validate required fields
    if (!email || !firstName || !lastName) {
      throw new AppError("Email, first name, and last name are required", 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError("Please provide a valid email address", 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // If user is VERIFIED, they should use login instead
      if (existingUser.isEmailVerified) {
        throw new AppError(
          "User with this email already exists. Please login instead.",
          400
        );
      }

      // If user is UNVERIFIED (from old flow or expired registration),
      // delete them and allow re-registration with new flow
      console.log(`🧹 Cleaning up unverified user: ${email}`);
      await prisma.user.delete({
        where: { id: existingUser.id },
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store registration data temporarily - user will only be created after OTP verification
    // Delete any existing pending registration for this email first
    await prisma.pendingRegistration.deleteMany({
      where: { email },
    });

    // Create new pending registration
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

    // Send OTP email
    try {
      await sendEmailVerification(email, otp, `${firstName} ${lastName}`);
    } catch (emailError) {
      // Log OTP to console in development if email fails
      if (config.NODE_ENV === "development") {
        console.log("\n========================================");
        console.log("📧 EMAIL SENDING FAILED - DEVELOPMENT MODE");
        console.log("========================================");
        console.log(`Email: ${email}`);
        console.log(`OTP Code: ${otp}`);
        console.log(`Expires: ${otpExpires.toLocaleString()}`);
        console.log("========================================\n");
      }
      // Don't throw error - allow registration to continue
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
        ...(config.NODE_ENV === "development" && { otp }), // Include OTP in dev mode
      },
    });
  }
);

/**
 * @desc    Request OTP for login (passwordless)
 * @route   POST /api/auth/request-otp
 * @access  Public
 */
export const requestOTP = asyncHandler(async (req: Request, res: Response) => {
  const { email, type = "login" } = req.body;

  if (!email) {
    throw new AppError("Email is required", 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError("Please provide a valid email address", 400);
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError("No account found with this email address", 404);
  }

  // Check if user is a GUEST
  if (user.role !== "GUEST") {
    throw new AppError(
      "Passwordless login is only available for guest accounts",
      400
    );
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store OTP in user record
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: otp,
      emailVerificationExpires: otpExpires,
    },
  });

  // Send OTP email
  try {
    await sendEmailVerification(
      email,
      otp,
      user.fullName || `${user.firstName} ${user.lastName}`
    );
  } catch (emailError) {
    // Log OTP to console in development if email fails
    if (config.NODE_ENV === "development") {
      console.log("\n========================================");
      console.log("📧 EMAIL SENDING FAILED - DEVELOPMENT MODE");
      console.log("========================================");
      console.log(`Email: ${email}`);
      console.log(`OTP Code: ${otp}`);
      console.log(`Expires: ${otpExpires.toLocaleString()}`);
      console.log("========================================\n");
    }
    // Don't throw error - allow login to continue
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
      ...(config.NODE_ENV === "development" && { otp }), // Include OTP in dev mode
    },
  });
});

/**
 * @desc    Verify OTP for registration
 * @route   POST /api/auth/verify-registration
 * @access  Public
 */
export const verifyRegistration = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new AppError("Email and OTP are required", 400);
    }

    // Find pending registration with this email and OTP
    const pendingReg = await prisma.pendingRegistration.findFirst({
      where: {
        email,
        otp,
      },
    });

    if (!pendingReg) {
      throw new AppError("Invalid or expired verification code", 400);
    }

    // Check if OTP is expired
    if (pendingReg.otpExpires < new Date()) {
      throw new AppError("Verification code has expired", 400);
    }

    // Check if user already exists (in case they verified after registering elsewhere)
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Clean up pending registration
      await prisma.pendingRegistration.delete({
        where: { id: pendingReg.id },
      });
      throw new AppError("User with this email already exists", 400);
    }

    // NOW create the actual user in the database (verified from the start)
    const user = await prisma.user.create({
      data: {
        email: pendingReg.email,
        password: "", // Empty password for passwordless
        firstName: pendingReg.firstName,
        lastName: pendingReg.lastName,
        fullName: `${pendingReg.firstName} ${pendingReg.lastName}`,
        role: pendingReg.role,
        isEmailVerified: true, // Already verified via OTP
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

    // Delete the pending registration
    await prisma.pendingRegistration.delete({
      where: { id: pendingReg.id },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Send welcome email (non-blocking - don't fail registration if email fails)
    try {
      await sendWelcomeEmail(
        email,
        user.fullName || `${user.firstName} ${user.lastName}`
      );
    } catch (emailError) {
      // Log error but don't block registration
      console.log(
        "⚠️  Welcome email failed to send, but registration completed successfully"
      );
      if (config.NODE_ENV === "development") {
        console.log("Email error:", emailError);
      }
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
  }
);

/**
 * @desc    Verify OTP for login
 * @route   POST /api/auth/verify-login
 * @access  Public
 */
export const verifyLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new AppError("Email and OTP are required", 400);
  }

  // Find user with this email and OTP
  const user = await prisma.user.findFirst({
    where: {
      email,
      emailVerificationToken: otp,
      role: "GUEST", // Only guests can use passwordless login
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
    throw new AppError("Invalid or expired verification code", 400);
  }

  // Check if OTP is expired
  if (
    user.emailVerificationExpires &&
    user.emailVerificationExpires < new Date()
  ) {
    throw new AppError("Verification code has expired", 400);
  }

  // Clear OTP
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
  });

  // Generate tokens
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
});
