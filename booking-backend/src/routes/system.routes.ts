import express from "express";
import { prisma } from "@/config/database";
import { logger } from "@/utils/logger";
import { AuthenticatedRequest } from "@/types";
import { asyncHandler } from "@/middleware/errorHandler";
import { authenticate, authorize } from "@/middleware/auth";

const router = express.Router();

// All system routes require authentication and admin role
router.use(authenticate);
router.use(authorize("ADMIN"));

/**
 * @swagger
 * /api/admin/system/job-locks:
 *   get:
 *     summary: Get all currently active job locks
 *     tags: [System]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Active job locks retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get(
  "/job-locks",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const locks = await prisma.jobLock.findMany({
      where: {
        expiresAt: { gt: new Date() }, // Only non-expired locks
      },
      orderBy: { lockedAt: "desc" },
      select: {
        id: true,
        jobName: true,
        lockedAt: true,
        lockedBy: true,
        expiresAt: true,
        bookingIds: true,
      },
    });

    logger.info("Fetched active job locks", {
      lockCount: locks.length,
      userId: user.id,
    });

    return res.json({
      success: true,
      data: locks,
    });
  })
);

/**
 * @swagger
 * /api/admin/system/health-stats:
 *   get:
 *     summary: Get system health metrics (webhooks, retries, transfers, locks)
 *     tags: [System]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: System health stats retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get(
  "/health-stats",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Fetch webhook stats (from escrow events with providerResponse)
    const recentEvents = await prisma.escrowEvent.findMany({
      where: {
        executedAt: { gte: oneDayAgo },
        transactionReference: { not: null },
      },
      select: {
        providerResponse: true,
        transactionReference: true,
      },
    });

    // Calculate webhook stats
    const webhookEvents = recentEvents.filter(
      (e) =>
        e.providerResponse &&
        typeof e.providerResponse === "object" &&
        "transferConfirmed" in e.providerResponse
    );

    const webhookStats = {
      totalReceived: webhookEvents.length,
      successRate:
        webhookEvents.length > 0
          ? (webhookEvents.filter(
              (e: any) => e.providerResponse?.transferConfirmed
            ).length /
              webhookEvents.length) *
            100
          : 0,
      failedCount: webhookEvents.filter(
        (e: any) => e.providerResponse?.transferFailed
      ).length,
      lastReceived:
        webhookEvents.length > 0
          ? recentEvents[0]?.transactionReference
          : undefined,
      byProvider: {
        paystack: webhookEvents.filter((e: any) =>
          e.transactionReference?.includes("PAYSTACK")
        ).length,
      },
    };

    // Fetch retry stats (events with retry attempts in notes or providerResponse)
    const retryEvents = recentEvents.filter(
      (e) =>
        e.providerResponse &&
        typeof e.providerResponse === "object" &&
        ("retryCount" in e.providerResponse ||
          "retryAttempt" in e.providerResponse)
    );

    const retryStats = {
      totalRetries: retryEvents.length,
      successRate:
        retryEvents.length > 0
          ? (retryEvents.filter((e: any) => !e.providerResponse?.transferFailed)
              .length /
              retryEvents.length) *
            100
          : 100,
      maxRetriesReached: retryEvents.filter(
        (e: any) =>
          e.providerResponse?.retryCount >= 3 ||
          e.providerResponse?.retryAttempt >= 3
      ).length,
      averageRetries:
        retryEvents.length > 0
          ? retryEvents.reduce(
              (sum: number, e: any) =>
                sum +
                (e.providerResponse?.retryCount ||
                  e.providerResponse?.retryAttempt ||
                  0),
              0
            ) / retryEvents.length
          : 0,
    };

    // Fetch transfer stats
    const transferEvents = await prisma.escrowEvent.findMany({
      where: {
        executedAt: { gte: oneDayAgo },
        eventType: {
          in: [
            "RELEASE_ROOM_FEE_SPLIT",
            "RELEASE_DEPOSIT_TO_CUSTOMER",
            "PAY_REALTOR_FROM_DEPOSIT",
            "REFUND_ROOM_FEE_TO_CUSTOMER",
          ],
        },
      },
      select: {
        providerResponse: true,
      },
    });

    const transferStats = {
      totalTransfers: transferEvents.length,
      confirmed: transferEvents.filter(
        (e: any) => e.providerResponse?.transferConfirmed
      ).length,
      pending: transferEvents.filter(
        (e: any) =>
          !e.providerResponse?.transferConfirmed &&
          !e.providerResponse?.transferFailed
      ).length,
      failed: transferEvents.filter(
        (e: any) => e.providerResponse?.transferFailed
      ).length,
      reversed: transferEvents.filter(
        (e: any) => e.providerResponse?.transferReversed
      ).length,
    };

    // Fetch active job locks count
    const activeLocksCount = await prisma.jobLock.count({
      where: {
        expiresAt: { gt: now },
      },
    });

    logger.info("Fetched system health stats", {
      webhooks: webhookStats.totalReceived,
      retries: retryStats.totalRetries,
      transfers: transferStats.totalTransfers,
      activeLocks: activeLocksCount,
      userId: user.id,
    });

    return res.json({
      success: true,
      data: {
        webhooks: webhookStats,
        retries: retryStats,
        transfers: transferStats,
        jobLocks: {
          active: activeLocksCount,
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/system/job-locks/{id}:
 *   delete:
 *     summary: Force release a stuck job lock
 *     tags: [System]
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
 *         description: Job lock released successfully
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Job lock not found
 */
