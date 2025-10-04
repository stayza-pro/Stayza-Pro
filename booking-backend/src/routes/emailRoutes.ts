import express from "express";
import { previewEmailTemplate } from "@/controllers/emailController";

const router = express.Router();

/**
 * @swagger
 * /api/email/preview/{templateName}:
 *   get:
 *     summary: Preview email template (Development only)
 *     tags: [Email]
 *     parameters:
 *       - in: path
 *         name: templateName
 *         required: true
 *         schema:
 *           type: string
 *           enum: [welcome, realtor-welcome, email-verification, password-reset, realtor-approved]
 *         description: Name of the email template to preview
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
router.get("/preview/:templateName", previewEmailTemplate);

export default router;
