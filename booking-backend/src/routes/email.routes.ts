import express, { Request, Response } from "express";
import { asyncHandler } from "@/middleware/errorHandler";
import { emailTemplates } from "@/services/email";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Email
 *     description: Email template preview endpoints
 */

/**
 * @swagger
 * /api/email/preview/{templateName}:
 *   get:
 *     summary: Preview email template
 *     description: Preview email template HTML (Development only)
 *     tags: [Email]
 *     parameters:
 *       - in: path
 *         name: templateName
 *         required: true
 *         schema:
 *           type: string
 *           enum: [welcome, realtor-welcome, email-verification, password-reset, realtor-approved]
 *     responses:
 *       200:
 *         description: Email template HTML
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       404:
 *         description: Template not found
 */
router.get(
  "/preview/:templateName",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { templateName } = req.params;

    let htmlContent = "";

    switch (templateName) {
      case "welcome":
        htmlContent = emailTemplates.welcome("John Doe").html;
        break;
      case "realtor-welcome":
        htmlContent = emailTemplates.realtorWelcome(
          "Jane Smith",
          "Smith Properties",
          "http://localhost:3000/dashboard",
          "http://localhost:3000/verify-email?token=sample-token&email=jane@example.com"
        ).html;
        break;
      case "email-verification":
        htmlContent = emailTemplates.emailVerification(
          "John Doe",
          "http://localhost:3000/verify-email?token=sample-token&email=john@example.com"
        ).html;
        break;
      case "password-reset":
        htmlContent = emailTemplates.passwordReset(
          "John Doe",
          "http://localhost:3000/realtor/reset-password?token=sample-token&email=john@example.com"
        ).html;
        break;
      case "realtor-approved":
        htmlContent = emailTemplates.realtorApproved(
          "Smith Properties",
          "http://localhost:3000/dashboard"
        ).html;
        break;
      default:
        res.status(404).json({
          success: false,
          message:
            "Template not found. Available templates: welcome, realtor-welcome, email-verification, password-reset, realtor-approved",
        });
        return;
    }

    res.setHeader("Content-Type", "text/html");
    res.send(htmlContent);
  })
);

export default router;
