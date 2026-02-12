import express, { Response } from "express";
import { prisma } from "@/config/database";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { logSettingUpdate } from "@/services/auditLogger";
import { authenticate, requireRole } from "@/middleware/auth";
import {
  FINANCE_SETTING_KEYS,
  validateFinanceSettingValue,
} from "@/services/financeConfig";
import { UserRole } from "@prisma/client";

const router = express.Router();

// Apply authentication and admin role requirement to all routes
router.use(authenticate);
router.use(requireRole(UserRole.ADMIN));

/**
 * @swagger
 * tags:
 *   - name: Admin Settings
 *     description: Platform settings management endpoints
 */

/**
 * Validate setting values based on their key/type
 */
function validateSettingValue(
  key: string,
  value: any
): { isValid: boolean; message: string } {
  if (Object.values(FINANCE_SETTING_KEYS).includes(key as any)) {
    const financeErrors = validateFinanceSettingValue(key, value);
    if (financeErrors.length > 0) {
      return {
        isValid: false,
        message: financeErrors.join("; "),
      };
    }
    return { isValid: true, message: "" };
  }

  switch (key) {
    case "commission_rate":
      return {
        isValid: false,
        message:
          "commission_rate is deprecated. Use finance.commission.tiers.v1 and related finance.* keys.",
      };

    case "payout_threshold":
      if (typeof value !== "number" || value < 1000 || value > 1000000) {
        return {
          isValid: false,
          message:
            "Payout threshold must be a number between 1,000 and 1,000,000",
        };
      }
      break;

    case "booking_cancellation_window":
      if (typeof value !== "number" || value < 1 || value > 168) {
        // 1 hour to 7 days
        return {
          isValid: false,
          message: "Cancellation window must be between 1 and 168 hours",
        };
      }
      break;

    case "max_property_images":
      if (typeof value !== "number" || value < 1 || value > 50) {
        return {
          isValid: false,
          message: "Max property images must be between 1 and 50",
        };
      }
      break;

    case "auto_payout_enabled":
      if (typeof value !== "boolean") {
        return {
          isValid: false,
          message: "Auto payout enabled must be a boolean value",
        };
      }
      break;

    default:
      // For unknown settings, allow any value but ensure it's not null/undefined
      if (value === null || value === undefined) {
        return {
          isValid: false,
          message: "Setting value cannot be null or undefined",
        };
      }
  }

  return { isValid: true, message: "" };
}

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Get all platform settings
 *     description: Get all platform settings grouped by category
 *     tags: [Admin Settings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter settings by category
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { category } = req.query;

    const where: any = {
      isActive: true,
    };

    if (category && typeof category === "string") {
      where.category = category;
    }

    const settings = await prisma.platformSettings.findMany({
      where,
      include: {
        updatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    // Group settings by category for easier frontend consumption
    const groupedSettings = settings.reduce((acc: any, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        settings: groupedSettings,
        total: settings.length,
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/settings:
 *   post:
 *     summary: Create a new platform setting
 *     description: Create a new platform setting (admin only)
 *     tags: [Admin Settings]
 *     security:
 *       - BearerAuth: []
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
 *               value:
 *                 oneOf:
 *                   - type: string
 *                   - type: number
 *                   - type: boolean
 *                   - type: object
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 default: general
 *     responses:
 *       201:
 *         description: Setting created successfully
 *       400:
 *         description: Invalid input or setting already exists
 *       403:
 *         description: Admin access required
 */
router.post(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { key, value, description, category = "general" } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      throw new AppError("Admin user ID is required", 400);
    }

    if (!key || value === undefined) {
      throw new AppError("Key and value are required", 400);
    }

    // Check if setting already exists
    const existingSetting = await prisma.platformSettings.findUnique({
      where: { key },
    });

    if (existingSetting) {
      throw new AppError(`Setting with key '${key}' already exists`, 400);
    }

    // Validate the value
    const validationResult = validateSettingValue(key, value);
    if (!validationResult.isValid) {
      throw new AppError(validationResult.message, 400);
    }

    const newSetting = await prisma.platformSettings.create({
      data: {
        key,
        value,
        description,
        category,
        updatedBy: adminId,
      },
      include: {
        updatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: newSetting,
      message: `Setting '${key}' created successfully`,
    });
  })
);

/**
 * @swagger
 * /api/admin/settings/category/{category}:
 *   get:
 *     summary: Get settings by category
 *     description: Get all settings for a specific category
 *     tags: [Admin Settings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get(
  "/category/:category",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { category } = req.params;

    const settings = await prisma.platformSettings.findMany({
      where: {
        category,
        isActive: true,
      },
      include: {
        updatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { key: "asc" },
    });

    res.status(200).json({
      success: true,
      data: {
        category,
        settings,
        count: settings.length,
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/settings/{key}:
 *   get:
 *     summary: Get a specific setting by key
 *     description: Get details of a specific platform setting
 *     tags: [Admin Settings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Setting retrieved successfully
 *       404:
 *         description: Setting not found
 *       403:
 *         description: Admin access required
 */
router.get(
  "/:key",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { key } = req.params;

    const setting = await prisma.platformSettings.findUnique({
      where: { key },
      include: {
        updatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!setting) {
      throw new AppError(`Setting with key '${key}' not found`, 404);
    }

    if (!setting.isActive) {
      throw new AppError(`Setting with key '${key}' is inactive`, 404);
    }

    res.status(200).json({
      success: true,
      data: setting,
    });
  })
);

/**
 * @swagger
 * /api/admin/settings/{key}:
 *   put:
 *     summary: Update a platform setting
 *     description: Update the value of a platform setting
 *     tags: [Admin Settings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
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
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Setting updated successfully
 *       400:
 *         description: Invalid value
 *       404:
 *         description: Setting not found
 *       403:
 *         description: Admin access required
 */
router.put(
  "/:key",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { key } = req.params;
    const { value, description } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      throw new AppError("Admin user ID is required", 400);
    }

    // Validate the setting exists
    const existingSetting = await prisma.platformSettings.findUnique({
      where: { key },
    });

    if (!existingSetting) {
      throw new AppError(`Setting with key '${key}' not found`, 404);
    }

    // Validate value based on setting type
    const validationResult = validateSettingValue(key, value);
    if (!validationResult.isValid) {
      throw new AppError(validationResult.message, 400);
    }

    // Store old value for audit log
    const oldValue = existingSetting.value;

    // Update the setting
    const updatedSetting = await prisma.platformSettings.update({
      where: { key },
      data: {
        value,
        description: description || existingSetting.description,
        updatedBy: adminId,
        updatedAt: new Date(),
      },
      include: {
        updatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Log the change for audit trail
    await logSettingUpdate(
      adminId,
      key,
      oldValue,
      value,
      existingSetting.description || ""
    );

    res.status(200).json({
      success: true,
      data: updatedSetting,
      message: `Setting '${key}' updated successfully`,
    });
  })
);

export default router;
