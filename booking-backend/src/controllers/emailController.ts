import { Request, Response } from "express";
import { asyncHandler } from "@/middleware/errorHandler";
import { emailTemplates } from "@/services/email";

/**
 * @desc    Preview email templates for testing
 * @route   GET /api/email/preview/:templateName
 * @access  Public (for development only)
 */
export const previewEmailTemplate = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
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
          "http://localhost:3000/reset-password?token=sample-token&email=john@example.com"
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
  }
);
