import express from "express";
import { Request, Response } from "express";

const router = express.Router();

// MVP: Simplified webhook endpoints - placeholder for future implementation
router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  (req: Request, res: Response) => {
    console.log("Stripe webhook received (placeholder)");
    res.status(200).json({ received: true });
  }
);

router.post("/paystack", (req: Request, res: Response) => {
  console.log("Paystack webhook received (placeholder)");
  res.status(200).json({ status: true });
});

export default router;
