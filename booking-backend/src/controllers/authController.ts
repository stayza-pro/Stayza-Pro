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
import { auditLogger } from "@/services/auditLogger";

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
    country,
    city,
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

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role,
      country,
      city,
      emailVerificationToken,
    },
    select: {
      id: true,
      email: true,
      role: true,
      isEmailVerified: true,

      country: true,
      city: true,
      createdAt: true,
    },
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  // Fire-and-forget welcome + verification emails (non-blocking)
  const verificationUrl = `${
    config.FRONTEND_URL
  }/verify-email?token=${emailVerificationToken}&email=${encodeURIComponent(
    user.email
  )}`;
  Promise.all([
    sendWelcomeEmail(user.email, firstName || "User"),
    sendEmailVerification(user.email, firstName || "User", verificationUrl),
  ]).catch((err) => console.error("Post-registration emails failed", err));

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      user,
      accessToken,
      refreshToken,
    },
  });

  // Audit (non-blocking)
  auditLogger
    .log("USER_REGISTER", "User", {
      entityId: user.id,
      userId: user.id,
      details: { email: user.email, role: user.role },
      req,
    })
    .catch(() => {});
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

  // Find user with password
  const user = await prisma.user.findUnique({
    where: { email },
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

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    message: "Login successful",
    data: {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    },
  });

  auditLogger
    .log("USER_LOGIN", "User", {
      entityId: user.id,
      userId: user.id,
      details: { email: user.email },
      req,
    })
    .catch(() => {});
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
        role: true,
        isEmailVerified: true,

        country: true,
        city: true,
        address: true,
        dateOfBirth: true,
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

    if (refreshToken) {
      // Delete refresh token from database
      await prisma.refreshToken.deleteMany({
        where: {
          token: refreshToken,
          userId: req.user!.id,
        },
      });
    }

    res.json({
      success: true,
      message: "Logged out successfully",
    });

    auditLogger
      .log("USER_LOGOUT", "User", {
        entityId: req.user!.id,
        userId: req.user!.id,
        req,
      })
      .catch(() => {});
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

    // Find refresh token in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      id: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    });

    // Delete old refresh token and create new one
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: storedToken.user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });

    auditLogger
      .log("TOKEN_REFRESH", "User", {
        entityId: storedToken.user.id,
        userId: storedToken.user.id,
        details: { oldTokenId: storedToken.id },
        req,
      })
      .catch(() => {});
  }
);

/**
 * @desc    Verify email using token
 * @route   GET /api/auth/verify-email
 * @access  Public
 */
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token, email } = req.query as { token?: string; email?: string };

  if (!token || !email) {
    throw new AppError("Email and token are required", 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || !user.emailVerificationToken) {
    throw new AppError("Invalid or expired verification token", 400);
  }

  if (user.isEmailVerified) {
    return res.json({
      success: true,
      message: "Email already verified",
    });
  }

  if (user.emailVerificationToken !== token) {
    throw new AppError("Invalid verification token", 400);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerificationToken: null,
    },
  });

  return res.json({
    success: true,
    message: "Email verified successfully",
  });
});

/**
 * @desc    Resend verification email
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
export const resendVerification = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body as { email?: string };

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
      throw new AppError("Email already verified", 400);
    }

    const emailVerificationToken = generateRandomToken();

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken },
    });

    const verificationUrl = `${
      config.FRONTEND_URL
    }/verify-email?token=${emailVerificationToken}&email=${encodeURIComponent(
      user.email
    )}`;

    await sendEmailVerification(
      user.email,
      user.firstName || "User",
      verificationUrl
    );

    res.json({
      success: true,
      message: "Verification email resent",
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

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

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

    if (
      !user ||
      !user.resetPasswordToken ||
      user.resetPasswordToken !== token ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  }
);
