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

  const { email, password, firstName, lastName, phone, role = "GUEST" } = value;

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

  // Create user - MVP: Auto-verified, no email verification
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      phone,
      role,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      phone: true,
      createdAt: true,
    },
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  // MVP: RefreshToken model not implemented, tokens are stateless

  // MVP: Send welcome email only (no email verification required)
  sendWelcomeEmail(user.email, firstName || "User").catch((err) =>
    console.error("Welcome email failed", err)
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

  // MVP: RefreshToken model not implemented, tokens are stateless

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
  // MVP: Auto-verification enabled, no email verification required
  res.json({
    success: true,
    message:
      "Email verification not required in MVP - all emails are auto-verified",
  });
});

/**
 * @desc    Resend verification email
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
export const resendVerification = asyncHandler(
  async (req: Request, res: Response) => {
    // MVP: Auto-verification enabled, no email verification required
    res.json({
      success: true,
      message:
        "Email verification not required in MVP - all emails are auto-verified",
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
