import { Request, Response } from "express";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";

// MVP: Review functionality placeholder - to be implemented post-launch
// Reviews require completed bookings and user engagement data

export const createReview = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({
      success: false,
      message: "Review functionality coming soon - post-MVP feature",
    });
  }
);

export const getPropertyReviews = asyncHandler(
  async (req: Request, res: Response) => {
    res.status(501).json({
      success: false,
      message: "Review functionality coming soon - post-MVP feature",
    });
  }
);

export const updateReview = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({
      success: false,
      message: "Review functionality coming soon - post-MVP feature",
    });
  }
);

export const deleteReview = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({
      success: false,
      message: "Review functionality coming soon - post-MVP feature",
    });
  }
);

export const getMyReviews = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({
      success: false,
      message: "Review functionality coming soon - post-MVP feature",
    });
  }
);

export const getHostReviews = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    res.status(501).json({
      success: false,
      message: "Review functionality coming soon - post-MVP feature",
    });
  }
);

export default {
  createReview,
  getPropertyReviews,
  updateReview,
  deleteReview,
  getMyReviews,
  getHostReviews,
};
