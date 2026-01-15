import { Router } from "express";
import { sendWaitlistEmail } from "../services/email.js";

const router = Router();

// Test route to send waitlist email directly
router.post("/test-waitlist-email", async (req, res) => {
  try {
    const { email, fullName } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    await sendWaitlistEmail(email, fullName);

    res.json({
      success: true,
      message: `Waitlist email sent to ${email}`,
    });
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
