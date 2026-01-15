import { Router, Request, Response } from "express";
import { prisma } from "@/config/database";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import Joi from "joi";
import { sendEmail, emailTemplates } from "@/services/email";

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
        message: "You're already on our waitlist! We'll notify you when we launch.",
        data: { alreadyExists: true },
      });
    }

    // Get IP and User Agent
    const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.ip || "unknown";
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

    // Send confirmation email
    try {
      await sendEmail(email, {
        subject: "You're on the Waitlist! 🎉",
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #1E3A8A; font-size: 32px; margin: 0;">Welcome to Stayza Pro!</h1>
              <p style="color: #6B7280; font-size: 18px; margin-top: 10px;">You're on the waitlist</p>
            </div>
            
            <div style="background: #F3F4F6; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
              <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi${fullName ? ` ${fullName}` : ""},
              </p>
              <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Thank you for your interest in Stayza Pro! We're excited to have you on our early access waitlist.
              </p>
              <p style="color: #111827; font-size: 16px; line-height: 1.6; margin: 0;">
                We're working hard to perfect the platform and will notify you as soon as we're ready to launch. 
                You'll be among the first to experience our revolutionary property booking system.
              </p>
            </div>

            <div style="background: #1E3A8A; color: white; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
              <h2 style="margin: 0 0 15px 0; font-size: 20px;">What to Expect:</h2>
              <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Direct booking payments with Paystack & Stripe</li>
                <li>Your own branded booking website</li>
                <li>Live-in-minutes setup</li>
                <li>Automated guest management</li>
                <li>Zero commission platform</li>
              </ul>
            </div>

            <div style="text-align: center;">
              <p style="color: #6B7280; font-size: 14px;">
                Follow us on social media for updates and exclusive content!
              </p>
            </div>

            <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #E5E7EB;">
              <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Stayza Pro. All rights reserved.
              </p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send waitlist confirmation email:", emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: "Successfully joined the waitlist! Check your email for confirmation.",
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
