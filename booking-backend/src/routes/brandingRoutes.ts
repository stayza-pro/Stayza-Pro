import { Router } from "express";
import {
  getBrandingBySubdomain,
  getMyBranding,
} from "@/controllers/brandingController";
import { authenticate } from "@/middleware/auth";

const router = Router();

/**
 * Public Routes
 */
// Get branding by subdomain (for guest landing pages)
router.get("/subdomain/:subdomain", getBrandingBySubdomain);

/**
 * Protected Routes
 */
// Get current realtor's branding (for dashboard)
router.get("/me", authenticate, getMyBranding);

export default router;
