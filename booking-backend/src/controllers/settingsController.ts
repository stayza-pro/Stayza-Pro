import { Request, Response } from "express";
import { prisma } from "@/config/database";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { logSettingUpdate } from "@/services/auditLogger";

/**
 * @desc    Get all platform settings
 * @route   GET /api/admin/settings
 * @access  Private (Admin only)
 */
export const getAllSettings = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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
  }
);

/**
 * @desc    Get a specific setting by key
 * @route   GET /api/admin/settings/:key
 * @access  Private (Admin only)
 */
export const getSettingByKey = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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
  }
);

/**
 * @desc    Update a platform setting
 * @route   PUT /api/admin/settings/:key
 * @access  Private (Admin only)
 */
export const updateSetting = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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
  }
);

/**
 * @desc    Get settings by category
 * @route   GET /api/admin/settings/category/:category
 * @access  Private (Admin only)
 */
export const getSettingsByCategory = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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
  }
);

/**
 * @desc    Create a new platform setting
 * @route   POST /api/admin/settings
 * @access  Private (Admin only)
 */
export const createSetting = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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
  }
);

/**
 * Validate setting values based on their key/type
 */
function validateSettingValue(
  key: string,
  value: any
): { isValid: boolean; message: string } {
  switch (key) {
    case "commission_rate":
      if (typeof value !== "number" || value < 0.01 || value > 0.15) {
        return {
          isValid: false,
          message:
            "Commission rate must be a number between 0.01 (1%) and 0.15 (15%)",
        };
      }
      break;

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
