import { prisma } from "@/config/database";
import { AppError } from "@/middleware/errorHandler";
import { logger } from "@/utils/logger";
import escrowService from "./escrowService";
import { StayStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Check-In Confirmation Service
 * Handles check-in confirmation logic with 3 methods:
 * 1. Guest confirms "I've entered the room"
 * 2. Realtor confirms guest checked in (after official check-in time)
 * 3. Auto-fallback 30 minutes after official check-in time
 */

export type CheckInConfirmationType =
  | "GUEST_CONFIRMED"
  | "REALTOR_CONFIRMED"
  | "AUTO_FALLBACK";

interface CheckInConfirmationResult {
  bookingId: string;
  checkinConfirmedAt: Date;
  confirmationType: CheckInConfirmationType;
  disputeWindowClosesAt: Date;
  roomFeeReleaseEligibleAt: Date;
}

/**
 * Validate if check-in can be confirmed
 */
export const validateCheckInEligibility = async (
  bookingId: string,
  confirmationType: CheckInConfirmationType
): Promise<void> => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: true,
      property: true,
    },
  });

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  // Check booking status
  if (booking.status !== "ACTIVE") {
    throw new AppError(
      `Cannot confirm check-in for booking with status: ${booking.status}`,
      400
    );
  }

  // Check if already checked in
  if (booking.checkinConfirmedAt) {
    throw new AppError("Check-in already confirmed", 400);
  }

  // Check payment status
  if (
    !booking.payment ||
    (booking.payment.status !== "PARTIALLY_RELEASED" &&
      booking.payment.status !== "SETTLED" &&
      booking.payment.status !== "HELD")
  ) {
    throw new AppError("Payment not completed or funds not in escrow", 400);
  }

  const now = new Date();
  const checkInDate = new Date(booking.checkInDate);

  // For REALTOR_CONFIRMED: Must be at or after official check-in time
  if (confirmationType === "REALTOR_CONFIRMED") {
    if (now < checkInDate) {
      throw new AppError(
        "Realtor cannot confirm check-in before official check-in time",
        400
      );
    }
  }

  // For AUTO_FALLBACK: Must be 30 minutes after check-in time
  if (confirmationType === "AUTO_FALLBACK") {
    const fallbackTime = new Date(checkInDate.getTime() + 30 * 60 * 1000); // +30 minutes
    if (now < fallbackTime) {
      throw new AppError(
        "Auto-fallback can only trigger 30 minutes after check-in time",
        400
      );
    }
  }

  // For GUEST_CONFIRMED: Can be done anytime after payment (no time restriction)
};

/**
 * Start guest dispute timer (1 hour after check-in confirmation)
 */
export const startGuestDisputeTimer = (
  checkinConfirmedAt: Date
): { disputeWindowClosesAt: Date; roomFeeReleaseEligibleAt: Date } => {
  const disputeWindowClosesAt = new Date(
    checkinConfirmedAt.getTime() + 60 * 60 * 1000
  ); // +1 hour
  const roomFeeReleaseEligibleAt = disputeWindowClosesAt; // Same time

  return { disputeWindowClosesAt, roomFeeReleaseEligibleAt };
};

/**
 * Confirm check-in for a booking
 */
