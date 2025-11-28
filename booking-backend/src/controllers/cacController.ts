import { Response } from "express";
import { prisma } from "@/config/database";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { CacStatus } from "@prisma/client";
import { sendCacApprovalEmail, sendCacRejectionEmail } from "@/services/email";
import { config } from "@/config";
import jwt from "jsonwebtoken";

/**
 * @desc    Submit CAC verification
 * @route   POST /api/realtor/cac
 * @access  Private (Realtor)
 */
export const submitCacVerification = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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
  }
);

/**
 * @desc    Resubmit CAC verification after rejection
 * @route   PUT /api/realtor/cac/resubmit
 * @access  Private (Realtor)
 */
export const resubmitCacVerification = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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
  }
);

/**
 * @desc    Get CAC verification status
 * @route   GET /api/realtor/cac/status
 * @access  Private (Realtor)
 */
export const getCacStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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
  }
);

/**
 * @desc    Process CAC appeal from email link
 * @route   GET /api/realtor/cac/appeal/:token
 * @access  Public (email link)
 */
export const processCacAppeal = asyncHandler(async (req, res: Response) => {
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
});

/**
 * @desc    Approve CAC verification (Admin only)
 * @route   PUT /api/admin/realtor/:realtorId/cac/approve
 * @access  Private (Admin)
 */
export const approveCac = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { realtorId } = req.params;

    if (!req.user || req.user.role !== "ADMIN") {
      throw new AppError("Admin access required", 403);
    }

    const realtor = await prisma.realtor.findUnique({
      where: { id: realtorId },
      include: { user: true },
    });

    if (!realtor) {
      throw new AppError("Realtor not found", 404);
    }

    // Update CAC status to approved
    const updatedRealtor = await prisma.realtor.update({
      where: { id: realtorId },
      data: {
        cacStatus: "APPROVED",
        cacVerifiedAt: new Date(),
        cacRejectedAt: null,
        cacRejectionReason: null,
        canAppeal: false,
      },
    });

    // Send approval email
    await sendCacApprovalEmail(
      realtor.user.email,
      realtor.user.firstName,
      realtor.businessName
    );

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: "CAC_APPROVED",
        entityType: "REALTOR",
        entityId: realtorId,
        details: {
          realtorId: realtor.id,
          businessName: realtor.businessName,
          cacNumber: realtor.corporateRegNumber,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "CAC verification approved successfully",
      data: updatedRealtor,
    });
  }
);

/**
 * @desc    Reject CAC verification (Admin only)
 * @route   PUT /api/admin/realtor/:realtorId/cac/reject
 * @access  Private (Admin)
 */
export const rejectCac = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { realtorId } = req.params;
    const { reason } = req.body;

    if (!req.user || req.user.role !== "ADMIN") {
      throw new AppError("Admin access required", 403);
    }

    if (!reason) {
      throw new AppError("Rejection reason is required", 400);
    }

    const realtor = await prisma.realtor.findUnique({
      where: { id: realtorId },
      include: { user: true },
    });

    if (!realtor) {
      throw new AppError("Realtor not found", 404);
    }

    // Generate secure JWT appeal token with 7-day expiry
    const appealToken = jwt.sign(
      {
        realtorId: realtor.id,
        type: "CAC_APPEAL",
        businessName: realtor.businessName,
        email: realtor.user.email,
      },
      config.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Update CAC status to rejected
    const updatedRealtor = await prisma.realtor.update({
      where: { id: realtorId },
      data: {
        cacStatus: "REJECTED",
        cacRejectedAt: new Date(),
        cacRejectionReason: reason,
        canAppeal: false, // Require email appeal first
      },
    });

    // Generate appeal link with JWT token
    const appealUrl =
      config.NODE_ENV === "development"
        ? `http://localhost:5000/api/realtor/cac/appeal/${appealToken}`
        : `https://api.stayza.pro/api/realtor/cac/appeal/${appealToken}`;

    // Send rejection email with appeal link
    await sendCacRejectionEmail(
      realtor.user.email,
      realtor.user.firstName,
      realtor.businessName,
      reason,
      appealUrl
    );

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: "CAC_REJECTED",
        entityType: "REALTOR",
        entityId: realtorId,
        details: {
          realtorId: realtor.id,
          businessName: realtor.businessName,
          cacNumber: realtor.corporateRegNumber,
          reason: reason,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "CAC verification rejected",
      data: updatedRealtor,
    });
  }
);
