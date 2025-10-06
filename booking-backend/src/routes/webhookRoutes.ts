import express from "express";
import { Request, Response } from "express";
import {
  handleFlutterwaveWebhook,
  handleBookingCompletion,
} from "@/controllers/webhookController";

const router = express.Router();

// Flutterwave webhook endpoint (primary payment processor)
router.post("/flutterwave", express.json(), handleFlutterwaveWebhook);

// Booking completion webhook (internal)
router.post("/booking-completion", handleBookingCompletion);

router.post("/paystack", (req: Request, res: Response) => {
  console.log("Paystack webhook received (placeholder - deprecated in MVP)");
  res.status(200).json({ status: true });
});

export default router;
