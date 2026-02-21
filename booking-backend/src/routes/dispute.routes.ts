import { Router, Response } from "express";
import {
  DisputeCategory,
  DisputeResponseAction,
  AdminDisputeDecision,
} from "@prisma/client";
import { logger } from "@/utils/logger";
import { AuthenticatedRequest } from "@/types";
import { authenticate } from "@/middleware/auth";
import * as disputeService from "@/services/disputeService";
import { disputeUpload, uploadDisputeEvidence } from "@/utils/upload";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/disputes/upload-attachment:
 *   post:
 *     summary: Upload a dispute evidence file (image or video)
 *     tags: [Disputes]
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/upload-attachment",
  (req, res, next) => {
    disputeUpload.single("file")(req, res, (err) => {
      if (err) {
        res
          .status(400)
          .json({ message: err.message || "File upload rejected" });
        return;
      }
      next();
    });
  },
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
      }

      const result = await uploadDisputeEvidence(file.buffer, file.mimetype);
      res.status(200).json({ url: result.secure_url });
    } catch (error: any) {
      logger.error("Error uploading dispute attachment:", error);
      res.status(400).json({
        message: error.message || "Failed to upload attachment",
      });
    }
  },
);

/**
 * @swagger
 * /api/disputes/booking/{bookingId}:
 *   get:
 *     summary: Get disputes for a specific booking
 *     tags: [Disputes]
 */
router.get(
  "/booking/:bookingId",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bookingId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const disputes = await disputeService.getDisputesByBooking(bookingId);

      if (!disputes || disputes.length === 0) {
        res.status(404).json({ message: "No dispute found for this booking" });
        return;
      }

      // Return most recent dispute as primary for backward compatibility
      res.status(200).json(disputes[0]);
    } catch (error: any) {
      logger.error("Error fetching dispute:", error);
      res.status(500).json({
        message: error.message || "Failed to fetch dispute",
      });
    }
  },
);

/**
 * @swagger
 * /api/disputes/realtor/disputes:
 *   get:
 *     summary: Get all disputes for a realtor
 *     tags: [Disputes]
 */
router.get(
  "/realtor/disputes",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { status } = req.query;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const disputes = await disputeService.getRealtorDisputes(
        userId,
        status as string,
      );

      res.status(200).json(disputes);
    } catch (error: any) {
      logger.error("Error fetching realtor disputes:", error);
      res.status(500).json({
        message: error.message || "Failed to fetch disputes",
      });
    }
  },
);

/**
 * @swagger
 * /api/disputes/realtor/stats:
 *   get:
 *     summary: Get dispute statistics for a realtor
 *     tags: [Disputes]
 */
router.get(
  "/realtor/stats",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const stats = await disputeService.getRealtorDisputeStats(userId);

      res.status(200).json(stats);
    } catch (error: any) {
      logger.error("Error fetching dispute stats:", error);
      res.status(500).json({
        message: error.message || "Failed to fetch stats",
      });
    }
  },
);

/**
 * @swagger
 * /api/disputes/room-fee:
 *   post:
 *     summary: Open a room fee dispute (Guest only, within 1hr of check-in)
 *     tags: [Disputes]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - category
 *               - writeup
 *             properties:
 *               bookingId:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [SAFETY_UNINHABITABLE, MAJOR_MISREPRESENTATION, MISSING_AMENITIES_CLEANLINESS, MINOR_INCONVENIENCE]
 *               writeup:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Room fee dispute opened successfully
 *       400:
 *         description: Invalid request
 */
router.post("/room-fee", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bookingId, category, writeup, attachments } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!bookingId || !category || !writeup) {
      res.status(400).json({
        message: "Missing required fields: bookingId, category, writeup",
      });
      return;
    }

    const dispute = await disputeService.openRoomFeeDispute(
      bookingId,
      userId,
      category as DisputeCategory,
      writeup,
      attachments,
    );

    res.status(201).json({
      message: "Room fee dispute opened successfully",
      dispute,
    });
  } catch (error: any) {
    logger.error("Error opening room fee dispute:", error);
    res.status(400).json({
      message: error.message || "Failed to open room fee dispute",
    });
  }
});

