import { Router } from "express";
import disputeController from "../controllers/disputeController";
import { authenticate } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/disputes/open
 * @desc    Open a new dispute
 * @access  Private
 */
router.post("/open", disputeController.openDispute);

/**
 * @route   POST /api/disputes/:id/messages
 * @desc    Send a message in a dispute
 * @access  Private
 */
router.post("/:id/messages", disputeController.sendMessage);

/**
 * @route   POST /api/disputes/:id/evidence
 * @desc    Add evidence to a dispute
 * @access  Private
 */
router.post("/:id/evidence", disputeController.uploadEvidence);

/**
 * @route   POST /api/disputes/:id/agree
 * @desc    Agree to a settlement amount
 * @access  Private
 */
router.post("/:id/agree", disputeController.agreeToSettlement);

/**
 * @route   POST /api/disputes/:id/escalate
 * @desc    Escalate dispute to admin
 * @access  Private
 */
router.post("/:id/escalate", disputeController.escalateToAdmin);

/**
 * @route   POST /api/disputes/:id/resolve
 * @desc    Admin resolves a dispute
 * @access  Private (Admin only)
 */
router.post("/:id/resolve", disputeController.resolveDispute);

/**
 * @route   GET /api/disputes/:id
 * @desc    Get dispute details by ID
 * @access  Private
 */
router.get("/:id", disputeController.getDisputeById);

/**
 * @route   GET /api/disputes/booking/:bookingId
 * @desc    Get all disputes for a booking
 * @access  Private
 */
router.get("/booking/:bookingId", disputeController.getDisputesByBooking);

/**
 * @route   GET /api/disputes/admin/all
 * @desc    Get all open disputes (admin only)
 * @access  Private (Admin only)
 */
router.get("/admin/all", disputeController.getAllOpenDisputes);

export default router;
