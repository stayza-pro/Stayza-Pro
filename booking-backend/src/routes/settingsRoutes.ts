import express from "express";
import {
  getAllSettings,
  getSettingByKey,
  updateSetting,
  getSettingsByCategory,
  createSetting,
} from "@/controllers/settingsController";
import { authenticate, requireRole } from "@/middleware/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

// Apply authentication and admin role requirement to all routes
router.use(authenticate);
router.use(requireRole(UserRole.ADMIN));

/**
 * @swagger
 * tags:
 *   name: Admin Settings
 *   description: Platform settings management endpoints
 */

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Get all platform settings
 *     tags: [Admin Settings]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter settings by category (e.g., commission, payout, booking)
 *     responses:
 *       200:
 *         description: Platform settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     settings:
 *                       type: object
 *                       description: Settings grouped by category
 *                     total:
 *                       type: number
 *   post:
 *     summary: Create a new platform setting
 *     tags: [Admin Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - value
 *             properties:
 *               key:
 *                 type: string
 *                 description: Unique setting key
 *               value:
 *                 oneOf:
 *                   - type: string
 *                   - type: number
 *                   - type: boolean
 *                   - type: object
 *                 description: Setting value (can be any JSON type)
 *               description:
 *                 type: string
 *                 description: Human-readable description of the setting
 *               category:
 *                 type: string
 *                 default: general
 *                 description: Setting category for organization
 *     responses:
 *       201:
 *         description: Setting created successfully
 *       400:
 *         description: Invalid input or setting already exists
 */
router.route("/").get(getAllSettings).post(createSetting);

/**
 * @swagger
 * /api/admin/settings/category/{category}:
 *   get:
 *     summary: Get settings by category
 *     tags: [Admin Settings]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Setting category (commission, payout, booking, property, etc.)
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     category:
 *                       type: string
 *                     settings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PlatformSetting'
 *                     count:
 *                       type: number
 */
router.get("/category/:category", getSettingsByCategory);

/**
 * @swagger
 * /api/admin/settings/{key}:
 *   get:
 *     summary: Get a specific setting by key
 *     tags: [Admin Settings]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Setting key (e.g., commission_rate, payout_threshold)
 *     responses:
 *       200:
 *         description: Setting retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PlatformSetting'
 *       404:
 *         description: Setting not found
 *   put:
 *     summary: Update a platform setting
 *     tags: [Admin Settings]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Setting key to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 oneOf:
 *                   - type: string
 *                   - type: number
 *                   - type: boolean
 *                   - type: object
 *                 description: New setting value
 *               description:
 *                 type: string
 *                 description: Updated description (optional)
 *     responses:
 *       200:
 *         description: Setting updated successfully
 *       400:
 *         description: Invalid value or validation failed
 *       404:
 *         description: Setting not found
 */
router.route("/:key").get(getSettingByKey).put(updateSetting);

/**
 * @swagger
 * components:
 *   schemas:
 *     PlatformSetting:
 *       type: object
 *       properties:
 *         key:
 *           type: string
 *           description: Unique setting identifier
 *         value:
 *           oneOf:
 *             - type: string
 *             - type: number
 *             - type: boolean
 *             - type: object
 *           description: Setting value
 *         description:
 *           type: string
 *           description: Human-readable description
 *         category:
 *           type: string
 *           description: Setting category
 *         isActive:
 *           type: boolean
 *           description: Whether setting is active
 *         updatedBy:
 *           type: string
 *           description: ID of admin who last updated
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         updatedByUser:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             email:
 *               type: string
 */

export default router;
