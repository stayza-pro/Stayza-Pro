import express, { Response } from "express";
import { prisma } from "@/config/database";
import { logger } from "@/utils/logger";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { authenticate, authorize } from "@/middleware/auth";
import { RefundRequestStatus, PaymentStatus } from "@prisma/client";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/refunds/request:
 *   post:
 *     summary: Request a refund (Guest)
 *     tags: [Refunds]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - paymentId
 *               - requestedAmount
 *               - reason
 *             properties:
 *               bookingId:
 *                 type: string
 *               paymentId:
 *                 type: string
 *               requestedAmount:
 *                 type: number
 *               reason:
 *                 type: string
 *               customerNotes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Refund request submitted successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Booking or payment not found
 */
router.post(
  "/request",
  authorize("GUEST"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId, paymentId, requestedAmount, reason, customerNotes } =
      req.body;
    const user = req.user!;

    // Validate guest can only request refunds for their own bookings
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        guestId: user.id,
      },
      select: {
        id: true,
        guestId: true,
        currency: true,
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
            refundAmount: true,
          },
        },
        property: {
          select: {
            realtor: true,
          },
        },
      },
    });

    if (!booking) {
      throw new AppError("Booking not found or unauthorized", 404);
    }

    if (!booking.payment || booking.payment.id !== paymentId) {
      throw new AppError("Payment not found for this booking", 404);
    }

    // Check if payment is completed and refundable
    if (booking.payment.status !== "HELD") {
      throw new AppError("Can only refund completed payments", 400);
    }

    // Check if refund amount is valid
    const currentRefundAmount = Number(booking.payment.refundAmount ?? 0);
    const availableForRefund =
      Number(booking.payment.amount) - currentRefundAmount;

    if (requestedAmount > availableForRefund) {
      throw new AppError(
        `Refund amount cannot exceed available balance of ${booking.currency} ${availableForRefund}`,
        400,
      );
    }

    // Check if there's already a pending refund request
    const existingRequest = await prisma.refundRequest.findFirst({
      where: {
        bookingId,
        status: {
          in: [
            "PENDING_REALTOR_APPROVAL",
            "REALTOR_APPROVED",
            "ADMIN_PROCESSING",
          ],
        },
      },
    });

    if (existingRequest) {
      throw new AppError(
        "There is already a pending refund request for this booking",
        400,
      );
    }

    // Create refund request
    const refundRequest = await prisma.refundRequest.create({
      data: {
        bookingId,
        paymentId,
        requestedBy: user.id,
        requestedAmount,
        currency: booking.currency,
        reason,
        customerNotes,
        realtorId: booking.property.realtor.id,
      },
      include: {
        booking: {
          include: {
            property: {
              select: {
                title: true,
              },
            },
          },
        },
        requester: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Send notification to realtor
    try {
      await prisma.notification.create({
        data: {
          userId: booking.property.realtor.userId,
          type: "SYSTEM_ALERT",
          title: "New Refund Request",
          message: `${refundRequest.requester.firstName} ${refundRequest.requester.lastName} requested a refund of ${refundRequest.currency} ${refundRequest.requestedAmount} for "${refundRequest.booking.property.title}"`,
        },
      });
    } catch (notificationError) {
      logger.error(
        "Failed to send refund request notification:",
        notificationError,
      );
    }

    return res.status(201).json({
      success: true,
      message: "Refund request submitted successfully",
      data: {
        id: refundRequest.id,
        status: refundRequest.status,
        requestedAmount: refundRequest.requestedAmount,
        currency: refundRequest.currency,
        reason: refundRequest.reason,
        createdAt: refundRequest.createdAt,
      },
    });
  }),
);

/**
 * @swagger
 * /api/refunds/realtor/pending:
 *   get:
 *     summary: Get refund requests for realtor review
 *     tags: [Refunds]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING_REALTOR_APPROVAL, REALTOR_APPROVED, REALTOR_REJECTED, ADMIN_PROCESSING, COMPLETED, FAILED]
 *     responses:
 *       200:
 *         description: Refund requests retrieved successfully
 *       404:
 *         description: Realtor profile not found
 */
