import { Router, Response } from "express";
import { AdminDisputeDecision, UserRole } from "@prisma/client";
import { logger } from "@/utils/logger";
import { AuthenticatedRequest } from "@/types";
import { authenticate, authorize } from "@/middleware/auth";
import disputeService from "@/services/disputeService";

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

/**
 * @swagger
 * /api/admin/disputes:
 *   get:
 *     summary: Get all open/escalated disputes (Admin only)
 *     tags: [Admin - Disputes]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Disputes retrieved successfully
 */
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const disputes = await disputeService.getAllOpenDisputes();

    res.status(200).json({
      disputes,
      count: disputes.length,
    });
  } catch (error: any) {
    logger.error("Error fetching disputes:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch disputes",
    });
  }
});

/**
 * @swagger
 * /api/admin/disputes/{id}:
 *   get:
 *     summary: Get dispute details (Admin view)
 *     tags: [Admin - Disputes]
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
 * /api/admin/disputes/{id}/resolve:
 *   post:
 *     summary: Resolve an escalated dispute (Admin only)
 *     tags: [Admin - Disputes]
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
 *               - decision
 *               - adminNotes
 *             properties:
 *               decision:
 *                 type: string
 *                 enum: [FULL_REFUND, PARTIAL_REFUND, NO_REFUND]
 *               adminNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dispute resolved successfully
 *       400:
 *         description: Invalid request or decision exceeds category limits
 */
router.post(
  "/:id/resolve",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { decision, adminNotes, adminClaimedAmount } = req.body;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (!decision || !adminNotes) {
        res.status(400).json({
          message: "Missing required fields: decision, adminNotes",
        });
        return;
      }

      // Validate adminClaimedAmount when PARTIAL_REFUND is chosen
      if (decision === "PARTIAL_REFUND" && adminClaimedAmount != null) {
        const claimed = Number(adminClaimedAmount);
        if (isNaN(claimed) || claimed < 0) {
          res.status(400).json({
            message: "adminClaimedAmount must be a non-negative number",
          });
          return;
        }
      }

      const validDecisions = ["FULL_REFUND", "PARTIAL_REFUND", "NO_REFUND"];
      if (!validDecisions.includes(decision)) {
        res.status(400).json({
          message:
            "Invalid decision. Must be FULL_REFUND, PARTIAL_REFUND, or NO_REFUND",
        });
        return;
      }

      const dispute = await disputeService.adminResolveDispute(
        id,
        adminId,
        decision as AdminDisputeDecision,
        adminNotes,
        adminClaimedAmount != null ? Number(adminClaimedAmount) : undefined,
      );

      res.status(200).json({
        message: "Dispute resolved successfully",
        dispute,
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
 * /api/admin/disputes/stats:
 *   get:
 *     summary: Get dispute statistics
 *     tags: [Admin - Disputes]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get("/stats", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prisma } = await import("@/config/database");

    const [
      totalDisputes,
      openDisputes,
      escalatedDisputes,
      resolvedDisputes,
      roomFeeDisputes,
      depositDisputes,
    ] = await Promise.all([
      prisma.dispute.count(),
      prisma.dispute.count({ where: { status: "AWAITING_RESPONSE" } }),
      prisma.dispute.count({ where: { status: "ESCALATED" } }),
      prisma.dispute.count({ where: { status: "RESOLVED" } }),
      prisma.dispute.count({ where: { disputeSubject: "ROOM_FEE" } }),
      prisma.dispute.count({ where: { disputeSubject: "SECURITY_DEPOSIT" } }),
    ]);

    res.status(200).json({
      stats: {
        total: totalDisputes,
        open: openDisputes,
        escalated: escalatedDisputes,
        resolved: resolvedDisputes,
        bySubject: {
          roomFee: roomFeeDisputes,
          deposit: depositDisputes,
        },
      },
    });
  } catch (error: any) {
    logger.error("Error fetching dispute stats:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch dispute statistics",
    });
  }
});

export default router;
