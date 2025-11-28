import { Response } from "express";
import { AuthenticatedRequest } from "@/types";
import { asyncHandler } from "@/middleware/errorHandler";
import { prisma } from "@/config/database";
import { AppError } from "@/middleware/errorHandler";

/**
 * @desc    Get realtor approval status for dashboard
 * @route   GET /api/realtors/approval-status
 * @access  Private (Realtor only)
 */
export const getApprovalStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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

    // Determine approval stage and messaging
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
  }
);
