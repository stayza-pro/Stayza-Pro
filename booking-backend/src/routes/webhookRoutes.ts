import express from "express";
import {
  handleFlutterwaveWebhook,
  handlePaystackWebhook,
  handleBookingCompletion,
} from "@/controllers/webhookController";

const router = express.Router();

// Paystack webhook endpoint (primary payment processor)
router.post("/paystack", express.json(), handlePaystackWebhook);

// Flutterwave webhook endpoint (secondary payment processor)
router.post("/flutterwave", express.json(), handleFlutterwaveWebhook);

// Booking completion webhook (internal)
router.post("/booking-completion", handleBookingCompletion);

export default router;
