import { Router, Request, Response } from "express";
import { prisma } from "@/config/database";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import Joi from "joi";
import { sendWaitlistEmail } from "@/services/email";

const router = Router();

// Validation schema
const waitlistSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  fullName: Joi.string().min(2).max(100).optional(),
  companyName: Joi.string().max(100).optional(),
  phone: Joi.string().max(20).optional(),
  message: Joi.string().max(500).optional(),
  source: Joi.string().max(100).optional(),
});

/**
 * @swagger
 * /api/waitlist:
 *   post:
 *     summary: Join the waitlist
 *     tags: [Waitlist]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               fullName:
 *                 type: string
 *               companyName:
 *                 type: string
 *               phone:
 *                 type: string
 *               message:
 *                 type: string
 *               source:
 *                 type: string
 *     responses:
 *       201:
 *         description: Successfully joined waitlist
 *       400:
 *         description: Validation error or already on waitlist
 */
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    // Validate input
    const { error, value } = waitlistSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { email, fullName, companyName, phone, message, source } = value;

    // Check if email already exists
    const existing = await prisma.waitlist.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message:
          "You're already on our waitlist! We'll notify you when we launch.",
        data: { alreadyExists: true },
      });
    }

    // Get IP and User Agent
    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.ip ||
      "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    // Create waitlist entry
    const waitlistEntry = await prisma.waitlist.create({
      data: {
        email,
        fullName,
        companyName,
        phone,
        message,
        source,
        ipAddress,
        userAgent,
      },
    });

    // Send confirmation email using new email service
    try {
      await sendWaitlistEmail(email, fullName || undefined);
    } catch (emailError) {
      
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message:
        "Successfully joined the waitlist! Check your email for confirmation.",
      data: {
        id: waitlistEntry.id,
        email: waitlistEntry.email,
      },
    });
  })
);

/**
 * @swagger
 * /api/waitlist/count:
 *   get:
 *     summary: Get waitlist count
 *     tags: [Waitlist]
 *     responses:
 *       200:
 *         description: Waitlist count retrieved successfully
 */
router.get(
  "/count",
  asyncHandler(async (req: Request, res: Response) => {
    const count = await prisma.waitlist.count({
      where: { status: "pending" },
    });

    res.json({
      success: true,
      data: { count },
    });
  })
);

export default router;