router.delete(
  "/job-locks/:id",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { id } = req.params;

    // Verify lock exists
    const lock = await prisma.jobLock.findUnique({
      where: { id },
    });

    if (!lock) {
      return res.status(404).json({
        success: false,
        message: "Job lock not found",
      });
    }

    // Delete the lock
    await prisma.jobLock.delete({
      where: { id },
    });

    logger.warn("Admin force-released job lock", {
      lockId: id,
      jobName: lock.jobName,
      adminId: user.id,
      adminEmail: user.email,
      wasExpired: lock.expiresAt < new Date(),
    });

    return res.json({
      success: true,
      message: "Job lock released successfully",
      data: { id: lock.id, jobName: lock.jobName },
    });
  })
);

/**
 * @swagger
 * /api/admin/webhooks/booking/{id}:
 *   get:
 *     summary: Get webhook delivery status for a booking
 *     tags: [System]
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
 *         description: Webhook status retrieved successfully
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Booking not found
 */
router.get(
  "/webhooks/booking/:id",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { id } = req.params;

    // Verify booking exists
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Fetch all escrow events with webhook data
    const events = await prisma.escrowEvent.findMany({
      where: { bookingId: id },
      orderBy: { executedAt: "desc" },
      select: {
        id: true,
        eventType: true,
        amount: true,
        executedAt: true,
        transactionReference: true,
        providerResponse: true,
      },
    });

    // Process webhook delivery status
    const webhookStatus = events.map((event) => {
      const response = event.providerResponse as any;

      return {
        eventId: event.id,
        eventType: event.eventType,
        amount: event.amount,
        executedAt: event.executedAt,
        transactionReference: event.transactionReference,
        webhookReceived:
          !!response?.transferConfirmed ||
          !!response?.transferFailed ||
          !!response?.transferReversed,
        webhookReceivedAt: response?.transferConfirmedAt,
        status: response?.transferConfirmed
          ? "confirmed"
          : response?.transferFailed
          ? "failed"
          : response?.transferReversed
          ? "reversed"
          : "pending",
        failureReason: response?.failureReason,
        retryCount: response?.retryCount || response?.retryAttempt || 0,
      };
    });

    logger.info("Fetched booking webhook status", {
      bookingId: id,
      eventCount: events.length,
      userId: user.id,
    });

    return res.json({
      success: true,
      data: webhookStatus,
    });
  })
);

export default router;
