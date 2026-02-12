import express, { Response } from "express";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { prisma } from "@/config/database";
import { authenticate } from "@/middleware/auth";
import {
  addHours,
  isPast,
  isFuture,
  differenceInMilliseconds,
} from "date-fns";

const router = express.Router();

interface FundStatus {
  status: string;
  amount: number;
  realtorAmount?: number;
  platformAmount?: number;
  releasedAt?: string;
  refundedAt?: string;
}

interface TimerStatus {
  date: string;
  isPast: boolean;
  remainingMs: number;
}

interface DisputeInfo {
  hasDispute: boolean;
  disputeId?: string;
  status?: string;
  openedAt?: string;
  resolvedAt?: string;
}

interface EscrowStatus {
  bookingId: string;
  funds: {
    roomFee: FundStatus;
    cleaningFee: FundStatus;
    securityDeposit: FundStatus;
    serviceFee: FundStatus;
    platformFee: FundStatus;
  };
  timers: {
    checkInWindow: TimerStatus;
    roomFeeRelease: TimerStatus;
    depositRefund: TimerStatus;
    disputeWindow: TimerStatus;
  };
  dispute: DisputeInfo;
  events: Array<{
    id: string;
    type: string;
    description: string;
    amount?: number;
    createdAt: string;
  }>;
}

/**
 * @swagger
 * /api/escrow/{bookingId}:
 *   get:
 *     summary: Get escrow status for a booking
 *     description: Returns detailed escrow fund breakdown, release schedules, and timers
 *     tags: [Escrow]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Escrow status retrieved successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Booking not found
 */
