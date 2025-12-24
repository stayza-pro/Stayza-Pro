import { Router, Response } from "express";
import { DisputeType } from "@prisma/client";
import { logger } from "@/utils/logger";
import { AuthenticatedRequest } from "@/types";
import { authenticate } from "@/middleware/auth";
import disputeService from "@/services/disputeService";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/disputes/open:
 *   post:
 *     summary: Open a new dispute
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
 *               - disputeType
 *               - initialMessage
 *               - evidence
 *             properties:
 *               bookingId:
 *                 type: string
 *               disputeType:
 *                 type: string
 *                 enum: [USER_DISPUTE, REALTOR_DISPUTE]
 *               initialMessage:
 *                 type: string
 *               evidence:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Dispute opened successfully
 *       400:
 *         description: Invalid request
 */
router.post("/open", async (req: AuthenticatedRequest, res: Response) => {
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
});

/**
 * @swagger
 * /api/disputes/{id}/messages:
 *   post:
 *     summary: Send a message in a dispute
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
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Message sent successfully
 */
router.post(
  "/:id/messages",
  async (req: AuthenticatedRequest, res: Response) => {
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
  }
);

/**
 * @swagger
 * /api/disputes/{id}/evidence:
 *   post:
 *     summary: Add evidence to a dispute
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
 *               - evidenceUrls
 *             properties:
 *               evidenceUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Evidence added successfully
 */
router.post(
  "/:id/evidence",
  async (req: AuthenticatedRequest, res: Response) => {
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
  }
);

/**
 * @swagger
 * /api/disputes/{id}/agree:
 *   post:
 *     summary: Agree to a settlement amount
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
 *               - agreedAmount
 *               - notes
 *             properties:
 *               agreedAmount:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Settlement agreed successfully
 */
router.post("/:id/agree", async (req: AuthenticatedRequest, res: Response) => {
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
});

/**
 * @swagger
 * /api/disputes/{id}/escalate:
 *   post:
 *     summary: Escalate dispute to admin
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dispute escalated successfully
 */
router.post(
  "/:id/escalate",
  async (req: AuthenticatedRequest, res: Response) => {
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
  }
);

/**
 * @swagger
 * /api/disputes/{id}/resolve:
 *   post:
 *     summary: Admin resolves a dispute
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
 *               - resolutionAmount
 *               - adminNotes
 *             properties:
 *               resolutionAmount:
 *                 type: number
 *               adminNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dispute resolved successfully
 */
router.post(
  "/:id/resolve",
  async (req: AuthenticatedRequest, res: Response) => {
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
  }
);

/**
 * @swagger
 * /api/disputes/{id}/resolve-guest-tier:
 *   post:
 *     summary: Admin resolves guest dispute with tier assignment (NEW COMMISSION FLOW)
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
 *               - tier
 *               - adminNotes
 *             properties:
 *               tier:
 *                 type: string
 *                 enum: [TIER_1_SEVERE, TIER_2_PARTIAL, TIER_3_ABUSE]
 *                 description: |
 *                   TIER_1_SEVERE: 100% room fee refund (realtor clearly at fault)
 *                   TIER_2_PARTIAL: 30% room fee refund (partial fault or minor issues)
 *                   TIER_3_ABUSE: 0% refund (guest abuse: no evidence, false claim)
 *               adminNotes:
 *                 type: string
 *                 description: Admin's explanation of the decision
 *     responses:
 *       200:
 *         description: Guest dispute resolved successfully with tier
 *       400:
 *         description: Invalid request or dispute type
 *       401:
 *         description: Unauthorized - admin only
 */
router.post(
  "/:id/resolve-guest-tier",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: disputeId } = req.params;
      const { tier, adminNotes } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (
        !tier ||
        !["TIER_1_SEVERE", "TIER_2_PARTIAL", "TIER_3_ABUSE"].includes(tier)
      ) {
        res.status(400).json({
          message:
            "Valid tier is required (TIER_1_SEVERE, TIER_2_PARTIAL, or TIER_3_ABUSE)",
        });
        return;
      }

      if (!adminNotes) {
        res.status(400).json({ message: "Admin notes are required" });
        return;
      }

      const result = await disputeService.adminResolveGuestDisputeWithTier(
        disputeId,
        userId,
        tier,
        adminNotes
      );

      res.status(200).json({
        message: "Guest dispute resolved successfully",
        tier,
        refundAmount: result.refundAmount,
        dispute: result.updatedDispute,
        booking: result.updatedBooking,
      });
    } catch (error: any) {
      logger.error("Error resolving guest dispute with tier:", error);
      res.status(400).json({
        message: error.message || "Failed to resolve guest dispute",
      });
    }
  }
);

/**
 * @swagger
 * /api/disputes/{id}/resolve-realtor-outcome:
 *   post:
 *     summary: Admin resolves realtor dispute with outcome (NEW COMMISSION FLOW)
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
 *               - outcome
 *               - damageAmount
 *               - adminNotes
 *             properties:
 *               outcome:
 *                 type: string
 *                 enum: [WIN, LOSS, PARTIAL]
 *                 description: |
 *                   WIN: Realtor gets full claimed amount from deposit
 *                   PARTIAL: Realtor gets partial amount based on evidence
 *                   LOSS: Realtor gets nothing, full deposit refunded to guest
 *               damageAmount:
 *                 type: number
 *                 description: Amount realtor should receive (0 for LOSS, full claim for WIN, custom for PARTIAL)
 *               adminNotes:
 *                 type: string
 *                 description: Admin's explanation of the decision
 *     responses:
 *       200:
 *         description: Realtor dispute resolved successfully with outcome
 *       400:
 *         description: Invalid request or dispute type
 *       401:
 *         description: Unauthorized - admin only
 */
router.post(
  "/:id/resolve-realtor-outcome",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id: disputeId } = req.params;
      const { outcome, damageAmount, adminNotes } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (!outcome || !["WIN", "LOSS", "PARTIAL"].includes(outcome)) {
        res.status(400).json({
          message: "Valid outcome is required (WIN, LOSS, or PARTIAL)",
        });
        return;
      }

      if (damageAmount === undefined || damageAmount === null) {
        res.status(400).json({ message: "Damage amount is required" });
        return;
      }

      if (!adminNotes) {
        res.status(400).json({ message: "Admin notes are required" });
        return;
      }

      const result = await disputeService.adminResolveRealtorDisputeWithOutcome(
        disputeId,
        userId,
        outcome,
        parseFloat(damageAmount),
        adminNotes
      );

      res.status(200).json({
        message: "Realtor dispute resolved successfully",
        outcome,
        realtorReceives: result.realtorGets,
        guestRefund: result.guestRefund,
        dispute: result.updatedDispute,
        booking: result.updatedBooking,
      });
    } catch (error: any) {
      logger.error("Error resolving realtor dispute with outcome:", error);
      res.status(400).json({
        message: error.message || "Failed to resolve realtor dispute",
      });
    }
  }
);

/**
 * @swagger
 * /api/disputes/{id}:
 *   get:
 *     summary: Get dispute details by ID
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
 *         description: Dispute details retrieved successfully
 *       404:
 *         description: Dispute not found
 */
router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
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

      res.status(200).json({
        disputes,
      });
    } catch (error: any) {
      logger.error("Error fetching disputes:", error);
      res.status(500).json({
        message: error.message || "Failed to fetch disputes",
      });
    }
  }
);

export default router;
