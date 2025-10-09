import { Request, Response } from "express";
import { prisma } from "@/config/database";
import { AppError } from "@/middleware/errorHandler";
import { RefundRequestStatus, PaymentStatus } from "@prisma/client";
import NotificationService, {
  notificationHelpers,
} from "@/services/notificationService";

// Async handler utility
const asyncHandler = (fn: any) => (req: Request, res: Response, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Authenticated request interface
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

/**
 * @desc    Request a refund (Guest)
 * @route   POST /api/refunds/request
 * @access  Private (Guest only)
 */
export const requestRefund = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId, paymentId, requestedAmount, reason, customerNotes } =
      req.body;
    const user = req.user!;

    // Validate guest can only request refunds for their own bookings
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        guestId: user.id,
      },
      include: {
        payment: true,
        property: {
          include: {
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
    if (booking.payment.status !== "COMPLETED") {
      throw new AppError("Can only refund completed payments", 400);
    }

    // Check if refund amount is valid
    const currentRefundAmount = Number(booking.payment.refundAmount || 0);
    const availableForRefund =
      Number(booking.payment.amount) - currentRefundAmount;

    if (requestedAmount > availableForRefund) {
      throw new AppError(
        `Refund amount cannot exceed available balance of ${booking.currency} ${availableForRefund}`,
        400
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
        400
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
      const notificationService = NotificationService.getInstance();
      await notificationService.createAndSendNotification({
        userId: booking.property.realtor.userId,
        type: "REFUND_REQUEST",
        title: "New Refund Request",
        message: `${refundRequest.requester.firstName} ${refundRequest.requester.lastName} requested a refund of ${refundRequest.currency} ${refundRequest.requestedAmount} for "${refundRequest.booking.property.title}"`,
        bookingId,
        paymentId,
        priority: "high",
      });
    } catch (notificationError) {
      console.error(
        "Failed to send refund request notification:",
        notificationError
      );
    }

    res.status(201).json({
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
  }
);

/**
 * @desc    Get refund requests for realtor review
 * @route   GET /api/refunds/realtor/pending
 * @access  Private (Realtor only)
 */
export const getRealtorRefundRequests = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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

    res.json({
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
  }
);

/**
 * @desc    Approve or reject refund request (Realtor)
 * @route   PATCH /api/refunds/:id/realtor-decision
 * @access  Private (Realtor only)
 */
export const realtorDecision = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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
        404
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
      const notificationService = NotificationService.getInstance();
      const message = approved
        ? `Your refund request for "${refundRequest.booking.property.title}" has been approved by the realtor and is now pending admin processing.`
        : `Your refund request for "${refundRequest.booking.property.title}" has been rejected by the realtor. Reason: ${realtorReason}`;

      await notificationService.createAndSendNotification({
        userId: refundRequest.requestedBy,
        type: approved
          ? "REFUND_APPROVED_BY_REALTOR"
          : "REFUND_REJECTED_BY_REALTOR",
        title: approved ? "Refund Request Approved" : "Refund Request Rejected",
        message,
        bookingId: refundRequest.bookingId,
        paymentId: refundRequest.paymentId,
        priority: "high",
      });

      // If approved, notify admins
      if (approved) {
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN" },
          select: { id: true },
        });

        for (const admin of admins) {
          await notificationService.createAndSendNotification({
            userId: admin.id,
            type: "REFUND_PENDING_ADMIN_APPROVAL",
            title: "Refund Request Pending Admin Processing",
            message: `A refund request for ${refundRequest.currency} ${refundRequest.requestedAmount} has been approved by the realtor and is pending your processing.`,
            bookingId: refundRequest.bookingId,
            paymentId: refundRequest.paymentId,
            priority: "normal",
          });
        }
      }
    } catch (notificationError) {
      console.error(
        "Failed to send refund decision notification:",
        notificationError
      );
    }

    res.json({
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
  }
);

/**
 * @desc    Get refund requests for admin processing
 * @route   GET /api/refunds/admin/pending
 * @access  Private (Admin only)
 */
export const getAdminRefundRequests = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 10, status } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // Filter by status if provided
    if (status) {
      where.status = status as RefundRequestStatus;
    } else {
      // Default to approved requests pending admin processing
      where.status = "REALTOR_APPROVED";
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
            },
          },
        },
        orderBy: {
          realtorApprovedAt: "asc", // Process oldest approved requests first
        },
        skip,
        take: limitNum,
      }),
      prisma.refundRequest.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      message: "Admin refund requests retrieved successfully",
      data: refundRequests,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount: total,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  }
);

