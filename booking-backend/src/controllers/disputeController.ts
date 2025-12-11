import { logger } from "@/utils/logger";
import { Response } from "express";
import { DisputeType } from "@prisma/client";
import { AuthenticatedRequest } from "../types";
import disputeService from "../services/disputeService";

/**
 * POST /api/disputes/open
 * Open a new dispute
 */
export const openDispute = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { bookingId, disputeType, evidence, initialMessage } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!bookingId || !disputeType || !initialMessage) {
      res.status(400).json({
        message:
          "Missing required fields: bookingId, disputeType, initialMessage",
      });
      return;
    }

    if (
      disputeType !== DisputeType.USER_DISPUTE &&
      disputeType !== DisputeType.REALTOR_DISPUTE
    ) {
      res.status(400).json({
        message:
          "Invalid dispute type. Must be USER_DISPUTE or REALTOR_DISPUTE",
      });
      return;
    }

    if (!evidence || !Array.isArray(evidence) || evidence.length === 0) {
      res.status(400).json({
        message: "Photo or video evidence is required to open a dispute",
      });
      return;
    }

    const dispute = await disputeService.openDispute({
      bookingId,
      userId,
      disputeType,
      evidence,
      initialMessage,
    });

    res.status(201).json({
      message: "Dispute opened successfully",
      dispute,
    });
  } catch (error: any) {
    logger.error("Error opening dispute:", error);
    res.status(400).json({
      message: error.message || "Failed to open dispute",
    });
  }
};

/**
 * POST /api/disputes/:id/messages
 * Send a message in a dispute
 */
export const sendMessage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: disputeId } = req.params;
    const { message, attachments = [] } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!message) {
      res.status(400).json({ message: "Message is required" });
      return;
    }

    const updatedDispute = await disputeService.sendDisputeMessage(
      disputeId,
      userId,
      message,
      attachments
    );

    res.status(200).json({
      message: "Message sent successfully",
      dispute: updatedDispute,
    });
  } catch (error: any) {
    logger.error("Error sending dispute message:", error);
    res.status(400).json({
      message: error.message || "Failed to send message",
    });
  }
};

/**
 * POST /api/disputes/:id/evidence
 * Add evidence to a dispute
 */
export const uploadEvidence = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: disputeId } = req.params;
    const { evidenceUrls, description } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (
      !evidenceUrls ||
      !Array.isArray(evidenceUrls) ||
      evidenceUrls.length === 0
    ) {
      res.status(400).json({ message: "Evidence URLs are required" });
      return;
    }

    const updatedDispute = await disputeService.addDisputeEvidence(
      disputeId,
      userId,
      evidenceUrls,
      description
    );

    res.status(200).json({
      message: "Evidence added successfully",
      dispute: updatedDispute,
    });
  } catch (error: any) {
    logger.error("Error adding dispute evidence:", error);
    res.status(400).json({
      message: error.message || "Failed to add evidence",
    });
  }
};

/**
 * POST /api/disputes/:id/agree
 * Agree to a settlement amount
 */
export const agreeToSettlement = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: disputeId } = req.params;
    const { agreedAmount, notes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (agreedAmount === undefined || agreedAmount === null) {
      res.status(400).json({ message: "Agreed amount is required" });
      return;
    }

    if (!notes) {
      res.status(400).json({ message: "Settlement notes are required" });
      return;
    }

    const updatedDispute = await disputeService.agreeToSettlement(
      disputeId,
      userId,
      parseFloat(agreedAmount),
      notes
    );

    res.status(200).json({
      message: "Settlement agreed successfully",
      dispute: updatedDispute,
    });
  } catch (error: any) {
    logger.error("Error agreeing to settlement:", error);
    res.status(400).json({
      message: error.message || "Failed to agree to settlement",
    });
  }
};

/**
 * POST /api/disputes/:id/escalate
 * Escalate dispute to admin
 */
export const escalateToAdmin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: disputeId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!reason) {
      res.status(400).json({ message: "Escalation reason is required" });
      return;
    }

    const updatedDispute = await disputeService.escalateToAdmin(
      disputeId,
      userId,
      reason
    );

    res.status(200).json({
      message: "Dispute escalated to admin successfully",
      dispute: updatedDispute,
    });
  } catch (error: any) {
    logger.error("Error escalating dispute:", error);
    res.status(400).json({
      message: error.message || "Failed to escalate dispute",
    });
  }
};

/**
 * POST /api/disputes/:id/resolve
 * Admin resolves a dispute
 */
export const resolveDispute = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: disputeId } = req.params;
    const { resolutionAmount, adminNotes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (resolutionAmount === undefined || resolutionAmount === null) {
      res.status(400).json({ message: "Resolution amount is required" });
      return;
    }

    if (!adminNotes) {
      res.status(400).json({ message: "Admin notes are required" });
      return;
    }

    const updatedDispute = await disputeService.adminResolveDispute(
      disputeId,
      userId,
      parseFloat(resolutionAmount),
      adminNotes
    );

    res.status(200).json({
      message: "Dispute resolved successfully",
      dispute: updatedDispute,
    });
  } catch (error: any) {
    logger.error("Error resolving dispute:", error);
    res.status(400).json({
      message: error.message || "Failed to resolve dispute",
    });
  }
};

/**
 * GET /api/disputes/booking/:bookingId
 * Get all disputes for a booking
 */
export const getDisputesByBooking = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const disputes = await disputeService.getDisputesByBooking(bookingId);

    res.status(200).json({
      disputes,
    });
  } catch (error: any) {
    logger.error("Error fetching disputes:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch disputes",
    });
  }
};

/**
 * GET /api/disputes/:id
 * Get dispute details by ID
 */
export const getDisputeById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: disputeId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const dispute = await disputeService.getDisputeById(disputeId);

    if (!dispute) {
      res.status(404).json({ message: "Dispute not found" });
      return;
    }

    res.status(200).json({
      dispute,
    });
  } catch (error: any) {
    logger.error("Error fetching dispute:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch dispute",
    });
  }
};

/**
 * GET /api/disputes/admin/all
 * Get all open disputes (admin only)
 */
export const getAllOpenDisputes = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || userRole !== "ADMIN") {
      res.status(403).json({ message: "Forbidden: Admin access required" });
      return;
    }

    const disputes = await disputeService.getAllOpenDisputes();

    res.status(200).json({
      disputes,
      total: disputes.length,
    });
  } catch (error: any) {
    logger.error("Error fetching all disputes:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch disputes",
    });
  }
};

export default {
  openDispute,
  sendMessage,
  uploadEvidence,
  agreeToSettlement,
  escalateToAdmin,
  resolveDispute,
  getDisputesByBooking,
  getDisputeById,
  getAllOpenDisputes,
};
