import express, { Request, Response } from "express";
import { prisma } from "@/config/database";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import * as emailService from "@/services/email";
import {
  logRealtorApproval,
  logRealtorRejection,
  logRealtorSuspension,
} from "@/services/auditLogger";
import { createAdminNotification } from "@/services/notificationService";
import { logger } from "@/utils/logger";
import jwt from "jsonwebtoken";
import { config } from "@/config";
import { sendCacApprovalEmail, sendCacRejectionEmail } from "@/services/email";
import { getDashboardUrl } from "@/utils/domains";

const router = express.Router();

/**
 * @swagger
 * /api/admin/realtors:
 *   get:
 *     summary: Get all realtors (admin)
 *     description: Get paginated list of all realtors with filtering and search options
 *     tags: [Admin - Realtor Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, SUSPENDED]
 *         description: Filter by realtor status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by business name, email, or realtor name
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 20
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Realtors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     realtors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           businessName:
 *                             type: string
 *                           status:
 *                             type: string
 *                           isActive:
 *                             type: boolean
 *                           user:
 *                             type: object
 *                             properties:
 *                               email:
 *                                 type: string
 *                               firstName:
 *                                 type: string
 *                               lastName:
 *                                 type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: number
 *                         totalPages:
 *                           type: number
 *                         totalCount:
 *                           type: number
 *                         hasNextPage:
 *                           type: boolean
 *                         hasPrevPage:
 *                           type: boolean
 *       403:
 *         description: Admin access required
 */