router.get(
  "/realtor/pending",
  authorize("REALTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const { page = 1, limit = 10, status } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get realtor record
    const realtor = await prisma.realtor.findUnique({
      where: { userId: user.id },
    });

    if (!realtor) {
      throw new AppError("Realtor profile not found", 404);
    }

    const where: any = {
      realtorId: realtor.id,
    };

    // Filter by status if provided
    if (status) {
      where.status = status as RefundRequestStatus;
    }

    const [refundRequests, total] = await Promise.all([
      prisma.refundRequest.findMany({
        where,
        include: {
          booking: {
            include: {
              property: {
                select: {
                  title: true,
                },
              },
            },
          },
          payment: {
            select: {
              amount: true,
              currency: true,
              refundAmount: true,
            },
          },
          requester: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limitNum,
      }),
      prisma.refundRequest.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.json({
      success: true,
      message: "Refund requests retrieved successfully",
      data: refundRequests,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount: total,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  }),
);

/**
 * @swagger
 * /api/refunds/{id}/realtor-decision:
 *   patch:
 *     summary: Approve or reject refund request (Realtor)
 *     tags: [Refunds]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - approved
 *             properties:
 *               approved:
 *                 type: boolean
 *               realtorReason:
 *                 type: string
 *               realtorNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund decision processed successfully
 *       404:
 *         description: Refund request not found
 */
router.patch(
  "/:id/realtor-decision",
  authorize("REALTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { approved, realtorReason, realtorNotes } = req.body;
    const user = req.user!;

    // Get realtor record
    const realtor = await prisma.realtor.findUnique({
      where: { userId: user.id },
    });

    if (!realtor) {
      throw new AppError("Realtor profile not found", 404);
    }

    const refundRequest = await prisma.refundRequest.findFirst({
      where: {
        id,
        realtorId: realtor.id,
        status: "PENDING_REALTOR_APPROVAL",
      },
      include: {
        booking: {
          include: {
            property: {
              select: {
                title: true,
              },
            },
          },
        },
        requester: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!refundRequest) {
      throw new AppError(
        "Refund request not found or not pending approval",
        404,
      );
    }

    const newStatus: RefundRequestStatus = approved
      ? "REALTOR_APPROVED"
      : "REALTOR_REJECTED";

    // Update refund request
    const updatedRequest = await prisma.refundRequest.update({
      where: { id },
      data: {
        status: newStatus,
        realtorApprovedAt: new Date(),
        realtorReason,
        realtorNotes,
      },
    });

    // Send notification to guest
    try {
      const message = approved
        ? `Your refund request for "${refundRequest.booking.property.title}" has been approved by the realtor and is now pending admin processing.`
        : `Your refund request for "${refundRequest.booking.property.title}" has been rejected by the realtor. Reason: ${realtorReason}`;

      await prisma.notification.create({
        data: {
          userId: refundRequest.requestedBy,
          type: "SYSTEM_ALERT",
          title: approved
            ? "Refund Request Approved"
            : "Refund Request Rejected",
          message,
        },
      });

      // If approved, notify admins
      if (approved) {
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN" },
          select: { id: true },
        });

        for (const admin of admins) {
          await prisma.notification.create({
            data: {
              userId: admin.id,
              type: "SYSTEM_ALERT",
              title: "Refund Request Pending Admin Processing",
              message: `A refund request for ${refundRequest.currency} ${refundRequest.requestedAmount} has been approved by the realtor and is pending your processing.`,
            },
          });
        }
      }
    } catch (notificationError) {
      logger.error(
        "Failed to send refund decision notification:",
        notificationError,
      );
    }

    return res.json({
      success: true,
      message: `Refund request ${
        approved ? "approved" : "rejected"
      } successfully`,
      data: {
        id: updatedRequest.id,
        status: updatedRequest.status,
        realtorReason: updatedRequest.realtorReason,
        realtorApprovedAt: updatedRequest.realtorApprovedAt,
      },
    });
  }),
);

/**
 * @swagger
 * /api/refunds/{id}:
 *   get:
 *     summary: Get refund request details
 *     tags: [Refunds]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Refund request details retrieved successfully
 *       403:
 *         description: Unauthorized to view this refund request
 *       404:
 *         description: Refund request not found
 */
router.get(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user = req.user!;

    const refundRequest = await prisma.refundRequest.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            property: {
              select: {
                title: true,
                realtorId: true,
              },
            },
          },
        },
        payment: {
          select: {
            amount: true,
            currency: true,
            refundAmount: true,
            method: true,
          },
        },
        requester: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        realtor: {
          select: {
            businessName: true,
            userId: true,
          },
        },
        admin: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!refundRequest) {
      throw new AppError("Refund request not found", 404);
    }

    // Check authorization
    const canView =
      user.role === "ADMIN" ||
      refundRequest.requestedBy === user.id ||
      (user.role === "REALTOR" && refundRequest.realtor?.userId === user.id);

    if (!canView) {
      throw new AppError("Unauthorized to view this refund request", 403);
    }

    return res.json({
      success: true,
      message: "Refund request details retrieved successfully",
      data: refundRequest,
    });
  }),
);

export default router;