/**
 * @swagger
 * /api/disputes/deposit:
 *   post:
 *     summary: Open a security deposit dispute (Realtor only, within 2hr of checkout)
 *     tags: [Disputes]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - category
 *               - claimedAmount
 *               - writeup
 *             properties:
 *               bookingId:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [PROPERTY_DAMAGE, MISSING_ITEMS, CLEANING_REQUIRED, OTHER_DEPOSIT_CLAIM]
 *               claimedAmount:
 *                 type: number
 *               writeup:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Deposit dispute opened successfully
 *       400:
 *         description: Invalid request
 */
router.post("/deposit", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bookingId, category, claimedAmount, writeup, attachments } =
      req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!bookingId || !category || !claimedAmount || !writeup) {
      res.status(400).json({
        message:
          "Missing required fields: bookingId, category, claimedAmount, writeup",
      });
      return;
    }

    // Get realtor ID from user
    const { prisma } = await import("@/config/database");
    const realtor = await prisma.realtor.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!realtor) {
      res
        .status(403)
        .json({ message: "Only realtors can open deposit disputes" });
      return;
    }

    const dispute = await disputeService.openDepositDispute(
      bookingId,
      realtor.id,
      category as DisputeCategory,
      parseFloat(claimedAmount),
      writeup,
      attachments,
    );

    res.status(201).json({
      message: "Deposit dispute opened successfully",
      dispute,
    });
  } catch (error: any) {
    logger.error("Error opening deposit dispute:", error);
    res.status(400).json({
      message: error.message || "Failed to open deposit dispute",
    });
  }
});

/**
 * @swagger
 * /api/disputes/{id}/respond:
 *   post:
 *     summary: Respond to a dispute (ACCEPT or REJECT_ESCALATE)
 *     tags: [Disputes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - responseAction
 *             properties:
 *               responseAction:
 *                 type: string
 *                 enum: [ACCEPT, REJECT_ESCALATE]
 *               responseNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Response submitted successfully
 *       400:
 *         description: Invalid request
 */
router.post(
  "/:id/respond",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { responseAction, responseNotes } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (!responseAction) {
        res.status(400).json({
          message: "Missing required field: responseAction",
        });
        return;
      }

      const dispute = await disputeService.respondToDispute(
        id,
        userId,
        responseAction as DisputeResponseAction,
        responseNotes,
      );

      res.status(200).json({
        message:
          responseAction === "ACCEPT"
            ? "Dispute accepted and resolved"
            : "Dispute escalated to admin",
        dispute,
      });
    } catch (error: any) {
      logger.error("Error responding to dispute:", error);
      res.status(400).json({
        message: error.message || "Failed to respond to dispute",
      });
    }
  },
);

/**
 * @swagger
 * /api/disputes/{id}:
 *   get:
 *     summary: Get dispute details
 *     tags: [Disputes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dispute retrieved successfully
 */
router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const dispute = await disputeService.getDisputeById(id);

    if (!dispute) {
      res.status(404).json({ message: "Dispute not found" });
      return;
    }

    res.status(200).json({ dispute });
  } catch (error: any) {
    logger.error("Error fetching dispute:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch dispute",
    });
  }
});

/**
 * @swagger
 * /api/disputes/booking/{bookingId}:
 *   get:
 *     summary: Get all disputes for a booking
 *     tags: [Disputes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Disputes retrieved successfully
 */
router.get(
  "/booking/:bookingId",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bookingId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const disputes = await disputeService.getDisputesByBooking(bookingId);

      res.status(200).json({ disputes });
    } catch (error: any) {
      logger.error("Error fetching disputes:", error);
      res.status(500).json({
        message: error.message || "Failed to fetch disputes",
      });
    }
  },
);

export default router;