router.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { status, page = 1, limit = 20, search } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status && typeof status === "string") {
      where.status = status.toUpperCase();
    }

    if (search && typeof search === "string") {
      where.OR = [
        { businessName: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [realtors, total] = await Promise.all([
      prisma.realtor.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              properties: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.realtor.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      message: "Realtors retrieved successfully",
      data: {
        realtors,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount: total,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/realtors/{id}/status:
 *   patch:
 *     summary: Update realtor status (approve, reject, suspend, or reinstate)
 *     description: |
 *       Unified endpoint for managing realtor account status.
 *       - approve: Approve pending realtor account
 *       - reject: Reject realtor application with reason
 *       - suspend: Suspend account, deactivate properties, cancel bookings
 *       - reinstate: Reactivate suspended account
 *     tags: [Admin - Realtor Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Realtor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject, suspend, reinstate]
 *                 description: Status action to perform
 *               reason:
 *                 type: string
 *                 description: Reason (required for reject and suspend)
 *               notes:
 *                 type: string
 *                 description: Optional notes (for approve and reinstate)
 *           examples:
 *             approve:
 *               value:
 *                 action: approve
 *                 notes: Verified business registration
 *             reject:
 *               value:
 *                 action: reject
 *                 reason: Incomplete business documentation
 *             suspend:
 *               value:
 *                 action: suspend
 *                 reason: Suspicious activities detected
 *             reinstate:
 *               value:
 *                 action: reinstate
 *                 notes: Issues resolved, account cleared
 *     responses:
 *       200:
 *         description: Realtor status updated successfully
 *       400:
 *         description: Invalid action or missing required fields
 *       404:
 *         description: Realtor not found
 *       403:
 *         description: Admin access required
 */
router.patch(
  "/:id/status",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { action, reason, notes } = req.body;

    if (
      !action ||
      !["approve", "reject", "suspend", "reinstate"].includes(action)
    ) {
      throw new AppError(
        'Invalid action. Must be "approve", "reject", "suspend", or "reinstate"',
        400
      );
    }

    if ((action === "reject" || action === "suspend") && !reason) {
      throw new AppError(`Reason is required for ${action} action`, 400);
    }

    const realtor = await prisma.realtor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        properties: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!realtor) {
      throw new AppError("Realtor not found", 404);
    }

    let updatedRealtor;
    let message: string;
    let additionalData: any = {};

    switch (action) {
      case "approve":
        if (realtor.status === "APPROVED") {
          throw new AppError("Realtor is already approved", 400);
        }

        updatedRealtor = await prisma.realtor.update({
          where: { id },
          data: {
            status: "APPROVED",
            cacStatus: "APPROVED",
            cacVerifiedAt: new Date(),
            cacRejectedAt: null,
            cacRejectionReason: null,
            canAppeal: true,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        try {
          const dashboardUrl = getDashboardUrl(
            "realtor",
            updatedRealtor.slug,
            true,
            req.headers.host
          );
          await emailService.sendRealtorApproval(
            updatedRealtor.user.email,
            updatedRealtor.businessName,
            dashboardUrl
          );
        } catch (emailError) {
          logger.error("Failed to send approval email:", emailError);
        }

        try {
          await logRealtorApproval(
            req.user!.id,
            updatedRealtor.id,
            updatedRealtor.businessName,
            req
          );
        } catch (auditError) {
          logger.error("Failed to log realtor approval:", auditError);
        }

        message = "Realtor approved successfully";
        break;

      case "reject":
        if (realtor.status === "REJECTED") {
          throw new AppError("Realtor is already rejected", 400);
        }

        updatedRealtor = await prisma.realtor.update({
          where: { id },
          data: { status: "REJECTED" },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        try {
          await emailService.sendRealtorRejection(
            updatedRealtor.user.email,
            updatedRealtor.businessName,
            reason
          );
        } catch (emailError) {
          logger.error("Failed to send rejection email:", emailError);
        }

        try {
          await logRealtorRejection(
            req.user!.id,
            updatedRealtor.id,
            updatedRealtor.businessName,
            reason,
            req
          );
        } catch (auditError) {
          logger.error("Failed to log realtor rejection:", auditError);
        }

        message = "Realtor application rejected";
        break;

      case "suspend": {
        if (!realtor.isActive) {
          throw new AppError("Realtor is already suspended", 400);
        }

        const activeBookings = await prisma.booking.findMany({
          where: {
            property: { realtorId: id },
            status: { in: ["PENDING", "ACTIVE"] },
          },
          include: {
            guest: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            property: {
              select: { title: true },
            },
          },
        });

        updatedRealtor = await prisma.realtor.update({
          where: { id },
          data: {
            isActive: false,
            suspendedAt: new Date(),
            status: "SUSPENDED",
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        await prisma.property.updateMany({
          where: { realtorId: id },
          data: { isActive: false },
        });

        if (activeBookings.length > 0) {
          const bookingIds = activeBookings.map((booking) => booking.id);
          const { batchUpdateBookingStatus } = await import(
            "@/services/bookingStatus"
          );

          await batchUpdateBookingStatus(bookingIds, "CANCELLED", {
            adminId: req.user!.id,
            reason: `Booking suspended due to realtor account suspension: ${reason}`,
            skipValidation: true,
          });

          try {
            const { sendBookingSuspensionNotification } = await import(
              "@/services/email"
            );

            for (const booking of activeBookings) {
              await sendBookingSuspensionNotification(
                booking.guest.email,
                {
                  firstName: booking.guest.firstName,
                  lastName: booking.guest.lastName,
                },
                {
                  bookingId: booking.id,
                  propertyTitle: booking.property.title,
                  realtorBusinessName: realtor.businessName,
                  reason: "suspicious activities detected",
                }
              );
            }
          } catch (emailError) {
            logger.error(
              "Failed to send suspension notifications:",
              emailError
            );
          }
        }

        try {
          const { sendRealtorSuspension } = await import("@/services/email");
          await sendRealtorSuspension(
            realtor.user.email,
            realtor.businessName,
            reason
          );
        } catch (emailError) {
          logger.error("Failed to send realtor suspension email:", emailError);
        }

        try {
          await logRealtorSuspension(
            req.user!.id,
            realtor.id,
            realtor.businessName,
            reason,
            req
          );
        } catch (auditError) {
          logger.error("Failed to log realtor suspension:", auditError);
        }

        message = "Realtor suspended and bookings cancelled successfully";
        additionalData = {
          suspendedBookings: activeBookings.length,
          affectedProperties: realtor.properties.length,
          notificationsSent: activeBookings.length,
        };
        break;
      }

      case "reinstate": {
        if (realtor.isActive) {
          throw new AppError("Realtor is already active", 400);
        }

        updatedRealtor = await prisma.realtor.update({
          where: { id },
          data: {
            isActive: true,
            suspendedAt: null,
            status: "APPROVED",
            cacStatus: "APPROVED",
            cacVerifiedAt: new Date(),
            cacRejectedAt: null,
            cacRejectionReason: null,
            canAppeal: true,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        const reactivatedCount = await prisma.property.updateMany({
          where: { realtorId: id, isActive: false },
          data: { isActive: true },
        });

        try {
          const { sendRealtorApproval } = await import("@/services/email");
          const dashboardUrl = getDashboardUrl(
            "realtor",
            realtor.slug,
            true,
            req.headers.host
          );
          await sendRealtorApproval(
            realtor.user.email,
            realtor.businessName,
            dashboardUrl
          );
        } catch (emailError) {
          logger.error(
            "Failed to send realtor reinstatement email:",
            emailError
          );
        }

        try {
          await logRealtorApproval(
            req.user!.id,
            realtor.id,
            realtor.businessName,
            req
          );
        } catch (auditError) {
          logger.error("Failed to log realtor reinstatement:", auditError);
        }

        try {
          await createAdminNotification({
            type: "REALTOR_REINSTATED",
            title: `Realtor reinstated: ${realtor.businessName}`,
            message: `${
              realtor.businessName
            } has been reinstated by an admin. ${notes || ""}`,
            data: { realtorId: id, realtorName: realtor.businessName },
          });
        } catch (notificationError) {
          logger.error(
            "Failed to create admin notification:",
            notificationError
          );
        }

        message = "Realtor reinstated successfully";
        additionalData = {
          reactivatedProperties: reactivatedCount.count,
        };
        break;
      }

      default:
        throw new AppError("Invalid action", 400);
    }

    res.json({
      success: true,
      message,
      data: {
        realtor: updatedRealtor,
        ...additionalData,
      },
    });
  })
);

/**
 * @swagger
 * /api/admin/realtors/batch-suspend-bookings:
 *   put:
 *     summary: Batch suspend bookings for realtor suspension
 *     description: Suspend all active bookings when a realtor is suspended
 *     tags: [Admin - Realtor Management]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - realtorId
 *               - reason
 *             properties:
 *               realtorId:
 *                 type: string
 *                 description: Realtor ID whose bookings to suspend
 *               reason:
 *                 type: string
 *                 description: Reason for suspension
 *     responses:
 *       200:
 *         description: Bookings suspended successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     successful:
 *                       type: array
 *                     failed:
 *                       type: array
 *                     suspendedBookings:
 *                       type: number
 *                     notificationsSent:
 *                       type: number
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Realtor not found
 */
router.put(
  "/batch-suspend-bookings",
  asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      const { realtorId, reason } = req.body;

      if (!realtorId || !reason) {
        throw new AppError("Realtor ID and reason are required", 400);
      }

      const realtor = await prisma.realtor.findUnique({
        where: { id: realtorId },
        select: {
          id: true,
          businessName: true,
          isActive: true,
        },
      });

      if (!realtor) {
        throw new AppError("Realtor not found", 404);
      }

      const activeBookings = await prisma.booking.findMany({
        where: {
          property: {
            realtorId,
          },
          status: {
            in: ["PENDING", "ACTIVE"],
          },
        },
        include: {
          guest: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          property: {
            select: {
              title: true,
            },
          },
        },
      });

      if (activeBookings.length === 0) {
        res.json({
          success: true,
          message: "No active bookings found for this realtor",
          data: {
            suspendedBookings: 0,
            notificationsSent: 0,
          },
        });
        return;
      }

      const bookingIds = activeBookings.map((booking) => booking.id);

      const { batchUpdateBookingStatus } = await import(
        "@/services/bookingStatus"
      );

      const result = await batchUpdateBookingStatus(bookingIds, "CANCELLED", {
        adminId: req.user!.id,
        reason: `Realtor suspension: ${reason}`,
        skipValidation: true,
      });

      let notificationsSent = 0;
      try {
        const { sendBookingSuspensionNotification } = await import(
          "@/services/email"
        );

        for (const booking of activeBookings) {
          try {
            await sendBookingSuspensionNotification(
              booking.guest.email,
              {
                firstName: booking.guest.firstName,
                lastName: booking.guest.lastName,
              },
              {
                bookingId: booking.id,
                propertyTitle: booking.property.title,
                realtorBusinessName: realtor.businessName,
                reason: "suspicious activities detected from the property host",
              }
            );
            notificationsSent++;
          } catch (emailError) {
            logger.error(
              `Failed to notify guest ${booking.guest.email}:`,
              emailError
            );
          }
        }
      } catch (emailError) {
        logger.error("Failed to send suspension notifications:", emailError);
      }

      res.json({
        success: true,
        message: `Successfully suspended ${result.successful.length} bookings and notified ${notificationsSent} guests`,
        data: {
          successful: result.successful,
          failed: result.failed,
          suspendedBookings: result.successful.length,
          notificationsSent,
          realtorBusinessName: realtor.businessName,
        },
      });
    }
  )
);

/**
 * @swagger
 * /api/admin/realtors/:realtorId/cac:
 *   patch:
 *     summary: Approve or reject realtor CAC verification
 *     description: |
 *       Admin endpoint to approve or reject CAC verification for a realtor.
 *       - On approval: Updates CAC status to APPROVED and sends approval email
 *       - On rejection: Generates appeal token, updates status to REJECTED, sends rejection email with appeal link
 *     tags: [Admin - Realtor Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: realtorId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the realtor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 description: Action to perform on CAC verification
 *               reason:
 *                 type: string
 *                 description: Reason for rejection (required when action is reject)
 *           examples:
 *             approve:
 *               value:
 *                 action: approve
 *             reject:
 *               value:
 *                 action: reject
 *                 reason: Invalid CAC document format
 *     responses:
 *       200:
 *         description: CAC verification processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request or realtor not pending verification
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Realtor not found
 */
router.patch(
  "/:realtorId/cac",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { realtorId } = req.params;
    const { action, reason } = req.body;

    // Validate admin user
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    // Validate action
    if (!["approve", "reject"].includes(action)) {
      throw new AppError('Invalid action. Must be "approve" or "reject"', 400);
    }

    // If rejecting, reason is required
    if (action === "reject" && !reason) {
      throw new AppError(
        "Rejection reason is required when rejecting CAC",
        400
      );
    }

    // Fetch the realtor with user details
    const realtor = await prisma.realtor.findUnique({
      where: { id: realtorId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            fullName: true,
          },
        },
      },
    });

    if (!realtor) {
      throw new AppError("Realtor not found", 404);
    }

    // Check if CAC is pending
    if (realtor.cacStatus !== "PENDING") {
      throw new AppError(
        `CAC is not pending verification. Current status: ${realtor.cacStatus}`,
        400
      );
    }

    let updatedRealtor;
    let message: string;

    if (action === "approve") {
      // Approve CAC
      updatedRealtor = await prisma.realtor.update({
        where: { id: realtorId },
        data: {
          cacStatus: "APPROVED",
          cacVerifiedAt: new Date(),
          cacRejectedAt: null,
          cacRejectionReason: null,
          canAppeal: true,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              fullName: true,
            },
          },
        },
      });

      // Send approval email
      try {
        const dashboardUrl = getDashboardUrl(
          "realtor",
          realtor.slug,
          true,
          req.headers.host
        );
        await sendCacApprovalEmail(
          realtor.user.email,
          realtor.user.firstName || "there",
          realtor.businessName || "Business",
          dashboardUrl
        );
        logger.info(`CAC approval email sent to ${realtor.user.email}`);
      } catch (emailError) {
        logger.error("Failed to send CAC approval email", emailError);
      }

      message = "CAC approved successfully";
    } else {
      // Reject CAC - Generate appeal token
      const appealToken = jwt.sign(
        { realtorId: realtor.id, purpose: "cac-appeal" },
        config.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Generate appeal URL
      const appealUrl =
        config.NODE_ENV === "development"
          ? `http://localhost:5050/api/realtor/cac/appeal/${appealToken}`
          : `https://api.stayza.pro/api/realtor/cac/appeal/${appealToken}`;

      // Calculate suspension expiry (5 days from now)
      const suspensionExpiresAt = new Date();
      suspensionExpiresAt.setDate(suspensionExpiresAt.getDate() + 5);

      updatedRealtor = await prisma.realtor.update({
        where: { id: realtorId },
        data: {
          cacStatus: "REJECTED",
          cacRejectedAt: new Date(),
          cacRejectionReason: reason,
          suspendedAt: new Date(),
          suspensionExpiresAt: suspensionExpiresAt,
          canAppeal: true,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              fullName: true,
            },
          },
        },
      });

      // Send rejection email with appeal link
      try {
        await sendCacRejectionEmail(
          realtor.user.email,
          realtor.user.firstName || "there",
          realtor.businessName || "Business",
          reason,
          appealUrl
        );
        logger.info(`CAC rejection email sent to ${realtor.user.email}`);
      } catch (emailError) {
        logger.error("Failed to send CAC rejection email", emailError);
      }

      message = "CAC rejected successfully. Appeal link sent to realtor.";
    }

    // Create audit log using helper function
    try {
      if (action === "approve") {
        await logRealtorApproval(
          req.user.id,
          realtor.id,
          realtor.businessName || "Business",
          req as any
        );
      } else {
        await logRealtorRejection(
          req.user.id,
          realtor.id,
          realtor.businessName || "Business",
          reason,
          req as any
        );
      }
    } catch (auditError) {
      logger.error("Failed to create audit log", auditError);
    }

    res.status(200).json({
      success: true,
      message,
      data: updatedRealtor,
    });
  })
);

/**
 * @swagger
 * /api/admin/realtors/all:
 *   get:
 *     summary: Get all realtors with basic filtering (legacy endpoint)
 *     description: |
 *       Legacy endpoint for listing realtors. Provides basic filtering by status and CAC status.
 *       Note: For more advanced filtering and search, use GET /api/admin/realtors instead.
 *     tags: [Admin - Realtor Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *         description: Number of results per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, SUSPENDED]
 *         description: Filter by realtor status
 *       - in: query
 *         name: cacStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: Filter by CAC verification status
 *     responses:
 *       200:
 *         description: Realtors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     total:
 *                       type: number
 *                     pages:
 *                       type: number
 *       403:
 *         description: Admin access required
 */
router.get(
  "/all",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = "1", limit = "10", status, cacStatus } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (cacStatus) {
      where.cacStatus = cacStatus;
    }

    const [realtors, total] = await Promise.all([
      prisma.realtor.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              fullName: true,
              isEmailVerified: true,
              createdAt: true,
            },
          },
          properties: {
            select: {
              id: true,
              title: true,
              isActive: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.realtor.count({ where }),
    ]);

    res.json({
      success: true,
      data: realtors,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  })
);

export default router;