router.get(
  "/:bookingId",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId } = req.params;
    const userId = req.user!.id;

    // Fetch booking with all required data
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        property: {
          include: {
            realtor: {
              select: {
                id: true,
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    // Check authorization - guest or realtor only
    const isGuest = booking.guestId === userId;
    const isRealtor = booking.property.realtor.userId === userId;

    if (!isGuest && !isRealtor) {
      throw new AppError("Not authorized to view this escrow status", 403);
    }

    if (!booking.payment) {
      throw new AppError("No payment found for this booking", 404);
    }

    // Calculate fee fields from persisted snapshots (no inferred percentages)
    const roomFee =
      Number(booking.payment.roomFeeAmount) > 0
        ? Number(booking.payment.roomFeeAmount)
        : Number(booking.roomFee) > 0
        ? Number(booking.roomFee)
        : 0;

    const cleaningFee =
      Number(booking.payment.cleaningFeeAmount) > 0
        ? Number(booking.payment.cleaningFeeAmount)
        : Number(booking.cleaningFee) > 0
        ? Number(booking.cleaningFee)
        : 0;

    const securityDeposit =
      Number(booking.payment.securityDepositAmount) > 0
        ? Number(booking.payment.securityDepositAmount)
        : Number(booking.securityDeposit) > 0
        ? Number(booking.securityDeposit)
        : 0;

    const serviceFee = Number(
      booking.payment.serviceFeeAmount ?? booking.serviceFee ?? 0
    );

    const effectiveRate = Math.min(
      Math.max(
        Number(
          booking.payment.commissionEffectiveRate ??
            booking.commissionEffectiveRate ??
            0
        ),
        0
      ),
      1
    );

    const roomFeePlatformAmount = Number(
      booking.payment.roomFeeSplitPlatformAmount ??
        booking.payment.platformFeeAmount ??
        booking.platformFee ??
        roomFee * effectiveRate
    );

    const roomFeeRealtorAmount = Number(
      booking.payment.roomFeeSplitRealtorAmount ??
        roomFee - roomFeePlatformAmount
    );

    // Calculate timers
    const checkInDate = new Date(booking.checkInDate);
    const checkOutDate = new Date(booking.checkOutDate);
    const now = new Date();

    // 1 hour after check-in for room fee release
    const roomFeeReleaseTime = booking.roomFeeReleaseEligibleAt
      ? new Date(booking.roomFeeReleaseEligibleAt)
      : addHours(checkInDate, 1);

    // 48 hours after check-out for security deposit refund
    const depositRefundTime = booking.depositRefundEligibleAt
      ? new Date(booking.depositRefundEligibleAt)
      : addHours(checkOutDate, 48);

    // Dispute window closes at same time as deposit refund
    const disputeWindowCloseTime = booking.disputeWindowClosesAt
      ? new Date(booking.disputeWindowClosesAt)
      : depositRefundTime;

    // Determine fund statuses based on actual persisted split states.
    const roomFeeStatus =
      booking.payment.roomFeeSplitDone || Boolean(booking.payment.roomFeeReleasedAt)
      ? "RELEASED"
      : booking.payment.roomFeeInEscrow
      ? "HELD"
      : "PENDING";

    const depositStatus = booking.payment.depositInEscrow
      ? "HELD"
      : booking.depositDeductionAmount && Number(booking.depositDeductionAmount) > 0
      ? "DEDUCTED"
      : booking.payment.depositRefunded
      ? "REFUNDED"
      : "RELEASED";

    // Fetch escrow events
    const escrowEvents = await prisma.escrowEvent.findMany({
      where: { bookingId },
      orderBy: { executedAt: "asc" },
      select: {
        id: true,
        eventType: true,
        amount: true,
        notes: true,
        executedAt: true,
      },
    });

    const response: EscrowStatus = {
      bookingId: booking.id,

      funds: {
        roomFee: {
          status: roomFeeStatus,
          amount: roomFee,
          realtorAmount: Number(roomFeeRealtorAmount.toFixed(2)),
          platformAmount: Number(roomFeePlatformAmount.toFixed(2)),
          releasedAt: booking.payment.roomFeeReleasedAt
            ? new Date(booking.payment.roomFeeReleasedAt).toISOString()
            : undefined,
        },
        cleaningFee: {
          status: booking.payment.cleaningFeeReleasedToRealtor
            ? "RELEASED"
            : "PENDING",
          amount: cleaningFee,
          releasedAt:
            booking.cleaningFeeReleasedAt || booking.payment.paidAt
              ? new Date(
                  booking.cleaningFeeReleasedAt ||
                    booking.payment.paidAt ||
                    new Date()
                ).toISOString()
              : undefined,
        },
        securityDeposit: {
          status: depositStatus,
          amount: securityDeposit,
          refundedAt: booking.payment.depositReleasedAt
            ? booking.payment.depositReleasedAt.toISOString()
            : undefined,
        },
        serviceFee: {
          status: booking.payment.serviceFeeCollectedByPlatform
            ? "COLLECTED"
            : "PENDING",
          amount: serviceFee,
        },
        platformFee: {
          status: roomFeeStatus === "RELEASED" ? "COLLECTED" : "HELD",
          amount: Number(roomFeePlatformAmount.toFixed(2)),
        },
      },

      timers: {
        checkInWindow: {
          date: checkInDate.toISOString(),
          isPast: isPast(checkInDate),
          remainingMs: isFuture(checkInDate)
            ? differenceInMilliseconds(checkInDate, now)
            : 0,
        },
        roomFeeRelease: {
          date: roomFeeReleaseTime.toISOString(),
          isPast: isPast(roomFeeReleaseTime),
          remainingMs: isFuture(roomFeeReleaseTime)
            ? differenceInMilliseconds(roomFeeReleaseTime, now)
            : 0,
        },
        depositRefund: {
          date: depositRefundTime.toISOString(),
          isPast: isPast(depositRefundTime),
          remainingMs: isFuture(depositRefundTime)
            ? differenceInMilliseconds(depositRefundTime, now)
            : 0,
        },
        disputeWindow: {
          date: disputeWindowCloseTime.toISOString(),
          isPast: isPast(disputeWindowCloseTime),
          remainingMs: isFuture(disputeWindowCloseTime)
            ? differenceInMilliseconds(disputeWindowCloseTime, now)
            : 0,
        },
      },

      dispute: {
        hasDispute: booking.userDisputeOpened || booking.realtorDisputeOpened,
        status: booking.guestDisputeTier || undefined,
      },

      events: escrowEvents.map((event) => ({
        id: event.id,
        type: event.eventType,
        description: event.notes || `${event.eventType} event`,
        amount: event.amount ? Number(event.amount) : undefined,
        createdAt: event.executedAt.toISOString(),
      })),
    };

    res.json({
      success: true,
      message: "Escrow status retrieved successfully",
      data: response,
    });
  })
);

export default router;
