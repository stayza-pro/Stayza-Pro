import { Router } from "express";
import {
  getActiveJobLocks,
  getSystemHealthStats,
  forceReleaseJobLock,
  getBookingWebhookStatus,
} from "@/controllers/systemController";
import { authenticate, authorize } from "@/middleware/auth";

const router = Router();

// All system routes require authentication and admin role
router.use(authenticate);
router.use(authorize("ADMIN"));

/**
 * @route   GET /api/admin/system/job-locks
 * @desc    Get all currently active job locks
 * @access  Admin only
 */
router.get("/job-locks", getActiveJobLocks);

/**
 * @route   GET /api/admin/system/health-stats
 * @desc    Get system health metrics (webhooks, retries, transfers, locks)
 * @access  Admin only
 */
router.get("/health-stats", getSystemHealthStats);

/**
 * @route   DELETE /api/admin/system/job-locks/:id
 * @desc    Force release a stuck job lock
 * @access  Admin only
 */
router.delete("/job-locks/:id", forceReleaseJobLock);

/**
 * @route   GET /api/admin/webhooks/booking/:id
 * @desc    Get webhook delivery status for a booking
 * @access  Admin only
 */
router.get("/webhooks/booking/:id", getBookingWebhookStatus);

export default router;
