import { Response } from "express";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { prisma } from "@/config/database";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";

// MVP: Simplified payment controller - no external payment processing

export const createPayment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({
      success: false,
      message:
        "Payment processing coming soon in MVP - manual confirmation required",
    });
  }
);

export const confirmPayment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({
      success: false,
      message: "Payment confirmation coming soon in MVP",
    });
  }
);

export const getPayment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({
      success: false,
      message: "Payment details coming soon in MVP",
    });
  }
);

export const getUserPayments = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({
      success: false,
      message: "Payment history coming soon in MVP",
    });
  }
);

export default {
  createPayment,
  confirmPayment,
  getPayment,
  getUserPayments,
};
