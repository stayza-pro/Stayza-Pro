// Test script - you can run this via POST to /api/auth/test-realtor
import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types";
import { asyncHandler } from "@/middleware/errorHandler";

export const testRealtorAuth = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    if (user.role !== "REALTOR") {
      return res.status(403).json({
        success: false,
        message: "Not a realtor",
        userRole: user.role,
      });
    }

    // Check realtor profile
    const { prisma } = await import("@/config/database");
    const realtor = await prisma.realtor.findUnique({
      where: { userId: user.id },
    });

    return res.json({
      success: true,
      message: "Realtor authentication test passed",
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        realtor: realtor
          ? {
              businessName: realtor.businessName,
              status: realtor.status,
              cacStatus: realtor.cacStatus,
              suspended: !!realtor.suspendedAt,
            }
          : null,
      },
    });
  }
);