/**
 * @desc    Process refund (Admin final step)
 * @route   POST /api/refunds/:id/process
 * @access  Private (Admin only)
 */
export const processRefund = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { actualRefundAmount, adminNotes } = req.body;
    const user = req.user!;

    const refundRequest = await prisma.refundRequest.findFirst({
      where: {
        id,
        status: "REALTOR_APPROVED",
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
        payment: true,
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
        "Refund request not found or not ready for processing",
        404
      );
    }

    const finalAmount =
      actualRefundAmount || Number(refundRequest.requestedAmount);
    const currentRefundAmount = Number(refundRequest.payment.refundAmount || 0);
    const availableForRefund =
      Number(refundRequest.payment.amount) - currentRefundAmount;

    if (finalAmount > availableForRefund) {
      throw new AppError(
        `Refund amount cannot exceed available balance of ${refundRequest.currency} ${availableForRefund}`,
        400
      );
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Update payment record
        const newRefundAmount = currentRefundAmount + finalAmount;
        const isFullyRefunded = newRefundAmount >= refundRequest.payment.amount;

        await tx.payment.update({
          where: { id: refundRequest.paymentId },
          data: {
            refundAmount: newRefundAmount,
            refundedAt: new Date(),
            status: isFullyRefunded
              ? PaymentStatus.REFUNDED
              : PaymentStatus.REFUNDED, // Use REFUNDED for now, add PARTIALLY_REFUNDED to enum if needed
            metadata: {
              ...((refundRequest.payment.metadata as any) || {}),
              refunds: [
                ...((refundRequest.payment.metadata as any)?.refunds || []),
                {
                  refundRequestId: refundRequest.id,
                  amount: finalAmount,
                  processedBy: user.id,
                  processedAt: new Date().toISOString(),
                  reason: refundRequest.reason,
                },
              ],
            } as any,
          },
        });

        // Update refund request
        await tx.refundRequest.update({
          where: { id },
          data: {
            status: "COMPLETED",
            adminId: user.id,
            adminProcessedAt: new Date(),
            adminNotes,
            actualRefundAmount: finalAmount,
            completedAt: new Date(),
            providerRefundId: `refund_${Date.now()}`, // In production, this would come from payment provider
          },
        });
      });

      // Send notification to guest
      try {
        const notificationService = NotificationService.getInstance();
        await notificationService.createAndSendNotification({
          userId: refundRequest.requestedBy,
          type: "REFUND_PROCESSED",
          title: "Refund Processed",
          message: `Your refund of ${refundRequest.currency} ${finalAmount} for "${refundRequest.booking.property.title}" has been processed successfully. The funds should appear in your account within 3-7 business days.`,
          bookingId: refundRequest.bookingId,
          paymentId: refundRequest.paymentId,
          priority: "high",
        });
      } catch (notificationError) {
        console.error(
          "Failed to send refund processed notification:",
          notificationError
        );
      }

      res.json({
        success: true,
        message: "Refund processed successfully",
        data: {
          refundRequestId: refundRequest.id,
          actualRefundAmount: finalAmount,
          currency: refundRequest.currency,
          processedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Refund processing error:", error);
      throw new AppError("Failed to process refund", 500);
    }
  }
);

/**
 * @desc    Get refund request details
 * @route   GET /api/refunds/:id
 * @access  Private (Guest, Realtor, Admin based on ownership)
 */
export const getRefundRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
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

    res.json({
      success: true,
      message: "Refund request details retrieved successfully",
      data: refundRequest,
    });
  }
);

export default {
  requestRefund,
  getRealtorRefundRequests,
  realtorDecision,
  getAdminRefundRequests,
  processRefund,
  getRefundRequest,
};