export const confirmCheckIn = async (
  bookingId: string,
  confirmationType: CheckInConfirmationType,
  userId: string // Who is confirming (guest or realtor)
): Promise<CheckInConfirmationResult> => {
  // Validate eligibility
  await validateCheckInEligibility(bookingId, confirmationType);

  const now = new Date();
  const { disputeWindowClosesAt, roomFeeReleaseEligibleAt } =
    startGuestDisputeTimer(now);

  // Update booking with check-in confirmation
  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "ACTIVE", // BookingStatus remains ACTIVE
      stayStatus: "CHECKED_IN", // StayStatus changes to CHECKED_IN
      checkInTime: now, // Record actual check-in timestamp
      checkinConfirmedAt: now,
      checkinConfirmationType: confirmationType,
      disputeWindowClosesAt,
      roomFeeReleaseEligibleAt,
    },
    include: {
      payment: true,
      guest: true,
      property: {
        include: {
          realtor: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  // Log escrow event
  await escrowService.logEscrowEvent({
    bookingId,
    eventType: "HOLD_ROOM_FEE",
    amount: updatedBooking.roomFee,
    description: `Check-in confirmed via ${confirmationType}. Room fee release eligible at ${roomFeeReleaseEligibleAt.toISOString()}`,
    metadata: {
      confirmationType,
      checkinConfirmedAt: now.toISOString(),
      disputeWindowClosesAt: disputeWindowClosesAt.toISOString(),
    },
  });

  // Send notification to both parties
  try {
    // Notify guest about 1-hour dispute window
    await prisma.notification.create({
      data: {
        userId: updatedBooking.guestId,
        type: "BOOKING_REMINDER",
        title: "Check-in Confirmed",
        message: `You have 1 hour to report any issues with the property. Dispute window closes at ${disputeWindowClosesAt.toLocaleTimeString()}.`,
        bookingId: bookingId,
        priority: "high",
        isRead: false,
      },
    });

    // Notify realtor
    await prisma.notification.create({
      data: {
        userId: updatedBooking.property.realtor.userId,
        type: "BOOKING_CONFIRMED",
        title: "Guest Checked In",
        message: `Guest has checked into ${updatedBooking.property.title}. Room fee will be released after 1-hour dispute window.`,
        bookingId: bookingId,
        priority: "medium",
        isRead: false,
      },
    });
  } catch (notificationError) {
    logger.error("Failed to send check-in notifications:", notificationError);
  }

  logger.info(
    `Check-in confirmed for booking ${bookingId} via ${confirmationType}`
  );

  return {
    bookingId,
    checkinConfirmedAt: now,
    confirmationType,
    disputeWindowClosesAt,
    roomFeeReleaseEligibleAt,
  };
};

/**
 * Auto-confirm check-in (for fallback job)
 */
export const autoConfirmCheckIn = async (
  bookingId: string
): Promise<CheckInConfirmationResult> => {
  return confirmCheckIn(bookingId, "AUTO_FALLBACK", "system");
};

/**
 * Check if guest dispute window is still open
 */
export const isGuestDisputeWindowOpen = async (
  bookingId: string
): Promise<boolean> => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      disputeWindowClosesAt: true,
      userDisputeOpened: true,
    },
  });

  if (!booking || !booking.disputeWindowClosesAt) {
    return false;
  }

  const now = new Date();
  return now < booking.disputeWindowClosesAt && !booking.userDisputeOpened;
};

/**
 * Check if realtor dispute window is still open
 */
export const isRealtorDisputeWindowOpen = async (
  bookingId: string
): Promise<boolean> => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      realtorDisputeClosesAt: true,
      realtorDisputeOpened: true,
    },
  });

  if (!booking || !booking.realtorDisputeClosesAt) {
    return false;
  }

  const now = new Date();
  return now < booking.realtorDisputeClosesAt && !booking.realtorDisputeOpened;
};

/**
 * Validate if guest can open dispute
 */
export const canGuestOpenDispute = async (
  bookingId: string
): Promise<{ canOpen: boolean; reason?: string }> => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      status: true,
      checkinConfirmedAt: true,
      disputeWindowClosesAt: true,
      userDisputeOpened: true,
    },
  });

  if (!booking) {
    return { canOpen: false, reason: "Booking not found" };
  }

  if (!booking.checkinConfirmedAt) {
    return { canOpen: false, reason: "Check-in not confirmed yet" };
  }

  if (booking.userDisputeOpened) {
    return { canOpen: false, reason: "Dispute already opened" };
  }

  if (!booking.disputeWindowClosesAt) {
    return { canOpen: false, reason: "Dispute window not set" };
  }

  const now = new Date();
  if (now >= booking.disputeWindowClosesAt) {
    return {
      canOpen: false,
      reason: "Dispute window expired (1 hour limit exceeded)",
    };
  }

  return { canOpen: true };
};

/**
 * Validate if realtor can open dispute
 */
export const canRealtorOpenDispute = async (
  bookingId: string
): Promise<{ canOpen: boolean; reason?: string }> => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      status: true,
      checkOutTime: true,
      realtorDisputeClosesAt: true,
      realtorDisputeOpened: true,
    },
  });

  if (!booking) {
    return { canOpen: false, reason: "Booking not found" };
  }

  if (booking.status !== "COMPLETED") {
    return { canOpen: false, reason: "Guest has not checked out yet" };
  }

  if (booking.realtorDisputeOpened) {
    return { canOpen: false, reason: "Dispute already opened" };
  }

  if (!booking.realtorDisputeClosesAt) {
    return { canOpen: false, reason: "Dispute window not set" };
  }

  const now = new Date();
  if (now >= booking.realtorDisputeClosesAt) {
    return {
      canOpen: false,
      reason: "Dispute window expired (4 hour limit exceeded)",
    };
  }

  return { canOpen: true };
};

export default {
  confirmCheckIn,
  autoConfirmCheckIn,
  validateCheckInEligibility,
  startGuestDisputeTimer,
  isGuestDisputeWindowOpen,
  isRealtorDisputeWindowOpen,
  canGuestOpenDispute,
  canRealtorOpenDispute,
};
