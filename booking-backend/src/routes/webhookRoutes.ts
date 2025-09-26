import express from "express";
import {
  handleStripeWebhook,
  handlePaystackWebhook,
} from "@/controllers/webhookController";

const router = express.Router();

/**
 * @swagger
 * /api/webhooks/stripe:
 *   post:
 *     summary: Handle Stripe webhooks
 *     tags: [Webhooks]
 *     description: Endpoint for receiving Stripe webhook events
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid signature or malformed request
 */
router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

/**
 * @swagger
 * /api/webhooks/paystack:
 *   post:
 *     summary: Handle Paystack webhooks
 *     tags: [Webhooks]
 *     description: Endpoint for receiving Paystack webhook events
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid signature or malformed request
 */
router.post("/paystack", handlePaystackWebhook);

export default router;
